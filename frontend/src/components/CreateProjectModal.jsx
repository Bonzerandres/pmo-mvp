import React, { useEffect, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { projectsAPI } from '../services/api';

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Infraestructura');
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [grantId, setGrantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstRef.current?.focus(), 50);
    } else {
      setName(''); setCategory('Infraestructura'); setDescription('');
      setAssignedUsers([]); setStartDate(''); setEndDate(''); setGrantId('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const validate = () => {
    if (!name || name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
    if (!category) return 'La categoría es obligatoria';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true); setError(null);
    try {
      const payload = { name: name.trim(), category, description: description.trim() };
      await projectsAPI.create(payload);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error creando proyecto';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8 transform transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Crear Proyecto</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Nombre <span className="text-danger-500">*</span></label>
            <input ref={firstRef} value={name} onChange={e => setName(e.target.value)} maxLength={100}
              placeholder="Ej: Implementación ERP" className="form-input mt-2 w-full" />
            <div className="text-xs text-neutral-500 mt-1">{name.length}/100</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Categoría <span className="text-danger-500">*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="form-input mt-2 w-full">
              <option>Infraestructura</option>
              <option>Software</option>
              <option>Consultoría</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500}
              placeholder="Descripción detallada del proyecto..." className="form-input mt-2 w-full h-28" />
            <div className="text-xs text-neutral-500 mt-1">{description.length}/500</div>
          </div>

          {error && <div className="text-sm text-danger-600">{error}</div>}

          <div className="flex items-center justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-success-600 text-white rounded-md flex items-center">
              {submitting ? <svg className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
