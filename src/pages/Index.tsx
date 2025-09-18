import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryGrid } from '@/components/InventoryGrid';
import { PaymentCalculator } from '@/components/PaymentCalculator';
import { BulkActions } from '@/components/BulkActions';
import { DealerSettingsPage } from '@/pages/DealerSettings';
import { api } from '@/services/api.service';
import type { Vehicle } from '@/types/inventory';

export default function Index() {
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.fetchInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleUpdate = (updatedVehicle: Vehicle) => {
    setInventory(prev => 
      prev.map(v => v.vin === updatedVehicle.vin ? updatedVehicle : v)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                DealerCentives
              </h1>
              <p className="text-sm text-gray-500">
                Tony Serra Ford Payment Calculator
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="inventory" className="text-gray-700">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-gray-700">
              Calculator
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-gray-700">
              Bulk Actions
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-700">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryGrid
              inventory={inventory}
              loading={loading}
              onVehicleSelect={setSelectedVehicle}
              onVehicleUpdate={handleVehicleUpdate}
            />
          </TabsContent>

          <TabsContent value="calculator">
            <PaymentCalculator />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkActions />
          </TabsContent>

          <TabsContent value="settings">
            <DealerSettingsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}