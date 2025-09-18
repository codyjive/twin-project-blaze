export interface ModelOverride {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  active: boolean;
  
  // Finance overrides
  financeOverride?: {
    rate?: number;
    term?: number;
    bonusCash?: number;
    additionalDiscount?: number;
    overrideManufacturerRate?: boolean;
  };
  
  // Lease overrides
  leaseOverride?: {
    moneyFactor?: number;
    residualPercentage?: number;
    term?: number;
    bonusCash?: number;
    additionalDiscount?: number;
  };
  
  // General incentives
  incentives?: {
    cashBack?: number;
    dealerCash?: number;
    loyaltyBonus?: number;
    tradeInBonus?: number;
    stackable?: boolean;
  };
  
  notes?: string;
  lastUpdated: Date;
}

export interface DownPaymentConfig {
  type: 'fixed' | 'percentage';
  value: number;
  basedOn?: 'msrp' | 'selling';
}