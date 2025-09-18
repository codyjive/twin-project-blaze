# Multi-Tenant DealerCentives Architecture Documentation

## Executive Summary
This document outlines the architecture and implementation plan for transforming the single-dealer DealerCentives application into a multi-tenant platform supporting multiple dealerships while maintaining the exact same user experience and functionality for each dealer.

## Architecture Overview

### Core Principles
1. **Design Preservation**: Maintain 100% of current UI/UX for dealer views
2. **Data Isolation**: Complete separation of dealer data
3. **Scalability**: Support hundreds of dealerships
4. **Maintainability**: Single codebase serving all dealers

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Admin Dashboard                      │
│  • Dealer Management  • Feed Configuration  • Analytics  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Backend                       │
│  • Multi-tenant DB  • Auth  • Storage  • Edge Functions │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Dealer Portal A     │    │   Dealer Portal B     │
│  (Current Interface)  │    │  (Current Interface)  │
└──────────────────────┘    └──────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Organizations (Dealerships)
CREATE TABLE dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- for URL: app.com/dealer/slug
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, suspended, trial
  subscription_tier TEXT DEFAULT 'basic'
);

-- Users with dealer association
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  dealership_id UUID REFERENCES dealerships(id),
  role TEXT NOT NULL, -- super_admin, dealer_admin, dealer_user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dealer-specific settings (exact mirror of current dealer-settings.ts)
CREATE TABLE dealer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) UNIQUE,
  settings JSONB NOT NULL, -- Store entire DealerSettings object
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed configurations
CREATE TABLE dealer_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id),
  feed_type TEXT NOT NULL, -- 'inventory' or 'incentives'
  feed_url TEXT,
  uploaded_file_path TEXT, -- for manual uploads
  update_frequency TEXT DEFAULT 'daily',
  last_sync TIMESTAMPTZ,
  next_sync TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- Cached inventory data
CREATE TABLE dealer_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id),
  vin TEXT NOT NULL,
  vehicle_data JSONB NOT NULL, -- Complete Vehicle object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dealership_id, vin)
);

-- Cached incentives data
CREATE TABLE dealer_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id),
  incentive_data JSONB NOT NULL, -- Complete incentive structure
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Dealers can only see their own data
CREATE POLICY "Dealers see own inventory" ON dealer_inventory
  FOR ALL USING (dealership_id = auth.jwt()->>'dealership_id');

CREATE POLICY "Dealers manage own settings" ON dealer_settings
  FOR ALL USING (dealership_id = auth.jwt()->>'dealership_id');

-- Super admins can see everything
CREATE POLICY "Admins see all" ON dealerships
  FOR ALL USING (auth.jwt()->>'role' = 'super_admin');
```

## Authentication & Authorization

### User Roles

1. **Super Admin**
   - Access to admin dashboard
   - Manage all dealerships
   - Configure global settings
   - View analytics across all dealers

2. **Dealer Admin**
   - Full access to their dealership
   - Manage dealer settings
   - Upload/configure feeds
   - View dealer-specific analytics

3. **Dealer User**
   - View-only access to dealer portal
   - Use calculator tools
   - View inventory

### Authentication Flow

```typescript
// Auth context with dealer context
interface AuthContext {
  user: User;
  dealership: Dealership;
  permissions: Permission[];
}

