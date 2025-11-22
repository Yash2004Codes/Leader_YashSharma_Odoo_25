# StockMaster - Complete Testing Guide

This guide walks you through testing the complete inventory flow from receiving goods to adjustments.

## Prerequisites

1. **Login to the system**
   - Go to `/login` or `/signup` if you don't have an account
   - Ensure you're logged in and can see the dashboard

2. **Create Required Setup** (if not already done)
   - **Warehouses**: Go to Settings → Create at least 2 warehouses:
     - "Main Store" (or any name)
     - "Production Rack" (or any name)
   - **Product**: Go to Products → Create a product:
     - Name: "Steel"
     - SKU: "STL-001" (or any unique SKU)
     - Unit of Measure: "kg"
     - Category: (optional)
     - Initial Stock: Leave empty (we'll add via receipt)

---

## Step 1: Receive Goods from Vendor (Receipt)

**Goal**: Receive 100 kg Steel → Stock: +100

### Steps:

1. **Navigate to Receipts**
   - Click "Receipts" in the sidebar menu
   - You'll see the Receipts page with a list of existing receipts

2. **Create New Receipt**
   - Click the "New Receipt" button (top right)
   - A modal will open

3. **Fill Receipt Form**:
   - **Supplier Name**: Enter "Steel Supplier" (or any vendor name)
   - **Warehouse**: Select "Main Store" (or your main warehouse)
   - **Notes**: (Optional) "Initial stock receipt"
   - **Items Section**:
     - **Product**: Select "Steel" from dropdown
     - **Quantity**: Enter `100`
     - **Unit Price**: Enter `50` (or any price, optional)
   - Click "Create Receipt"

4. **Validate the Receipt** (This updates stock):
   - Find your newly created receipt in the table
   - Click the "Validate" button next to it
   - You should see a success message: "Receipt validated successfully!"
   - The receipt status will change to "done"

5. **Verify Stock Updated**:
   - Go to **Products** page
   - Find "Steel" in the products list
   - Check the "Stock" column - it should show **100 kg** (or 100 in Main Store)

---

## Step 2: Move to Production Rack (Internal Transfer)

**Goal**: Transfer Steel from Main Store → Production Rack → Stock unchanged in total, but location updated

### Steps:

1. **Navigate to Transfers**
   - Click "Transfers" in the sidebar menu
   - You'll see the Internal Transfers page

2. **Create New Transfer**
   - Click the "New Transfer" button (top right)
   - A modal will open

3. **Fill Transfer Form**:
   - **From Warehouse**: Select "Main Store"
   - **To Warehouse**: Select "Production Rack"
   - **Notes**: (Optional) "Moving to production"
   - **Items Section**:
     - **Product**: Select "Steel"
     - **Quantity**: Enter `100` (transfer all 100 kg)
   - Click "Create Transfer"

4. **Validate the Transfer** (This moves stock):
   - Find your newly created transfer in the table
   - Click the "Validate" button next to it
   - You should see a success message: "Transfer validated successfully!"
   - The transfer status will change to "done"

5. **Verify Stock Moved**:
   - Go to **Products** page
   - Find "Steel" in the products list
   - Check the stock levels:
     - **Main Store**: Should show **0 kg** (stock moved out)
     - **Production Rack**: Should show **100 kg** (stock moved in)
   - **Total Stock**: Still **100 kg** (unchanged, just moved location)

---

## Step 3: Deliver Finished Goods (Delivery Order)

**Goal**: Deliver 20 kg Steel → Stock: -20

### Steps:

1. **Navigate to Deliveries**
   - Click "Deliveries" in the sidebar menu
   - You'll see the Delivery Orders page

2. **Create New Delivery Order**
   - Click the "New Delivery Order" button (top right)
   - A modal will open

3. **Fill Delivery Form**:
   - **Customer Name**: Enter "Customer ABC" (or any customer name)
   - **Warehouse**: Select "Production Rack" (where the stock is)
   - **Notes**: (Optional) "Delivery of finished goods"
   - **Items Section**:
     - **Product**: Select "Steel"
     - **Quantity**: Enter `20`
   - Click "Create Delivery Order"

4. **Validate the Delivery** (This reduces stock):
   - Find your newly created delivery order in the table
   - Click the "Validate" button next to it
   - You should see a success message: "Delivery order validated successfully!"
   - The delivery status will change to "done"

5. **Verify Stock Reduced**:
   - Go to **Products** page
   - Find "Steel" in the products list
   - Check the stock:
     - **Production Rack**: Should show **80 kg** (100 - 20 = 80)
     - **Total Stock**: Should show **80 kg**

---

## Step 4: Adjust Damaged Items (Stock Adjustment)

**Goal**: 3 kg Steel damaged → Stock: -3

### Steps:

1. **Navigate to Adjustments**
   - Click "Adjustments" in the sidebar menu
   - You'll see the Stock Adjustments page

2. **Create New Adjustment**
   - Click the "New Adjustment" button (top right)
   - A modal will open

3. **Fill Adjustment Form**:
   - **Warehouse**: Select "Production Rack" (where the stock is)
   - **Reason**: Select "damage" (or "loss")
   - **Notes**: (Optional) "3 kg steel damaged during handling"
   - **Items Section**:
     - **Product**: Select "Steel"
     - **Counted Quantity**: Enter `77` (current stock 80 - damaged 3 = 77)
     - The system will automatically calculate the difference: -3
   - Click "Create Adjustment"

4. **Validate the Adjustment** (This updates stock):
   - Find your newly created adjustment in the table
   - Click the "Validate" button next to it
   - You should see a success message: "Adjustment validated successfully!"
   - The adjustment status will change to "done"

5. **Verify Stock Adjusted**:
   - Go to **Products** page
   - Find "Steel" in the products list
   - Check the stock:
     - **Production Rack**: Should show **77 kg** (80 - 3 = 77)
     - **Total Stock**: Should show **77 kg**

---

## Step 5: View Stock Ledger (Move History)

**Goal**: Verify all transactions are logged in the Stock Ledger

### Steps:

1. **Navigate to Move History**
   - Click "Move History" in the sidebar menu
   - You'll see the Stock Ledger page

2. **View All Transactions**:
   - You should see all 4 transactions listed:
     - **Receipt**: +100 kg (Steel received)
     - **Transfer Out**: -100 kg (from Main Store)
     - **Transfer In**: +100 kg (to Production Rack)
     - **Delivery**: -20 kg (delivered to customer)
     - **Adjustment**: -3 kg (damaged items)

3. **Filter Transactions** (Optional):
   - Use the filters to view specific transactions:
     - **Product**: Select "Steel" to see only Steel transactions
     - **Warehouse**: Select a warehouse to see transactions for that location
     - **Transaction Type**: Filter by receipt, delivery, transfer, or adjustment

4. **Verify Transaction Details**:
   - Each transaction shows:
     - Transaction type
     - Product name
     - Warehouse
     - Quantity change (+ or -)
     - Quantity before and after
     - Reference number
     - Date and time
     - Created by (user)

---

## Summary of Stock Flow

| Step | Action | Location | Quantity Change | Final Stock |
|------|--------|----------|----------------|-------------|
| Initial | - | - | 0 | 0 kg |
| Step 1 | Receipt | Main Store | +100 | 100 kg |
| Step 2 | Transfer Out | Main Store | -100 | 0 kg (Main Store) |
| Step 2 | Transfer In | Production Rack | +100 | 100 kg (Production Rack) |
| Step 3 | Delivery | Production Rack | -20 | 80 kg (Production Rack) |
| Step 4 | Adjustment | Production Rack | -3 | 77 kg (Production Rack) |

**Final Result**: 77 kg Steel in Production Rack

---

## Tips for Testing

1. **Check Stock After Each Step**: Always verify stock levels in the Products page after validating any transaction

2. **Use Move History**: The Move History page shows a complete audit trail of all stock movements

3. **Validate Transactions**: Remember to click "Validate" after creating receipts, transfers, deliveries, and adjustments - this is what actually updates the stock

4. **Check Dashboard**: The dashboard shows KPIs that update based on your transactions

5. **Print Receipts**: You can click "Print" on any receipt to generate a PDF

6. **Filter Products**: Use the warehouse filter in Products page to see stock levels per location

---

## Troubleshooting

- **Stock not updating?**: Make sure you clicked "Validate" on the transaction
- **Product not showing?**: Check if the product is active in the Products page
- **Warehouse not available?**: Create warehouses in Settings page first
- **Can't find transactions?**: Check Move History page and use filters

---

## Quick Test Checklist

- [ ] Created warehouses (Main Store, Production Rack)
- [ ] Created product (Steel, 100 kg)
- [ ] Step 1: Created and validated receipt (+100 kg)
- [ ] Verified stock increased to 100 kg
- [ ] Step 2: Created and validated transfer (Main Store → Production Rack)
- [ ] Verified stock moved (0 kg Main Store, 100 kg Production Rack)
- [ ] Step 3: Created and validated delivery (-20 kg)
- [ ] Verified stock reduced to 80 kg
- [ ] Step 4: Created and validated adjustment (-3 kg)
- [ ] Verified stock adjusted to 77 kg
- [ ] Step 5: Viewed Move History and verified all transactions logged

---

**Happy Testing! 🎉**

