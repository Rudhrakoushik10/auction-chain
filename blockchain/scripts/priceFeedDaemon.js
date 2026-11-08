const fs = require("fs");
const path = require("path");
const http = require("http");
const hre = require("hardhat");

/**
 * Check if the local Hardhat EVM node is active
 */
function checkNodeReady() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    });

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 8545,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 1500,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

/**
 * Autonomous Price Oracle Worker Daemon
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
  console.log("============================================================================");
  console.log("  AuctionChain - Autonomous Price Oracle Daemon (Account 4)");
  console.log("============================================================================");

  // 1. Wait up to 60s for local Hardhat node to become reachable
  let isOnline = false;
  for (let i = 0; i < 40; i++) {
    isOnline = await checkNodeReady();
    if (isOnline) break;
    if (i === 0) {
      console.log("[Oracle] Waiting for Hardhat node on http://127.0.0.1:8545...");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!isOnline) {
    console.error("\n[ERROR] Cannot connect to local Hardhat node at http://127.0.0.1:8545.");
    console.error("Please start the blockchain node first in Terminal 1:");
    console.error("  -> Run: npm run chain (or scripts\\start-blockchain.bat)");
    console.error("============================================================================\n");
    process.exit(1);
  }

  // 2. Wait up to 30s for deployed contractAddresses.json file
  const addressesPath = path.join(__dirname, "../../frontend/src/contracts/contractAddresses.json");
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(addressesPath)) break;
    if (i === 0) {
      console.log("[Oracle] Waiting for smart contract deployment to finish...");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!fs.existsSync(addressesPath)) {
    console.error("\n[ERROR] Contract addresses file not found.");
    console.error("Please deploy contracts first: run 'npm run chain'");
    console.error("============================================================================\n");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const oracleContractAddress = addresses.PriceOracle;

  const signers = await hre.ethers.getSigners();
  const oracleSigner = signers[4]; // Account 4 — Authorized Oracle

  console.log("Contract Address:", oracleContractAddress);
  console.log("Oracle Signer:   ", oracleSigner.address, "(Hardhat Account #4)");
  console.log("Target Feed:      ETH / INR (8 decimals, AggregatorV3Interface)");
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
  console.error("Fatal daemon error:", err.message || err);
  process.exit(1);
});
