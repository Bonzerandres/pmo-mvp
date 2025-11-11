import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, projectName, taskCount = 0, isDeleting = false }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !isDeleting) onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      // focus cancel for accessibility
      setTimeout(() => cancelRef.current && cancelRef.current.focus(), 60);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-danger flex items-center justify-center">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 modal-fade-enter-active">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-danger-600" />
        </div>
        <h3 id="delete-title" className="text-2xl font-bold text-neutral-900 text-center mb-2">¿Eliminar Proyecto?</h3>
        <p className="text-sm text-neutral-600 text-center mb-4">Esta acción es irreversible y eliminará todas las tareas asociadas al proyecto.</p>

        <div className="bg-neutral-50 p-4 rounded-md mb-4 text-center">
          <div className="font-semibold text-neutral-900">{projectName}</div>
          <div className="text-sm text-neutral-600">Este proyecto tiene <span className="font-medium text-danger-600">{taskCount}</span> tarea(s) que también serán eliminadas.</div>
        </div>

        <div className="flex space-x-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
          </button>
        </div>
      </div>
    </div>
  );
}
