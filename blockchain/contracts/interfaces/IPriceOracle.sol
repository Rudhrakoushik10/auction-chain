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

    function updateEthInrPrice(int256 _newPrice) external returns (uint80 roundId);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function getLatestEthInrRate() external view returns (uint256);
}
