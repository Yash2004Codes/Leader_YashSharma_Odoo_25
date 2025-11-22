# Stock Notification System Guide

## Overview
The Intelligent Stock Notification System automatically monitors your inventory and alerts users when stock levels drop below reorder thresholds. It provides real-time toast notifications with a clean, user-friendly interface.

## Features

### 🚨 Alert Types

1. **Out of Stock** (Error - Red)
   - Triggered when: Available stock ≤ 0
   - Severity: Critical
   - Duration: 6 seconds
   - Example: "🚨 Out of Stock: Product A (SKU123) in Main Warehouse"

2. **Critical Stock** (Error - Red)
   - Triggered when: Available stock ≤ 50% of reorder level
   - Severity: Critical
   - Duration: 6 seconds
   - Example: "⚠️ Critical Stock: Product B has only 5 units left in Warehouse X (Reorder: 10)"

3. **Low Stock** (Warning - Yellow)
   - Triggered when: Available stock ≤ reorder level (but > 0)
   - Severity: Warning
   - Duration: 6 seconds
   - Example: "📦 Low Stock: Product C (SKU456) has 8 units in Warehouse Y (Reorder level: 10)"

### ✨ Key Features

- **Automatic Monitoring**: Checks stock levels every 30 seconds
- **Smart Deduplication**: Only shows new alerts (prevents spam)
- **Priority-Based**: Critical alerts shown first
- **Batch Notifications**: Groups multiple alerts intelligently
- **Non-Intrusive**: Toast notifications that auto-dismiss
- **Persistent Tracking**: Remembers which alerts have been shown

## How It Works

### 1. Background Monitoring
- The system runs automatically when users are logged in
- Checks stock levels every 30 seconds (configurable)
- Only monitors products with reorder levels set

### 2. Alert Detection
- Compares available stock (total - reserved) with reorder levels
- Calculates alert severity based on stock percentage
- Groups alerts by type for better UX

### 3. Notification Display
- Shows toast notifications in top-right corner
- Different colors for different severity levels
- Auto-dismisses after 6 seconds (errors/warnings) or 3 seconds (info)
- Users can manually dismiss by clicking X

### 4. Duplicate Prevention
- Tracks which alerts have been shown
- Only displays new alerts that haven't been seen
- Prevents notification spam

## Configuration

### Default Settings
```typescript
{
  enabled: true,              // Enable/disable notifications
  checkInterval: 30000,       // Check every 30 seconds
  showToasts: true,           // Show toast notifications
  minSeverity: 'warning'      // Show warnings and errors
}
```

### Customization Options

#### In DashboardLayout
```typescript
useStockNotifications({
  enabled: true,              // Enable notifications
  checkInterval: 60000,       // Check every 60 seconds
  showToasts: true,           // Show toast notifications
  minSeverity: 'error',       // Only show critical alerts
});
```

#### Severity Levels
- `'warning'`: Show both warnings and errors (default)
- `'error'`: Only show critical/error alerts

## API Endpoint

### GET `/api/notifications/stock-alerts`

Returns all active stock alerts.

**Query Parameters:**
- `warehouse_id` (optional): Filter by warehouse
- `alert_type` (optional): Filter by type (`low_stock`, `out_of_stock`, `critical`, `all`)

**Response:**
```json
{
  "alerts": [
    {
      "product_id": "uuid",
      "product_name": "Product A",
      "product_sku": "SKU123",
      "warehouse_id": "uuid",
      "warehouse_name": "Main Warehouse",
      "current_stock": 5,
      "available_stock": 3,
      "reorder_level": 10,
      "alert_type": "low_stock",
      "severity": "warning"
    }
  ]
}
```

## Usage Examples

### Basic Usage
The notification system is automatically enabled in `DashboardLayout`. No additional setup required!

### Manual Refresh
```typescript
const { refreshAlerts } = useStockNotifications();

// Manually check for alerts
refreshAlerts();
```

### Get Current Alerts
```typescript
const { alerts, lastChecked } = useStockNotifications();

// alerts: Array of current stock alerts
// lastChecked: Timestamp of last check
```

