export const PRICE_ORACLE_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PriceOracle
 * @notice On-chain registry for AI vehicle resale price predictions (stored in integer cents = USD * 100)
 *         and canonical vehicle data hashes for the AuctionChain platform.
 */
contract PriceOracle {
    struct PredictionRecord {
        uint256 predictionId;
        uint256 predictedPricePaise; // USD * 100 (integer cents)
        bytes32 productDataHash;     // Canonical hash of normalized vehicle JSON
        string modelVersion;         // "1.0.0"
        uint256 timestamp;
        address oracleAddress;
        bool exists;
    }

    address public owner;
    address public authorizedOracle;
    uint256 public nextPredictionId;

    mapping(uint256 => PredictionRecord) private predictions;

    event PredictionRegistered(
        uint256 indexed predictionId,
        uint256 predictedPricePaise,
        bytes32 indexed productDataHash,
        string modelVersion,
        uint256 timestamp,
        address indexed oracleAddress
    );

    event AuthorizedOracleUpdated(address indexed previousOracle, address indexed newOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == authorizedOracle, "Only authorized oracle");
        _;
    }

    constructor(address _initialOracle) {
        owner = msg.sender;
        authorizedOracle = _initialOracle;
        nextPredictionId = 1;
    }

    function setAuthorizedOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        emit AuthorizedOracleUpdated(authorizedOracle, _newOracle);
        authorizedOracle = _newOracle;
    }

    function registerPrediction(
        uint256 _predictedPricePaise,
        bytes32 _productDataHash,
        string calldata _modelVersion,
        uint256 _timestamp
    ) external onlyOracle returns (uint256 predictionId) {
        predictionId = nextPredictionId++;
        predictions[predictionId] = PredictionRecord({
            predictionId: predictionId,
            predictedPricePaise: _predictedPricePaise,
            productDataHash: _productDataHash,
            modelVersion: _modelVersion,
            timestamp: _timestamp,
            oracleAddress: msg.sender,
            exists: true
        });

        emit PredictionRegistered(
            predictionId,
            _predictedPricePaise,
            _productDataHash,
            _modelVersion,
            _timestamp,
            msg.sender
        );
    }

    function getPrediction(uint256 _predictionId) external view returns (PredictionRecord memory) {
        require(predictions[_predictionId].exists, "Prediction not found");
        return predictions[_predictionId];
    }
}`;

export const SEALED_AUCTION_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPriceOracle.sol";

/**
 * @title Auction
 * @notice Decentralized Vehicle Sealed-Bid Commit-Reveal Smart Contract on Hardhat Local Network (Chain ID 31337)
 *         Commitment formula: keccak256(abi.encode(auctionId, msg.sender, bidAmount, salt))
 */
contract Auction {
    struct VehicleAuction {
        uint256 auctionId;
        address seller;
        string title;
        string category;          // "vehicle"
        bytes32 metadataHash;
        uint256 predictionId;
        uint256 startingPrice;    // in wei (Test ETH)
        uint256 reservePrice;     // in wei (Test ETH), >= startingPrice
        uint256 fixedDeposit;     // in wei (Test ETH)
        uint256 commitDeadline;
        uint256 revealDeadline;
        address highestBidder;
        uint256 highestBid;
        uint256 winningCommitTime;
        bool finalized;
        bool sold;
        bool winnerSettled;
    }

    IPriceOracle public immutable priceOracle;
    mapping(uint256 => VehicleAuction) public auctions;

    function commitBid(uint256 _auctionId, bytes32 _commitmentHash) external payable {
        require(block.timestamp <= auctions[_auctionId].commitDeadline, "Commit phase ended");
        require(msg.sender != auctions[_auctionId].seller, "Seller cannot bid");
        require(msg.value == auctions[_auctionId].fixedDeposit, "Must send fixed deposit");
        // Records sealed commitment hash on-chain
    }

    function revealBid(uint256 _auctionId, uint256 _bidAmount, bytes32 _salt) external {
        bytes32 expectedHash = keccak256(abi.encode(_auctionId, msg.sender, _bidAmount, _salt));
        // Verifies hash & updates highestBid with earliest-commit tie-breaker
    }
}`;
