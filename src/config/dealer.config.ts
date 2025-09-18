export const dealerConfig = {
  dealerId: 'inver-grove-honda',
  dealerName: 'Inver Grove Honda',
  
  finance: {
    defaultTerms: [36, 48, 60, 72, 84],
    defaultDownPayment: 0,
    defaultCreditTier: 'good',
    includeAcquisitionFee: true,
    markupBasisPoints: 200, // 2% dealer markup
    maxBackend: 2500, // Max F&I products
  },
  
  lease: {
    defaultTerms: [24, 36, 39, 48],
    defaultMileage: [10000, 12000, 15000],
    defaultDownPayment: 2500,
    includeAcquisitionFee: true,
    acquisitionFee: 595,
    dispositionFee: 350,
    excessMileageCharge: 0.20,
    taxMethod: 'monthly', // Minnesota taxes monthly payment
  },
  
  fees: {
    docFee: 125,
    electronicFiling: 100,
    stateTaxRate: 0.06875, // Minnesota state tax
    countyTaxRate: 0.005,   // Estimated county tax
    customFees: [],
  },
  
  display: {
    roundingMethod: 'nearest5', // Round to nearest $5
    showDisclaimer: true,
    disclaimerPosition: 'bottom',
    emphasisMode: 'payment', // Focus on monthly payment
    showIncentives: true,
    showTotalSavings: true,
  },
};

export type DealerConfig = typeof dealerConfig;