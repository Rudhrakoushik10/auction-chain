const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
  it("allows only authorized oracle to register vehicle price predictions in paise", async function () {
    const [owner, other, oracleSigner] = await ethers.getSigners();
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const oracle = await PriceOracle.deploy(oracleSigner.address);

    const productHash = ethers.keccak256(ethers.toUtf8Bytes('{"brand":"hyundai","category":"vehicle"}'));
    await expect(
      oracle.connect(other).registerPrediction(306450000, productHash, "vehicle-v1", 1730000000)
    ).to.be.reverted;

    await oracle.connect(oracleSigner).registerPrediction(306450000, productHash, "vehicle-v1", 1730000000);
    const record = await oracle.getPrediction(1);
    expect(record.predictedPricePaise).to.equal(306450000n);
    expect(record.modelVersion).to.equal("vehicle-v1");
  });
});
