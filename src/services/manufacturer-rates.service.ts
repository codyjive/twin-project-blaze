import type { ManufacturerFinanceRate, FinanceRateMatch } from '@/types/finance-rates';
import type { Vehicle } from '@/types/inventory';

class ManufacturerRatesService {
  private rates: ManufacturerFinanceRate[] = [];
  private lastFetchTime: number = 0;
  private cacheExpiry = 3600000; // 1 hour cache
  private cachedFeedData: any = null;
  
  // Ford incentive feed URL
  private feedUrl = 'https://files.dealercentives.com/feeds/meta/regional/feeds/ford/ford-al-finance.json';

  async fetchRates(manufacturer: string = 'ford'): Promise<ManufacturerFinanceRate[]> {
    // Check cache
    if (this.rates.length && Date.now() - this.lastFetchTime < this.cacheExpiry) {
      return this.rates;
    }
    
    try {
      // Try to fetch from the actual Ford feed
      // Note: This may fail due to CORS, in which case we'll use sample data
      const response = await fetch(this.feedUrl);
      if (response.ok) {
        const data = await response.json();
        this.rates = this.parseFordIncentives(data);
        console.log(`Loaded ${this.rates.length} Ford rates from feed`);
      } else {
        throw new Error('Failed to fetch Ford rates');
      }
    } catch (error) {
      console.log('Using sample Ford rates due to CORS or network issues');
      // Fall back to sample rates if fetch fails
      this.rates = this.getSampleFordRates();
    }
    
    this.lastFetchTime = Date.now();
    console.log(`Total ${this.rates.length} Ford manufacturer finance rates available`);
    return this.rates;
  }