### Clear Shown Alerts
```typescript
const { clearShownAlerts } = useStockNotifications();

// Reset notification tracking (useful for testing)
clearShownAlerts();
```

## Alert Logic

### Stock Calculation
```
Available Stock = Total Stock - Reserved Stock
```

### Alert Thresholds
1. **Out of Stock**: `available_stock <= 0`
2. **Critical**: `available_stock <= reorder_level * 0.5`
3. **Low Stock**: `available_stock <= reorder_level`

### Example Scenarios

**Scenario 1: Product with reorder level 10**
- Stock: 0 → Out of Stock alert
- Stock: 3 → Critical alert (3 ≤ 5)
- Stock: 8 → Low Stock alert (8 ≤ 10)
- Stock: 12 → No alert

**Scenario 2: Product with reorder level 20**
- Stock: 0 → Out of Stock alert
- Stock: 8 → Critical alert (8 ≤ 10)
- Stock: 15 → Low Stock alert (15 ≤ 20)
- Stock: 25 → No alert

## Best Practices

### 1. Set Reorder Levels
- Always set reorder levels for products you want to monitor
- Products without reorder levels won't trigger alerts
- Set realistic reorder levels based on usage patterns

### 2. Monitor Regularly
- The system checks automatically, but you can manually refresh
- Review alerts in the dashboard regularly
- Take action on critical alerts immediately

### 3. Warehouse Management
- Set reorder levels per product (not per warehouse)
- System checks all warehouses automatically
- Filter by warehouse if needed

### 4. Notification Management
- Alerts are shown once per unique product/warehouse combination
- Clear shown alerts if you want to see them again
- Adjust check interval based on your needs

## Troubleshooting

### Notifications Not Showing

1. **Check if enabled**
   - Verify `enabled: true` in configuration
   - Check if user is authenticated

2. **Check reorder levels**
   - Products must have reorder levels set
   - Products must be active (`is_active = 1`)

3. **Check stock levels**
   - Verify stock exists in database
   - Check if stock is actually below reorder level

4. **Check browser console**
   - Look for API errors
   - Verify authentication token

### Too Many Notifications

1. **Adjust severity filter**
   ```typescript
   minSeverity: 'error' // Only show critical alerts
   ```

2. **Increase check interval**
   ```typescript
   checkInterval: 60000 // Check every minute instead of 30 seconds
   ```

3. **Disable toasts temporarily**
   ```typescript
   showToasts: false
   ```

### Notifications Not Clearing

- Notifications auto-dismiss after duration
- Click X button to manually dismiss
- Check if multiple alerts are queued

## Integration Points

### Dashboard Layout
- Automatically enabled for all authenticated users
- Runs in background while dashboard is open
- Shows notifications across all pages

### Toast System
- Uses existing toast component
- Integrates with `useToast` hook
- Respects toast container positioning

### Stock Management
- Monitors all stock level changes
- Works with stock reservations
- Accounts for reserved quantities

## Future Enhancements

Potential improvements:
- Email notifications for critical alerts
- SMS notifications for out-of-stock items
- Customizable alert thresholds per product
- Notification history/log
- Sound alerts for critical items
- Dashboard widget showing active alerts
- Notification preferences per user
- Integration with reorder workflows

## Technical Details

### Hook: `useStockNotifications`
- Location: `/lib/hooks/useStockNotifications.ts`
- Uses: `useEffect`, `useRef`, `useCallback`
- Dependencies: `useToast`, `apiGet`

### API: Stock Alerts
- Location: `/app/api/notifications/stock-alerts/route.ts`
- Method: GET
- Authentication: Required
- Database: Supabase

### Component: Toast
- Location: `/components/ui/Toast.tsx`
- Types: success, error, warning, info
- Duration: Configurable per type

## Support

For issues or questions:
1. Check this guide
2. Review browser console for errors
3. Verify API endpoint is accessible
4. Check authentication status
5. Verify product reorder levels are set

