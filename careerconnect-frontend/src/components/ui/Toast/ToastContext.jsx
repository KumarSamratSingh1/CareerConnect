import { useState, useCallback } from 'react';
import { ToastContext } from './ToastContextDef';
import { ToastContainer } from './ToastContainer';

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const newToast = { id, type, title, message, duration };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Limit to 5 simultaneous toasts
    return id;
  }, []);

  const toast = {
    success: (message, options = {}) =>
      addToast({ type: 'success', message, title: options.title, duration: options.duration }),
    error: (message, options = {}) =>
      addToast({ type: 'error', message, title: options.title || 'Error', duration: options.duration || 5000 }),
    info: (message, options = {}) =>
      addToast({ type: 'info', message, title: options.title, duration: options.duration }),
    warning: (message, options = {}) =>
      addToast({ type: 'warning', message, title: options.title || 'Notice', duration: options.duration }),
    custom: addToast,
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
