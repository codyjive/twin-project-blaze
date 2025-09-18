import type { Vehicle } from '@/types/inventory';
import { incentivesService } from './incentives.service';
import { mockInventory } from './mock-data';

class InventoryService {
  private inventory: Vehicle[] = [];
  private inventoryUrl = 'https://dealercentives.app.n8n.cloud/webhook/b845e99a-f406-48fa-b8a7-ba95d7111e91';

  async fetchInventory(): Promise<Vehicle[]> {
    try {
      console.log('Fetching real inventory from DealerCentives...');
      
      // Try to fetch real inventory data with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(this.inventoryUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns an object with num_found and listings array
      const listings = data.listings || data;
      const isArray = Array.isArray(listings);
      const vehicleData = isArray ? listings : [];
      
      console.log(`Loaded ${vehicleData.length} vehicles from DealerCentives`);
      
      // Transform the API data to match our Vehicle interface
      this.inventory = this.transformApiData(vehicleData);
      await this.enhanceInventory();
      
      return this.inventory;
    } catch (error) {
      console.error('Error fetching inventory, using mock data:', error);
      // Use mock data as fallback
      this.inventory = mockInventory;
      await this.enhanceInventory();
      return this.inventory;
    }
  }

  private transformApiData(apiData: any[]): Vehicle[] {
    return apiData.map(item => ({
      vin: item.vin || '',
      stock_no: item.stock_no || '',
      inventory_type: item.inventory_type || 'new',
      price: item.price || item.msrp || 0,
      msrp: item.msrp || item.price || 0,
      dom: item.dom || 0,
      build: {
        year: item.build?.year || new Date().getFullYear(),
        make: item.build?.make || 'Ford',
        model: item.build?.model || '',
        trim: item.build?.trim || '',
        body_style: item.build?.body_type || '',
        engine: item.build?.engine || '',
        transmission: item.build?.transmission || '',
        drivetrain: item.build?.drivetrain || '',
        exterior_color: item.exterior_color || '',
        interior_color: item.interior_color || '',
      },
      // Store original data for reference
      _raw: item,
    }));
  }

  private async enhanceInventory(): Promise<void> {
    this.inventory = await Promise.all(
      this.inventory.map(async vehicle => ({
        ...vehicle,
        residuals: vehicle.residuals || this.calculateResiduals(vehicle),
        financeRates: vehicle.financeRates || this.getFinanceRates(vehicle),
        isAged: vehicle.dom > 60,
        eligibleIncentives: await incentivesService.getVehicleIncentives(vehicle),
      }))
    );
  }

  private calculateResiduals(vehicle: Vehicle): Record<number, number> {
    const baseResidual: Record<string, Record<number, number>> = {
      'Ford': { 24: 0.62, 36: 0.53, 39: 0.50, 48: 0.43 },
      'Honda': { 24: 0.64, 36: 0.55, 39: 0.52, 48: 0.45 },
      'default': { 24: 0.60, 36: 0.50, 39: 0.47, 48: 0.40 },
    };
    
    const brand = vehicle.build.make;
    const residuals = baseResidual[brand] || baseResidual.default;
    
    return Object.entries(residuals).reduce((acc, [term, percent]) => {
      acc[Number(term)] = Math.round(vehicle.msrp * percent);
      return acc;
    }, {} as Record<number, number>);
  }

  private getFinanceRates(vehicle: Vehicle) {
    const isNew = vehicle.inventory_type === 'new';
    return {
      excellent: isNew ? 4.99 : 5.99,
      good: isNew ? 6.99 : 7.99,
      fair: isNew ? 9.99 : 11.99,
      poor: isNew ? 14.99 : 17.99,
    };
  }


  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    if (!this.inventory.length) {
      await this.fetchInventory();
    }
    return this.inventory.find(v => v.vin === vin);
  }
}

export const inventoryService = new InventoryService();