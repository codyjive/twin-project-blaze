import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { dealerSettingsService } from '@/services/dealer-settings.service';
import type { DealerSettings } from '@/types/dealer-settings';
import { Save, RotateCcw, DollarSign, Calculator, FileText, Palette, RefreshCw, Settings2 } from 'lucide-react';
import { ModelOverridesManager } from '@/components/ModelOverridesManager';
import { DownPaymentConfigComponent } from '@/components/DownPaymentConfig';

export function DealerSettingsPage() {
  const [settings, setSettings] = useState<DealerSettings>(dealerSettingsService.getSettings());
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    dealerSettingsService.updateSettings(settings);
    setHasChanges(false);
    
    // Trigger a recalculation event
    window.dispatchEvent(new CustomEvent('dealerSettingsUpdated'));
    
    toast({
      title: 'Settings Saved',
      description: 'Your dealer settings have been updated successfully. Payments will be recalculated.',
    });
  };

  const handleReset = () => {
    const defaults = dealerSettingsService.resetToDefaults();
    setSettings(defaults);
    setHasChanges(false);
    toast({
      title: 'Settings Reset',
      description: 'Settings have been reset to defaults.',
    });
  };

  const updateSettings = (path: string[], value: any) => {
    setSettings(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      setHasChanges(true);
      return updated;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Dealer Settings</h2>
          <p className="text-muted-foreground mt-1">
            Configure rates, fees, and display preferences for your dealership
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('dealerSettingsUpdated'));
              toast({
                title: 'Recalculating Payments',
                description: 'All vehicle payments are being recalculated with current settings.',
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate All
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="finance" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="lease" className="gap-2">
            <Calculator className="h-4 w-4" />
            Lease
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2">
            <FileText className="h-4 w-4" />
            Fees & Taxes
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Model Overrides
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Palette className="h-4 w-4" />
            Display
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>Finance Settings</CardTitle>
              <CardDescription>Configure default finance rates and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Manufacturer Rates</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically pull rates from Ford Credit incentive feeds
                  </p>
                    {settings.finance.useManufacturerRates && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs text-primary">Active - Ford Credit rates enabled</span>
                    </div>
                  )}
                </div>
                <Switch
                  checked={settings.finance.useManufacturerRates}
                  onCheckedChange={(checked) => 
                    updateSettings(['finance', 'useManufacturerRates'], checked)
                  }
                />
              </div>

              <DownPaymentConfigComponent
                config={settings.finance.defaultDownPaymentConfig}
                defaultValue={settings.finance.defaultDownPayment}
                onChange={(config) => updateSettings(['finance', 'defaultDownPaymentConfig'], config)}
                label="Default Down Payment Configuration"
              />

              <div className="grid grid-cols-2 gap-4">
              
              <div>
                <Label>Pricing Method for Calculations</Label>
                <Select
                  value={settings.finance.pricingMethod || 'selling'}
                  onValueChange={(value: 'msrp' | 'selling') => 
                    updateSettings(['finance', 'pricingMethod'], value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msrp">Use MSRP</SelectItem>
                    <SelectItem value="selling">Use Selling Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div>
                  <Label>Default Credit Tier</Label>
                  <Select
                    value={settings.finance.defaultCreditTier}
                    onValueChange={(value) => 
                      updateSettings(['finance', 'defaultCreditTier'], value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (720+)</SelectItem>
                      <SelectItem value="good">Good (680-719)</SelectItem>
                      <SelectItem value="fair">Fair (620-679)</SelectItem>
                      <SelectItem value="poor">Poor (Below 620)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!settings.finance.useManufacturerRates && (
                <div className="space-y-4">
                  <Label>Custom APR Rates by Credit Tier</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Excellent</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.finance.customRates?.excellent || 4.99}
                        onChange={(e) => 
                          updateSettings(['finance', 'customRates', 'excellent'], Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Good</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.finance.customRates?.good || 6.99}
                        onChange={(e) => 
                          updateSettings(['finance', 'customRates', 'good'], Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fair</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.finance.customRates?.fair || 9.99}
                        onChange={(e) => 
                          updateSettings(['finance', 'customRates', 'fair'], Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Poor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.finance.customRates?.poor || 14.99}
                        onChange={(e) => 
                          updateSettings(['finance', 'customRates', 'poor'], Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lease">
          <Card>
            <CardHeader>
              <CardTitle>Lease Settings</CardTitle>
              <CardDescription>Configure lease terms and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DownPaymentConfigComponent
                config={settings.lease.defaultDownPaymentConfig}
                defaultValue={settings.lease.defaultDownPayment}
                onChange={(config) => updateSettings(['lease', 'defaultDownPaymentConfig'], config)}
                label="Default Down Payment Configuration"
              />

              <div className="grid grid-cols-2 gap-4">
              
              <div>
                <Label>Pricing Method for Calculations</Label>
                <Select
                  value={settings.lease.pricingMethod || 'msrp'}
                  onValueChange={(value: 'msrp' | 'selling') => 
                    updateSettings(['lease', 'pricingMethod'], value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msrp">Use MSRP</SelectItem>
                    <SelectItem value="selling">Use Selling Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div>
                  <Label>Acquisition Fee</Label>
                  <Input
                    type="number"
                    value={settings.lease.acquisitionFee}
                    onChange={(e) => 
                      updateSettings(['lease', 'acquisitionFee'], Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Disposition Fee</Label>
                  <Input
                    type="number"
                    value={settings.lease.dispositionFee}
                    onChange={(e) => 
                      updateSettings(['lease', 'dispositionFee'], Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Excess Mileage Charge</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.lease.excessMileageCharge}
                    onChange={(e) => 
                      updateSettings(['lease', 'excessMileageCharge'], Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Tax Method</Label>
                <Select
                  value={settings.lease.taxMethod}
                  onValueChange={(value) => 
                    updateSettings(['lease', 'taxMethod'], value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Tax on Monthly Payment</SelectItem>
                    <SelectItem value="upfront">Tax Paid Upfront</SelectItem>
                    <SelectItem value="capitalized">Tax Capitalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Default Annual Mileage Options</Label>
                <div className="flex gap-2">
                  {settings.lease.defaultMileage.map((miles, index) => (
                    <Input
                      key={index}
                      type="number"
                      value={miles}
                      onChange={(e) => {
                        const newMileage = [...settings.lease.defaultMileage];
                        newMileage[index] = Number(e.target.value);
                        updateSettings(['lease', 'defaultMileage'], newMileage);
                      }}
                      className="w-32"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fees & Taxes</CardTitle>
              <CardDescription>Configure dealer fees and tax rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Documentation Fee</Label>
                  <Input
                    type="number"
                    value={settings.fees.docFee}
                    onChange={(e) => 
                      updateSettings(['fees', 'docFee'], Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Electronic Filing Fee</Label>
                  <Input
                    type="number"
                    value={settings.fees.electronicFiling}
                    onChange={(e) => 
                      updateSettings(['fees', 'electronicFiling'], Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>State Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={(settings.fees.stateTaxRate * 100).toFixed(3)}
                    onChange={(e) => 
                      updateSettings(['fees', 'stateTaxRate'], Number(e.target.value) / 100)
                    }
                  />
                </div>
                <div>
                  <Label>County Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={(settings.fees.countyTaxRate * 100).toFixed(3)}
                    onChange={(e) => 
                      updateSettings(['fees', 'countyTaxRate'], Number(e.target.value) / 100)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          <Card>
            <CardContent className="pt-6">
              <ModelOverridesManager
                overrides={settings.modelOverrides || []}
                onUpdate={(overrides) => updateSettings(['modelOverrides'], overrides)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Configure how payments and disclaimers are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Rounding</Label>
                  <Select
                    value={settings.display.roundingMethod}
                    onValueChange={(value) => 
                      updateSettings(['display', 'roundingMethod'], value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest1">Nearest $1</SelectItem>
                      <SelectItem value="nearest5">Nearest $5</SelectItem>
                      <SelectItem value="nearest10">Nearest $10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Emphasis Mode</Label>
                  <Select
                    value={settings.display.emphasisMode}
                    onValueChange={(value) => 
                      updateSettings(['display', 'emphasisMode'], value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Amount</SelectItem>
                      <SelectItem value="savings">Total Savings</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Disclaimers</Label>
                    <p className="text-sm text-muted-foreground">
                      Display legal disclaimers with payment information
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.showDisclaimer}
                    onCheckedChange={(checked) => 
                      updateSettings(['display', 'showDisclaimer'], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Incentives</Label>
                    <p className="text-sm text-muted-foreground">
                      Display available incentives and rebates
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.showIncentives}
                    onCheckedChange={(checked) => 
                      updateSettings(['display', 'showIncentives'], checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Total Savings</Label>
                    <p className="text-sm text-muted-foreground">
                      Display total savings from incentives
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.showTotalSavings}
                    onCheckedChange={(checked) => 
                      updateSettings(['display', 'showTotalSavings'], checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}