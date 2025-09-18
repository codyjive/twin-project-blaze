export interface DealerSettings {
  dealerId: string;
  dealerName: string;
  
  // Finance Settings
  finance: {
    defaultTerms: number[];
    defaultDownPayment: number;
    defaultCreditTier: 'excellent' | 'good' | 'fair' | 'poor';
    useManufacturerRates: boolean;
    pricingMethod: 'msrp' | 'selling'; // Which price to use for calculations
    customRates?: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    markupBasisPoints: number;
    maxBackend: number;
    // Fallback rates for vehicles without manufacturer rates
    fallbackRates: {
      byModel: Array<{
        year: number;
        make: string;
        model: string;
        trim?: string;
        rates: {
          excellent: number;
          good: number;
          fair: number;
          poor: number;
        };
      }>;
      default: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
      };
    };
  };
  
  // Lease Settings
  lease: {
    defaultTerms: number[];
    defaultMileage: number[];
    defaultDownPayment: number;
    pricingMethod: 'msrp' | 'selling'; // Which price to use for calculations
    acquisitionFee: number;
    dispositionFee: number;
    excessMileageCharge: number;
    taxMethod: 'monthly' | 'upfront' | 'capitalized';
    customMoneyFactors?: Record<number, number>;
    // Fallback residuals for vehicles without manufacturer data
    fallbackResiduals: {
      byModel: Array<{
        year: number;
        make: string;
        model: string;
        trim?: string;
        residuals: Record<number, number>; // term -> residual percentage
      }>;
      default: Record<number, number>; // term -> default residual percentage
    };
  };
  
  // Fees
  fees: {
    docFee: number;
    electronicFiling: number;
    stateTaxRate: number;
    countyTaxRate: number;
    customFees: Array<{
      name: string;
      amount: number;
      taxable: boolean;
    }>;
  };
  
  // Display Settings
  display: {
    roundingMethod: 'nearest1' | 'nearest5' | 'nearest10';
    showDisclaimer: boolean;
    disclaimerPosition: 'top' | 'bottom';
    emphasisMode: 'payment' | 'savings' | 'both';
    showIncentives: boolean;
    showTotalSavings: boolean;
    customDisclaimerText?: string;
    showMissingRateWarning: boolean; // Flag vehicles missing manufacturer rates
  };
  
  // Integration Settings
  integrations: {
    financeFeedUrl?: string;
    leaseFeedUrl?: string;
    inventoryWebhookUrl: string;
    autoUpdateRates: boolean;
    updateFrequency: 'hourly' | 'daily' | 'weekly';
  };
}