import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate, dbInsert, dbInsertMany, supabase } from '@/lib/supabase';
import { updateStockLevel, validateStockAvailability } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageDeliveries');
    if (permissionCheck instanceof NextResponse) return permissionCheck;
    const { user } = permissionCheck;
    const userId = user.id;

    const body = await request.json();
    const { customer_name, warehouse_id, notes, items, status } = body;

    const order = await dbGet('delivery_orders', { id: params.id }) as any;
    if (!order || !order.id) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }

    if (order.status === 'done' && status !== 'done') {
      return NextResponse.json({ error: 'Cannot edit validated delivery order' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (customer_name !== undefined) updates.customer_name = customer_name;
    if (warehouse_id !== undefined) updates.warehouse_id = warehouse_id;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'done' && order.status !== 'done') {
        updates.validated_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await dbUpdate('delivery_orders', { id: params.id }, updates);
    }

    if (items && Array.isArray(items)) {
      // Determine which warehouse to check (use updated warehouse_id if changed, otherwise original)
      const checkWarehouseId = warehouse_id !== undefined ? warehouse_id : order.warehouse_id;

      // Validate stock availability before making changes
      try {
        await validateStockAvailability(items, checkWarehouseId);
      } catch (error: any) {
        return NextResponse.json({ 
          error: error.message || 'Insufficient stock available' 
        }, { status: 400 });
      }

      // Unreserve old items
      const { data: oldItems } = await supabase
        .from('delivery_order_items')
        .select('*')
        .eq('delivery_order_id', params.id);

      if (oldItems) {
        for (const oldItem of oldItems) {
          const stock = await dbGet('stock_levels', { product_id: oldItem.product_id, warehouse_id: order.warehouse_id }) as any;
          if (stock && stock.id) {
            await dbUpdate(
              'stock_levels',
              { id: stock.id },
              { reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - oldItem.quantity) }
            );
          }
        }
      }

      // Delete existing items
      await supabase.from('delivery_order_items').delete().eq('delivery_order_id', params.id);

      // Insert new items and reserve stock
      const orderItems = items.map((item: any) => ({
        delivery_order_id: params.id,
        product_id: item.product_id,
        quantity: item.quantity,
        notes: item.notes || null
      }));

      await dbInsertMany('delivery_order_items', orderItems);

      // Reserve stock for new items (use the warehouse we validated against)
      for (const item of items) {
        const stock = await dbGet('stock_levels', { product_id: item.product_id, warehouse_id: checkWarehouseId }) as any;
        if (stock && stock.id) {
          await dbUpdate(
            'stock_levels',
            { id: stock.id },
            { reserved_quantity: (stock.reserved_quantity || 0) + item.quantity }
          );
        } else {
          // Create stock level entry if it doesn't exist (shouldn't happen after validation, but safety check)
          await dbInsert('stock_levels', {
            product_id: item.product_id,
            warehouse_id: checkWarehouseId,
            quantity: 0,
            reserved_quantity: item.quantity
          });
        }
      }
    }

    // If validating (status = done), update stock and unreserve
    if (status === 'done' && order.status !== 'done') {
      const { data: orderItems } = await supabase
        .from('delivery_order_items')
        .select('*')
        .eq('delivery_order_id', params.id);
      
      if (orderItems && orderItems.length > 0) {
        // Final stock availability check before validating (in case stock changed)
        try {
          const itemsToCheck = orderItems.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }));
          await validateStockAvailability(itemsToCheck, order.warehouse_id);
        } catch (error: any) {
          return NextResponse.json({ 
            error: `Cannot validate delivery order - insufficient stock:\n${error.message}` 
          }, { status: 400 });
        }

        for (const item of orderItems) {
          // Unreserve first
          const stock = await dbGet('stock_levels', { product_id: item.product_id, warehouse_id: order.warehouse_id }) as any;
          if (stock && stock.id) {
            await dbUpdate(
              'stock_levels',
              { id: stock.id },
              { reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - item.quantity) }
            );
          }

          // Then decrease stock
          await updateStockLevel(
            item.product_id,
            order.warehouse_id,
            -item.quantity,
            'delivery',
            params.id,
            order.order_number,
            userId,
            `Delivery: ${order.order_number}`
          );
        }
      }
    }

    const updatedOrder = await dbGet('delivery_orders', { id: params.id }) as any;
    const { data: orderItems } = await supabase
      .from('delivery_order_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('delivery_order_id', params.id);

    return NextResponse.json({ ...updatedOrder, items: orderItems || [] });
  } catch (error) {
    console.error('Update delivery order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}