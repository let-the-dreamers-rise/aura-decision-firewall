const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AuraDecisionLogger', function () {
  let auraDecisionLogger;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AuraDecisionLogger = await ethers.getContractFactory('AuraDecisionLogger');
    auraDecisionLogger = await AuraDecisionLogger.deploy();
    await auraDecisionLogger.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await auraDecisionLogger.owner()).to.equal(owner.address);
    });

    it('Should initialize stats correctly', async function () {
      const stats = await auraDecisionLogger.getStats();
      expect(stats.totalDecisions).to.equal(0);
      expect(stats.totalApprovals).to.equal(0);
      expect(stats.totalRejections).to.equal(0);
    });
  });

  describe('Decision Logging', function () {
    it('Should log a decision correctly', async function () {
      const txHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-tx'));
      const userHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(user1.address));
      const approved = true;
      const riskLevel = 'medium';

      await expect(
        auraDecisionLogger.connect(user1).logDecision(txHash, userHash, approved, riskLevel)
      ).to.emit(auraDecisionLogger, 'DecisionLogged');

      const stats = await auraDecisionLogger.getStats();
      expect(stats.totalDecisions).to.equal(1);
      expect(stats.totalApprovals).to.equal(1);
      expect(stats.totalRejections).to.equal(0);
    });

    it('Should log rejection correctly', async function () {
      const txHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-tx-2'));
      const userHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(user1.address));
      const approved = false;
      const riskLevel = 'high';

      await auraDecisionLogger.connect(user1).logDecision(txHash, userHash, approved, riskLevel);

      const stats = await auraDecisionLogger.getStats();
      expect(stats.totalDecisions).to.equal(1);
      expect(stats.totalApprovals).to.equal(0);
      expect(stats.totalRejections).to.equal(1);
    });

    it('Should reject invalid risk levels', async function () {
      const txHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-tx-3'));
      const userHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(user1.address));

      await expect(
        auraDecisionLogger.connect(user1).logDecision(txHash, userHash, true, 'invalid')
      ).to.be.revertedWith("Risk level must be 'low', 'medium', or 'high'");
    });

    it('Should reject empty transaction hash', async function () {
      const userHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(user1.address));

      await expect(
        auraDecisionLogger.connect(user1).logDecision(
          ethers.constants.HashZero,
          userHash,
          true,
          'low'
        )
      ).to.be.revertedWith('Transaction hash cannot be empty');
    });
  });

  describe('Decision Retrieval', function () {
    beforeEach(async function () {
      // Log a few test decisions
      const txHash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-tx-1'));
      const txHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-tx-2'));
      const userHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(user1.address));

      await auraDecisionLogger.connect(user1).logDecision(txHash1, userHash, true, 'low');
      await auraDecisionLogger.connect(user1).logDecision(txHash2, userHash, false, 'high');
    });

    it('Should return correct decision count', async function () {
      const count = await auraDecisionLogger.getDecisionCount();
      expect(count).to.equal(2);
    });

    it('Should return recent decisions', async function () {
      const recentDecisions = await auraDecisionLogger.getRecentDecisions(2);
      expect(recentDecisions.length).to.equal(2);
    });

    it('Should limit recent decisions count', async function () {
      await expect(
        auraDecisionLogger.getRecentDecisions(101)
      ).to.be.revertedWith('Count must be between 1 and 100');
    });
  });

  describe('Access Control', function () {
    it('Should allow owner to pause contract', async function () {
      await auraDecisionLogger.connect(owner).setPaused(true);
      expect(await auraDecisionLogger.paused()).to.equal(true);
    });

    it('Should prevent non-owner from pausing', async function () {
      await expect(
        auraDecisionLogger.connect(user1).setPaused(true)
      ).to.be.revertedWith('Only owner can call this function');
    });

    it('Should allow owner to transfer ownership', async function () {
      await auraDecisionLogger.connect(owner).transferOwnership(user1.address);
      expect(await auraDecisionLogger.owner()).to.equal(user1.address);
    });
  });
});