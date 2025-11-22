import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const warehouseId = searchParams.get('warehouse_id');
    const transactionType = searchParams.get('transaction_type');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('stock_ledger')
      .select(`
        *,
        products(name, sku),
        warehouses(name),
        users(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) query = query.eq('product_id', productId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);
    if (transactionType) query = query.eq('transaction_type', transactionType);

    const { data: history, error } = await query;
    if (error) throw error;

    const formattedHistory = (history || []).map((entry: any) => ({
      ...entry,
      product_name: entry.products?.name,
      sku: entry.products?.sku,
      warehouse_name: entry.warehouses?.name,
      created_by_name: entry.users?.name
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Get move history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}