import React, { createContext, useContext, useCallback, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, type, message }]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const api = {
    showSuccess: (msg) => show('success', msg),
    showError: (msg) => show('error', msg),
    showInfo: (msg) => show('info', msg),
    showWarning: (msg) => show('warning', msg),
    remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }} aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} type={t.type} message={t.message} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
