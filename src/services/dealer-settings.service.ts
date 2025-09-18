import type { DealerSettings } from '@/types/dealer-settings';

const DEFAULT_SETTINGS: DealerSettings = {
  dealerId: 'inver-grove-honda',
  dealerName: 'Inver Grove Honda',
  
  finance: {
    defaultTerms: [36, 48, 60, 72, 84],
    defaultDownPayment: 0,
    defaultCreditTier: 'good',
    useManufacturerRates: true,
    pricingMethod: 'selling', // Default to selling price
    customRates: {
      excellent: 4.99,
      good: 6.99,
      fair: 9.99,
      poor: 14.99,
    },
    markupBasisPoints: 200,
    maxBackend: 2500,
    fallbackRates: {
      byModel: [],
      default: {
        excellent: 5.99,
        good: 6.99,
        fair: 9.99,
        poor: 13.99,
      },
    },
  },
  
  lease: {
    defaultTerms: [24, 36, 39, 48],
    defaultMileage: [10000, 12000, 15000],
    defaultDownPayment: 2500,
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
    financeFeedUrl: 'https://files.dealercentives.com/feeds/meta/regional/feeds/honda/honda-ut-finance.json',
    inventoryWebhookUrl: 'https://dealercentives.app.n8n.cloud/webhook/7790fd25-d45b-469b-abf9-8b18946dc5dd',
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
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading dealer settings:', error);
    }
    return DEFAULT_SETTINGS;
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
    this.settings = {
      ...this.settings,
      ...updates,
      finance: { ...this.settings.finance, ...updates.finance },
      lease: { ...this.settings.lease, ...updates.lease },
      fees: { ...this.settings.fees, ...updates.fees },
      display: { ...this.settings.display, ...updates.display },
      integrations: { ...this.settings.integrations, ...updates.integrations },
    };
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