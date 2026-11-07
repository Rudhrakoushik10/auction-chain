const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const hardhatCli = path.resolve(__dirname, "../node_modules/hardhat/internal/cli/cli.js");
const projectRoot = path.resolve(__dirname, "..");

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

async function waitForNode(maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkNodeReady();
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function runAutoDeploy() {
  console.log("\n========================================================");
  console.log("[Auto-Deploy] Hardhat node ready on http://127.0.0.1:8545");
  console.log("[Auto-Deploy] Running automated smart contract deployment...");
  console.log("========================================================\n");

  const deploy = spawn(
    process.execPath,
    [hardhatCli, "run", "scripts/deployLocal.js", "--network", "localhost"],
    {
      cwd: projectRoot,
      stdio: "inherit",
    }
  );

  deploy.on("close", (code) => {
    if (code === 0) {
      console.log("\n========================================================");
      console.log("[Auto-Deploy] Smart contracts successfully deployed!");
      console.log("  - PriceOracle.sol : 0x5FbDB2315678afecb367f032d93F642f64180aa3");
      console.log("  - Auction.sol     : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
      console.log("  - Chain ID        : 31337 (http://127.0.0.1:8545)");
      console.log("  - Hardhat node is running continuously in this terminal.");
      console.log("========================================================\n");
    } else {
      console.error(`[Auto-Deploy] Contract deployment exited with code ${code}`);
    }
  });
}

console.log("[Blockchain] Launching local Hardhat Ethereum node on http://127.0.0.1:8545...");
const nodeProcess = spawn(process.execPath, [hardhatCli, "node"], {
  cwd: projectRoot,
  stdio: "inherit",
});

(async () => {
  const ready = await waitForNode();
  if (ready) {
    runAutoDeploy();
  } else {
    console.warn("[Auto-Deploy] Timed out waiting for Hardhat node to respond.");
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
