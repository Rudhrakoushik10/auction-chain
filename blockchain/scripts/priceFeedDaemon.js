const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

/**
 * Autonomous Chainlink-Style Price Feed Worker Daemon
 * Signs and broadcasts real-world ETH/INR market prices onto PriceOracle.sol on Hardhat.
 */
async function fetchEthInrFromMarket() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const inr = data?.ethereum?.inr;
      if (typeof inr === "number" && inr > 0) {
        return { priceInr: Math.round(inr), source: "CoinGecko Spot" };
      }
    }
  } catch (err) {
    // CoinGecko failed, try Binance
  }

  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
    if (res.ok) {
      const data = await res.json();
      const ethUsd = parseFloat(data?.price);
      if (!isNaN(ethUsd) && ethUsd > 0) {
        return { priceInr: Math.round(ethUsd * 87.5), source: "Binance Spot (~87.5 INR/USD)" };
      }
    }
  } catch (err) {
    // Both failed
  }

  return null;
}

async function main() {
  const addressesPath = path.join(__dirname, "../../frontend/src/contracts/contractAddresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("Contract addresses file not found. Deploy contracts first: npm start in blockchain/");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const oracleContractAddress = addresses.PriceOracle;

  const signers = await hre.ethers.getSigners();
  const oracleSigner = signers[4]; // Account 4 — Authorized Oracle Feeder

  console.log("============================================================================");
  console.log("  AuctionChain - Chainlink-Style Autonomous Price Feed Daemon");
  console.log("============================================================================");
  console.log("Contract Address:", oracleContractAddress);
  console.log("Oracle Feeder:", oracleSigner.address, "(Hardhat Account #4)");
  console.log("Target Feed: ETH / INR (8 decimals, AggregatorV3Interface)");
  console.log("Polling interval: 30 seconds");
  console.log("----------------------------------------------------------------------------\n");

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle", oracleSigner);
  const oracleContract = PriceOracle.attach(oracleContractAddress);

  async function pushUpdate() {
    const market = await fetchEthInrFromMarket();
    if (!market) {
      console.warn(`[${new Date().toLocaleTimeString()}] Warning: Could not fetch market price. Retrying in 30s...`);
      return;
    }

    try {
      const priceWith8Decimals = BigInt(market.priceInr) * 100000000n; // 1e8 fixed-point
      const tx = await oracleContract.updateEthInrPrice(priceWith8Decimals);
      const receipt = await tx.wait();

      const latestRate = await oracleContract.getLatestEthInrRate();
      const roundData = await oracleContract.latestRoundData();

      console.log(
        `[${new Date().toLocaleTimeString()}] Round #${roundData.roundId.toString()} Broadcast: 1 ETH = ₹${latestRate.toString()} (${market.source}) | Tx: ${receipt.hash.slice(0, 14)}...`
      );
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] Oracle update error:`, err.message || err);
    }
  }

  // Push immediate first round
  await pushUpdate();

  // Run continuously every 30 seconds
  setInterval(pushUpdate, 30000);
}

main().catch((err) => {
  console.error("Fatal daemon error:", err);
  process.exit(1);
});