  private getSampleFordRates(): ManufacturerFinanceRate[] {
    // Sample Ford finance rates based on actual feed structure
    return [
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'F-150 F-150', // Match the feed format
        trim: '',
        incentive_type: 'finance',
        finance_rate: '1.9',
        finance_term: 48,
        finance_apr: '1.9',
        finance_disclaimer: 'Program #21420: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        lease_disclaimer: '',
        valid_from: '2025-09-09',
        valid_through: '2025-09-30',
        expiration_date: '09/30/2025',
        title_raw: 'APR Financing',
        offer_headline: 'Public Offers',
        disclaimer_raw: 'Program #21420: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        oem_program_name: '',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Mustang',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '3.9',
        finance_term: 36,
        finance_apr: '3.9',
        finance_disclaimer: 'Program #21420: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        lease_disclaimer: '',
        valid_from: '2025-07-08',
        valid_through: '2025-09-30',
        expiration_date: '09/30/2025',
        title_raw: 'APR Financing',
        offer_headline: 'Public Offers',
        disclaimer_raw: 'Program #21420: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        oem_program_name: '',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Transit Chassis',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '6.9',
        finance_term: 48,
        finance_apr: '6.9',
        finance_disclaimer: 'Program #21440: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        lease_disclaimer: '',
        valid_from: '2025-07-08',
        valid_through: '2025-09-30',
        expiration_date: '09/30/2025',
        title_raw: 'Upfit APR Financing',
        offer_headline: 'Public Offers',
        disclaimer_raw: 'Program #21440: Not all buyers will qualify. Ford Credit limited-term APR financing. Take new retail delivery from dealer stock by 09/30/2025. See dealer for qualifications and complete details.',
        oem_program_name: '',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Explorer',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '3.9',
        finance_term: 60,
        finance_apr: '3.9',
        finance_disclaimer: '3.9% APR for up to 60 months on select 2025 Ford Explorer models. Not all buyers will qualify for Ford Credit financing.',
        lease_disclaimer: '',
        valid_from: '2025-01-01',
        valid_through: '2025-09-30',
        expiration_date: '2025-09-30',
        title_raw: '3.9% APR for 60 Months',
        offer_headline: '3.9% APR for up to 60 Months',
        disclaimer_raw: 'Not all buyers will qualify',
        oem_program_name: 'Ford Credit Special APR',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Escape',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '2.9',
        finance_term: 60,
        finance_apr: '2.9',
        finance_disclaimer: '2.9% APR for up to 60 months on select 2025 Ford Escape models. Not all buyers will qualify for Ford Credit financing.',
        lease_disclaimer: '',
        valid_from: '2025-01-01',
        valid_through: '2025-09-30',
        expiration_date: '2025-09-30',
        title_raw: '2.9% APR for 60 Months',
        offer_headline: '2.9% APR for up to 60 Months',
        disclaimer_raw: 'Not all buyers will qualify',
        oem_program_name: 'Ford Credit Special APR',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Bronco',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '5.9',
        finance_term: 72,
        finance_apr: '5.9',
        finance_disclaimer: '5.9% APR for up to 72 months on select 2025 Ford Bronco models. Not all buyers will qualify for Ford Credit financing.',
        lease_disclaimer: '',
        valid_from: '2025-01-01',
        valid_through: '2025-09-30',
        expiration_date: '2025-09-30',
        title_raw: '5.9% APR for 72 Months',
        offer_headline: '5.9% APR for up to 72 Months',
        disclaimer_raw: 'Not all buyers will qualify',
        oem_program_name: 'Ford Credit Special APR',
      },
      {
        id: null,
        year: '2025',
        make: 'Ford',
        model: 'Edge',
        trim: '',
        incentive_type: 'finance',
        finance_rate: '3.9',
        finance_term: 60,
        finance_apr: '3.9',
        finance_disclaimer: '3.9% APR for up to 60 months on select 2025 Ford Edge models. Not all buyers will qualify for Ford Credit financing.',
        lease_disclaimer: '',
        valid_from: '2025-01-01',
        valid_through: '2025-09-30',
        expiration_date: '2025-09-30',
        title_raw: '3.9% APR for 60 Months',
        offer_headline: '3.9% APR for up to 60 Months',
        disclaimer_raw: 'Not all buyers will qualify',
        oem_program_name: 'Ford Credit Special APR',
      },
    ];
  }

  private parseFordIncentives(data: any): ManufacturerFinanceRate[] {
    const rates: ManufacturerFinanceRate[] = [];
    
    // Parse Ford incentive data structure based on actual feed format
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.incentive_type === 'finance' && item.finance_rate) {
          rates.push({
            id: item.id || null,
            year: item.year || new Date().getFullYear().toString(),
            make: item.make || 'Ford',
            model: item.model || '',
            trim: item.trim || '',
            incentive_type: 'finance',
            finance_rate: item.finance_rate || '0',
            finance_term: item.finance_term || 60,
            finance_apr: item.finance_rate || '0', // Use finance_rate as APR
            finance_disclaimer: item.finance_disclaimer || item.disclaimer_raw || '',
            lease_disclaimer: item.lease_disclaimer || '',
            valid_from: item.valid_from || new Date().toISOString(),
            valid_through: item.valid_through || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            expiration_date: item.expiration_date || item.valid_through || '',
            title_raw: item.title_raw || item.offer_headline || '',
            offer_headline: item.offer_headline || item.title_raw || '',
            disclaimer_raw: item.disclaimer_raw || item.combined_disclaimer || '',
            oem_program_name: item.oem_program_name || 'Ford Credit Special APR',
          });
        }
      });
    }
    
    return rates;
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
    
    // Handle Ford feed duplicated model names like "F-150 F-150"
    // Extract the actual model name (first part before duplication)
    const cleanRateModel = rateModelLower.split(' ')[0];
    const cleanVehicleModel = vehicleModelLower.split(' ')[0];
    
    // Direct match
    if (cleanRateModel === cleanVehicleModel) return true;
    if (rateModelLower === vehicleModelLower) return true;
    
    // Check if the rate model contains the vehicle model
    if (rateModelLower.includes(vehicleModelLower)) return true;
    
    // Check for F-150 specific matching
    if ((rateModelLower.includes('f-150') || rateModelLower.includes('f150')) && 
        (vehicleModelLower.includes('f-150') || vehicleModelLower.includes('f150'))) {
      return true;
    }
    
    // Check for Transit specific matching
    if (rateModelLower.includes('transit') && vehicleModelLower.includes('transit')) {
      return true;
    }
    
    // Handle variations like "CR-V" vs "CRV"
    const normalizeModel = (model: string) => model.replace(/[-\s]/g, '');
    return normalizeModel(cleanRateModel) === normalizeModel(cleanVehicleModel) ||
           normalizeModel(rateModelLower) === normalizeModel(vehicleModelLower);
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