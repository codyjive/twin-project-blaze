import type { DealerSettings } from '@/types/dealer-settings';

const DEFAULT_SETTINGS: DealerSettings = {
  dealerId: 'tony-serra-ford',
  dealerName: 'Tony Serra Ford',
  
  finance: {
    defaultTerms: [36, 48, 60, 72, 84],
    defaultDownPayment: 0,
    defaultDownPaymentConfig: {
      type: 'percentage',
      value: 10,
      basedOn: 'selling',
    },
    defaultCreditTier: 'good',
    useManufacturerRates: true,
    pricingMethod: 'selling', // Default to selling price
    customRates: {
      excellent: 5.99,
      good: 7.99,
      fair: 10.99,
      poor: 15.99,
    },
    markupBasisPoints: 200,
    maxBackend: 2500,
    fallbackRates: {
      byModel: [],
      default: {
        excellent: 6.99,
        good: 8.99,
        fair: 11.99,
        poor: 16.99,
      },
    },
  },
  
  lease: {
    defaultTerms: [24, 36, 39, 48],
    defaultMileage: [10000, 12000, 15000],
    defaultDownPayment: 2500,
    defaultDownPaymentConfig: {
      type: 'percentage',
      value: 10,
      basedOn: 'selling',
    },
    pricingMethod: 'msrp', // Default to MSRP for leases
    acquisitionFee: 595,
    dispositionFee: 350,
    excessMileageCharge: 0.20,
    taxMethod: 'monthly',
    customMoneyFactors: {
      24: 0.00125,
      36: 0.00150,
      39: 0.00165,
      48: 0.00180,
    },
    fallbackResiduals: {
      byModel: [],
      default: {
        24: 0.65,
        36: 0.55,
        39: 0.52,
        48: 0.45,
      },
    },
  },
  
  fees: {
    docFee: 125,
    electronicFiling: 100,
    stateTaxRate: 0.06875,
    countyTaxRate: 0.005,
    customFees: [],
  },
  
  display: {
    roundingMethod: 'nearest5',
    showDisclaimer: true,
    disclaimerPosition: 'bottom',
    emphasisMode: 'payment',
    showIncentives: true,
    showTotalSavings: true,
    showMissingRateWarning: true,
  },
  
  integrations: {
    financeFeedUrl: 'https://files.dealercentives.com/feeds/meta/regional/feeds/ford/ford-al-finance.json',
    inventoryWebhookUrl: 'https://dealercentives.app.n8n.cloud/webhook/b845e99a-f406-48fa-b8a7-ba95d7111e91',
    autoUpdateRates: true,
    updateFrequency: 'daily',
  },
};

class DealerSettingsService {
  private settings: DealerSettings;
  private storageKey = 'dealer-settings';

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): DealerSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge to ensure nested objects are properly merged
        return this.deepMerge(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.error('Error loading dealer settings:', error);
    }
    return DEFAULT_SETTINGS;
  }
  
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
  
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving dealer settings:', error);
    }
  }

  getSettings(): DealerSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<DealerSettings>): DealerSettings {
    // Use deep merge to properly handle nested updates
    this.settings = this.deepMerge(this.settings, updates);
    this.saveSettings();
    return this.getSettings();
  }

  resetToDefaults(): DealerSettings {
    this.settings = DEFAULT_SETTINGS;
    this.saveSettings();
    return this.getSettings();
  }

  // Convenience methods for specific settings
  getFinanceSettings() {
    return this.settings.finance;
  }

  getLeaseSettings() {
    return this.settings.lease;
  }

  getFees() {
    return this.settings.fees;
  }

  getDisplaySettings() {
    return this.settings.display;
  }
}

export const dealerSettingsService = new DealerSettingsService();