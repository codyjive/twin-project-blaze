import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import type { ModelOverride } from '@/types/model-overrides';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface ModelOverridesManagerProps {
  overrides: ModelOverride[];
  onUpdate: (overrides: ModelOverride[]) => void;
}

export function ModelOverridesManager({ overrides = [], onUpdate }: ModelOverridesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOverride, setNewOverride] = useState<Partial<ModelOverride>>({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    active: true,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    if (!newOverride.make || !newOverride.model) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least make and model.',
        variant: 'destructive',
      });
      return;
    }

    const override: ModelOverride = {
      id: Date.now().toString(),
      year: newOverride.year!,
      make: newOverride.make!,
      model: newOverride.model!,
      trim: newOverride.trim,
      active: true,
      financeOverride: newOverride.financeOverride,
      leaseOverride: newOverride.leaseOverride,
      incentives: newOverride.incentives,
      notes: newOverride.notes,
      lastUpdated: new Date(),
    };

    onUpdate([...overrides, override]);
    setNewOverride({
      year: new Date().getFullYear(),
      make: '',
      model: '',
      active: true,
    });
    setShowAddForm(false);
    toast({
      title: 'Override Added',
      description: `Model override for ${override.year} ${override.make} ${override.model} has been added.`,
    });
  };

  const handleDelete = (id: string) => {
    onUpdate(overrides.filter(o => o.id !== id));
    toast({
      title: 'Override Removed',
      description: 'The model override has been removed.',
    });
  };

  const handleToggle = (id: string) => {
    onUpdate(overrides.map(o => 
      o.id === id ? { ...o, active: !o.active, lastUpdated: new Date() } : o
    ));
  };

  const handleUpdate = (id: string, updates: Partial<ModelOverride>) => {
    onUpdate(overrides.map(o => 
      o.id === id ? { ...o, ...updates, lastUpdated: new Date() } : o
    ));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model-Specific Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Override manufacturer rates and add incentives for specific models
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          className="border-border hover:bg-accent"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Override
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Model Override</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={newOverride.year}
                  onChange={(e) => setNewOverride({ ...newOverride, year: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Make</Label>
                <Input
                  value={newOverride.make || ''}
                  onChange={(e) => setNewOverride({ ...newOverride, make: e.target.value })}
                  placeholder="e.g., Ford"
                />
              </div>
              <div>
                <Label>Model</Label>
                <Input
                  value={newOverride.model || ''}
                  onChange={(e) => setNewOverride({ ...newOverride, model: e.target.value })}
                  placeholder="e.g., F-150"
                />
              </div>
              <div>
                <Label>Trim (Optional)</Label>
                <Input
                  value={newOverride.trim || ''}
                  onChange={(e) => setNewOverride({ ...newOverride, trim: e.target.value })}
                  placeholder="e.g., Lariat"
                />
              </div>
            </div>

            <Tabs defaultValue="finance" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="incentives">Incentives</TabsTrigger>
              </TabsList>

              <TabsContent value="finance" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Override Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave empty to use feed"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        financeOverride: {
                          ...newOverride.financeOverride,
                          rate: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Override Term</Label>
                    <Input
                      type="number"
                      placeholder="Months"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        financeOverride: {
                          ...newOverride.financeOverride,
                          term: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Bonus Cash</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        financeOverride: {
                          ...newOverride.financeOverride,
                          bonusCash: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Additional Discount</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        financeOverride: {
                          ...newOverride.financeOverride,
                          additionalDiscount: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lease" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Money Factor</Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="Leave empty for default"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        leaseOverride: {
                          ...newOverride.leaseOverride,
                          moneyFactor: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Residual %</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="Leave empty for default"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        leaseOverride: {
                          ...newOverride.leaseOverride,
                          residualPercentage: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Bonus Cash</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        leaseOverride: {
                          ...newOverride.leaseOverride,
                          bonusCash: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Additional Discount</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        leaseOverride: {
                          ...newOverride.leaseOverride,
                          additionalDiscount: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="incentives" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cash Back</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        incentives: {
                          ...newOverride.incentives,
                          cashBack: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Dealer Cash</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        incentives: {
                          ...newOverride.incentives,
                          dealerCash: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Loyalty Bonus</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        incentives: {
                          ...newOverride.incentives,
                          loyaltyBonus: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Trade-In Bonus</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      onChange={(e) => setNewOverride({
                        ...newOverride,
                        incentives: {
                          ...newOverride.incentives,
                          tradeInBonus: e.target.value ? Number(e.target.value) : undefined,
                        }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>Notes</Label>
              <Input
                value={newOverride.notes || ''}
                onChange={(e) => setNewOverride({ ...newOverride, notes: e.target.value })}
                placeholder="Optional notes about this override"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAdd}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                Add Override
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setNewOverride({
                  year: new Date().getFullYear(),
                  make: '',
                  model: '',
                  active: true,
                });
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {overrides.map((override) => (
          <Card key={override.id} className={override.active ? '' : 'opacity-60'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {override.year} {override.make} {override.model} {override.trim || ''}
                  </CardTitle>
                  <Badge 
                    variant={override.active ? 'default' : 'secondary'}
                    className={override.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                  >
                    {override.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={override.active}
                    onCheckedChange={() => handleToggle(override.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === override.id ? null : override.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(override.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {editingId !== override.id && (
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {override.financeOverride && (
                    <div>
                      <p className="font-medium mb-1">Finance Override</p>
                      {override.financeOverride.rate && (
                        <p>Rate: {override.financeOverride.rate}%</p>
                      )}
                      {override.financeOverride.term && (
                        <p>Term: {override.financeOverride.term} months</p>
                      )}
                      {override.financeOverride.bonusCash && (
                        <p>Bonus: ${override.financeOverride.bonusCash.toLocaleString()}</p>
                      )}
                      {override.financeOverride.additionalDiscount && (
                        <p>Discount: ${override.financeOverride.additionalDiscount.toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  {override.leaseOverride && (
                    <div>
                      <p className="font-medium mb-1">Lease Override</p>
                      {override.leaseOverride.moneyFactor && (
                        <p>MF: {override.leaseOverride.moneyFactor}</p>
                      )}
                      {override.leaseOverride.residualPercentage && (
                        <p>Residual: {override.leaseOverride.residualPercentage}%</p>
                      )}
                      {override.leaseOverride.bonusCash && (
                        <p>Bonus: ${override.leaseOverride.bonusCash.toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  {override.incentives && (
                    <div>
                      <p className="font-medium mb-1">Incentives</p>
                      {override.incentives.cashBack && (
                        <p>Cash Back: ${override.incentives.cashBack.toLocaleString()}</p>
                      )}
                      {override.incentives.dealerCash && (
                        <p>Dealer Cash: ${override.incentives.dealerCash.toLocaleString()}</p>
                      )}
                      {override.incentives.loyaltyBonus && (
                        <p>Loyalty: ${override.incentives.loyaltyBonus.toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
                {override.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{override.notes}</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {overrides.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No model overrides configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add overrides to customize rates and incentives for specific models
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}