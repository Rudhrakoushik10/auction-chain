// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title Auction
 * @notice Decentralized Vehicle Sealed-Bid Commit-Reveal Auction Contract (AuctionChain).
 *         Inherits OpenZeppelin ReentrancyGuard (nonReentrant) and enforces domain-bound commitments:
 *         keccak256(abi.encode(auctionId, msg.sender, bidAmount, salt)),
 *         fixed ETH participation deposits, reserve price checks, earliest-commit tie-breaking,
 *         and pull-based refunds/proceeds withdrawals.
 */
contract Auction is ReentrancyGuard {
    enum AuctionStatus {
        CommitPhase,
        RevealPhase,
        FinalizedSold,
        FinalizedNoSale,
        Cancelled
    }

    struct VehicleAuction {
        uint256 auctionId;
        address seller;
        string title;
        string category;          // "vehicle"
        bytes32 metadataHash;     // Canonical hash of vehicle attributes JSON
        uint256 predictionId;     // Reference to PriceOracle prediction record
        uint256 startingPrice;    // In wei (Test ETH)
        uint256 reservePrice;     // In wei (Test ETH), must be >= startingPrice
        uint256 fixedDeposit;     // In wei (Test ETH), uniform deposit required at commit
        uint256 commitDeadline;   // Unix timestamp
        uint256 revealDeadline;   // Unix timestamp
        address highestBidder;
        uint256 highestBid;       // In wei (Test ETH)
        uint256 winningCommitTime;
        bool finalized;
        bool sold;
        bool winnerSettled;
        bool sellerWithdrawn;
        uint256 commitCount;
        uint256 revealCount;
    }

    struct BidCommitment {
        bytes32 commitmentHash;
        uint256 depositPaid;
        uint256 committedAt;
        bool committed;
        bool revealed;
        uint256 revealedAmount;
        bool depositRefunded;
    }

    IPriceOracle public immutable priceOracle;
    uint256 public nextAuctionId;

    mapping(uint256 => VehicleAuction) public auctions;
    mapping(uint256 => mapping(address => BidCommitment)) public commitments;
    mapping(address => uint256) public pendingSellerProceeds;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string category,
        uint256 predictionId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 fixedDeposit,
        uint256 commitDeadline,
        uint256 revealDeadline
    );

    event BidCommitted(
        uint256 indexed auctionId,
        address indexed bidder,
        bytes32 commitmentHash,
        uint256 depositPaid,
        uint256 committedAt
    );

    event BidRevealed(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidAmount,
        bool isCurrentHighest
    );

    event AuctionFinalized(
        uint256 indexed auctionId,
        bool sold,
        address indexed winner,
        uint256 winningBid
    );

    event WinnerSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 totalBidPaid
    );

    event RefundClaimed(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event SellerProceedsWithdrawn(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 amount
    );

    error InvalidOraclePrediction();
    error InvalidPricingConfig();
    error InvalidDeadlines();
    error SellerCannotBidOnOwnAuction();
    error NotInCommitPhase();
    error NotInRevealPhase();
    error RevealPhaseNotEnded();
    error AlreadyCommitted();
    error IncorrectDepositAmount();
    error NoCommitmentFound();
    error AlreadyRevealed();
    error CommitmentHashMismatch();
    error BidBelowStartingPrice();
    error AlreadyFinalized();
    error OnlyWinnerCanSettle();
    error IncorrectSettlementAmount();
    error NothingToWithdraw();
    error TransferFailed();

    constructor(address _priceOracle) {
        priceOracle = IPriceOracle(_priceOracle);
        nextAuctionId = 1;
    }

    function createAuction(
        string calldata _title,
        bytes32 _metadataHash,
        uint256 _predictionId,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _fixedDeposit,
        uint256 _commitDurationSeconds,
        uint256 _revealDurationSeconds
    ) external returns (uint256 auctionId) {
        if (!priceOracle.predictionExists(_predictionId)) revert InvalidOraclePrediction();
        if (_startingPrice == 0 || _reservePrice < _startingPrice || _fixedDeposit == 0) {
            revert InvalidPricingConfig();
        }
        if (_commitDurationSeconds == 0 || _revealDurationSeconds == 0) {
            revert InvalidDeadlines();
        }

        auctionId = nextAuctionId++;
        uint256 commitDeadline = block.timestamp + _commitDurationSeconds;
        uint256 revealDeadline = commitDeadline + _revealDurationSeconds;

        auctions[auctionId] = VehicleAuction({
            auctionId: auctionId,
            seller: msg.sender,
            title: _title,
            category: "vehicle",
            metadataHash: _metadataHash,
            predictionId: _predictionId,
            startingPrice: _startingPrice,
            reservePrice: _reservePrice,
            fixedDeposit: _fixedDeposit,
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            highestBidder: address(0),
            highestBid: 0,
            winningCommitTime: type(uint256).max,
            finalized: false,
            sold: false,
            winnerSettled: false,
            sellerWithdrawn: false,
            commitCount: 0,
            revealCount: 0
        });

        emit AuctionCreated(
            auctionId,
            msg.sender,
            "vehicle",
            _predictionId,
            _startingPrice,
            _reservePrice,
            _fixedDeposit,
            commitDeadline,
            revealDeadline
        );
    }

    function commitBid(uint256 _auctionId, bytes32 _commitmentHash) external payable nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (block.timestamp > auction.commitDeadline) revert NotInCommitPhase();
        if (msg.sender == auction.seller) revert SellerCannotBidOnOwnAuction();

        BidCommitment storage bid = commitments[_auctionId][msg.sender];
        if (bid.committed) revert AlreadyCommitted();
        if (msg.value != auction.fixedDeposit) revert IncorrectDepositAmount();

        bid.commitmentHash = _commitmentHash;
        bid.depositPaid = msg.value;
        bid.committedAt = block.timestamp;
        bid.committed = true;

        auction.commitCount += 1;

        emit BidCommitted(_auctionId, msg.sender, _commitmentHash, msg.value, block.timestamp);
    }

    function revealBid(uint256 _auctionId, uint256 _bidAmount, bytes32 _salt) external nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (block.timestamp <= auction.commitDeadline || block.timestamp > auction.revealDeadline) {
            revert NotInRevealPhase();
        }

        BidCommitment storage bid = commitments[_auctionId][msg.sender];
        if (!bid.committed) revert NoCommitmentFound();
        if (bid.revealed) revert AlreadyRevealed();
        if (_bidAmount < auction.startingPrice) revert BidBelowStartingPrice();

        bytes32 computedHash = keccak256(abi.encode(_auctionId, msg.sender, _bidAmount, _salt));
        if (computedHash != bid.commitmentHash) revert CommitmentHashMismatch();

        bid.revealed = true;
        bid.revealedAmount = _bidAmount;
        auction.revealCount += 1;

        bool isNewHighest = false;
        if (
            _bidAmount > auction.highestBid ||
            (_bidAmount == auction.highestBid && bid.committedAt < auction.winningCommitTime)
        ) {
            auction.highestBid = _bidAmount;
            auction.highestBidder = msg.sender;
            auction.winningCommitTime = bid.committedAt;
            isNewHighest = true;
        }

        emit BidRevealed(_auctionId, msg.sender, _bidAmount, isNewHighest);
    }

    function finalizeAuction(uint256 _auctionId) external nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (block.timestamp <= auction.revealDeadline) revert RevealPhaseNotEnded();
        if (auction.finalized) revert AlreadyFinalized();

        auction.finalized = true;

        if (auction.highestBidder != address(0) && auction.highestBid >= auction.reservePrice) {
            auction.sold = true;
            emit AuctionFinalized(_auctionId, true, auction.highestBidder, auction.highestBid);
        } else {
            auction.sold = false;
            emit AuctionFinalized(_auctionId, false, address(0), auction.highestBid);
        }
    }

    function settleWinnerPayment(uint256 _auctionId) external payable nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (!auction.finalized || !auction.sold) revert OnlyWinnerCanSettle();
        if (msg.sender != auction.highestBidder) revert OnlyWinnerCanSettle();
        if (auction.winnerSettled) revert AlreadyFinalized();

        BidCommitment storage winningCommitment = commitments[_auctionId][msg.sender];
        uint256 depositCredit = winningCommitment.depositPaid;
        uint256 amountDue = auction.highestBid > depositCredit ? (auction.highestBid - depositCredit) : 0;

        if (msg.value != amountDue) revert IncorrectSettlementAmount();

        auction.winnerSettled = true;
        winningCommitment.depositRefunded = true;
        pendingSellerProceeds[auction.seller] += (depositCredit + msg.value);

        emit WinnerSettled(_auctionId, msg.sender, depositCredit + msg.value);
    }

    function claimRefund(uint256 _auctionId) external nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (!auction.finalized) revert RevealPhaseNotEnded();

        BidCommitment storage bid = commitments[_auctionId][msg.sender];
        if (!bid.committed || !bid.revealed || bid.depositRefunded) revert NothingToWithdraw();
        if (auction.sold && msg.sender == auction.highestBidder) revert NothingToWithdraw();

        uint256 refundAmount = bid.depositPaid;
        bid.depositRefunded = true;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(_auctionId, msg.sender, refundAmount);
    }

    function withdrawSellerProceeds(uint256 _auctionId) external nonReentrant {
        VehicleAuction storage auction = auctions[_auctionId];
        if (msg.sender != auction.seller || !auction.winnerSettled || auction.sellerWithdrawn) {
            revert NothingToWithdraw();
        }

        uint256 amount = pendingSellerProceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        auction.sellerWithdrawn = true;
        pendingSellerProceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit SellerProceedsWithdrawn(_auctionId, msg.sender, amount);
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }

    function name() external pure returns (string memory) {
        return "AuctionChainSealedAuction";
    }

    function symbol() external pure returns (string memory) {
        return "AUCTION";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    fallback(bytes calldata) external returns (bytes memory) {
        return abi.encode(uint256(0));
    }
}

