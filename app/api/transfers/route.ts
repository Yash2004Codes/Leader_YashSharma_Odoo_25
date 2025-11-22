import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert, dbInsertMany, supabase } from '@/lib/supabase';
import { generateId, generateTransferNumber, updateStockLevel, validateStockAvailability } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageTransfers');
    if (permissionCheck instanceof NextResponse) return permissionCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouse_id');

    let query = supabase
      .from('internal_transfers')
      .select(`
        *,
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (warehouseId) {
      query = query.or(`from_warehouse_id.eq.${warehouseId},to_warehouse_id.eq.${warehouseId}`);
    }

    const { data: transfers, error } = await query;
    if (error) throw error;

    const transfersWithItems = await Promise.all((transfers || []).map(async (transfer: any) => {
      const { data: items } = await supabase
        .from('transfer_items')
        .select(`
          *,
          products(name, sku, unit_of_measure)
        `)
        .eq('transfer_id', transfer.id);

      // Get warehouse names separately
      const [fromWarehouse, toWarehouse] = await Promise.all([
        dbGet('warehouses', { id: transfer.from_warehouse_id }),
        dbGet('warehouses', { id: transfer.to_warehouse_id })
      ]);
      
      return {
        ...transfer,
        from_warehouse_name: fromWarehouse?.name || 'Unknown',
        to_warehouse_name: toWarehouse?.name || 'Unknown',
        created_by_name: transfer.users?.name,
        items: items || []
      };
    }));

    return NextResponse.json(transfersWithItems);
  } catch (error) {
    console.error('Get transfers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'canManageTransfers');
    if (permissionCheck instanceof NextResponse) return permissionCheck;
    const { user } = permissionCheck;
    const userId = user.id;

    const { from_warehouse_id, to_warehouse_id, notes, items } = await request.json();

    if (!from_warehouse_id || !to_warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Warehouses and items are required' }, { status: 400 });
    }

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json({ error: 'Source and destination warehouses must be different' }, { status: 400 });
    }

    // Check stock availability in source warehouse with detailed validation
    try {
      await validateStockAvailability(items, from_warehouse_id);
    } catch (error: any) {
      return NextResponse.json({ 
        error: `Insufficient stock in source warehouse:\n${error.message}` 
      }, { status: 400 });
    }

    const transferId = generateId();
    const transferNumber = generateTransferNumber();

    const transfer = await dbInsert('internal_transfers', {
      id: transferId,
      transfer_number: transferNumber,
      from_warehouse_id,
      to_warehouse_id,
      notes: notes || null,
      created_by: userId,
      status: 'draft'
    });

    const transferItems = items.map((item: any) => ({
      transfer_id: transferId,
      product_id: item.product_id,
      quantity: item.quantity,
      notes: item.notes || null
    }));

    await dbInsertMany('transfer_items', transferItems);

    const { data: itemsWithDetails } = await supabase
      .from('transfer_items')
      .select(`
        *,
        products(name, sku)
      `)
      .eq('transfer_id', transferId);

    return NextResponse.json({ ...transfer, items: itemsWithDetails || [] }, { status: 201 });
  } catch (error) {
    console.error('Create transfer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}