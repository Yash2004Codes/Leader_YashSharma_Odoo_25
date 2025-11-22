'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Sidebar } from './Sidebar';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { useStockNotifications } from '@/lib/hooks/useStockNotifications';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toast = useToast();

  // Enable stock notifications when user is authenticated
  useStockNotifications({
    enabled: isAuthenticated(),
    checkInterval: 30000, // Check every 30 seconds
    showToasts: true,
    minSeverity: 'warning', // Show both warnings and errors
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return null;
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
