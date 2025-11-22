'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  position?: 'center' | 'right';
  scrollable?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  position = 'center',
  scrollable = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    right: 'items-start justify-end',
  };

  const modalPosition = position === 'right' 
    ? { marginTop: '1rem', marginRight: '1rem', maxWidth: '400px' }
    : {};

  return (
    <div
      className={`fixed inset-0 z-50 flex ${positionClasses[position]} p-4 bg-black bg-opacity-50 animate-in fade-in-0`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} animate-in ${position === 'center' ? 'slide-in-from-bottom-2' : 'slide-in-from-right'} fade-in-0 max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={modalPosition}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className={`p-6 ${scrollable ? 'overflow-y-auto flex-1' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}: AlertModalProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const typeStyles = {
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    error: {
      icon: '❌',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
  };

  const style = typeStyles[type];

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-right fade-in-0"
      style={{ maxWidth: '400px', zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center text-xl`}>
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-700 leading-relaxed mb-4 break-words">{message}</p>
          <div className="flex justify-end gap-3">
            {showCancel && (
              <Button variant="outline" onClick={onClose} size="sm">
                {cancelText}
              </Button>
            )}
            <Button onClick={handleConfirm} className={style.button} size="sm">
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

