# DealerCentives Implementation Plan

## Current State Analysis
Last Updated: 2025-09-14

### ✅ Completed Components
- Basic inventory fetching from API
- Vehicle card display
- Basic finance/lease calculators
- Dealer settings UI page (not connected)
- Manufacturer rates service (not connected)

### ❌ Critical Issues
1. **Hardcoded $500 Incentive**
   - Location: `src/services/inventory.service.ts` line 106
   - Issue: All vehicles get $500, not from real data
   
2. **No Disclaimers in UI**
   - Disclaimers are generated but not displayed
   - Need to add to vehicle cards and payment results
   
3. **Settings Not Connected**
   - Dealer settings page exists but doesn't affect calculations
   - Need to wire settings to calculators
   
4. **No Live Rate Integration**
   - Manufacturer rates feed created but not used
   - Need to match rates by year/make/model/trim
   
5. **Poor UI/UX**
   - No payment amounts displayed
   - Basic card design
   - No proper navigation

## Implementation Stages

### Stage 1: Fix Incentives & Connect Manufacturer Rates
**Priority: CRITICAL**
- [ ] Remove hardcoded $500 incentive
- [ ] Create incentive matching service
- [ ] Pull incentives from manufacturer feed
- [ ] Match by year/make/model/trim
- [ ] Display actual incentive amounts

### Stage 2: Display Disclaimers & Payment Information
**Priority: HIGH**
- [ ] Add disclaimer display to vehicle cards
- [ ] Show calculated payments on cards
- [ ] Add payment breakdown modal
- [ ] Display finance/lease options
- [ ] Show "Copy Disclaimer" button for dealers

### Stage 3: Connect Dealer Settings
**Priority: HIGH**
- [ ] Wire settings to calculators
- [ ] Use dealer fees in calculations
- [ ] Apply tax rates from settings
- [ ] Use rounding preferences
- [ ] Apply display preferences

### Stage 4: UI/UX Improvements
**Priority: MEDIUM**
- [ ] Redesign vehicle cards with better layout
- [ ] Add sidebar navigation
- [ ] Improve header with dealer branding
- [ ] Add payment calculator modal
- [ ] Enhance mobile responsiveness

### Stage 5: Bulk Operations & Export
**Priority: LOW**
- [ ] Implement bulk calculation UI
- [ ] Add export to CSV/PDF
- [ ] Create email templates
- [ ] Add print-friendly views

## Technical Debt to Address
1. Move incentive logic to dedicated service
2. Create proper rate matching algorithm
3. Add error handling for API failures
4. Implement caching for rates/incentives
5. Add loading states and error boundaries

## Configuration Requirements
- Dealer can set custom incentives
- Dealer can override manufacturer rates
- Dealer can customize disclaimer text
- Dealer can set display preferences
- All settings should persist and affect calculations