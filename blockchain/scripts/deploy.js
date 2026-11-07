const hre = require("hardhat");

async function main() {
  const [admin, , , , oracle] = await hre.ethers.getSigners();
  console.log("Account 0 (Admin / Deployer):", admin.address);
  console.log("Account 4 (Authorized Oracle Signer):", oracle.address);

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(oracle.address);
  await priceOracle.waitForDeployment();
  const oracleAddress = await priceOracle.getAddress();
  console.log("PriceOracle deployed to:", oracleAddress);

  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(oracleAddress);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("Auction (Vehicle Sealed-Bid) deployed to:", auctionAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
