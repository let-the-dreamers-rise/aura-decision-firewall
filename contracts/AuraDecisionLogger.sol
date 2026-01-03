// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuraDecisionLogger
 * @dev Minimal contract to log transaction decisions on Mantle L2
 * @notice AURA AI Decision Firewall - Mantle Global Hackathon
 */
contract AuraDecisionLogger {
    
    event DecisionLogged(
        bytes32 indexed transactionHash,
        address indexed user,
        bool approved,
        bool isDemo,
        uint256 timestamp
    );

    uint256 public totalDecisions;
    uint256 public totalApprovals;
    uint256 public totalRejections;

    /**
     * @dev Log a user's transaction decision
     * @param transactionHash Hash of the transaction being decided on
     * @param approved Whether the user approved or rejected
     * @param isDemo Whether this is a demo transaction
     */
    function logDecision(
        bytes32 transactionHash,
        bool approved,
        bool isDemo
    ) external {
        totalDecisions++;
        
        if (approved) {
            totalApprovals++;
        } else {
            totalRejections++;
        }

        emit DecisionLogged(
            transactionHash,
            msg.sender,
            approved,
            isDemo,
            block.timestamp
        );
    }

    /**
     * @dev Get aggregate statistics
     */
    function getStats() external view returns (
        uint256 _totalDecisions,
        uint256 _totalApprovals,
        uint256 _totalRejections
    ) {
        return (totalDecisions, totalApprovals, totalRejections);
    }
}
