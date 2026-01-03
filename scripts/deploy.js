async function main() {
  const AuraProof = await ethers.getContractFactory("AuraProof");
  const contract = await AuraProof.deploy();
  await contract.deployed();

  console.log("AuraProof deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
