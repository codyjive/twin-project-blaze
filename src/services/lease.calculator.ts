import { dealerSettingsService } from '@/services/dealer-settings.service';
import { manufacturerRatesService } from '@/services/manufacturer-rates.service';
import type { LeaseCalculationParams } from '@/types/calculation';
import type { PaymentResult } from '@/types/inventory';
import type { Vehicle } from '@/types/inventory';

export class LeaseCalculator {

  async calculate({
    vehicle,
    downPayment = 2500,
    term = 36,
    annualMiles = 12000,
    includeIncentives = true,
  }: LeaseCalculationParams): Promise<PaymentResult> {
    const settings = dealerSettingsService.getSettings();
    const leaseConfig = settings.lease;
    const fees = settings.fees;
    const msrp = vehicle.msrp;
    const sellingPrice = leaseConfig.pricingMethod === 'msrp' ? msrp : (vehicle.price || msrp);
    
    // Apply lease incentives
    let leaseIncentive = 0;
    if (includeIncentives && vehicle.eligibleIncentives) {
      leaseIncentive = vehicle.eligibleIncentives
        .filter(inc => inc.type === 'lease' || inc.type === 'cash')
        .reduce((sum, inc) => sum + inc.amount, 0);
    }
    
    // Use Honda-specific residual values based on actual market data
    // Honda typically offers 65-70% residuals on Civic models
    const residualPercent = this.getResidualPercent(vehicle.build.make, vehicle.build.model, term);
    const residualValue = msrp * (residualPercent / 100);
    
    // Get money factor - try manufacturer rates first, then fall back to defaults
    const { moneyFactor, hasManufacturerRate } = await this.getMoneyFactor(vehicle, term);
    
    // Calculate capitalized cost
    const grossCapCost = sellingPrice + leaseConfig.acquisitionFee;
    const capCostReduction = downPayment + leaseIncentive;
    const adjustedCapCost = grossCapCost - capCostReduction;
    
    // Monthly depreciation
    const depreciation = (adjustedCapCost - residualValue) / term;
    
    // Monthly finance charge
    const financeCharge = (adjustedCapCost + residualValue) * moneyFactor;
    
    // Base payment
    const basePayment = depreciation + financeCharge;
    
    // Add tax (Minnesota taxes monthly payment)
    const monthlyTax = basePayment * (fees.stateTaxRate + fees.countyTaxRate);
    const totalPayment = basePayment + monthlyTax;
    
    // Calculate due at signing (matching dealer format)
    const firstPayment = this.roundPayment(totalPayment, settings.display.roundingMethod);
    const totalAtSigning = downPayment + firstPayment + fees.docFee + fees.electronicFiling;
    
    // Generate disclaimer
    const disclaimer = this.generateDisclaimer({
      payment: firstPayment,
      term,
      miles: annualMiles,
      totalAtSigning,
      totalLeaseCost: (firstPayment * term) + downPayment,
    });
    
    return {
      type: 'lease',
      payment: firstPayment,
      term,
      annualMiles,
      totalAtSigning: Math.round(totalAtSigning),
      residualValue: Math.round(residualValue),
      incentivesSaved: leaseIncentive,
      hasManufacturerRate,
      disclaimer,
      breakdown: {
        vehiclePrice: msrp,
        incentives: -leaseIncentive,
        salePrice: sellingPrice,
        docFee: fees.docFee,
        acquisitionFee: leaseConfig.acquisitionFee,
        salesTax: Math.round(monthlyTax * term),
        totalAmount: Math.round((firstPayment * term) + downPayment),
        downPayment: -downPayment,
        residualValue: Math.round(residualValue),
        depreciation: Math.round(depreciation),
        financeCharge: Math.round(financeCharge),
      },
    };
  }

