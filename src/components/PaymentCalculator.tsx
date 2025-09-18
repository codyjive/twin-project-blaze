import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentCalculator } from '@/hooks/usePaymentCalculator';
import { api } from '@/services/api.service';
import type { Vehicle } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import { Calculator, Search } from 'lucide-react';

export function PaymentCalculator() {
  const [vin, setVin] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [paymentType, setPaymentType] = useState<'finance' | 'lease'>('finance');
  
  // Payment parameters
  const [downPayment, setDownPayment] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [term, setTerm] = useState(72);
  const [creditTier, setCreditTier] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [annualMiles, setAnnualMiles] = useState(10000);
  
  const { calculate, loading, result, reset } = usePaymentCalculator();
  
  const handleVehicleLookup = async () => {
    if (!vin) {
      toast({
        title: 'Error',
        description: 'Please enter a VIN',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const foundVehicle = await api.getVehicleByVin(vin);
      if (foundVehicle) {
        setVehicle(foundVehicle);
        reset();
        toast({
          title: 'Vehicle Found',
          description: `${foundVehicle.build.year} ${foundVehicle.build.make} ${foundVehicle.build.model}`,
        });
      } else {
        toast({
          title: 'Vehicle Not Found',
          description: 'No vehicle found with that VIN',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to lookup vehicle',
        variant: 'destructive',
      });
    }
  };
  
  const handleCalculate = async () => {
    if (!vehicle) {
      toast({
        title: 'Error',
        description: 'Please select a vehicle first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await calculate(vehicle, {
        type: paymentType,
        downPayment,
        tradeValue: paymentType === 'finance' ? tradeValue : undefined,
        term,
        creditTier: paymentType === 'finance' ? creditTier : undefined,
        annualMiles: paymentType === 'lease' ? annualMiles : undefined,
      });
      
      toast({
        title: 'Calculation Complete',
        description: 'Payment has been calculated successfully',
      });
    } catch (error) {
      toast({
        title: 'Calculation Error',
        description: 'Failed to calculate payment',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Vehicle Lookup */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Vehicle Lookup</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="vin">Enter VIN</Label>
            <Input
              id="vin"
              placeholder="Enter vehicle VIN..."
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVehicleLookup()}
            />
          </div>
          <Button 
            onClick={handleVehicleLookup}
            className="mt-auto"
          >
            <Search className="h-4 w-4 mr-2" />
            Lookup
          </Button>
        </div>
        
        {vehicle && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="font-medium">
              {vehicle.build.year} {vehicle.build.make} {vehicle.build.model} {vehicle.build.trim}
            </p>
            <p className="text-sm text-gray-600">
              Stock: {vehicle.stock_no} | VIN: {vehicle.vin}
            </p>
            <p className="text-lg font-bold mt-2">
              ${(vehicle.price || vehicle.msrp).toLocaleString()}
            </p>
          </div>
        )}
      </Card>
      
      {/* Payment Configuration */}
      {vehicle && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Configuration</h3>
          
          <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as 'finance' | 'lease')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
            </TabsList>
            
            <TabsContent value="finance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="down-payment">Down Payment</Label>
                  <Input
                    id="down-payment"
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="trade-value">Trade-In Value</Label>
                  <Input
                    id="trade-value"
                    type="number"
                    value={tradeValue}
                    onChange={(e) => setTradeValue(Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="term">Term (months)</Label>
                  <Select value={String(term)} onValueChange={(v) => setTerm(Number(v))}>
                    <SelectTrigger id="term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                      <SelectItem value="72">72 months</SelectItem>
                      <SelectItem value="84">84 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="credit">Credit Tier</Label>
                  <Select value={creditTier} onValueChange={(v) => setCreditTier(v as any)}>
                    <SelectTrigger id="credit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (720+)</SelectItem>
                      <SelectItem value="good">Good (680-719)</SelectItem>
                      <SelectItem value="fair">Fair (640-679)</SelectItem>
                      <SelectItem value="poor">Poor (Below 640)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="lease" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lease-down">Down Payment</Label>
                  <Input
                    id="lease-down"
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="lease-term">Term (months)</Label>
                  <Select value={String(term)} onValueChange={(v) => setTerm(Number(v))}>
                    <SelectTrigger id="lease-term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="39">39 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="miles">Annual Miles</Label>
                  <Select value={String(annualMiles)} onValueChange={(v) => setAnnualMiles(Number(v))}>
                    <SelectTrigger id="miles">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10,000 miles</SelectItem>
                      <SelectItem value="12000">12,000 miles</SelectItem>
                      <SelectItem value="15000">15,000 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={handleCalculate}
            disabled={loading}
            className="w-full mt-6"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {loading ? 'Calculating...' : 'Calculate Payment'}
          </Button>
        </Card>
      )}
      
      {/* Results */}
      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Results</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Monthly Payment</p>
              <p className="text-3xl font-bold text-green-700">${result.payment}/mo</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Term</p>
                <p className="font-medium">{result.term} months</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">APR</p>
                <p className="font-medium">{result.apr}%</p>
              </div>
              
              {result.totalAtSigning && (
                <div>
                  <p className="text-sm text-gray-500">Due at Signing</p>
                  <p className="font-medium">${result.totalAtSigning.toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {result.breakdown && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Breakdown</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Vehicle Price</dt>
                    <dd>${result.breakdown.vehiclePrice.toLocaleString()}</dd>
                  </div>
                  {result.breakdown.incentives < 0 && (
                    <div className="flex justify-between text-green-600">
                      <dt>Incentives</dt>
                      <dd>-${Math.abs(result.breakdown.incentives).toLocaleString()}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Sale Price</dt>
                    <dd>${result.breakdown.salePrice.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Fees & Taxes</dt>
                    <dd>${(result.breakdown.docFee + result.breakdown.salesTax).toLocaleString()}</dd>
                  </div>
                  {result.breakdown.amountFinanced && (
                    <div className="flex justify-between font-medium">
                      <dt>Amount Financed</dt>
                      <dd>${result.breakdown.amountFinanced.toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
            
            {result.disclaimer && (
              <div className="p-3 bg-gray-100 rounded text-xs text-gray-600">
                {result.disclaimer}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}