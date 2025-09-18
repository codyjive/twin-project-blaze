export interface Vehicle {
  vin: string;
  stock_no: string;
  inventory_type: 'new' | 'used' | 'demo';
  price: number;
  msrp: number;
  dom: number; // Days on market
  build: {
    year: number;
    make: string;
    model: string;
    trim: string;
    body_style: string;
    engine: string;
    transmission: string;
    drivetrain: string;
    exterior_color: string;
    interior_color: string;
  };
  residuals?: Record<number, number>;
  financeRates?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  isAged?: boolean;
  eligibleIncentives?: Incentive[];
  calculatedPayment?: PaymentResult;
  _raw?: any; // Original API data for reference
}

export interface Incentive {
  id: string;
  type: 'finance' | 'lease' | 'cash';
  name: string;
  amount: number;
  requirements?: string[];
  stackable?: boolean;
}

export interface PaymentResult {
  type: 'finance' | 'lease';
  payment: number;
  term: number;
  apr?: number;
  annualMiles?: number;
  totalAtSigning: number;
  amountFinanced?: number;
  residualValue?: number;
  totalPrice?: number;
  incentivesSaved: number;
  disclaimer: string;
  hasManufacturerRate?: boolean;
  breakdown?: PaymentBreakdown;
}

export interface PaymentBreakdown {
  vehiclePrice: number;
  incentives: number;
  salePrice: number;
  docFee: number;
  electronicFiling?: number;
  salesTax: number;
  totalAmount: number;
  downPayment: number;
  tradeValue?: number;
  amountFinanced?: number;
  acquisitionFee?: number;
  residualValue?: number;
  depreciation?: number;
  financeCharge?: number;
}