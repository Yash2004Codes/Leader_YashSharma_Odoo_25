'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { canAccessRoute } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof typeof import('@/lib/roles').ROLE_PERMISSIONS[typeof import('@/lib/roles').ROLES.INVENTORY_MANAGER];
  route?: string;
}

export function ProtectedRoute({ children, requiredPermission, route }: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (user && route) {
      if (!canAccessRoute(user.role, route)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isAuthenticated, router, route]);

  if (!isAuthenticated() || !user) {
    return null;
  }

  if (route && !canAccessRoute(user.role, route)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

