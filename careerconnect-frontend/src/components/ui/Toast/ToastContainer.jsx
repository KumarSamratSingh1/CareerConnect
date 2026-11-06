import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const ToastItem = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;
  const startTimeRef = useRef(null);
  const isPausedRef = useRef(false);

  const IconComponent = TOAST_ICONS[toast.type] || Info;

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 200);
  }, [onClose, toast.id]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const updateInterval = 50;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        handleClose();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [duration, handleClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast toast--${toast.type} ${isExiting ? 'toast--exiting' : ''}`}
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
        startTimeRef.current = Date.now() - (1 - progress / 100) * duration;
      }}
    >
      <div className="toast__icon">
        <IconComponent size={18} />
      </div>
      <div className="toast__content">
        {toast.title && <div className="toast__title">{toast.title}</div>}
        <div className="toast__message">{toast.message}</div>
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={handleClose}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
      <div className="toast__progress" style={{ width: `${progress}%` }} />
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;

