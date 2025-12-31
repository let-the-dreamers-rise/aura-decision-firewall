const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying AuraDecisionLogger to Mantle L2...');

  // Get the contract factory
  const AuraDecisionLogger = await ethers.getContractFactory('AuraDecisionLogger');

  // Deploy the contract
  const auraDecisionLogger = await AuraDecisionLogger.deploy();

  // Wait for deployment to complete
  await auraDecisionLogger.deployed();

  console.log('AuraDecisionLogger deployed to:', auraDecisionLogger.address);
  console.log('Transaction hash:', auraDecisionLogger.deployTransaction.hash);

  // Verify deployment by calling getStats
  const stats = await auraDecisionLogger.getStats();
  console.log('Initial stats:', {
    totalDecisions: stats.totalDecisions.toString(),
    totalApprovals: stats.totalApprovals.toString(),
    totalRejections: stats.totalRejections.toString(),
    lastUpdated: new Date(stats.lastUpdated.toNumber() * 1000).toISOString()
  });

  // Save deployment info
  const deploymentInfo = {
    contractAddress: auraDecisionLogger.address,
    deploymentHash: auraDecisionLogger.deployTransaction.hash,
    network: 'mantle-testnet',
    deployedAt: new Date().toISOString(),
    deployer: await auraDecisionLogger.owner()
  };

  console.log('\nDeployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for frontend integration
  const fs = require('fs');
  const path = require('path');
  
  const deploymentPath = path.join(__dirname, '..', 'src', 'contracts');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentPath, 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\nDeployment info saved to src/contracts/deployment.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });