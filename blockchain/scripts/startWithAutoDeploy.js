const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

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
        timeout: 1000,
      },
      (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
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

async function waitForNode(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkNodeReady();
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function runAutoDeploy() {
  console.log("\n========================================================");
  console.log("⚡ [Auto-Deploy] Hardhat node ready on http://127.0.0.1:8545");
  console.log("⚡ [Auto-Deploy] Running automated smart contract deployment...");
  console.log("========================================================\n");

  const deploy = spawn("npx", ["hardhat", "run", "scripts/deployLocal.js", "--network", "localhost"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  });

  deploy.on("close", (code) => {
    if (code === 0) {
      console.log("\n========================================================");
      console.log("✅ [Auto-Deploy] Smart contracts successfully deployed!");
      console.log("   - PriceOracle.sol & Auction.sol active on Chain ID 31337");
      console.log("   - Addresses exported to frontend/src/contracts/contractAddresses.json");
      console.log("   - Hardhat node running continuously in this terminal.");
      console.log("========================================================\n");
    } else {
      console.error(`❌ [Auto-Deploy] Contract deployment exited with code ${code}`);
    }
  });
}

console.log("🚀 [Blockchain] Launching local Hardhat Ethereum node...");
const nodeProcess = spawn("npx", ["hardhat", "node"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  shell: true,
});

(async () => {
  const ready = await waitForNode();
  if (ready) {
    runAutoDeploy();
  } else {
    console.warn("⚠️ [Auto-Deploy] Timed out waiting for Hardhat node to respond.");
  }
})();

process.on("SIGINT", () => {
  nodeProcess.kill("SIGINT");
  process.exit();
});

process.on("SIGTERM", () => {
  nodeProcess.kill("SIGTERM");
  process.exit();
});
