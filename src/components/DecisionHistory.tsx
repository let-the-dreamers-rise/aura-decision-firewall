import React, { useState, useEffect } from 'react';
import { decisionLogger } from '../utils/decisionLogger';
import { LoadingCard, LoadingButton } from './LoadingSpinner';
import { DecisionRecord } from '../types';

interface DecisionStats {
  totalDecisions: number;
  totalApprovals: number;
  totalRejections: number;
  lastUpdated: Date;
}

interface DecisionHistoryProps {
  className?: string;
}

export const DecisionHistory: React.FC<DecisionHistoryProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<DecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectedToMantle, setIsConnectedToMantle] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDecisionStats();
    checkMantleConnection();
  }, []);

  const loadDecisionStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const decisionStats = await decisionLogger.getDecisionStats();
      setStats(decisionStats);
      
      // Load recent decisions for display
      const decisions = decisionLogger.getLocalDecisions();
      setRecentDecisions(decisions.slice(0, 5)); // Show last 5
    } catch (err) {
      console.error('Failed to load decision stats:', err);
      setError('Failed to load decision statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const checkMantleConnection = () => {
    setIsConnectedToMantle(decisionLogger.isConnectedToMantleL2());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getApprovalRate = () => {
    if (!stats || stats.totalDecisions === 0) return 0;
    return Math.round((stats.totalApprovals / stats.totalDecisions) * 100);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDecisionStats();
    checkMantleConnection();
    // Reload recent decisions
    const decisions = decisionLogger.getLocalDecisions();
    setRecentDecisions(decisions.slice(0, 5));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <LoadingCard title="Decision History" lines={4} className={className} />;
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Statistics</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <LoadingButton
            isLoading={isRefreshing}
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
          >
            Retry
          </LoadingButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Decision History</h3>
        <div className="flex items-center space-x-2">
          {isConnectedToMantle ? (
            <div className="flex items-center text-green-600 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Mantle L2
            </div>
          ) : (
            <div className="flex items-center text-yellow-600 text-sm">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></div>
              Local Only
            </div>
          )}
          <LoadingButton
            isLoading={isRefreshing}
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            className="p-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </LoadingButton>
        </div>
      </div>

      {stats && stats.totalDecisions > 0 ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-blue-900">{stats.totalDecisions}</div>
                  <div className="text-sm text-blue-700">Total Decisions</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-green-900">{stats.totalApprovals}</div>
                  <div className="text-sm text-green-700">Approved</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-red-900">{stats.totalRejections}</div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Approval Rate</span>
              <span className="text-sm font-bold text-gray-900">{getApprovalRate()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getApprovalRate()}%` }}
              ></div>
            </div>
          </div>

          {/* Recent Decisions List */}
          {recentDecisions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Decisions</h4>
              <div className="space-y-2">
                {recentDecisions.map((decision, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      decision.userChoice === 'approved' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {decision.userChoice === 'approved' ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            decision.userChoice === 'approved' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {decision.userChoice === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                          {decision.isDemo && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              Demo
                            </span>
                          )}
                          {!decision.isDemo && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Live
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {decision.transactionHash.slice(0, 10)}...
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        decision.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        decision.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {decision.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            Last updated: {formatDate(stats.lastUpdated)}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Decisions Yet</h3>
          <p className="text-sm text-gray-600">
            Start using AURA to analyze transactions and your decision history will appear here.
          </p>
        </div>
      )}

      {/* Contract Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Contract: {decisionLogger.getContractAddress().slice(0, 10)}...</span>
            <span>Local Decisions: {decisionLogger.getLocalDecisionsCount()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};