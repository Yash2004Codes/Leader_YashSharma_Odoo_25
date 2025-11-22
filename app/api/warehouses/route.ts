import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbInsert } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouses = await dbAll('warehouses', { is_active: 1 }, '*', 'name ASC');
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, address } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const existing = await dbGet('warehouses', { code }) as any;
    if (existing && existing.id) {
      return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 400 });
    }

    const warehouse = await dbInsert('warehouses', {
      name,
      code,
      address: address || null,
      is_active: 1
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Create warehouse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}