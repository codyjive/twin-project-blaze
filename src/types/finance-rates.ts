export interface ManufacturerFinanceRate {
  id: string | null;
  year: string;
  make: string;
  model: string;
  trim: string;
  incentive_type: 'finance' | 'lease' | 'cash';
  finance_rate: string;
  finance_term: number;
  finance_apr: string;
  finance_disclaimer: string;
  lease_disclaimer: string;
  valid_from: string;
  valid_through: string;
  expiration_date: string;
  title_raw: string;
  offer_headline: string;
  disclaimer_raw: string;
  oem_program_name: string;
}

export interface FinanceRateMatch {
  rate: number;
  term: number;
  disclaimer: string;
  programName: string;
  expirationDate: string;
}