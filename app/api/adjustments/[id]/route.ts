import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate, dbInsertMany, supabase } from '@/lib/supabase';
import { updateStockLevel } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageAdjustments');
    if (permissionCheck instanceof NextResponse) return permissionCheck;
    const { user } = permissionCheck;
    const userId = user.id;

    const body = await request.json();
    const { reason, notes, items, status } = body;

    const adjustment = await dbGet('stock_adjustments', { id: params.id }) as any;
    if (!adjustment || !adjustment.id) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    if (adjustment.status === 'done' && status !== 'done') {
      return NextResponse.json({ error: 'Cannot edit validated adjustment' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (reason !== undefined) updates.reason = reason;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'done' && adjustment.status !== 'done') {
        updates.validated_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await dbUpdate('stock_adjustments', { id: params.id }, updates);
    }

    if (items && Array.isArray(items)) {
      await supabase.from('adjustment_items').delete().eq('adjustment_id', params.id);

      const adjustmentItems = await Promise.all(items.map(async (item: any) => {
        const stock = await dbGet('stock_levels', { product_id: item.product_id, warehouse_id: adjustment.warehouse_id }) as any;
        const recordedQuantity = stock?.quantity || 0;
        const countedQuantity = item.counted_quantity;
        const difference = countedQuantity - recordedQuantity;

        return {
          adjustment_id: params.id,
          product_id: item.product_id,
          recorded_quantity: recordedQuantity,
          counted_quantity: countedQuantity,
          difference,
          notes: item.notes || null
        };
      }));

      await dbInsertMany('adjustment_items', adjustmentItems);
    }

    // If validating (status = done), update stock
    if (status === 'done' && adjustment.status !== 'done') {
      const { data: adjustmentItems } = await supabase
        .from('adjustment_items')
        .select('*')
        .eq('adjustment_id', params.id);
      
      if (adjustmentItems) {
        for (const item of adjustmentItems) {
          await updateStockLevel(
            item.product_id,
            adjustment.warehouse_id,
            item.difference,
            'adjustment',
            params.id,
            adjustment.adjustment_number,
            userId,
            `Adjustment: ${adjustment.adjustment_number} - ${adjustment.reason || 'Stock count'}`
          );
        }
      }
    }

    const updatedAdjustment = await dbGet('stock_adjustments', { id: params.id }) as any;
    const { data: adjustmentItems } = await supabase
      .from('adjustment_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('adjustment_id', params.id);

    return NextResponse.json({ ...updatedAdjustment, items: adjustmentItems || [] });
  } catch (error) {
    console.error('Update adjustment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}