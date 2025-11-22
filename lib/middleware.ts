import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './auth';
import { hasPermission, ROLES } from './roles';

/**
 * Check if user has required permission for an API route
 */
export async function requirePermission(
  request: NextRequest,
  permission: keyof typeof import('./roles').ROLE_PERMISSIONS[typeof ROLES.INVENTORY_MANAGER]
): Promise<{ user: any } | NextResponse> {
  const user = await getUserFromRequest(request);
  
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to perform this action' },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Check if user has one of the required roles
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: any } | NextResponse> {
  const user = await getUserFromRequest(request);
  
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to access this resource' },
      { status: 403 }
    );
  }

  return { user };
}

