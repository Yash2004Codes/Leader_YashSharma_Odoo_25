import { NextRequest, NextResponse } from 'next/server';
import { dbCount, dbAll, supabase } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');
    const documentType = searchParams.get('document_type');
    const status = searchParams.get('status');

    // Total Products
    const totalProducts = await dbCount('products', { is_active: 1 });

    // Low Stock Items - get all products with stock levels and calculate
    let productsQuery = supabase
      .from('products')
      .select(`
        id,
        reorder_level,
        stock_levels(quantity, reserved_quantity, warehouse_id)
      `)
      .eq('is_active', 1)
      .gt('reorder_level', 0);

    if (warehouseId) {
      productsQuery = productsQuery.eq('stock_levels.warehouse_id', warehouseId);
    }

    const { data: products } = await productsQuery;
    const lowStockCount = (products || []).filter((p: any) => {
      const totalStock = (p.stock_levels || []).reduce((sum: number, sl: any) => sum + (sl.quantity || 0) - (sl.reserved_quantity || 0), 0);
      return totalStock <= p.reorder_level;
    }).length;

    // Out of Stock
    const outOfStockCount = (products || []).filter((p: any) => {
      const totalStock = (p.stock_levels || []).reduce((sum: number, sl: any) => sum + (sl.quantity || 0) - (sl.reserved_quantity || 0), 0);
      return totalStock <= 0;
    }).length;

    // Pending Receipts
    const receiptsFilters: any = { status: ['draft', 'waiting', 'ready'] };
    if (warehouseId) receiptsFilters.warehouse_id = warehouseId;
    const pendingReceipts = await dbCount('receipts', receiptsFilters);

    // Pending Deliveries
    const deliveriesFilters: any = { status: ['draft', 'waiting', 'ready'] };
    if (warehouseId) deliveriesFilters.warehouse_id = warehouseId;
    const pendingDeliveries = await dbCount('delivery_orders', deliveriesFilters);

    // Scheduled Transfers
    const transfersFilters: any = { status: ['draft', 'waiting', 'ready'] };
    let transfersCount = 0;
    if (warehouseId) {
      const { count } = await supabase
        .from('internal_transfers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'waiting', 'ready'])
        .or(`from_warehouse_id.eq.${warehouseId},to_warehouse_id.eq.${warehouseId}`);
      transfersCount = count || 0;
    } else {
      transfersCount = await dbCount('internal_transfers', transfersFilters);
    }

    // Recent transactions
    const recentTransactions: any[] = [];
    const limit = 20;

    if (!documentType || documentType === 'all' || documentType === 'receipts') {
      let receiptsQuery = supabase
        .from('receipts')
        .select('receipt_number, status, created_at, warehouse_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status && status !== 'all') receiptsQuery = receiptsQuery.eq('status', status);
      if (warehouseId) receiptsQuery = receiptsQuery.eq('warehouse_id', warehouseId);
      
      const { data: receipts } = await receiptsQuery;
      if (receipts) {
        recentTransactions.push(...receipts.map((r: any) => ({
          type: 'receipt',
          reference: r.receipt_number,
          status: r.status,
          created_at: r.created_at,
          warehouse_id: r.warehouse_id
        })));
      }
    }

    if (!documentType || documentType === 'all' || documentType === 'deliveries') {
      let deliveriesQuery = supabase
        .from('delivery_orders')
        .select('order_number, status, created_at, warehouse_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status && status !== 'all') deliveriesQuery = deliveriesQuery.eq('status', status);
      if (warehouseId) deliveriesQuery = deliveriesQuery.eq('warehouse_id', warehouseId);
      
      const { data: deliveries } = await deliveriesQuery;
      if (deliveries) {
        recentTransactions.push(...deliveries.map((d: any) => ({
          type: 'delivery',
          reference: d.order_number,
          status: d.status,
          created_at: d.created_at,
          warehouse_id: d.warehouse_id
        })));
      }
    }

    if (!documentType || documentType === 'all' || documentType === 'transfers') {
      let transfersQuery = supabase
        .from('internal_transfers')
        .select('transfer_number, status, created_at, from_warehouse_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status && status !== 'all') transfersQuery = transfersQuery.eq('status', status);
      if (warehouseId) {
        transfersQuery = transfersQuery.or(`from_warehouse_id.eq.${warehouseId},to_warehouse_id.eq.${warehouseId}`);
      }
      
      const { data: transfers } = await transfersQuery;
      if (transfers) {
        recentTransactions.push(...transfers.map((t: any) => ({
          type: 'transfer',
          reference: t.transfer_number,
          status: t.status,
          created_at: t.created_at,
          warehouse_id: t.from_warehouse_id
        })));
      }
    }

    if (!documentType || documentType === 'all' || documentType === 'adjustments') {
      let adjustmentsQuery = supabase
        .from('stock_adjustments')
        .select('adjustment_number, status, created_at, warehouse_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status && status !== 'all') adjustmentsQuery = adjustmentsQuery.eq('status', status);
      if (warehouseId) adjustmentsQuery = adjustmentsQuery.eq('warehouse_id', warehouseId);
      
      const { data: adjustments } = await adjustmentsQuery;
      if (adjustments) {
        recentTransactions.push(...adjustments.map((a: any) => ({
          type: 'adjustment',
          reference: a.adjustment_number,
          status: a.status,
          created_at: a.created_at,
          warehouse_id: a.warehouse_id
        })));
      }
    }

    // Sort by created_at and limit
    recentTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limitedTransactions = recentTransactions.slice(0, limit);

    return NextResponse.json({
      kpis: {
        totalProducts,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        pendingReceipts,
        pendingDeliveries: pendingDeliveries,
        scheduledTransfers: transfersCount,
      },
      recentTransactions: limitedTransactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}