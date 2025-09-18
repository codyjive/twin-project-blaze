import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DownPaymentConfig } from '@/types/model-overrides';

interface DownPaymentConfigProps {
  config: DownPaymentConfig | undefined;
  defaultValue: number;
  onChange: (config: DownPaymentConfig) => void;
  label: string;
}

export function DownPaymentConfigComponent({ 
  config, 
  defaultValue, 
  onChange, 
  label 
}: DownPaymentConfigProps) {
  const currentConfig: DownPaymentConfig = config || {
    type: 'fixed',
    value: defaultValue,
    basedOn: 'selling'
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <RadioGroup
        value={currentConfig.type}
        onValueChange={(type: 'fixed' | 'percentage') => 
          onChange({ ...currentConfig, type })
        }
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="fixed" id="fixed" />
          <Label htmlFor="fixed" className="font-normal">Fixed Amount</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="percentage" id="percentage" />
          <Label htmlFor="percentage" className="font-normal">Percentage</Label>
        </div>
      </RadioGroup>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">
            {currentConfig.type === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
          </Label>
          <Input
            type="number"
            step={currentConfig.type === 'fixed' ? '100' : '1'}
            value={currentConfig.value}
            onChange={(e) => 
              onChange({ ...currentConfig, value: Number(e.target.value) })
            }
            placeholder={currentConfig.type === 'fixed' ? '$0' : '0%'}
          />
        </div>

        {currentConfig.type === 'percentage' && (
          <div>
            <Label className="text-sm">Based On</Label>
            <Select
              value={currentConfig.basedOn || 'selling'}
              onValueChange={(value: 'msrp' | 'selling') => 
                onChange({ ...currentConfig, basedOn: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="msrp">MSRP</SelectItem>
                <SelectItem value="selling">Selling Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {currentConfig.type === 'fixed' 
          ? `Fixed down payment of $${currentConfig.value.toLocaleString()}`
          : `${currentConfig.value}% of ${currentConfig.basedOn === 'msrp' ? 'MSRP' : 'Selling Price'}`}
      </p>
    </div>
  );
}