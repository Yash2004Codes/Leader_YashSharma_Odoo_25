import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbInsert, dbInsertMany, supabase } from '@/lib/supabase';
import { generateId, generateReceiptNumber, updateStockLevel } from '@/lib/utils';
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
      .from('receipts')
      .select(`
        *,
        warehouses(name),
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data: receipts, error } = await query;
    if (error) throw error;

    // Get items for each receipt
    const receiptsWithItems = await Promise.all((receipts || []).map(async (receipt: any) => {
      const { data: items } = await supabase
        .from('receipt_items')
        .select(`
          *,
          products(name, sku, unit_of_measure)
        `)
        .eq('receipt_id', receipt.id);

      return {
        ...receipt,
        warehouse_name: receipt.warehouses?.name,
        created_by_name: receipt.users?.name,
        items: items || []
      };
    }));

    return NextResponse.json(receiptsWithItems);
  } catch (error) {
    console.error('Get receipts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supplier_name, warehouse_id, notes, items } = await request.json();

    if (!warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Warehouse and items are required' }, { status: 400 });
    }

    const receiptId = generateId();
    const receiptNumber = generateReceiptNumber();

    const receipt = await dbInsert('receipts', {
      id: receiptId,
      receipt_number: receiptNumber,
      supplier_name: supplier_name || null,
      warehouse_id,
      notes: notes || null,
      created_by: userId,
      status: 'draft'
    });

    // Insert items
    const receiptItems = items.map((item: any) => ({
      receipt_id: receiptId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price || null,
      notes: item.notes || null
    }));

    await dbInsertMany('receipt_items', receiptItems);

    // Get items with product details
    const { data: itemsWithDetails } = await supabase
      .from('receipt_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('receipt_id', receiptId);

    return NextResponse.json({ ...receipt, items: itemsWithDetails || [] }, { status: 201 });
  } catch (error) {
    console.error('Create receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}