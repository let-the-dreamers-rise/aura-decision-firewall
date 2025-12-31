import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      case 'gray':
        return 'text-gray-600';
      case 'white':
        return 'text-white';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <svg
      className={`animate-spin ${getSizeClasses()} ${getColorClasses()} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-transparent';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-transparent';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white border-transparent';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-transparent';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'md':
        return 'sm';
      case 'lg':
        return 'md';
      default:
        return 'sm';
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        border font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {isLoading && (
        <LoadingSpinner
          size={getSpinnerSize() as 'sm' | 'md'}
          color="white"
          className="mr-2"
        />
      )}
      {children}
    </button>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  children
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        {children && (
          <div className="text-sm text-gray-600">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  lines?: number;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title,
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
      {title && (
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-gray-200 rounded ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = 'Loading...',
  size = 'sm',
  className = ''
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <LoadingSpinner size={size} className="mr-2" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};