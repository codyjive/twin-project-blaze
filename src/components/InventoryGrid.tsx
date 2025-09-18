import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleCardProfessional } from '@/components/VehicleCardProfessional';
import type { Vehicle } from '@/types/inventory';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface InventoryGridProps {
  inventory: Vehicle[];
  loading: boolean;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onVehicleUpdate?: (vehicle: Vehicle) => void;
}

export function InventoryGrid({ 
  inventory, 
  loading, 
  onVehicleSelect, 
  onVehicleUpdate 
}: InventoryGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleType, setVehicleType] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');

  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.vin.toLowerCase().includes(search) ||
        vehicle.stock_no.toLowerCase().includes(search) ||
        `${vehicle.build.year} ${vehicle.build.make} ${vehicle.build.model}`.toLowerCase().includes(search)
      );
    }

    // Apply type filter
    if (vehicleType !== 'all') {
      filtered = filtered.filter(v => v.inventory_type === vehicleType);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      // First, check if either vehicle has $0 pricing
      const aHasZeroPrice = (a.price === 0 || a.msrp === 0);
      const bHasZeroPrice = (b.price === 0 || b.msrp === 0);
      
      // If one has zero price and the other doesn't, put the zero price at the bottom
      if (aHasZeroPrice && !bHasZeroPrice) return 1;
      if (!aHasZeroPrice && bHasZeroPrice) return -1;
      
      // If both have zero price or both have non-zero price, apply regular sorting
      switch (sortBy) {
        case 'price-asc':
          return (a.price || a.msrp) - (b.price || b.msrp);
        case 'price-desc':
          return (b.price || b.msrp) - (a.price || a.msrp);
        case 'dom-asc':
          return a.dom - b.dom;
        case 'dom-desc':
          return b.dom - a.dom;
        case 'year-desc':
          return b.build.year - a.build.year;
        case 'year-asc':
          return a.build.year - b.build.year;
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, vehicleType, sortBy]);

  const stats = useMemo(() => {
    return {
      total: inventory.length,
    };
  }, [inventory]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search by VIN, Stock #, or Model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 border-gray-300"
          />
        </div>
        
        <Select value={vehicleType} onValueChange={setVehicleType}>
          <SelectTrigger className="w-full md:w-[200px] border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px] border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="dom-asc">Days: Low to High</SelectItem>
            <SelectItem value="dom-desc">Days: High to Low</SelectItem>
            <SelectItem value="year-desc">Year: Newest</SelectItem>
            <SelectItem value="year-asc">Year: Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map(vehicle => (
          <VehicleCardProfessional
            key={vehicle.vin}
            vehicle={vehicle}
            onCalculate={() => {
              const updated = { ...vehicle, calculatedPayment: vehicle.calculatedPayment };
              onVehicleUpdate?.(updated);
            }}
            onSelect={() => onVehicleSelect?.(vehicle)}
          />
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}