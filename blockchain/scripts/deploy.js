const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const oracle = signers[4];
  const liquidityProvider = signers[9];

  console.log("Account 0 (Admin / Deployer):", admin.address);
  console.log("Account 4 (Authorized Oracle Signer):", oracle.address);

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle", admin);
  const priceOracle = await PriceOracle.deploy(oracle.address);
  await priceOracle.waitForDeployment();
  const oracleAddress = await priceOracle.getAddress();
  console.log("PriceOracle deployed to:", oracleAddress);

  const Auction = await hre.ethers.getContractFactory("Auction", admin);
  const auction = await Auction.deploy(oracleAddress);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("Auction (Vehicle Sealed-Bid) deployed to:", auctionAddress);

  // Seed escrow reserve pool from Account #9 so pull-based refunds & withdrawals always have liquidity
  const seedTx = await liquidityProvider.sendTransaction({
    to: auctionAddress,
    value: hre.ethers.parseEther("500.0"),
  });
  await seedTx.wait();
  console.log("Auction escrow liquidity pool seeded with 500.0 ETH from Account #9");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
