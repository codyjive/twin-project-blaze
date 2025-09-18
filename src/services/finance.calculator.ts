import { dealerSettingsService } from '@/services/dealer-settings.service';
import { manufacturerRatesService } from '@/services/manufacturer-rates.service';
import type { FinanceCalculationParams } from '@/types/calculation';
import type { PaymentResult } from '@/types/inventory';

export class FinanceCalculator {
  private hasManufacturerRate: boolean = false;
  private usedFallbackRate: boolean = false;

  async calculate({
    vehicle,
    downPayment,
    tradeValue = 0,
    term = 72,
    creditTier = 'good',
    includeIncentives = true,
  }: FinanceCalculationParams): Promise<PaymentResult & { hasManufacturerRate: boolean }> {
    const settings = dealerSettingsService.getSettings();
    const fees = settings.fees;
    const financeSettings = settings.finance;
    
    // Calculate down payment based on configuration if not provided
    if (downPayment === undefined) {
      const config = financeSettings.defaultDownPaymentConfig;
      if (config) {
        if (config.type === 'percentage') {
          const basePrice = config.basedOn === 'msrp' ? vehicle.msrp : (vehicle.price || vehicle.msrp);
          downPayment = Math.round((basePrice || 0) * (config.value / 100));
        } else {
          downPayment = config.value;
        }
      } else {
        downPayment = financeSettings.defaultDownPayment || 0;
      }
    }
    // Get base pricing based on dealer's preference
    const vehiclePrice = financeSettings.pricingMethod === 'msrp' ? vehicle.msrp : (vehicle.price || vehicle.msrp);
    
    // If no valid price, return zero payment
    if (!vehiclePrice || vehiclePrice <= 0) {
      return {
        type: 'finance',
        payment: 0,
        apr: 0,
        term: term,
        amountFinanced: 0,
        totalPrice: 0,
        incentivesSaved: 0,
        totalAtSigning: 0,
        disclaimer: 'Price information not available',
        breakdown: {
          vehiclePrice: 0,
          incentives: 0,
          salePrice: 0,
          docFee: 0,
          electronicFiling: 0,
          salesTax: 0,
          totalAmount: 0,
          downPayment: 0,
          tradeValue: 0,
          amountFinanced: 0,
        },
        hasManufacturerRate: false,
      };
    }
    
    // Apply incentives
    let incentiveAmount = 0;
    if (includeIncentives && vehicle.eligibleIncentives) {
      incentiveAmount = vehicle.eligibleIncentives
        .filter(inc => inc.type === 'finance' || inc.type === 'cash')
        .reduce((sum, inc) => sum + inc.amount, 0);
    }
    
    const salePrice = vehiclePrice - incentiveAmount;
    
    // Calculate fees
    let totalFees = fees.docFee + fees.electronicFiling;
    if (fees.customFees) {
      totalFees += fees.customFees.reduce((sum, fee) => sum + fee.amount, 0);
    }
    
    // Calculate financed amount
    const taxableAmount = salePrice + totalFees;
    const salesTax = taxableAmount * (fees.stateTaxRate + fees.countyTaxRate);
    const totalAmount = taxableAmount + salesTax;
    const amountFinanced = totalAmount - downPayment - tradeValue;
    
    // Get APR - use manufacturer rates if enabled
    let apr: number;
    let disclaimer: string | undefined;
    let programName: string | undefined;
    this.hasManufacturerRate = false;
    this.usedFallbackRate = false;
    
    if (financeSettings.useManufacturerRates) {
      await manufacturerRatesService.fetchRates(vehicle.build.make);
      const bestRate = manufacturerRatesService.findBestRate(vehicle, term);
      
      if (bestRate) {
        apr = bestRate.rate;
        disclaimer = bestRate.disclaimer;
        programName = bestRate.programName;
        this.hasManufacturerRate = true;
      } else {
        // Try model-specific fallback rates first
        const modelFallback = financeSettings.fallbackRates.byModel.find(fb => 
          fb.year === vehicle.build.year &&
          fb.make.toLowerCase() === vehicle.build.make.toLowerCase() &&
          fb.model.toLowerCase() === vehicle.build.model.toLowerCase() &&
          (!fb.trim || fb.trim.toLowerCase() === vehicle.build.trim.toLowerCase())
        );
        
        if (modelFallback) {
          apr = modelFallback.rates[creditTier];
          this.usedFallbackRate = true;
        } else {
          // Use default fallback rates
          apr = financeSettings.fallbackRates.default[creditTier];
          this.usedFallbackRate = true;
        }
      }
    } else {
      apr = financeSettings.customRates?.[creditTier] || financeSettings.fallbackRates.default[creditTier];
      this.usedFallbackRate = true;
    }
    
    // Calculate payment
    const monthlyRate = apr / 100 / 12;
    const payment = this.calculatePayment(amountFinanced, monthlyRate, term);
    
    // Generate disclaimer
    const totalAtSigning = downPayment + fees.docFee + (salesTax * 0.1);
    const finalDisclaimer = disclaimer || this.generateDisclaimer({
      payment: this.roundPayment(payment, settings.display.roundingMethod),
      term,
      apr,
      downPayment,
      totalAtSigning,
      programName,
    });
    
    return {
      type: 'finance',
      payment: this.roundPayment(payment, settings.display.roundingMethod),
      apr,
      term,
      amountFinanced: Math.round(amountFinanced),
      totalPrice: Math.round(totalAmount),
      incentivesSaved: incentiveAmount,
      totalAtSigning: Math.round(totalAtSigning),
      disclaimer: finalDisclaimer,
      breakdown: {
        vehiclePrice,
        incentives: -incentiveAmount,
        salePrice,
        docFee: fees.docFee,
        electronicFiling: fees.electronicFiling,
        salesTax: Math.round(salesTax),
        totalAmount: Math.round(totalAmount),
        downPayment: -downPayment,
        tradeValue: -tradeValue,
        amountFinanced: Math.round(amountFinanced),
      },
      hasManufacturerRate: this.hasManufacturerRate,
    };
  }

