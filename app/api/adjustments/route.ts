import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert, dbInsertMany, supabase } from '@/lib/supabase';
import { generateId, generateAdjustmentNumber, updateStockLevel } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageAdjustments');
    if (permissionCheck instanceof NextResponse) return permissionCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouse_id');

    let query = supabase
      .from('stock_adjustments')
      .select(`
        *,
        warehouses(name),
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data: adjustments, error } = await query;
    if (error) throw error;

    const adjustmentsWithItems = await Promise.all((adjustments || []).map(async (adjustment: any) => {
      const { data: items } = await supabase
        .from('adjustment_items')
        .select(`
          *,
          products(name, sku, unit_of_measure)
        `)
        .eq('adjustment_id', adjustment.id);

      return {
        ...adjustment,
        warehouse_name: adjustment.warehouses?.name,
        created_by_name: adjustment.users?.name,
        items: items || []
      };
    }));

    return NextResponse.json(adjustmentsWithItems);
  } catch (error) {
    console.error('Get adjustments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageAdjustments');
    if (permissionCheck instanceof NextResponse) return permissionCheck;
    const { user } = permissionCheck;
    const userId = user.id;

    const { warehouse_id, reason, notes, items } = await request.json();

    if (!warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Warehouse and items are required' }, { status: 400 });
    }

    const adjustmentId = generateId();
    const adjustmentNumber = generateAdjustmentNumber();

    const adjustment = await dbInsert('stock_adjustments', {
      id: adjustmentId,
      adjustment_number: adjustmentNumber,
      warehouse_id,
      reason: reason || null,
      notes: notes || null,
      created_by: userId,
      status: 'draft'
    });

    // Get current stock and create adjustment items
    const adjustmentItems = await Promise.all(items.map(async (item: any) => {
      const stock = await dbGet('stock_levels', { product_id: item.product_id, warehouse_id }) as any;
      const recordedQuantity = stock?.quantity || 0;
      const countedQuantity = item.counted_quantity;
      const difference = countedQuantity - recordedQuantity;

      return {
        adjustment_id: adjustmentId,
        product_id: item.product_id,
        recorded_quantity: recordedQuantity,
        counted_quantity: countedQuantity,
        difference,
        notes: item.notes || null
      };
    }));

    await dbInsertMany('adjustment_items', adjustmentItems);

    const { data: itemsWithDetails } = await supabase
      .from('adjustment_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('adjustment_id', adjustmentId);

    return NextResponse.json({ ...adjustment, items: itemsWithDetails || [] }, { status: 201 });
  } catch (error) {
    console.error('Create adjustment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}