  private async getMoneyFactor(vehicle: Vehicle, term: number): Promise<{ moneyFactor: number; hasManufacturerRate: boolean }> {
    // Try to get manufacturer rate first
    const manufacturerRate = await manufacturerRatesService.findBestRate(vehicle, term);
    
    if (manufacturerRate && manufacturerRate.rate > 0) {
      // Convert APR to money factor (APR / 2400)
      const moneyFactor = manufacturerRate.rate / 2400;
      return { moneyFactor, hasManufacturerRate: true };
    }
    
    // Fall back to Honda-specific money factors based on current programs
    const make = vehicle.build.make;
    const model = vehicle.build.model;
    
    if (make.toLowerCase() === 'honda') {
      const hondaFactors: Record<number, number> = {
        24: 0.00100,  // 2.4% APR
        36: 0.00110,  // 2.64% APR - matches dealer example
        39: 0.00125,  // 3.0% APR
        48: 0.00140,  // 3.36% APR
      };
      return { 
        moneyFactor: hondaFactors[term] || 0.00125,
        hasManufacturerRate: false
      };
    }
    
    // Default factors for other makes
    const defaultFactors: Record<number, number> = {
      24: 0.00150,
      36: 0.00175,
      39: 0.00185,
      48: 0.00200,
    };
    
    return { 
      moneyFactor: defaultFactors[term] || 0.00175,
      hasManufacturerRate: false
    };
  }

  private getResidualPercent(make: string, model: string, term: number): number {
    // Honda-specific residual values based on actual market data
    if (make.toLowerCase() === 'honda') {
      // Civic models have strong residuals
      if (model.toLowerCase().includes('civic')) {
        const civicResiduals: Record<number, number> = {
          24: 72,   // 72% for 24 months
          36: 68,   // 68% for 36 months - matches dealer example
          39: 65,   // 65% for 39 months
          48: 60,   // 60% for 48 months
        };
        return civicResiduals[term] || 65;
      }
      
      // HR-V and CR-V models
      if (model.toLowerCase().includes('hr-v') || model.toLowerCase().includes('cr-v')) {
        const suvResiduals: Record<number, number> = {
          24: 70,
          36: 66,
          39: 63,
          48: 58,
        };
        return suvResiduals[term] || 63;
      }
      
      // Default Honda residuals
      const hondaDefaults: Record<number, number> = {
        24: 68,
        36: 64,
        39: 61,
        48: 56,
      };
      return hondaDefaults[term] || 60;
    }
    
    // Default residuals for other makes
    const defaultResiduals: Record<number, number> = {
      24: 60,
      36: 55,
      39: 52,
      48: 48,
    };
    
    return defaultResiduals[term] || 50;
  }

  private roundPayment(payment: number, method: string = 'nearest5'): number {
    switch (method) {
      case 'nearest1':
        return Math.round(payment);
      case 'nearest10':
        return Math.round(payment / 10) * 10;
      case 'nearest5':
      default:
        return Math.round(payment / 5) * 5;
    }
  }

  private generateDisclaimer({
    payment,
    term,
    miles,
    totalAtSigning,
    totalLeaseCost,
  }: {
    payment: number;
    term: number;
    miles: number;
    totalAtSigning: number;
    totalLeaseCost: number;
  }): string {
    // Get end of current month for expiration date
    const now = new Date();
    const expirationDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expDateStr = `${expirationDate.getMonth() + 1}/${expirationDate.getDate()}/${expirationDate.getFullYear()}`;
    
    // Lease disclaimer with all dynamic values
    return `*Estimated monthly lease payment of $${payment}/mo for ${term} months with ${miles.toLocaleString()} miles/year. ` +
      `$${Math.round(totalAtSigning).toLocaleString()} total due at lease signing includes $${Math.round(totalAtSigning - payment).toLocaleString()} down payment, first month payment of $${payment}, and $0 security deposit. ` +
      `Total cost to lessee is $${Math.round(totalLeaseCost).toLocaleString()} over the lease term. ` +
      `Except as otherwise expressly provided, excludes sales tax, title, registration and other fees. ` +
      `Lessee is responsible for vehicle maintenance, insurance, repairs and charges for excess wear and tear. ` +
      `Excess mileage charges may apply. Actual monthly payments will vary. ` +
      `Not all lessees may qualify; higher lease rates apply for lessees with lower credit ratings. ` +
      `Payment estimate based on lease programs in effect through ${expDateStr}.`;
  }
}

export const leaseCalculator = new LeaseCalculator();