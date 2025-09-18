import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Vehicle, PaymentResult } from '@/types/inventory';
import { usePaymentCalculator } from '@/hooks/usePaymentCalculator';
import { toast } from '@/hooks/use-toast';
import { Eye } from 'lucide-react';
import { dealerSettingsService } from '@/services/dealer-settings.service';

interface VehicleCardProfessionalProps {
  vehicle: Vehicle;
  onCalculate?: () => void;
  onSelect?: () => void;
}

export function VehicleCardProfessional({ 
  vehicle, 
  onCalculate, 
  onSelect 
}: VehicleCardProfessionalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [financePayment, setFinancePayment] = useState<PaymentResult | null>(null);
  const [leasePayment, setLeasePayment] = useState<PaymentResult | null>(null);
  const { calculate } = usePaymentCalculator();
  
  // Function to calculate payments using dealer settings
  const calculatePayments = async () => {
    try {
      // Get current dealer settings
      const settings = dealerSettingsService.getSettings();
      
      // Calculate finance payment with dealer settings
      const financeResult = await calculate(vehicle, {
        type: 'finance',
        downPayment: settings.finance.defaultDownPayment,
        term: settings.finance.defaultTerms[2] || 72, // Use middle term or fallback
        creditTier: settings.finance.defaultCreditTier as any,
      });
      setFinancePayment(financeResult);
      
      // Calculate lease payment with dealer settings
      const leaseResult = await calculate(vehicle, {
        type: 'lease',
        downPayment: settings.lease.defaultDownPayment,
        term: settings.lease.defaultTerms[1] || 36, // Use second term or fallback
        annualMiles: settings.lease.defaultMileage[0] || 10000,
      });
      setLeasePayment(leaseResult);
    } catch (error) {
      console.error('Payment calculation error:', error);
    }
  };
  
  // Calculate on mount and when dealer settings update
  useEffect(() => {
    calculatePayments();
    
    // Listen for dealer settings updates
    const handleSettingsUpdate = () => {
      calculatePayments();
    };
    
    window.addEventListener('dealerSettingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('dealerSettingsUpdated', handleSettingsUpdate);
    };
  }, [vehicle]);

  const handleViewDetails = () => {
    setShowDetails(true);
    onCalculate?.();
  };

  const copyDisclaimer = () => {
    const disclaimer = financePayment?.disclaimer || leasePayment?.disclaimer;
    if (disclaimer) {
      navigator.clipboard.writeText(disclaimer);
      toast({
        title: 'Disclaimer Copied',
        description: 'The disclaimer has been copied to your clipboard.',
      });
    }
  };

  const totalIncentives = vehicle.eligibleIncentives?.reduce(
    (sum, inc) => sum + inc.amount, 
    0
  ) || 0;

  // Get first vehicle image from media or use placeholder
  const vehicleImage = vehicle._raw?.media?.photo_links?.[0] || '/placeholder.svg';

  return (
    <>
      <Card className="overflow-hidden bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
        {/* Vehicle Image */}
        <div className="relative h-64 bg-white">
          <img 
            src={vehicleImage} 
            alt={`${vehicle.build.year} ${vehicle.build.make} ${vehicle.build.model}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {/* Status Badges - Only show aged inventory in dark gray */}
          <div className="absolute top-3 left-3 flex gap-2">
            {vehicle.inventory_type === 'new' && (
              <Badge className="bg-gray-800 text-white border-0 text-xs font-medium px-3 py-1">
                NEW
              </Badge>
            )}
            {vehicle.dom > 60 && (
              <Badge className="bg-gray-800 text-white border-0 text-xs font-medium px-3 py-1">
                {vehicle.dom}+ Days
              </Badge>
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="p-5 space-y-4">
          {/* Title and Specs */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {vehicle.build.year} {vehicle.build.make} {vehicle.build.model}
            </h3>
            <p className="text-base text-gray-900 font-medium mt-1">
              {vehicle.build.trim}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span>{vehicle.build.drivetrain}</span>
              <span>•</span>
              <span>{vehicle.build.transmission}</span>
              <span>•</span>
              <span>Stock: {vehicle.stock_no}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            {/* Finance Payment */}
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">Est. Finance</span>
                {financePayment ? (
                  <span className="text-2xl font-bold text-gray-900">
                    ${financePayment.payment}
                    <span className="text-base font-normal text-gray-600">/mo*</span>
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Calculating...</span>
                )}
              </div>
              {financePayment && (
                <p className="text-xs text-gray-500">
                  {financePayment.term} mo • {financePayment.apr}% APR • ${financePayment.breakdown?.downPayment ? Math.abs(financePayment.breakdown.downPayment).toLocaleString() : '0'} down
                </p>
              )}
            </div>

            {/* Lease Payment */}
            <div className="pb-3">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">Est. Lease</span>
                {leasePayment ? (
                  <span className="text-2xl font-bold text-gray-900">
                    ${leasePayment.payment}
                    <span className="text-base font-normal text-gray-600">/mo*</span>
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Calculating...</span>
                )}
              </div>
              {leasePayment && (
                <p className="text-xs text-gray-500">
                  {leasePayment.term} mo • {(leasePayment.annualMiles || 10000).toLocaleString()} mi/yr • ${leasePayment.breakdown?.downPayment ? Math.abs(leasePayment.breakdown.downPayment).toLocaleString() : '0'} down
                </p>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <Button 
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 font-medium rounded-lg transition-colors" 
            onClick={handleViewDetails}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>

          {/* VIN Display */}
          <p className="text-xs text-gray-400 text-center">
            VIN: {vehicle.vin}
          </p>
        </div>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">
              {vehicle.build.year} {vehicle.build.make} {vehicle.build.model} {vehicle.build.trim}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete vehicle details and payment options
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vehicle Image in Modal */}
            <div className="h-64 bg-gradient-to-b from-gray-50 to-white rounded-lg">
              <img 
                src={vehicleImage} 
                alt={`${vehicle.build.year} ${vehicle.build.make} ${vehicle.build.model}`}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Vehicle Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Stock #</dt>
                    <dd className="text-gray-900 font-medium">{vehicle.stock_no}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">VIN</dt>
                    <dd className="font-mono text-xs text-gray-900">{vehicle.vin}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">MSRP</dt>
                    <dd className="text-gray-900 font-semibold">${vehicle.msrp.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Selling Price</dt>
                    <dd className="text-gray-900 font-semibold">${vehicle.price.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Exterior</dt>
                    <dd className="text-gray-900">{vehicle.build.exterior_color}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Interior</dt>
                    <dd className="text-gray-900">{vehicle.build.interior_color}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Specifications</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Engine</dt>
                    <dd className="text-gray-900">{vehicle.build.engine}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Transmission</dt>
                    <dd className="text-gray-900">{vehicle.build.transmission}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Drivetrain</dt>
                    <dd className="text-gray-900">{vehicle.build.drivetrain}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Body Style</dt>
                    <dd className="text-gray-900">{vehicle.build.body_style}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Payment Options in Modal */}
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Payment Options</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Finance Option */}
                {financePayment && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">Est. Finance Payment</h5>
                    <div className="mb-3">
                      <span className="text-3xl text-gray-900">
                        ${financePayment.payment}
                      </span>
                      <span className="text-gray-600">/mo<span className="text-xs">*</span></span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Term:</span>
                        <span className="text-gray-900 font-medium">{financePayment.term} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. APR:</span>
                        <span className="text-gray-900 font-medium">
                          {financePayment.apr}%
                          {financePayment.hasManufacturerRate && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                              Manufacturer Rate
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount Financed:</span>
                        <span className="text-gray-900 font-medium">
                          ${financePayment.breakdown?.amountFinanced?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Due at Signing:</span>
                        <span className="text-gray-900 font-medium">
                          ${financePayment.totalAtSigning.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lease Option */}
                {leasePayment && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">Est. Lease Payment</h5>
                    <div className="mb-3">
                      <span className="text-3xl text-gray-900">
                        ${leasePayment.payment}
                      </span>
                      <span className="text-gray-600">/mo<span className="text-xs">*</span></span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Term:</span>
                        <span className="text-gray-900 font-medium">{leasePayment.term} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Miles/Year:</span>
                        <span className="text-gray-900 font-medium">{leasePayment.annualMiles?.toLocaleString() || '10,000'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Due at Signing:</span>
                        <span className="text-gray-900 font-medium">
                          ${leasePayment.totalAtSigning.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Residual Value:</span>
                        <span className="text-gray-900 font-medium">
                          ${leasePayment.residualValue?.toLocaleString()} 
                          <span className="text-xs text-gray-500 ml-1">
                            ({Math.round((leasePayment.residualValue / vehicle.msrp) * 100)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimers - Dynamically Generated */}
            <div className="space-y-3">
              {financePayment && financePayment.disclaimer && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-2 text-sm text-gray-900">Finance Offer - Estimated Monthly Payment</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {financePayment.disclaimer}
                  </p>
                </div>
              )}
              {leasePayment && leasePayment.disclaimer && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-2 text-sm text-gray-900">Lease Offer - Estimated Monthly Payment</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {leasePayment.disclaimer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}