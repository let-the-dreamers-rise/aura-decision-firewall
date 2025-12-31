// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuraDecisionLogger
 * @dev Simple contract to log user transaction decisions on Mantle L2
 * @notice This contract stores privacy-preserving decision logs for AURA AI Decision Firewall
 */
contract AuraDecisionLogger {
    // Events
    event DecisionLogged(
        bytes32 indexed transactionHash,
        bytes32 indexed userAddressHash,
        bool approved,
        uint256 timestamp,
        string riskLevel,
        bool isDemo
    );

    event StatsUpdated(
        uint256 totalDecisions,
        uint256 totalApprovals,
        uint256 totalRejections
    );

    // Structs
    struct DecisionRecord {
        bytes32 transactionHash;
        bytes32 userAddressHash; // Privacy-preserving hash of user address
        bool approved;
        uint256 timestamp;
        string riskLevel; // "low", "medium", "high"
        bool isDemo; // true for demo/mock transactions, false for real
    }

    struct DecisionStats {
        uint256 totalDecisions;
        uint256 totalApprovals;
        uint256 totalRejections;
        uint256 lastUpdated;
    }

    // State variables
    mapping(bytes32 => DecisionRecord) public decisions;
    DecisionStats public stats;
    address public owner;
    
    // Array to store decision hashes for enumeration
    bytes32[] public decisionHashes;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        stats = DecisionStats({
            totalDecisions: 0,
            totalApprovals: 0,
            totalRejections: 0,
            lastUpdated: block.timestamp
        });
    }

    /**
     * @dev Log a user's transaction decision
     * @param _transactionHash Hash of the transaction being decided on
     * @param _userAddressHash Privacy-preserving hash of user's address
     * @param _approved Whether the user approved (true) or rejected (false) the transaction
     * @param _riskLevel Risk level assessment: "low", "medium", or "high"
     * @param _isDemo Whether this is a demo/mock transaction (true) or real (false)
     */
    function logDecision(
        bytes32 _transactionHash,
        bytes32 _userAddressHash,
        bool _approved,
        string memory _riskLevel,
        bool _isDemo
    ) external {
        require(_transactionHash != bytes32(0), "Transaction hash cannot be empty");
        require(_userAddressHash != bytes32(0), "User address hash cannot be empty");
        require(
            keccak256(abi.encodePacked(_riskLevel)) == keccak256(abi.encodePacked("low")) ||
            keccak256(abi.encodePacked(_riskLevel)) == keccak256(abi.encodePacked("medium")) ||
            keccak256(abi.encodePacked(_riskLevel)) == keccak256(abi.encodePacked("high")),
            "Risk level must be 'low', 'medium', or 'high'"
        );

        // Create unique decision ID
        bytes32 decisionId = keccak256(abi.encodePacked(_transactionHash, _userAddressHash, block.timestamp));
        
        // Ensure this decision hasn't been logged already
        require(decisions[decisionId].timestamp == 0, "Decision already logged");

        // Store the decision
        decisions[decisionId] = DecisionRecord({
            transactionHash: _transactionHash,
            userAddressHash: _userAddressHash,
            approved: _approved,
            timestamp: block.timestamp,
            riskLevel: _riskLevel,
            isDemo: _isDemo
        });

        // Add to enumeration array
        decisionHashes.push(decisionId);

        // Update stats
        stats.totalDecisions++;
        if (_approved) {
            stats.totalApprovals++;
        } else {
            stats.totalRejections++;
        }
        stats.lastUpdated = block.timestamp;

        // Emit events
        emit DecisionLogged(_transactionHash, _userAddressHash, _approved, block.timestamp, _riskLevel, _isDemo);
        emit StatsUpdated(stats.totalDecisions, stats.totalApprovals, stats.totalRejections);
    }

    /**
     * @dev Get decision statistics
     * @return totalDecisions Total number of decisions logged
     * @return totalApprovals Total number of approved transactions
     * @return totalRejections Total number of rejected transactions
     * @return lastUpdated Timestamp of last update
     */
    function getStats() external view returns (
        uint256 totalDecisions,
        uint256 totalApprovals,
        uint256 totalRejections,
        uint256 lastUpdated
    ) {
        return (
            stats.totalDecisions,
            stats.totalApprovals,
            stats.totalRejections,
            stats.lastUpdated
        );
    }

    /**
     * @dev Get a specific decision by its ID
     * @param _decisionId The unique decision identifier
     * @return transactionHash Hash of the transaction
     * @return userAddressHash Privacy-preserving hash of user address
     * @return approved Whether the transaction was approved
     * @return timestamp When the decision was made
     * @return riskLevel Risk level assessment
     * @return isDemo Whether this was a demo transaction
     */
    function getDecision(bytes32 _decisionId) external view returns (
        bytes32 transactionHash,
        bytes32 userAddressHash,
        bool approved,
        uint256 timestamp,
        string memory riskLevel,
        bool isDemo
    ) {
        DecisionRecord memory decision = decisions[_decisionId];
        require(decision.timestamp != 0, "Decision not found");
        
        return (
            decision.transactionHash,
            decision.userAddressHash,
            decision.approved,
            decision.timestamp,
            decision.riskLevel,
            decision.isDemo
        );
    }

    /**
     * @dev Get the total number of decisions logged
     * @return The number of decisions in the contract
     */
    function getDecisionCount() external view returns (uint256) {
        return decisionHashes.length;
    }

    /**
     * @dev Get decision ID by index (for enumeration)
     * @param _index Index in the decisions array
     * @return The decision ID at the given index
     */
    function getDecisionIdByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < decisionHashes.length, "Index out of bounds");
        return decisionHashes[_index];
    }

    /**
     * @dev Get recent decisions (last N decisions)
     * @param _count Number of recent decisions to retrieve (max 100)
     * @return decisionIds Array of recent decision IDs
     */
    function getRecentDecisions(uint256 _count) external view returns (bytes32[] memory decisionIds) {
        require(_count > 0 && _count <= 100, "Count must be between 1 and 100");
        
        uint256 totalDecisions = decisionHashes.length;
        uint256 returnCount = _count > totalDecisions ? totalDecisions : _count;
        
        decisionIds = new bytes32[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            decisionIds[i] = decisionHashes[totalDecisions - 1 - i];
        }
        
        return decisionIds;
    }

    /**
     * @dev Emergency function to pause the contract (owner only)
     * @notice This is a simple implementation - in production, consider using OpenZeppelin's Pausable
     */
    bool public paused = false;
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function logDecisionSafe(
        bytes32 _transactionHash,
        bytes32 _userAddressHash,
        bool _approved,
        string memory _riskLevel,
        bool _isDemo
    ) external whenNotPaused {
        this.logDecision(_transactionHash, _userAddressHash, _approved, _riskLevel, _isDemo);
    }

    /**
     * @dev Transfer ownership (owner only)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}