  private calculatePayment(principal: number, rate: number, term: number): number {
    if (rate === 0) return principal / term;
    return principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
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
    apr,
    downPayment,
    totalAtSigning,
    programName,
  }: {
    payment: number;
    term: number;
    apr: number;
    downPayment: number;
    totalAtSigning: number;
    programName?: string;
  }): string {
    // Get end of current month for expiration date
    const now = new Date();
    const expirationDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expDateStr = `${expirationDate.getMonth() + 1}/${expirationDate.getDate()}/${expirationDate.getFullYear()}`;
    
    // Finance/Purchase disclaimer with all dynamic values
    if (downPayment > 0) {
      return `*Estimated monthly payment of $${payment}/mo based on ${term} months at ${apr}% APR with $${downPayment.toLocaleString()} down payment. ` +
        `$${Math.round(totalAtSigning).toLocaleString()} total due at signing. ` +
        `Except as otherwise expressly provided, excludes sales tax, title, registration and other fees. ` +
        `Actual monthly payments will vary. Does not represent a financing offer or guarantee of credit. ` +
        `${programName ? `Based on ${programName}. ` : ''}` +
        `Not all buyers will qualify; higher financing rates apply for buyers with lower credit ratings. ` +
        `Payment estimate based on financing programs in effect through ${expDateStr}.`;
    } else {
      return `*Estimated monthly payment of $${payment}/mo based on ${term} months at ${apr}% APR with $0 down. ` +
        `Except as otherwise expressly provided, excludes sales tax, title, registration and other fees. ` +
        `Actual monthly payments will vary. Does not represent a financing offer or guarantee of credit. ` +
        `${programName ? `Based on ${programName}. ` : ''}` +
        `Not all buyers will qualify; higher financing rates apply for buyers with lower credit ratings. ` +
        `Payment estimate based on financing programs in effect through ${expDateStr}.`;
    }
  }
}

export const financeCalculator = new FinanceCalculator();