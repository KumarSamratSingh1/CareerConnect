import { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from './ToastContainer';

const ToastContext = createContext(null);

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

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.error('[Toast Error]:', msg),
      info: (msg) => console.info('[Toast Info]:', msg),
      warning: (msg) => console.warn('[Toast Warning]:', msg),
      dismiss: () => {},
    };
  }
  return context;
};

export default ToastProvider;

