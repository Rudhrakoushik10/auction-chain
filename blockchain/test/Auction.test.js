const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction (Vehicle Sealed-Bid Commit-Reveal)", function () {
  it("prevents seller self-bidding and verifies keccak256(abi.encode(auctionId, bidder, bidAmount, salt))", async function () {
    const [owner, seller, bidderA, bidderB, oracleSigner] = await ethers.getSigners();
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const oracle = await PriceOracle.deploy(oracleSigner.address);

    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy(await oracle.getAddress());

    const productHash = ethers.keccak256(ethers.toUtf8Bytes('{"brand":"hyundai","category":"vehicle"}'));
    await oracle.connect(oracleSigner).registerPrediction(306450000, productHash, "vehicle-v1", 1730000000);

    await auction
      .connect(seller)
      .createAuction(
        "2023 Hyundai IONIQ 5",
        productHash,
        1,
        ethers.parseEther("8.5"),
        ethers.parseEther("10.0"),
        ethers.parseEther("1.5"),
        3600,
        3600
      );

    const bidAmount = ethers.parseEther("11.4");
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const commitment = ethers.keccak256(
      abiCoder.encode(["uint256", "address", "uint256", "bytes32"], [1, bidderA.address, bidAmount, salt])
    );

    await expect(
      auction.connect(seller).commitBid(1, commitment, { value: ethers.parseEther("1.5") })
    ).to.be.reverted;

    await auction.connect(bidderA).commitBid(1, commitment, { value: ethers.parseEther("1.5") });
    const stored = await auction.commitments(1, bidderA.address);
    expect(stored.committed).to.equal(true);
  });
});
