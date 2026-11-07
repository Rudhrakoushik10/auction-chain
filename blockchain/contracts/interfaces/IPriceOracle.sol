// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPriceOracle {
    struct PredictionRecord {
        uint256 predictionId;
        uint256 predictedPricePaise;
        bytes32 productDataHash;
        string modelVersion;
        uint256 timestamp;
        address oracleAddress;
        bool exists;
    }

    function registerPrediction(
        uint256 _predictedPricePaise,
        bytes32 _productDataHash,
        string calldata _modelVersion,
        uint256 _timestamp
    ) external returns (uint256 predictionId);

    function getPrediction(uint256 _predictionId) external view returns (PredictionRecord memory);

    function predictionExists(uint256 _predictionId) external view returns (bool);
}
