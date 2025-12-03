import React, { useState } from 'react';
import { X } from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const STATUS_OPTIONS = [
  { value: null, label: 'Ninguno' },
  { value: 'P', label: 'Programado (P)', color: 'bg-success-100' },
  { value: 'R', label: 'Real (R)', color: 'bg-warning-100' },
  { value: 'RP', label: 'Reprogramado (RP)', color: 'bg-danger-100' }
];

export default function WeeklyProgressModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  taskId,
  taskName,
  year,
  month,
  weekNumber,
  initialData = {}
}) {
  const [formData, setFormData] = useState({
    plannedStatus: initialData.plannedStatus || null,
    actualStatus: initialData.actualStatus || null,
    plannedProgress: initialData.plannedProgress || 0,
    actualProgress: initialData.actualProgress || 0,
    comments: initialData.comments || ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  function validateForm() {
    const newErrors = {};
    if (formData.plannedProgress < 0 || formData.plannedProgress > 100) {
      newErrors.plannedProgress = 'El progreso debe estar entre 0 y 100';
    }
    if (formData.actualProgress < 0 || formData.actualProgress > 100) {
      newErrors.actualProgress = 'El progreso debe estar entre 0 y 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }

  function getWeekDateRange() {
    const startDay = (weekNumber - 1) * 7 + 1;
    const date = new Date(year, month - 1, startDay);
    const endDate = new Date(year, month - 1, Math.min(startDay + 6, new Date(year, month, 0).getDate()));
    
    return `${date.getDate()}-${endDate.getDate()}`;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Actualizar Progreso Semanal
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Semana S{weekNumber} ({getWeekDateRange()}) - {MONTH_NAMES[month - 1]} {year}
            </p>
            <p className="text-sm font-medium text-neutral-800 mt-2">
              {taskName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-500"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Planned Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estado Planificado
              </label>
              <select
                value={formData.plannedStatus || ''}
                onChange={e => handleChange('plannedStatus', e.target.value || null)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                disabled={saving}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actual Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estado Real
              </label>
              <select
                value={formData.actualStatus || ''}
                onChange={e => handleChange('actualStatus', e.target.value || null)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                disabled={saving}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Planned Progress */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Avance Programado (%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.plannedProgress}
                  onChange={e => handleChange('plannedProgress', Number(e.target.value))}
                  className="w-24 rounded-md border border-neutral-300 px-3 py-2"
                  disabled={saving}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.plannedProgress}
                  onChange={e => handleChange('plannedProgress', Number(e.target.value))}
                  className="flex-1"
                  disabled={saving}
                />
              </div>
              {errors.plannedProgress && (
                <p className="mt-1 text-sm text-danger-600">{errors.plannedProgress}</p>
              )}
            </div>

            {/* Actual Progress */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Avance Real (%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.actualProgress}
                  onChange={e => handleChange('actualProgress', Number(e.target.value))}
                  className="w-24 rounded-md border border-neutral-300 px-3 py-2"
                  disabled={saving}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.actualProgress}
                  onChange={e => handleChange('actualProgress', Number(e.target.value))}
                  className="flex-1"
                  disabled={saving}
                />
              </div>
              {errors.actualProgress && (
                <p className="mt-1 text-sm text-danger-600">{errors.actualProgress}</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Comentarios
              </label>
              <textarea
                value={formData.comments}
                onChange={e => handleChange('comments', e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 h-24 resize-none"
                placeholder="Notas sobre el progreso de esta semana..."
                maxLength={500}
                disabled={saving}
              />
              <p className="mt-1 text-sm text-neutral-500">
                {formData.comments.length}/500 caracteres
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-md border border-neutral-300"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}