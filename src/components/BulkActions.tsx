import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api.service';
import type { BulkCalculationSummary } from '@/types/calculation';
import { toast } from '@/hooks/use-toast';
import { Calculator, Download, Play } from 'lucide-react';

export function BulkActions() {
  const [paymentType, setPaymentType] = useState<'finance' | 'lease'>('finance');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkCalculationSummary | null>(null);
  
  // Finance parameters
  const [financeDownPayment, setFinanceDownPayment] = useState(0);
  const [financeTradeValue, setFinanceTradeValue] = useState(0);
  const [financeTerm, setFinanceTerm] = useState(72);
  const [financeCreditTier, setFinanceCreditTier] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  
  // Lease parameters
  const [leaseDownPayment, setLeaseDownPayment] = useState(0);
  const [leaseTerm, setLeaseTerm] = useState(36);
  const [leaseAnnualMiles, setLeaseAnnualMiles] = useState(10000);
  
  const handleBulkCalculation = async () => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const configuration = paymentType === 'finance'
        ? {
            downPayment: financeDownPayment,
            tradeValue: financeTradeValue,
            term: financeTerm,
            creditTier: financeCreditTier,
          }
        : {
            downPayment: leaseDownPayment,
            term: leaseTerm,
            annualMiles: leaseAnnualMiles,
          };
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await api.calculateBulk({
        type: paymentType,
        configuration,
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(result);
      
      toast({
        title: 'Bulk Calculation Complete',
        description: `Processed ${result.total} vehicles. ${result.successful} successful, ${result.failed} failed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process bulk calculations',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };
  
  const exportResults = () => {
    if (!results) return;
    
    const csv = [
      ['VIN', 'Stock Number', 'Status', 'Monthly Payment', 'Due at Signing', 'Error'],
      ...results.results.map(r => [
        r.vin,
        r.stockNumber,
        r.success ? 'Success' : 'Failed',
        r.payment?.toString() || '',
        r.totalAtSigning?.toString() || '',
        r.error || '',
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-calculations-${paymentType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: 'Results exported to CSV file',
    });
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Calculation Configuration</h3>
        
        <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as 'finance' | 'lease')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="lease">Lease</TabsTrigger>
          </TabsList>
          
          <TabsContent value="finance" className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure finance parameters to apply to all vehicles in inventory.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-finance-down">Down Payment</Label>
                <Input
                  id="bulk-finance-down"
                  type="number"
                  value={financeDownPayment}
                  onChange={(e) => setFinanceDownPayment(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="bulk-finance-trade">Trade-In Value</Label>
                <Input
                  id="bulk-finance-trade"
                  type="number"
                  value={financeTradeValue}
                  onChange={(e) => setFinanceTradeValue(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="bulk-finance-term">Term (months)</Label>
                <Select value={String(financeTerm)} onValueChange={(v) => setFinanceTerm(Number(v))}>
                  <SelectTrigger id="bulk-finance-term">
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
                <Label htmlFor="bulk-finance-credit">Credit Tier</Label>
                <Select value={financeCreditTier} onValueChange={(v) => setFinanceCreditTier(v as any)}>
                  <SelectTrigger id="bulk-finance-credit">
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
            <p className="text-sm text-gray-600">
              Configure lease parameters to apply to all vehicles in inventory.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-lease-down">Down Payment</Label>
                <Input
                  id="bulk-lease-down"
                  type="number"
                  value={leaseDownPayment}
                  onChange={(e) => setLeaseDownPayment(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="bulk-lease-term">Term (months)</Label>
                <Select value={String(leaseTerm)} onValueChange={(v) => setLeaseTerm(Number(v))}>
                  <SelectTrigger id="bulk-lease-term">
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
                <Label htmlFor="bulk-lease-miles">Annual Miles</Label>
                <Select value={String(leaseAnnualMiles)} onValueChange={(v) => setLeaseAnnualMiles(Number(v))}>
                  <SelectTrigger id="bulk-lease-miles">
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
          onClick={handleBulkCalculation}
          disabled={processing}
          className="w-full mt-6"
        >
          {processing ? (
            <>Processing...</>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Bulk Calculation
            </>
          )}
        </Button>
        
        {processing && (
          <Progress value={progress} className="mt-4" />
        )}
      </Card>
      
      {/* Results */}
      {results && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Results</h3>
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-bold">{results.total}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Successful</p>
              <p className="text-2xl font-bold text-green-700">{results.successful}</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded">
              <p className="text-sm text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-700">{results.failed}</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">Avg Payment</p>
              <p className="text-2xl font-bold text-blue-700">${results.averagePayment}/mo</p>
            </div>
          </div>
          
          {/* Results Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">VIN</th>
                  <th className="px-4 py-2 text-left">Stock #</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Payment</th>
                  <th className="px-4 py-2 text-right">Due at Signing</th>
                </tr>
              </thead>
              <tbody>
                {results.results.slice(0, 10).map((r, idx) => (
                  <tr key={r.vin} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-mono text-xs">{r.vin}</td>
                    <td className="px-4 py-2">{r.stockNumber}</td>
                    <td className="px-4 py-2">
                      {r.success ? (
                        <span className="text-green-600">✓ Success</span>
                      ) : (
                        <span className="text-red-600">✗ Failed</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {r.payment ? `$${r.payment}/mo` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.totalAtSigning ? `$${r.totalAtSigning.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {results.results.length > 10 && (
              <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                Showing 10 of {results.results.length} results. Export to see all.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}