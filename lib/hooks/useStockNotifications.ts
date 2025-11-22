import { useEffect, useRef, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { useToast } from './useToast';
import { StockAlert } from '@/app/api/notifications/stock-alerts/route';

interface NotificationState {
  alerts: StockAlert[];
  lastChecked: number;
  shownAlerts: Set<string>; // Track which alerts have been shown
}

export function useStockNotifications(options?: {
  enabled?: boolean;
  checkInterval?: number; // in milliseconds
  showToasts?: boolean;
  minSeverity?: 'warning' | 'error';
}) {
  const {
    enabled = true,
    checkInterval = 30000, // 30 seconds default
    showToasts = true,
    minSeverity = 'warning',
  } = options || {};

  const toast = useToast();
  const stateRef = useRef<NotificationState>({
    alerts: [],
    lastChecked: 0,
    shownAlerts: new Set(),
  });

  const getAlertKey = useCallback((alert: StockAlert): string => {
    return `${alert.product_id}-${alert.warehouse_id}-${alert.alert_type}`;
  }, []);

  const checkStockAlerts = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await apiGet<{ alerts: StockAlert[] }>('/api/notifications/stock-alerts');
      const newAlerts = response.alerts || [];

      // Filter by minimum severity
      const filteredAlerts = newAlerts.filter(alert => {
        if (minSeverity === 'error') {
          return alert.severity === 'error';
        }
        return true; // Show both warning and error
      });

      // Find new alerts that haven't been shown yet
      const newAlertsToShow = filteredAlerts.filter(alert => {
        const key = getAlertKey(alert);
        return !stateRef.current.shownAlerts.has(key);
      });

      // Show toast notifications for new alerts
      if (showToasts && newAlertsToShow.length > 0) {
        // Group alerts by type for better UX
        const outOfStockAlerts = newAlertsToShow.filter(a => a.alert_type === 'out_of_stock');
        const criticalAlerts = newAlertsToShow.filter(a => a.alert_type === 'critical');
        const lowStockAlerts = newAlertsToShow.filter(a => a.alert_type === 'low_stock');

        // Show out of stock alerts (highest priority)
        if (outOfStockAlerts.length > 0) {
          if (outOfStockAlerts.length === 1) {
            const alert = outOfStockAlerts[0];
            toast.error(
              `🚨 Out of Stock: ${alert.product_name} (${alert.product_sku}) in ${alert.warehouse_name}`
            );
          } else {
            toast.error(
              `🚨 ${outOfStockAlerts.length} products are out of stock! Check inventory immediately.`
            );
          }
          outOfStockAlerts.forEach(alert => {
            stateRef.current.shownAlerts.add(getAlertKey(alert));
          });
        }

        // Show critical alerts
        if (criticalAlerts.length > 0) {
          if (criticalAlerts.length === 1) {
            const alert = criticalAlerts[0];
            toast.error(
              `⚠️ Critical Stock: ${alert.product_name} has only ${alert.available_stock} units left in ${alert.warehouse_name} (Reorder: ${alert.reorder_level})`
            );
          } else {
            toast.error(
              `⚠️ ${criticalAlerts.length} products have critically low stock!`
            );
          }
          criticalAlerts.forEach(alert => {
            stateRef.current.shownAlerts.add(getAlertKey(alert));
          });
        }

        // Show low stock alerts (batch if multiple)
        if (lowStockAlerts.length > 0) {
          if (lowStockAlerts.length === 1) {
            const alert = lowStockAlerts[0];
            toast.warning(
              `📦 Low Stock: ${alert.product_name} (${alert.product_sku}) has ${alert.available_stock} units in ${alert.warehouse_name} (Reorder level: ${alert.reorder_level})`
            );
          } else {
            toast.warning(
              `📦 ${lowStockAlerts.length} products are running low on stock. Consider reordering.`
            );
          }
          lowStockAlerts.forEach(alert => {
            stateRef.current.shownAlerts.add(getAlertKey(alert));
          });
        }
      }

      // Update state
      stateRef.current.alerts = filteredAlerts;
      stateRef.current.lastChecked = Date.now();
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      // Don't show error toast to avoid spam, just log it
    }
  }, [enabled, showToasts, minSeverity, toast, getAlertKey]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkStockAlerts();

    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      checkStockAlerts();
    }, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, checkInterval, checkStockAlerts]);

  // Function to manually refresh alerts
  const refreshAlerts = useCallback(() => {
    checkStockAlerts();
  }, [checkStockAlerts]);

  // Function to clear shown alerts (useful for testing or reset)
  const clearShownAlerts = useCallback(() => {
    stateRef.current.shownAlerts.clear();
  }, []);

  // Function to mark alert as read (so it won't show again)
  const markAlertAsRead = useCallback((alert: StockAlert) => {
    const key = getAlertKey(alert);
    stateRef.current.shownAlerts.add(key);
  }, [getAlertKey]);

  return {
    alerts: stateRef.current.alerts,
    lastChecked: stateRef.current.lastChecked,
    refreshAlerts,
    clearShownAlerts,
    markAlertAsRead,
  };
}

