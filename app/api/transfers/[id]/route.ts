import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate, dbInsertMany, supabase } from '@/lib/supabase';
import { updateStockLevel, validateStockAvailability } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { from_warehouse_id, to_warehouse_id, notes, items, status } = body;

    const transfer = await dbGet('internal_transfers', { id: params.id }) as any;
    if (!transfer || !transfer.id) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status === 'done' && status !== 'done') {
      return NextResponse.json({ error: 'Cannot edit validated transfer' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (from_warehouse_id !== undefined) updates.from_warehouse_id = from_warehouse_id;
    if (to_warehouse_id !== undefined) updates.to_warehouse_id = to_warehouse_id;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'done' && transfer.status !== 'done') {
        updates.validated_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await dbUpdate('internal_transfers', { id: params.id }, updates);
    }

    if (items && Array.isArray(items)) {
      // Determine which warehouse to check (use updated from_warehouse_id if changed, otherwise original)
      const checkWarehouseId = from_warehouse_id !== undefined ? from_warehouse_id : transfer.from_warehouse_id;

      // Validate stock availability in source warehouse before making changes
      try {
        await validateStockAvailability(items, checkWarehouseId);
      } catch (error: any) {
        return NextResponse.json({ 
          error: `Insufficient stock in source warehouse:\n${error.message}` 
        }, { status: 400 });
      }

      await supabase.from('transfer_items').delete().eq('transfer_id', params.id);

      const transferItems = items.map((item: any) => ({
        transfer_id: params.id,
        product_id: item.product_id,
        quantity: item.quantity,
        notes: item.notes || null
      }));

      await dbInsertMany('transfer_items', transferItems);
    }

    // If validating (status = done), update stock
    if (status === 'done' && transfer.status !== 'done') {
      const { data: transferItems } = await supabase
        .from('transfer_items')
        .select('*')
        .eq('transfer_id', params.id);
      
      if (transferItems && transferItems.length > 0) {
        // Final stock availability check before validating (in case stock changed)
        // Use updated warehouse IDs if changed, otherwise original
        const sourceWarehouseId = from_warehouse_id !== undefined ? from_warehouse_id : transfer.from_warehouse_id;
        
        try {
          const itemsToCheck = transferItems.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }));
          await validateStockAvailability(itemsToCheck, sourceWarehouseId);
        } catch (error: any) {
          return NextResponse.json({ 
            error: `Cannot validate transfer - insufficient stock in source warehouse:\n${error.message}` 
          }, { status: 400 });
        }

        for (const item of transferItems) {
          // Use updated warehouse IDs if changed, otherwise original
          const finalSourceWarehouseId = from_warehouse_id !== undefined ? from_warehouse_id : transfer.from_warehouse_id;
          const finalDestWarehouseId = to_warehouse_id !== undefined ? to_warehouse_id : transfer.to_warehouse_id;

          // Decrease from source warehouse
          await updateStockLevel(
            item.product_id,
            finalSourceWarehouseId,
            -item.quantity,
            'transfer_out',
            params.id,
            transfer.transfer_number,
            userId,
            `Transfer out: ${transfer.transfer_number}`
          );

          // Increase in destination warehouse
          await updateStockLevel(
            item.product_id,
            finalDestWarehouseId,
            item.quantity,
            'transfer_in',
            params.id,
            transfer.transfer_number,
            userId,
            `Transfer in: ${transfer.transfer_number}`
          );
        }
      }
    }

    const updatedTransfer = await dbGet('internal_transfers', { id: params.id }) as any;
    const { data: transferItems } = await supabase
      .from('transfer_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('transfer_id', params.id);

    return NextResponse.json({ ...updatedTransfer, items: transferItems || [] });
  } catch (error) {
    console.error('Update transfer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}