const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [admin, seller, bidder1, bidder2, oracle] = await hre.ethers.getSigners();
  console.log("Account 0 (Admin):", admin.address);
  console.log("Account 1 (Seller):", seller.address);
  console.log("Account 2 (Bidder 1):", bidder1.address);
  console.log("Account 3 (Bidder 2):", bidder2.address);
  console.log("Account 4 (Oracle):", oracle.address);

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(oracle.address);
  await priceOracle.waitForDeployment();
  const oracleAddress = await priceOracle.getAddress();

  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(oracleAddress);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  const addresses = {
    chainId: 31337,
    network: "Hardhat Localhost (Chain ID 31337)",
    PriceOracle: oracleAddress,
    Auction: auctionAddress,
    roles: {
      account0_admin: admin.address,
      account1_seller: seller.address,
      account2_bidder1: bidder1.address,
      account3_bidder2: bidder2.address,
      account4_oracle: oracle.address,
      admin: admin.address,
      seller: seller.address,
      bidder1: bidder1.address,
      bidder2: bidder2.address,
      oracle: oracle.address,
    },
  };

  const outPathFrontend = path.join(__dirname, "../../frontend/src/contracts/contractAddresses.json");
  fs.mkdirSync(path.dirname(outPathFrontend), { recursive: true });
  fs.writeFileSync(outPathFrontend, JSON.stringify(addresses, null, 2));

  console.log("Saved contractAddresses.json to frontend/src/contracts/contractAddresses.json:", addresses);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
