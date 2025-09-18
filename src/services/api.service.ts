import { inventoryService } from './inventory.service';
import { financeCalculator } from './finance.calculator';
import { leaseCalculator } from './lease.calculator';
import { dealerConfig } from '@/config/dealer.config';
import type { Vehicle, PaymentResult } from '@/types/inventory';
import type { BulkCalculationRequest, BulkCalculationSummary, CreditTier } from '@/types/calculation';

export const api = {
  // Inventory endpoints
  async fetchInventory(): Promise<Vehicle[]> {
    return inventoryService.fetchInventory();
  },

  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    return inventoryService.getVehicleByVin(vin);
  },

  // Payment calculation endpoints
  async calculatePayment(
    vin: string,
    params: {
      type: 'finance' | 'lease';
      downPayment?: number;
      tradeValue?: number;
      term?: number;
      creditTier?: CreditTier;
      annualMiles?: number;
    }
  ): Promise<{ vehicle: Vehicle; calculation: PaymentResult } | null> {
    const vehicle = await inventoryService.getVehicleByVin(vin);
    
    if (!vehicle) {
      return null;
    }

    const calculation = params.type === 'lease'
      ? await leaseCalculator.calculate({
          vehicle,
          downPayment: params.downPayment,
          term: params.term,
          annualMiles: params.annualMiles,
        })
      : await financeCalculator.calculate({
          vehicle,
          downPayment: params.downPayment,
          tradeValue: params.tradeValue,
          term: params.term,
          creditTier: params.creditTier,
        });

    return { vehicle, calculation };
  },

  // Bulk calculation endpoints
  async calculateBulk(request: BulkCalculationRequest): Promise<BulkCalculationSummary> {
    const inventory = await inventoryService.fetchInventory();
    
    const results = await Promise.all(inventory.map(async vehicle => {
      try {
        const calc = request.type === 'lease'
          ? await leaseCalculator.calculate({ vehicle, ...request.configuration })
          : await financeCalculator.calculate({ vehicle, ...request.configuration });
        
        return {
          vin: vehicle.vin,
          stockNumber: vehicle.stock_no,
          success: true,
          payment: calc.payment,
          totalAtSigning: calc.totalAtSigning,
        };
      } catch (error) {
        return {
          vin: vehicle.vin,
          stockNumber: vehicle.stock_no,
          success: false,
          error: error instanceof Error ? error.message : 'Calculation failed',
        };
      }
    }));

    const successfulResults = results.filter(r => r.success && r.payment);
    const averagePayment = successfulResults.length > 0
      ? Math.round(
          successfulResults.reduce((sum, r) => sum + (r.payment || 0), 0) / successfulResults.length
        )
      : 0;

    return {
      total: results.length,
      successful: successfulResults.length,
      failed: results.filter(r => !r.success).length,
      averagePayment,
      results,
    };
  },

  // Configuration endpoints
  getConfig() {
    return dealerConfig;
  },

  updateConfig(newConfig: Partial<typeof dealerConfig>) {
    Object.assign(dealerConfig, newConfig);
    return dealerConfig;
  },
};