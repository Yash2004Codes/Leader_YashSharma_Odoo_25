import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbInsert, dbSearch, supabase } from '@/lib/supabase';
import { generateId, updateStockLevel } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');

    // Build query with joins - use left join so products without stock still show
    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        stock_levels(warehouse_id, quantity, reserved_quantity, warehouses(name, code))
      `)
      .eq('is_active', 1);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Filter by warehouse if specified (after fetching to handle products without stock)
    let filteredProducts = products || [];
    if (warehouseId) {
      filteredProducts = filteredProducts.filter((p: any) => {
        const stockLevels = p.stock_levels || [];
        return stockLevels.some((sl: any) => sl.warehouse_id === warehouseId);
      });
    }

    // Process products to calculate totals and add stock info
    const productsWithStock = filteredProducts.map((product: any) => {
      const stockLevels = product.stock_levels || [];
      const totalStock = stockLevels.reduce((sum: number, sl: any) => sum + (sl.quantity || 0), 0);
      const totalReserved = stockLevels.reduce((sum: number, sl: any) => sum + (sl.reserved_quantity || 0), 0);

      const isLowStock = product.reorder_level > 0 && (totalStock - totalReserved) <= product.reorder_level;
      const isOutOfStock = (totalStock - totalReserved) <= 0;

      return {
        ...product,
        category_name: product.product_categories?.name,
        total_stock: totalStock,
        total_reserved: totalReserved,
        stock_levels: stockLevels.map((sl: any) => ({
          warehouse_id: sl.warehouse_id,
          quantity: sl.quantity,
          reserved_quantity: sl.reserved_quantity,
          available: (sl.quantity || 0) - (sl.reserved_quantity || 0),
          warehouse_name: sl.warehouses?.name
        })),
        is_low_stock: isLowStock,
        is_out_of_stock: isOutOfStock
      };
    });

    return NextResponse.json(productsWithStock);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, sku, category_id, unit_of_measure, description, reorder_level, reorder_quantity, initial_stock } = await request.json();

    if (!name || !sku || !unit_of_measure) {
      return NextResponse.json({ error: 'Name, SKU, and unit of measure are required' }, { status: 400 });
    }

    const existing = await dbGet('products', { sku }) as any;
    if (existing && existing.id) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    const product = await dbInsert('products', {
      name,
      sku,
      category_id: category_id || null,
      unit_of_measure,
      description: description || null,
      reorder_level: reorder_level || 0,
      reorder_quantity: reorder_quantity || 0,
      is_active: 1
    });

    // Set initial stock if provided
    if (initial_stock && initial_stock.warehouse_id && initial_stock.quantity) {
      await updateStockLevel(
        product.id,
        initial_stock.warehouse_id,
        initial_stock.quantity,
        'initial_stock',
        product.id,
        'INITIAL',
        userId,
        'Initial stock'
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}