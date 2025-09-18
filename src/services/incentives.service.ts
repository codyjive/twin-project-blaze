import type { Vehicle, Incentive } from '@/types/inventory';
import { manufacturerRatesService } from './manufacturer-rates.service';
import { dealerSettingsService } from './dealer-settings.service';

interface IncentiveRule {
  id: string;
  type: 'finance' | 'lease' | 'cash';
  name: string;
  amount: number;
  requirements?: string[];
  stackable?: boolean;
  models?: string[];
  minDom?: number;
  maxDom?: number;
}

class IncentivesService {
  private incentivesUrl = 'https://files.dealercentives.com/feeds/meta/regional/feeds/ford/ford-al-finance.json';
  // Default incentive rules - these should eventually come from a database or API
  private defaultRules: IncentiveRule[] = [
    {
      id: 'aged-inventory-60',
      type: 'cash',
      name: 'Aged Inventory Discount',
      amount: 1000,
      minDom: 60,
      maxDom: 90,
      stackable: true,
    },
    {
      id: 'aged-inventory-90',
      type: 'cash',
      name: 'Aged Inventory Discount',
      amount: 1500,
      minDom: 90,
      stackable: true,
    },
  ];

  /**
   * Get all eligible incentives for a vehicle
   * This will eventually pull from manufacturer feeds and dealer-specific rules
   */
  async getVehicleIncentives(vehicle: Vehicle): Promise<Incentive[]> {
    const incentives: Incentive[] = [];
    const settings = dealerSettingsService.getSettings();
    
    // Only apply incentives to new vehicles
    if (vehicle.inventory_type !== 'new') {
      return incentives;
    }

    // Check aged inventory incentives
    const agedIncentive = this.checkAgedInventory(vehicle);
    if (agedIncentive) {
      incentives.push(agedIncentive);
    }

    // Get manufacturer incentives from feed
    if (settings.finance.useManufacturerRates) {
      const manufacturerIncentives = await this.getManufacturerIncentives(vehicle);
      incentives.push(...manufacturerIncentives);
    }

    // Apply dealer-specific incentives
    const dealerIncentives = this.getDealerIncentives(vehicle);
    incentives.push(...dealerIncentives);

    return incentives;
  }

  private checkAgedInventory(vehicle: Vehicle): Incentive | null {
    // No automatic aged inventory discounts
    return null;
  }

  private async getManufacturerIncentives(vehicle: Vehicle): Promise<Incentive[]> {
    const incentives: Incentive[] = [];
    
    try {
      // Fetch Ford incentives from feed
      const response = await fetch(this.incentivesUrl);
      if (response.ok) {
        const data = await response.json();
        // Parse Ford incentive data
        // Structure will depend on actual feed format
        // For now, return empty array until we know the structure
      }
    } catch (error) {
      console.error('Error fetching Ford incentives:', error);
    }
    
    return incentives;
  }

  private getDealerIncentives(vehicle: Vehicle): Incentive[] {
    const incentives: Incentive[] = [];
    
    // These would come from dealer-specific configuration
    // For now, NO hardcoded $500 incentive - only real incentives
    
    return incentives;
  }

  /**
   * Calculate total incentive amount for a vehicle
   */
  calculateTotalIncentives(
    incentives: Incentive[],
    type: 'finance' | 'lease' | 'cash' = 'cash'
  ): number {
    return incentives
      .filter(inc => inc.type === type || inc.type === 'cash')
      .filter(inc => inc.stackable !== false) // Only stackable incentives
      .reduce((sum, inc) => sum + inc.amount, 0);
  }
}

export const incentivesService = new IncentivesService();