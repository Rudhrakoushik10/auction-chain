const hre = require("hardhat");

async function main() {
  const oracleContractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const newOracleSigner = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";

  const priceOracle = await hre.ethers.getContractAt("PriceOracle", oracleContractAddr);
  const tx = await priceOracle.setAuthorizedOracle(newOracleSigner);
  await tx.wait();
  console.log("Authorized Oracle Signer updated to:", newOracleSigner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
