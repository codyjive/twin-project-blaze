import { dealerSettingsService } from '@/services/dealer-settings.service';
import { manufacturerRatesService } from '@/services/manufacturer-rates.service';
import type { LeaseCalculationParams } from '@/types/calculation';
import type { PaymentResult } from '@/types/inventory';
import type { Vehicle } from '@/types/inventory';

export class LeaseCalculator {

  async calculate({
    vehicle,
    downPayment,
    term = 36,
    annualMiles = 12000,
    includeIncentives = true,
  }: LeaseCalculationParams): Promise<PaymentResult> {
    const settings = dealerSettingsService.getSettings();
    const leaseConfig = settings.lease;
    const fees = settings.fees;
    
    // Calculate down payment based on configuration if not provided
    if (downPayment === undefined) {
      const config = leaseConfig.defaultDownPaymentConfig;
      if (config) {
        if (config.type === 'percentage') {
          const basePrice = config.basedOn === 'msrp' ? vehicle.msrp : (vehicle.price || vehicle.msrp);
          downPayment = Math.round((basePrice || 0) * (config.value / 100));
        } else {
          downPayment = config.value;
        }
      } else {
        downPayment = leaseConfig.defaultDownPayment || 0;
      }
    }
    const msrp = vehicle.msrp;
    const sellingPrice = leaseConfig.pricingMethod === 'msrp' ? msrp : (vehicle.price || msrp);
    
    // If no valid price, return zero payment
    if (!msrp || msrp <= 0 || !sellingPrice || sellingPrice <= 0) {
      return {
        type: 'lease',
        payment: 0,
        term: term,
        annualMiles: annualMiles,
        totalAtSigning: 0,
        residualValue: 0,
        incentivesSaved: 0,
        hasManufacturerRate: false,
        disclaimer: 'Price information not available',
        breakdown: {
          vehiclePrice: 0,
          incentives: 0,
          salePrice: 0,
          docFee: 0,
          acquisitionFee: 0,
          salesTax: 0,
          totalAmount: 0,
          downPayment: 0,
          residualValue: 0,
          depreciation: 0,
          financeCharge: 0,
        },
      };
    }
    
    // Apply lease incentives
    let leaseIncentive = 0;
    if (includeIncentives && vehicle.eligibleIncentives) {
      leaseIncentive = vehicle.eligibleIncentives
        .filter(inc => inc.type === 'lease' || inc.type === 'cash')
        .reduce((sum, inc) => sum + inc.amount, 0);
    }
    
    // Use 60% residual value as requested for Ford vehicles
    const residualPercent = 60; // Fixed 60% residual as requested
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
    
    if (make.toLowerCase() === 'ford') {
      // Ford-specific money factors
      const fordFactors: Record<number, number> = {
        24: 0.00150,  // 3.6% APR
        36: 0.00175,  // 4.2% APR 
        39: 0.00185,  // 4.44% APR
        48: 0.00200,  // 4.8% APR
      };
      return { 
        moneyFactor: fordFactors[term] || 0.00175,
        hasManufacturerRate: false
      };
    }
    
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

  // Removed - using fixed 60% residual as requested
  private getResidualPercent(make: string, model: string, term: number): number {
    // Fixed 60% residual for all vehicles as requested
    return 60;
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