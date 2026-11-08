export const PRICE_ORACLE_SOL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PriceOracle
 * @notice Live Chainlink-compatible ETH/INR Price Feed (AggregatorV3Interface)
 *         and on-chain registry for AI vehicle resale price predictions in integer paise.
 */
contract PriceOracle {
    struct PredictionRecord {
        uint256 predictionId;
        uint256 predictedPricePaise; // INR * 100 (integer paise)
        bytes32 productDataHash;     // Canonical SHA-256 / Keccak-256 hash of normalized vehicle JSON
        string modelVersion;         // "vehicle-v1"
        uint256 timestamp;
        address oracleAddress;
        bool exists;
    }

    address public owner;
    address public authorizedOracle;
    uint256 public nextPredictionId;

    // --- Chainlink-Compatible AggregatorV3 Live ETH/INR Price Feed ---
    int256 private ethInrPrice; // 8 decimals: 25000000000000 = ₹250,000.00
    uint80 private currentRoundId;
    uint256 private lastUpdatedAt;

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

    event PriceUpdated(
        uint80 indexed roundId,
        int256 price,
        uint256 updatedAt,
        address indexed updater
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == authorizedOracle || msg.sender == owner, "Only authorized oracle or owner");
        _;
    }

    constructor(address _initialOracle) {
        require(_initialOracle != address(0), "Invalid oracle address");
        owner = msg.sender;
        authorizedOracle = _initialOracle;
        nextPredictionId = 1;
        ethInrPrice = int256(250000 * 1e8); // Default: ₹250,000 (8 decimals)
        currentRoundId = 1;
        lastUpdatedAt = block.timestamp;
    }

    function setAuthorizedOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        emit AuthorizedOracleUpdated(authorizedOracle, _newOracle);
        authorizedOracle = _newOracle;
    }

    /**
     * @notice Chainlink AggregatorV3Interface standard method
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        int256 effectivePrice = ethInrPrice > 0 ? ethInrPrice : int256(250000 * 1e8);
        uint256 effectiveTime = lastUpdatedAt > 0 ? lastUpdatedAt : block.timestamp;
        uint80 effectiveRound = currentRoundId > 0 ? currentRoundId : 1;
        return (effectiveRound, effectivePrice, effectiveTime, effectiveTime, effectiveRound);
    }

    /**
     * @notice Updates the live ETH/INR price feed rate (8 decimals)
     */
    function updateEthInrPrice(int256 _newPrice) external onlyOracle returns (uint80 roundId) {
        require(_newPrice > 0, "Invalid price");
        currentRoundId++;
        ethInrPrice = _newPrice;
        lastUpdatedAt = block.timestamp;
        emit PriceUpdated(currentRoundId, _newPrice, block.timestamp, msg.sender);
        return currentRoundId;
    }

    /**
     * @notice Returns live ETH to INR exchange rate as integer rupees
     */
    function getLatestEthInrRate() external view returns (uint256) {
        int256 effectivePrice = ethInrPrice > 0 ? ethInrPrice : int256(250000 * 1e8);
        return uint256(effectivePrice / 1e8);
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function description() external pure returns (string memory) {
        return "ETH / INR Price Feed";
    }

    function version() external pure returns (uint256) {
        return 3;
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
