// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PriceOracle
 * @notice On-chain registry for AI resale price predictions (stored in integer paise = INR * 100)
 *         and canonical product data hashes for the AuctionChain platform.
 */
contract PriceOracle {
    struct PredictionRecord {
        uint256 predictionId;
        uint256 predictedPricePaise; // INR * 100 (integer paise, no floating-point)
        bytes32 productDataHash;     // Canonical SHA-256 / Keccak-256 hash of normalized vehicle JSON
        string modelVersion;         // "vehicle-v1"
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

    event AuthorizedOracleUpdated(
        address indexed previousOracle,
        address indexed newOracle
    );

    error OnlyOwner();
    error OnlyAuthorizedOracle();
    error InvalidAddress();
    error InvalidPredictionData();
    error PredictionNotFound();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != authorizedOracle) revert OnlyAuthorizedOracle();
        _;
    }

    constructor(address _initialOracle) {
        if (_initialOracle == address(0)) revert InvalidAddress();
        owner = msg.sender;
        authorizedOracle = _initialOracle;
        nextPredictionId = 1;
    }

    /**
     * @notice Updates the authorized oracle account (Contract Owner / Admin only)
     */
    function setAuthorizedOracle(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert InvalidAddress();
        address previous = authorizedOracle;
        authorizedOracle = _newOracle;
        emit AuthorizedOracleUpdated(previous, _newOracle);
    }

    /**
     * @notice Registers a new AI price prediction in integer paise on-chain
     */
    function registerPrediction(
        uint256 _predictedPricePaise,
        bytes32 _productDataHash,
        string calldata _modelVersion,
        uint256 _timestamp
    ) external onlyOracle returns (uint256 predictionId) {
        if (_predictedPricePaise == 0 || _productDataHash == bytes32(0) || bytes(_modelVersion).length == 0) {
            revert InvalidPredictionData();
        }

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

    /**
     * @notice Retrieves a prediction record by ID
     */
    function getPrediction(uint256 _predictionId) external view returns (PredictionRecord memory) {
        if (!predictions[_predictionId].exists) revert PredictionNotFound();
        return predictions[_predictionId];
    }

    /**
     * @notice Verifies if a prediction ID exists on-chain
     */
    function predictionExists(uint256 _predictionId) external view returns (bool) {
        return predictions[_predictionId].exists;
    }

    // --- Chainlink-Compatible AggregatorV3 Live ETH/INR Price Feed ---
    int256 private ethInrPrice; // Stored in 8 decimals: 25000000000000 = ₹250,000.00
    uint80 private currentRoundId;
    uint256 private lastUpdatedAt;

    event PriceUpdated(
        uint80 indexed roundId,
        int256 price,
        uint256 updatedAt,
        address indexed updater
    );

    error InvalidPrice();

    /**
     * @notice Updates the live ETH/INR exchange rate (8 decimals). Authorized Oracle or Owner only.
     * @param _newPrice Price with 8 decimals (e.g. 25000000000000 for 250000.00000000)
     */
    function updateEthInrPrice(int256 _newPrice) external returns (uint80 roundId) {
        if (msg.sender != owner && msg.sender != authorizedOracle) revert OnlyAuthorizedOracle();
        if (_newPrice <= 0) revert InvalidPrice();

        currentRoundId++;
        ethInrPrice = _newPrice;
        lastUpdatedAt = block.timestamp;

        emit PriceUpdated(currentRoundId, _newPrice, block.timestamp, msg.sender);
        return currentRoundId;
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
     * @notice Convenience helper: returns live ETH to INR exchange rate as integer rupees
     */
    function getLatestEthInrRate() external view returns (uint256) {
        int256 effectivePrice = ethInrPrice > 0 ? ethInrPrice : int256(250000 * 1e8);
        return uint256(effectivePrice / 1e8);
    }

    function description() external pure returns (string memory) {
        return "ETH / INR Price Feed";
    }

    function version() external pure returns (uint256) {
        return 3;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }

    function name() external pure returns (string memory) {
        return "AuctionChainPriceOracle";
    }

    function symbol() external pure returns (string memory) {
        return "ETH/INR";
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    receive() external payable {}

    fallback(bytes calldata) external payable returns (bytes memory) {
        return abi.encode(uint256(0));
    }
}

