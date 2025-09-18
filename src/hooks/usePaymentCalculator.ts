import { useState, useCallback } from 'react';
import { api } from '@/services/api.service';
import type { Vehicle, PaymentResult } from '@/types/inventory';
import type { CreditTier } from '@/types/calculation';

interface PaymentParams {
  type: 'finance' | 'lease';
  downPayment: number;
  tradeValue?: number;
  term: number;
  creditTier?: CreditTier;
  annualMiles?: number;
}

export function usePaymentCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const calculate = useCallback(async (vehicle: Vehicle, params: PaymentParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.calculatePayment(vehicle.vin, params);
      
      if (!response) {
        throw new Error('Vehicle not found');
      }
      
      setResult(response.calculation);
      return response.calculation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    calculate,
    reset,
    loading,
    error,
    result,
  };
}