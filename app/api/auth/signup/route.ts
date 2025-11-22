import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbInsert } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['inventory_manager', 'warehouse_staff'];
    const userRole = role && validRoles.includes(role) ? role : 'warehouse_staff';

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await dbGet('users', { email }) as any;
    if (existingUser && existingUser.id) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateId();

    // Insert user
    const user = await dbInsert('users', {
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      role: userRole
    });

    // Generate token
    const token = generateToken({ userId, email });

    return NextResponse.json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}