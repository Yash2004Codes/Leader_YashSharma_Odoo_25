import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export interface StockAlert {
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  current_stock: number;
  available_stock: number;
  reorder_level: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'critical';
  severity: 'warning' | 'error';
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');
    const alertTypeFilter = searchParams.get('alert_type'); // 'low_stock', 'out_of_stock', 'critical', 'all'

    // Get all products with reorder levels set
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, reorder_level')
      .gt('reorder_level', 0)
      .eq('is_active', 1);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const alerts: StockAlert[] = [];

    // Check stock for each product
    for (const product of products) {
      let stockQuery = supabase
        .from('stock_levels')
        .select('quantity, reserved_quantity, warehouse_id, warehouses(name)')
        .eq('product_id', product.id);

      if (warehouseId) {
        stockQuery = stockQuery.eq('warehouse_id', warehouseId);
      }

      const { data: stockLevels, error: stockError } = await stockQuery;

      if (stockError) {
        console.error(`Error fetching stock for product ${product.id}:`, stockError);
        continue;
      }

      if (!stockLevels || stockLevels.length === 0) {
        // Product has no stock anywhere - out of stock
        alerts.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          warehouse_id: '',
          warehouse_name: 'All Warehouses',
          current_stock: 0,
          available_stock: 0,
          reorder_level: product.reorder_level,
          alert_type: 'out_of_stock',
          severity: 'error',
        });
        continue;
      }

      // Check each warehouse's stock
      for (const stockLevel of stockLevels) {
        const totalStock = stockLevel.quantity || 0;
        const reservedStock = stockLevel.reserved_quantity || 0;
        const availableStock = totalStock - reservedStock;
        const warehouseName = stockLevel.warehouses?.name || 'Unknown Warehouse';

        // Determine alert type
        let alertType: 'low_stock' | 'out_of_stock' | 'critical' = 'low_stock';
        let severity: 'warning' | 'error' = 'warning';

        if (availableStock <= 0) {
          alertType = 'out_of_stock';
          severity = 'error';
        } else if (availableStock <= product.reorder_level * 0.5) {
          // Critical - below 50% of reorder level
          alertType = 'critical';
          severity = 'error';
        } else if (availableStock <= product.reorder_level) {
          alertType = 'low_stock';
          severity = 'warning';
        } else {
          // Stock is above reorder level, skip
          continue;
        }

        // Filter by alert type if specified
        if (alertTypeFilter && alertTypeFilter !== 'all') {
          if (alertType !== alertTypeFilter) {
            continue; // Skip if doesn't match filter
          }
        }

        alerts.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          warehouse_id: stockLevel.warehouse_id,
          warehouse_name: warehouseName,
          current_stock: totalStock,
          available_stock: availableStock,
          reorder_level: product.reorder_level,
          alert_type: alertType,
          severity: severity,
        });
      }
    }

    // Sort by severity (error first) then by stock level
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'error' ? -1 : 1;
      }
      return a.available_stock - b.available_stock;
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('Get stock alerts error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

