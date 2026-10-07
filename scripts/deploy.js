const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const reg = await (await hre.ethers.getContractFactory("CredentialRegistry")).deploy();
  await reg.waitForDeployment();
  const address = await reg.getAddress();
  // Demo: quien despliega también queda como institución autorizada
  const [deployer] = await hre.ethers.getSigners();
  await (await reg.requestAccess("ULACIT (demo)", "ulacit.ac.cr")).wait();
  await (await reg.review(deployer.address, true)).wait();
  const rpc = hre.network.name === "localhost" ? "http://127.0.0.1:8545" : (process.env.SEPOLIA_RPC || "");
  fs.writeFileSync("frontend/js/config.js", `export const CFG = ${JSON.stringify({ address, rpc, chainName: hre.network.name, demo: process.env.DEMO !== "false" }, null, 2)};\n`);
  console.log("Contrato desplegado en:", address);
}
main().catch(e => { console.error(e); process.exit(1); });
