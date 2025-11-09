import React, { useEffect } from 'react';

export default function Toast({ id, type = 'info', message, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(t);
  }, [id, onClose]);

  const color = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`rounded shadow p-3 text-white ${color} mb-2`} role="status">
      <div className="flex justify-between items-center">
        <div>{message}</div>
        <button onClick={() => onClose(id)} aria-label="close">✕</button>
      </div>
    </div>
  );
}
