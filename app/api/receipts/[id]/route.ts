import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate, dbDelete, dbInsertMany, supabase } from '@/lib/supabase';
import { generateId, updateStockLevel } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select(`
        *,
        warehouses(name),
        users(name)
      `)
      .eq('id', params.id)
      .single();

    if (error || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const { data: items } = await supabase
      .from('receipt_items')
      .select(`
        *,
        products(name, sku, unit_of_measure)
      `)
      .eq('receipt_id', params.id);

    return NextResponse.json({ 
      ...receipt, 
      warehouse_name: receipt.warehouses?.name,
      created_by_name: receipt.users?.name,
      items: items || [] 
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { supplier_name, warehouse_id, notes, items, status } = body;

    const receipt = await dbGet('receipts', { id: params.id }) as any;
    if (!receipt || !receipt.id) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.status === 'done' && status !== 'done') {
      return NextResponse.json({ error: 'Cannot edit validated receipt' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (supplier_name !== undefined) updates.supplier_name = supplier_name;
    if (warehouse_id !== undefined) updates.warehouse_id = warehouse_id;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'done' && receipt.status !== 'done') {
        updates.validated_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await dbUpdate('receipts', { id: params.id }, updates);
    }

    if (items && Array.isArray(items)) {
      // Delete existing items
      await supabase.from('receipt_items').delete().eq('receipt_id', params.id);

      // Insert new items
      const receiptItems = items.map((item: any) => ({
        receipt_id: params.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price || null,
        notes: item.notes || null
      }));

      await dbInsertMany('receipt_items', receiptItems);
    }

    // If validating (status = done), update stock
    if (status === 'done' && receipt.status !== 'done') {
      const { data: receiptItems } = await supabase
        .from('receipt_items')
        .select('*')
        .eq('receipt_id', params.id);
      
      if (receiptItems) {
        for (const item of receiptItems) {
          await updateStockLevel(
            item.product_id,
            receipt.warehouse_id,
            item.quantity,
            'receipt',
            params.id,
            receipt.receipt_number,
            userId,
            `Receipt: ${receipt.receipt_number}`
          );
        }
      }
    }

    const updatedReceipt = await dbGet('receipts', { id: params.id }) as any;
    const { data: receiptItems } = await supabase
      .from('receipt_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('receipt_id', params.id);

    return NextResponse.json({ ...updatedReceipt, items: receiptItems || [] });
  } catch (error) {
    console.error('Update receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}