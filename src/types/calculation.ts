export type CreditTier = 'excellent' | 'good' | 'fair' | 'poor';

export interface FinanceCalculationParams {
  vehicle: import('./inventory').Vehicle;
  downPayment?: number;
  tradeValue?: number;
  term?: number;
  creditTier?: CreditTier;
  includeIncentives?: boolean;
}

export interface LeaseCalculationParams {
  vehicle: import('./inventory').Vehicle;
  downPayment?: number;
  term?: number;
  annualMiles?: number;
  includeIncentives?: boolean;
}

export interface BulkCalculationRequest {
  type: 'finance' | 'lease';
  configuration: Partial<FinanceCalculationParams | LeaseCalculationParams>;
}

export interface BulkCalculationResult {
  vin: string;
  stockNumber: string;
  success: boolean;
  payment?: number;
  totalAtSigning?: number;
  error?: string;
}

export interface BulkCalculationSummary {
  total: number;
  successful: number;
  failed: number;
  averagePayment: number;
  results: BulkCalculationResult[];
}