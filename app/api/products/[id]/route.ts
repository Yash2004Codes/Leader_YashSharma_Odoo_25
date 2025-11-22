import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate, supabase } from '@/lib/supabase';
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

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name)
      `)
      .eq('id', params.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { data: stockLevels } = await supabase
      .from('stock_levels')
      .select(`
        *,
        warehouses(name, code)
      `)
      .eq('product_id', params.id);

    return NextResponse.json({ 
      ...product, 
      category_name: product.product_categories?.name,
      stock_levels: stockLevels || [] 
    });
  } catch (error) {
    console.error('Get product error:', error);
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
    const { name, category_id, unit_of_measure, description, reorder_level, reorder_quantity } = body;

    const product = await dbGet('products', { id: params.id }) as any;
    if (!product || !product.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (category_id !== undefined) updates.category_id = category_id;
    if (unit_of_measure !== undefined) updates.unit_of_measure = unit_of_measure;
    if (description !== undefined) updates.description = description;
    if (reorder_level !== undefined) updates.reorder_level = reorder_level;
    if (reorder_quantity !== undefined) updates.reorder_quantity = reorder_quantity;

    const updatedProduct = await dbUpdate('products', { id: params.id }, updates);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}