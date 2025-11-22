'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { canAccessRoute } from '@/lib/roles';
import { Sidebar } from './Sidebar';
import { Chatbot } from '@/components/chatbot/Chatbot';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check route access based on role
    if (user && pathname) {
      if (!canAccessRoute(user.role, pathname)) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, router, pathname, user]);

  if (!isAuthenticated() || !user) {
    return null;
  }

  // Show access denied if user doesn't have permission for this route
  if (pathname && !canAccessRoute(user.role, pathname)) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                  <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Chatbot />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
