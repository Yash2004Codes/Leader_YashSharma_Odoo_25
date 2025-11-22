import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getStockAvailability, checkStockAvailability, getAvailableStock } from '@/lib/utils';
import { dbGet, supabase } from '@/lib/supabase';

/**
 * GET /api/stock/availability
 * Check stock availability for products
 * Query params:
 * - product_id: single product to check
 * - warehouse_id: warehouse to check
 * - quantity: requested quantity (optional)
 * 
 * Or POST with body:
 * - items: [{ product_id, quantity }]
 * - warehouse_id: warehouse to check
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const warehouseId = searchParams.get('warehouse_id');
    const quantity = searchParams.get('quantity');

    if (!productId || !warehouseId) {
      return NextResponse.json({ 
        error: 'product_id and warehouse_id are required' 
      }, { status: 400 });
    }

    const requestedQty = quantity ? parseInt(quantity) : 0;
    const availability = await getStockAvailability(
      productId,
      warehouseId,
      requestedQty
    );

    return NextResponse.json(availability);
  } catch (error: any) {
    console.error('Get stock availability error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * POST /api/stock/availability
 * Check stock availability for multiple items
 * Body: {
 *   items: [{ product_id, quantity }],
 *   warehouse_id: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, warehouse_id } = await request.json();

    if (!warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'warehouse_id and items array are required' 
      }, { status: 400 });
    }

    const checkResult = await checkStockAvailability(items, warehouse_id);

    return NextResponse.json(checkResult);
  } catch (error: any) {
    console.error('Check stock availability error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

