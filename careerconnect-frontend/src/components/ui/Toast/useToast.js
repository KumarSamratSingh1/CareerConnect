import { useContext } from 'react';
import { ToastContext } from './ToastContextDef';

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

export default useToast;
