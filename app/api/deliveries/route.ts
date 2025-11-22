import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert, dbInsertMany, dbUpdate, supabase } from '@/lib/supabase';
import { generateId, generateDeliveryOrderNumber, updateStockLevel, validateStockAvailability } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouse_id');

    let query = supabase
      .from('delivery_orders')
      .select(`
        *,
        warehouses(name),
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data: orders, error } = await query;
    if (error) throw error;

    const ordersWithItems = await Promise.all((orders || []).map(async (order: any) => {
      const { data: items } = await supabase
        .from('delivery_order_items')
        .select(`
          *,
          products(name, sku, unit_of_measure)
        `)
        .eq('delivery_order_id', order.id);

      return {
        ...order,
        warehouse_name: order.warehouses?.name,
        created_by_name: order.users?.name,
        items: items || []
      };
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Get delivery orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_name, warehouse_id, notes, items } = await request.json();

    if (!warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Warehouse and items are required' }, { status: 400 });
    }

    // Check stock availability with detailed validation
    try {
      await validateStockAvailability(items, warehouse_id);
    } catch (error: any) {
      return NextResponse.json({ 
        error: error.message || 'Insufficient stock available' 
      }, { status: 400 });
    }

    const orderId = generateId();
    const orderNumber = generateDeliveryOrderNumber();

    const order = await dbInsert('delivery_orders', {
      id: orderId,
      order_number: orderNumber,
      customer_name: customer_name || null,
      warehouse_id,
      notes: notes || null,
      created_by: userId,
      status: 'draft'
    });

    // Insert items and reserve stock
    const orderItems = items.map((item: any) => ({
      delivery_order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      notes: item.notes || null
    }));

    await dbInsertMany('delivery_order_items', orderItems);

    // Reserve stock
    for (const item of items) {
      const stock = await dbGet('stock_levels', { product_id: item.product_id, warehouse_id }) as any;
      if (stock && stock.id) {
        await dbUpdate(
          'stock_levels',
          { id: stock.id },
          { reserved_quantity: (stock.reserved_quantity || 0) + item.quantity }
        );
      }
    }

    const { data: itemsWithDetails } = await supabase
      .from('delivery_order_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('delivery_order_id', orderId);

    return NextResponse.json({ ...order, items: itemsWithDetails || [] }, { status: 201 });
  } catch (error) {
    console.error('Create delivery order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}