// Route protection
const DealerRoute = ({ children }) => {
  const { dealership, user } = useAuth();
  
  if (!dealership || !user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

## URL Structure & Routing

### Public Routes
- `/` - Marketing landing page
- `/login` - Unified login (redirects based on role)
- `/signup` - New dealer registration

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/dealers` - Dealer management
- `/admin/dealers/:id` - Individual dealer details
- `/admin/analytics` - Platform analytics

### Dealer Routes (Current Application)
- `/dealer/:slug` - Dealer homepage (current Index.tsx)
- `/dealer/:slug/inventory` - Inventory grid
- `/dealer/:slug/calculator` - Payment calculator
- `/dealer/:slug/settings` - Dealer settings

## Implementation Steps

### Phase 1: Backend Setup (Week 1-2)

1. **Supabase Project Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Initialize project
   supabase init
   
   # Create migrations
   supabase migration new create_multi_tenant_schema
   ```

2. **Database Migration**
   - Create all tables listed above
   - Set up RLS policies
   - Create database functions for dealer isolation

3. **Authentication Setup**
   - Configure Supabase Auth
   - Create custom JWT claims for dealership_id
   - Set up email templates

### Phase 2: Feed Management System (Week 2-3)

1. **Edge Functions for Feed Processing**
   ```typescript
   // supabase/functions/process-inventory-feed/index.ts
   export async function processInventoryFeed(dealershipId: string) {
     const { feed_url, uploaded_file_path } = await getFeedConfig(dealershipId);
     const data = await fetchFeedData(feed_url || uploaded_file_path);
     const transformed = transformInventoryData(data);
     await upsertInventory(dealershipId, transformed);
   }
   ```

2. **Scheduled Jobs**
   - Daily feed synchronization
   - Error handling and notifications
   - Feed validation

3. **Manual Upload Interface**
   ```typescript
   // Admin dashboard component
   const FeedUploader = ({ dealershipId }) => {
     const handleUpload = async (file: File, type: 'inventory' | 'incentives') => {
       const { data } = await supabase.storage
         .from('dealer-feeds')
         .upload(`${dealershipId}/${type}/${file.name}`, file);
       
       await supabase.from('dealer_feeds').upsert({
         dealership_id: dealershipId,
         feed_type: type,
         uploaded_file_path: data.path
       });
     };
   };
   ```

### Phase 3: Admin Dashboard (Week 3-4)

1. **Dashboard Components**
   ```typescript
   // src/admin/components/DealerList.tsx
   export const DealerList = () => {
     // Table with all dealers
     // Quick actions: suspend, edit, view
     // Analytics summary per dealer
   };
   
   // src/admin/components/DealerForm.tsx
   export const DealerForm = () => {
     // Create/edit dealer
     // Configure feeds
     // Set initial settings
   };
   ```

2. **Analytics Dashboard**
   - Active dealers count
   - API usage per dealer
   - Feed sync status
   - Error logs

### Phase 4: Dealer Portal Adaptation (Week 4-5)

1. **Context Provider Updates**
   ```typescript
   // src/contexts/DealerContext.tsx
   export const DealerProvider = ({ children }) => {
     const { dealership_id } = useParams();
     const [dealerSettings, setDealerSettings] = useState<DealerSettings>();
     const [inventory, setInventory] = useState<Vehicle[]>();
     
     useEffect(() => {
       // Load dealer-specific data
       loadDealerSettings(dealership_id);
       loadInventory(dealership_id);
     }, [dealership_id]);
     
     return (
       <DealerContext.Provider value={{ dealerSettings, inventory }}>
         {children}
       </DealerContext.Provider>
     );
   };
   ```

2. **Service Layer Updates**
   ```typescript
   // src/services/inventory.service.ts
   class InventoryService {
     constructor(private dealershipId: string) {}
     
     async fetchInventory(): Promise<Vehicle[]> {
       const { data } = await supabase
         .from('dealer_inventory')
         .select('vehicle_data')
         .eq('dealership_id', this.dealershipId);
       
       return data.map(row => row.vehicle_data);
     }
   }
   ```

### Phase 5: Deployment & DevOps (Week 5-6)

1. **Environment Configuration**
   ```env
   # .env.production
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://app.dealercentives.com
   ```

2. **CI/CD Pipeline**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - run: npm install
         - run: npm run build
         - run: supabase db push
         - run: supabase functions deploy
   ```

## Code Migration Guide

### Current → Multi-Tenant Service Changes

**Current (Single Dealer)**
```typescript
// src/services/dealer-settings.service.ts
class DealerSettingsService {
  private storageKey = 'dealer-settings';
  
  getSettings(): DealerSettings {
    return localStorage.getItem(this.storageKey);
  }
}
```

**New (Multi-Tenant)**
```typescript
// src/services/dealer-settings.service.ts
class DealerSettingsService {
  constructor(private dealershipId: string) {}
  
  async getSettings(): Promise<DealerSettings> {
    const { data } = await supabase
      .from('dealer_settings')
      .select('settings')
      .eq('dealership_id', this.dealershipId)
      .single();
    
    return data.settings;
  }
}
```

### Component Updates

**Minimal changes to existing components:**
```typescript
// src/pages/Index.tsx - No visual changes needed
const Index = () => {
  const { dealership } = useDealerContext(); // Only change: context
  // Rest remains exactly the same
  return (
    <div className="min-h-screen bg-background">
      {/* Exact same UI */}
    </div>
  );
};
```

## Data Migration Strategy

### For Existing Single Dealer

1. **Export current data**
   ```typescript
   const exportData = {
     settings: dealerSettingsService.getSettings(),
     inventory: await inventoryService.fetchInventory(),
     incentives: incentivesService.getIncentives()
   };
   ```

2. **Import to multi-tenant**
   ```sql
   INSERT INTO dealerships (name, slug) VALUES ('Inver Grove Honda', 'inver-grove-honda');
   INSERT INTO dealer_settings (dealership_id, settings) VALUES (...);
   ```

## Security Considerations

1. **Data Isolation**
   - RLS policies on all tables
   - Dealer ID validation in all queries
   - Separate storage buckets per dealer

2. **API Security**
   - Rate limiting per dealer
   - API key management
   - Request validation

3. **Feed Security**
   - Validate feed sources
   - Sanitize imported data
   - Monitor for anomalies

## Performance Optimization

1. **Caching Strategy**
   ```typescript
   // Redis-like caching with Supabase
   const getCachedInventory = async (dealershipId: string) => {
     const cacheKey = `inventory:${dealershipId}`;
     const cached = await redis.get(cacheKey);
     
     if (cached) return JSON.parse(cached);
     
     const fresh = await fetchInventory(dealershipId);
     await redis.setex(cacheKey, 3600, JSON.stringify(fresh));
     return fresh;
   };
   ```

2. **Database Indexes**
   ```sql
   CREATE INDEX idx_inventory_dealer ON dealer_inventory(dealership_id);
   CREATE INDEX idx_inventory_vin ON dealer_inventory(dealership_id, vin);
   ```

## Monitoring & Analytics

### Key Metrics to Track

1. **Per Dealer**
   - Active users
   - Calculator usage
   - Inventory views
   - Feed sync success rate

2. **Platform-wide**
   - Total active dealers
   - API usage
   - Error rates
   - Performance metrics

### Implementation
```typescript
// Analytics service
class AnalyticsService {
  trackEvent(event: string, properties: any) {
    supabase.from('analytics_events').insert({
      dealership_id: getCurrentDealershipId(),
      event,
      properties,
      timestamp: new Date()
    });
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('Multi-tenant InventoryService', () => {
  it('should only return dealer-specific inventory', async () => {
    const service = new InventoryService('dealer-123');
    const inventory = await service.fetchInventory();
    expect(inventory.every(v => v.dealership_id === 'dealer-123')).toBe(true);
  });
});
```

### E2E Tests
```typescript
describe('Dealer Portal Access', () => {
  it('should prevent cross-dealer data access', async () => {
    await loginAsDealer('dealer-a');
    await navigateTo('/dealer/dealer-b/inventory');
    expect(getCurrentUrl()).toBe('/unauthorized');
  });
});
```

## Cost Estimation

### Supabase Pricing (Pro Plan)
- **Database**: 8GB included (~1000 dealers)
- **Storage**: 100GB included (feeds & uploads)
- **Auth**: Unlimited users
- **Edge Functions**: 2M invocations
- **Estimated**: $25/month initially, scaling to $100/month at 100 dealers

### Additional Costs
- **Domain**: $15/year
- **SSL**: Free with Supabase
- **Monitoring**: $50/month (Sentry, LogRocket)

## Timeline Summary

- **Week 1-2**: Backend setup, database, auth
- **Week 2-3**: Feed management system
- **Week 3-4**: Admin dashboard
- **Week 4-5**: Dealer portal adaptation
- **Week 5-6**: Testing, deployment, documentation

**Total: 6 weeks for MVP**

## Next Steps

1. **Set up new Lovable project with Supabase integration**
2. **Copy current codebase as foundation**
3. **Implement multi-tenant backend following this guide**
4. **Build admin dashboard**
5. **Migrate existing dealer data**
6. **Deploy and test with pilot dealers**

## Conclusion

This architecture maintains 100% of the current application's design and functionality while adding multi-tenancy. Each dealer gets their own isolated view that looks and works exactly like the current single-dealer application, with the added benefit of centralized management and maintenance.