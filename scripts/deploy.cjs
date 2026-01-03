const hre = require("hardhat");

async function main() {
  console.log("Deploying AuraProof to Mantle Sepolia...");

  const AuraProof = await hre.ethers.getContractFactory("AuraProof");
  const contract = await AuraProof.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log("");
  console.log("========================================");
  console.log("✅ AuraProof deployed to:", address);
  console.log("========================================");
  console.log("Network: Mantle Sepolia");
  console.log("Explorer: https://explorer.sepolia.mantle.xyz/address/" + address);
  console.log("");
  console.log("Use this address for hackathon submission!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
