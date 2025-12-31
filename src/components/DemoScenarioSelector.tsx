import React, { useState } from 'react';
import { DemoScenario, demoScenarios, getDemoScenarioForPresentation } from '../utils/demoScenarios';
import { LoadingButton } from './LoadingSpinner';

interface DemoScenarioSelectorProps {
  onSelectScenario: (scenario: DemoScenario) => void;
  onBack: () => void;
}

export const DemoScenarioSelector: React.FC<DemoScenarioSelectorProps> = ({
  onSelectScenario,
  onBack
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'safe' | 'risky' | 'complex'>('all');
  
  const presentationScenarios = getDemoScenarioForPresentation();
  const filteredScenarios = selectedCategory === 'all' 
    ? demoScenarios 
    : demoScenarios.filter(scenario => scenario.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'risky': return 'bg-red-100 text-red-800 border-red-200';
      case 'complex': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safe':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'risky':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'complex':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Demo Scenarios</h1>
            <LoadingButton
              isLoading={false}
              onClick={onBack}
              variant="secondary"
              size="md"
            >
              ← Back to Main
            </LoadingButton>
          </div>
          <p className="text-gray-600">
            Choose a transaction scenario to see how AURA analyzes different types of blockchain interactions.
          </p>
        </div>

        {/* Quick Demo Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            ⭐ Featured Scenarios
          </h2>
          <p className="text-blue-700 mb-4">
            These scenarios showcase AURA's key capabilities across different transaction types.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presentationScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className="text-left p-4 bg-white border border-blue-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(scenario.category)}`}>
                    {getCategoryIcon(scenario.category)}
                    <span className="ml-1 capitalize">{scenario.category}</span>
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{scenario.name}</h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'safe', 'risky', 'complex'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category === 'all' ? 'All Scenarios' : `${category.charAt(0).toUpperCase() + category.slice(1)} Transactions`}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(scenario.category)}`}>
                    {getCategoryIcon(scenario.category)}
                    <span className="ml-2 capitalize">{scenario.category}</span>
                  </span>
                  {scenario.expectedUserAction && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      scenario.expectedUserAction === 'approve' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Expected: {scenario.expectedUserAction}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {scenario.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {scenario.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Notes:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {scenario.demoNotes.slice(0, 2).map((note, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-1">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                <LoadingButton
                  isLoading={false}
                  onClick={() => onSelectScenario(scenario)}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  Review Transaction
                </LoadingButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};