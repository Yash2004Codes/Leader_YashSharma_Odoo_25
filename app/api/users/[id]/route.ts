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

    // Users can only view their own profile
    if (userId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await dbGet('users', { id: params.id }, 'id, email, name, role, created_at') as any;
    if (!user || !user.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
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

    // Users can only update their own profile
    if (userId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email } = body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await dbGet('users', { email }, 'id') as any;
      if (existingUser && existingUser.id && existingUser.id !== params.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const updatedUser = await dbUpdate('users', { id: params.id }, updates);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

