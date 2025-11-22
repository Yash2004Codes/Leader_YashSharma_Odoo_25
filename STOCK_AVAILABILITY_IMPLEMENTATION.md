# Stock Unavailability Management Implementation

## Overview
This document describes the comprehensive stock unavailability management system implemented in the supply chain application. The system ensures proper stock management by validating stock availability before operations and providing detailed error messages when stock is unavailable.

## Features Implemented

### 1. Stock Availability Utility Functions (`lib/utils.ts`)

#### `getStockAvailability()`
- Gets stock availability for a single product in a warehouse
- Returns detailed information including:
  - Available quantity (total - reserved)
  - Total quantity
  - Reserved quantity
  - Shortfall (if requested quantity exceeds available)
  - Product and warehouse details for better error messages

#### `checkStockAvailability()`
- Checks stock availability for multiple items at once
- Returns:
  - `allAvailable`: boolean indicating if all items are available
  - `unavailableItems`: array of items with insufficient stock
  - `availableItems`: array of items with sufficient stock

#### `validateStockAvailability()`
- Validates stock availability and throws detailed error if unavailable
- Provides comprehensive error messages listing all unavailable items with:
  - Product name/SKU
  - Available quantity
  - Requested quantity
  - Shortfall amount

#### `getAvailableStock()`
- Simple utility to get available stock quantity (total - reserved) for a product

#### Enhanced `updateStockLevel()`
- Added validation to prevent negative stock (except for adjustments)
- Throws error if stock would go negative

### 2. Stock Availability API Endpoint (`/api/stock/availability`)

#### GET `/api/stock/availability`
- Query parameters:
  - `product_id`: Product to check
  - `warehouse_id`: Warehouse to check
  - `quantity`: Requested quantity (optional)
- Returns detailed stock availability information

#### POST `/api/stock/availability`
- Body:
  ```json
  {
    "items": [
      { "product_id": "...", "quantity": 10 }
    ],
    "warehouse_id": "..."
  }
  ```
- Returns comprehensive check result with available and unavailable items

### 3. Enhanced Delivery Orders

#### Creating Delivery Orders (`POST /api/deliveries`)
- Validates stock availability before creating order
- Provides detailed error messages listing all unavailable items
- Only creates order if all items have sufficient stock

#### Updating Delivery Orders (`PUT /api/deliveries/[id]`)
- Validates stock availability when items are updated
- Handles warehouse changes correctly
- Validates stock in the correct warehouse (updated or original)
- Creates stock level entries if needed (safety check)

#### Validating Delivery Orders (status = 'done')
- Final stock availability check before validation
- Prevents validation if stock became unavailable since order creation
- Ensures stock is still sufficient before decreasing inventory

### 4. Enhanced Internal Transfers

#### Creating Transfers (`POST /api/transfers`)
- Validates stock availability in source warehouse
- Provides detailed error messages for unavailable items
- Only creates transfer if all items are available in source

#### Updating Transfers (`PUT /api/transfers/[id]`)
- Validates stock availability when items are updated
- Handles warehouse changes correctly
- Validates stock in the correct source warehouse

#### Validating Transfers (status = 'done')
- Final stock availability check before validation
- Prevents validation if stock became unavailable since transfer creation
- Handles warehouse changes during validation

## Stock Availability Logic

### Available Stock Calculation
```
Available Stock = Total Quantity - Reserved Quantity
```

### Stock Reservation
- When a delivery order is created, stock is **reserved** (not deducted)
- Reserved stock is unavailable for other operations
- When order is validated (status = 'done'), stock is:
  1. Unreserved
  2. Deducted from inventory

### Stock Validation Flow

1. **Before Creating Order/Transfer**
   - Check if available stock >= requested quantity
   - If not, return detailed error with all unavailable items

2. **Before Updating Order/Transfer**
   - Check if available stock >= new requested quantity
   - Account for previously reserved stock being released
   - Validate in correct warehouse (if warehouse changed)

3. **Before Validating Order/Transfer**
   - Final check to ensure stock is still available
   - Prevents validation if stock changed since creation
   - Ensures data integrity

## Error Messages

The system provides detailed, user-friendly error messages:

### Example Error Format
```
Insufficient stock:
Product A: Available 5, Requested 10, Shortfall 5
Product B: Available 0, Requested 3, Shortfall 3
```

### Error Scenarios
1. **Creating order with insufficient stock**: Lists all unavailable items
2. **Updating order with insufficient stock**: Shows what changed
3. **Validating order with insufficient stock**: Prevents validation with clear message
4. **Transfer with insufficient stock in source**: Shows source warehouse issues

## Benefits

1. **Prevents Stock Overselling**: Ensures orders can only be created if stock is available
2. **Real-time Validation**: Checks stock at multiple points (create, update, validate)
3. **Detailed Error Messages**: Users know exactly which products and quantities are unavailable
4. **Data Integrity**: Prevents negative stock and inconsistent inventory
5. **Better UX**: Clear feedback on why operations fail
6. **Audit Trail**: All stock changes are logged in stock ledger

## Usage Examples

### Check Single Product Availability
```typescript
const availability = await getStockAvailability(
  productId,
  warehouseId,
  requestedQuantity
);

if (!availability.isAvailable) {
  console.log(`Shortfall: ${availability.shortfall}`);
}
```

### Validate Multiple Items
```typescript
try {
  await validateStockAvailability(items, warehouseId);
  // Proceed with operation
} catch (error) {
  // Handle insufficient stock error
  console.error(error.message);
}
```

### Check Stock via API
```bash
# GET single product
GET /api/stock/availability?product_id=xxx&warehouse_id=yyy&quantity=10

# POST multiple items
POST /api/stock/availability
{
  "items": [
    { "product_id": "xxx", "quantity": 10 },
    { "product_id": "yyy", "quantity": 5 }
  ],
  "warehouse_id": "zzz"
}
```

## Database Schema

The system uses existing database tables:
- `stock_levels`: Stores current stock and reserved quantities
- `stock_ledger`: Logs all stock movements
- `delivery_orders` & `delivery_order_items`: Tracks outgoing stock
- `internal_transfers` & `transfer_items`: Tracks stock movements

## Future Enhancements (Optional)

1. **Stock Unavailability Tracking Table**: Track when stock becomes unavailable for analytics
2. **Low Stock Alerts**: Automatic notifications when stock falls below reorder level
3. **Backorder Management**: Handle orders when stock is unavailable
4. **Stock Reservation Expiry**: Auto-release reservations after timeout
5. **Multi-warehouse Availability**: Check availability across all warehouses

## Testing Recommendations

1. Test creating delivery order with insufficient stock
2. Test updating delivery order with insufficient stock
3. Test validating delivery order when stock became unavailable
4. Test transfers with insufficient stock in source warehouse
5. Test warehouse changes during order/transfer updates
6. Test concurrent operations (multiple orders for same product)

