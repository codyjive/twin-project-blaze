import type { ManufacturerFinanceRate, FinanceRateMatch } from '@/types/finance-rates';
import type { Vehicle } from '@/types/inventory';
import { HONDA_FINANCE_FEED_SAMPLE } from '@/data/honda-finance-feed';

class ManufacturerRatesService {
  private rates: ManufacturerFinanceRate[] = [];
  private lastFetchTime: number = 0;
  private cacheExpiry = 3600000; // 1 hour cache
  
  // Minnesota-specific feed URL for Inver Grove Honda
  private feedUrl = 'https://files.dealercentives.com/feeds/meta/regional/feeds/honda/honda-mn-finance.json';
  private fallbackUrl = 'https://files.dealercentives.com/feeds/meta/regional/feeds/honda/honda-ut-finance.json';

  async fetchRates(manufacturer: string = 'honda'): Promise<ManufacturerFinanceRate[]> {
    // Check cache
    if (this.rates.length && Date.now() - this.lastFetchTime < this.cacheExpiry) {
      return this.rates;
    }
    
    // Use sample data - external feeds won't work due to CORS
    // In production, this would be fetched server-side
    this.rates = HONDA_FINANCE_FEED_SAMPLE as ManufacturerFinanceRate[];
    this.lastFetchTime = Date.now();
    console.log(`Loaded ${this.rates.length} manufacturer finance rates from sample data`);
    return this.rates;
  }

  findBestRate(vehicle: Vehicle, term: number = 72): FinanceRateMatch | null {
    // Ensure rates are loaded
    if (!this.rates.length) {
      console.warn('No rates loaded');
      return null;
    }

    console.log(`Finding rate for: ${vehicle.build.year} ${vehicle.build.make} ${vehicle.build.model} ${vehicle.build.trim}, Term: ${term}`);

    // First try exact match with trim
    let matches = this.rates.filter(rate => {
      const yearMatch = rate.year === String(vehicle.build.year);
      const makeMatch = rate.make?.toLowerCase() === vehicle.build.make.toLowerCase();
      const modelMatch = this.isModelMatch(rate.model, vehicle.build.model);
      const trimMatch = !rate.trim || 
                       rate.trim.toLowerCase() === vehicle.build.trim.toLowerCase() ||
                       vehicle.build.trim.toLowerCase().includes(rate.trim.toLowerCase());
      
      // Check if the rate is currently valid
      const now = new Date();
      const validThrough = new Date(rate.valid_through);
      const isValid = now <= validThrough;
      
      // Check if term matches or is in range
      const termMatches = this.isTermInRange(term, rate.finance_term, rate.offer_headline);
      
      return yearMatch && makeMatch && modelMatch && trimMatch && isValid && termMatches && rate.incentive_type === 'finance';
    });

    // If no exact match, try without trim
    if (!matches.length) {
      console.log('No exact trim match, trying model only...');
      matches = this.rates.filter(rate => {
        const yearMatch = rate.year === String(vehicle.build.year);
        const makeMatch = rate.make?.toLowerCase() === vehicle.build.make.toLowerCase();
        const modelMatch = this.isModelMatch(rate.model, vehicle.build.model);
        
        const now = new Date();
        const validThrough = new Date(rate.valid_through);
        const isValid = now <= validThrough;
        
        const termMatches = this.isTermInRange(term, rate.finance_term, rate.offer_headline);
        
        return yearMatch && makeMatch && modelMatch && isValid && termMatches && rate.incentive_type === 'finance';
      });
    }

    if (!matches.length) {
      console.log('No manufacturer rate found for vehicle');
      return null;
    }

    // Sort by lowest rate
    matches.sort((a, b) => parseFloat(a.finance_rate) - parseFloat(b.finance_rate));
    
    const bestMatch = matches[0];
    console.log(`Found rate: ${bestMatch.finance_rate}% for ${bestMatch.finance_term} months`);
    
    return {
      rate: parseFloat(bestMatch.finance_rate),
      term: bestMatch.finance_term,
      disclaimer: bestMatch.finance_disclaimer || bestMatch.disclaimer_raw,
      programName: bestMatch.oem_program_name || 'Honda Financial Services Special APR',
      expirationDate: bestMatch.expiration_date || bestMatch.valid_through,
    };
  }

  private isModelMatch(rateModel: string, vehicleModel: string): boolean {
    if (!rateModel || !vehicleModel) return false;
    
    const rateModelLower = rateModel.toLowerCase();
    const vehicleModelLower = vehicleModel.toLowerCase();
    
    // Direct match
    if (rateModelLower === vehicleModelLower) return true;
    
    // Check if one contains the other
    if (rateModelLower.includes(vehicleModelLower) || vehicleModelLower.includes(rateModelLower)) {
      return true;
    }
    
    // Handle variations like "CR-V" vs "CRV"
    const normalizeModel = (model: string) => model.replace(/[-\s]/g, '');
    return normalizeModel(rateModelLower) === normalizeModel(vehicleModelLower);
  }

  private isTermInRange(requestedTerm: number, rateTerm: number, offerHeadline: string): boolean {
    // Direct match
    if (requestedTerm === rateTerm) return true;
    
    // Check if the offer headline mentions term ranges
    if (offerHeadline) {
      // Pattern for "24-48 MOS" or similar
      const termRangePattern = /(\d+)-(\d+)\s*MOS/gi;
      const matches = [...offerHeadline.matchAll(termRangePattern)];
      
      for (const match of matches) {
        const minTerm = parseInt(match[1]);
        const maxTerm = parseInt(match[2]);
        if (requestedTerm >= minTerm && requestedTerm <= maxTerm) {
          return true;
        }
      }
      
      // Check for specific term mentions like "72 MOS"
      const specificTermPattern = new RegExp(`${requestedTerm}\\s*MOS`, 'i');
      if (specificTermPattern.test(offerHeadline)) {
        return true;
      }
    }
    
    // If rate term is max term and requested is less or equal
    return requestedTerm <= rateTerm;
  }

  getRatesByModel(year: number, make: string, model: string): ManufacturerFinanceRate[] {
    return this.rates.filter(rate => 
      rate.year === String(year) &&
      rate.make?.toLowerCase() === make.toLowerCase() &&
      this.isModelMatch(rate.model, model)
    );
  }
}

export const manufacturerRatesService = new ManufacturerRatesService();