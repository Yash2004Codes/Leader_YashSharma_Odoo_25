'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toastDuration);

    return () => clearTimeout(timer);
  }, [toastDuration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-[500px] ${bgColors[type]} animate-in slide-in-from-top-5 fade-in-0`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <p className={`font-medium flex-1 ${textColors[type]} break-words`}>{message}</p>
      <button
        onClick={onClose}
        className={`${textColors[type]} hover:opacity-70 transition-opacity flex-shrink-0 mt-0.5`}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

