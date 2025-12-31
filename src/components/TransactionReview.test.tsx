import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionReview } from './TransactionReview';
import { TransactionContext, TransactionType, IndicatorType } from '../types';

describe('TransactionReview', () => {
  const mockTransaction: TransactionContext = {
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    type: TransactionType.TRANSFER,
    recipient: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6',
    value: '0.1',
    intent: 'Send 0.1 ETH to recipient address',
    estimatedOutcome: 'Recipient will receive 0.1 ETH',
    riskIndicators: [
      {
        type: IndicatorType.HIGH_VALUE,
        severity: 'warning',
        message: 'High value transaction',
        source: 'Value Analysis'
      }
    ],
    timestamp: Date.now()
  };

  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    mockOnApprove.mockClear();
    mockOnReject.mockClear();
  });

  it('should render transaction details correctly', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Check if main elements are present
    expect(screen.getByText('Transaction Review')).toBeInTheDocument();
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('Risk Indicators')).toBeInTheDocument();
    
    // Check transaction details
    expect(screen.getByText('Token Transfer')).toBeInTheDocument();
    expect(screen.getByText('0x742d...d8b6')).toBeInTheDocument();
    expect(screen.getByText('0.1000 ETH')).toBeInTheDocument();
    expect(screen.getByText('Send 0.1 ETH to recipient address')).toBeInTheDocument();
  });

  it('should render risk indicators correctly', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('High Value Transaction')).toBeInTheDocument();
    expect(screen.getByText('High value transaction')).toBeInTheDocument();
    expect(screen.getByText('Source: Value Analysis')).toBeInTheDocument();
  });

  it('should show no risk indicators message when none present', () => {
    const transactionWithoutRisk = {
      ...mockTransaction,
      riskIndicators: []
    };

    render(
      <TransactionReview
        transaction={transactionWithoutRisk}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('No Risk Indicators Detected')).toBeInTheDocument();
  });

  it('should call onApprove when proceed button is clicked', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const proceedButton = screen.getByText('Proceed with Transaction');
    fireEvent.click(proceedButton);

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('should call onReject when cancel button is clicked', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const cancelButton = screen.getByText('Cancel Transaction');
    fireEvent.click(cancelButton);

    expect(mockOnReject).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when processing', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        isProcessing={true}
      />
    );

    const cancelButton = screen.getByText('Cancel Transaction');
    const proceedButton = screen.getByText('Proceed with Transaction');
    
    expect(cancelButton).toBeDisabled();
    expect(proceedButton).toBeDisabled();
  });

  it('should render disclaimer text', () => {
    render(
      <TransactionReview
        transaction={mockTransaction}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/These indicators are basic data checks/)).toBeInTheDocument();
    expect(screen.getByText(/Proceeding will open MetaMask/)).toBeInTheDocument();
  });
});