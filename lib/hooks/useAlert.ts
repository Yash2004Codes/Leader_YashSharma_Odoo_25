import { useState, useCallback } from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertState extends AlertOptions {
  isOpen: boolean;
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert({
      isOpen: true,
      title: options.title || getDefaultTitle(options.type || 'info'),
      message: options.message,
      type: options.type || 'info',
      onConfirm: options.onConfirm,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      showCancel: options.showCancel,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const success = useCallback(
    (message: string, options?: Omit<AlertOptions, 'message' | 'type'>) => {
      showAlert({ ...options, message, type: 'success' });
    },
    [showAlert]
  );

  const error = useCallback(
    (message: string, options?: Omit<AlertOptions, 'message' | 'type'>) => {
      showAlert({ ...options, message, type: 'error' });
    },
    [showAlert]
  );

  const warning = useCallback(
    (message: string, options?: Omit<AlertOptions, 'message' | 'type'>) => {
      showAlert({ ...options, message, type: 'warning' });
    },
    [showAlert]
  );

  const info = useCallback(
    (message: string, options?: Omit<AlertOptions, 'message' | 'type'>) => {
      showAlert({ ...options, message, type: 'info' });
    },
    [showAlert]
  );

  return {
    alert,
    showAlert,
    closeAlert,
    success,
    error,
    warning,
    info,
  };
}

function getDefaultTitle(type: AlertType): string {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Information';
  }
}

