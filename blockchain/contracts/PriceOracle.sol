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

    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }

    function name() external pure returns (string memory) {
        return "AuctionChainPriceOracle";
    }

    function symbol() external pure returns (string memory) {
        return "ORACLE";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    receive() external payable {}

    fallback(bytes calldata) external payable returns (bytes memory) {
        return abi.encode(uint256(0));
    }
}

