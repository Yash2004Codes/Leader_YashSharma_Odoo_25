import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbUpdate } from '@/lib/supabase';
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

    const warehouse = await dbGet('warehouses', { id: params.id }) as any;
    if (!warehouse || !warehouse.id) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Get warehouse error:', error);
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
    const { name, code, address, is_active } = body;

    const warehouse = await dbGet('warehouses', { id: params.id }) as any;
    if (!warehouse || !warehouse.id) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (address !== undefined) updates.address = address;
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;

    const updatedWarehouse = await dbUpdate('warehouses', { id: params.id }, updates);
    return NextResponse.json(updatedWarehouse);
  } catch (error) {
    console.error('Update warehouse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}