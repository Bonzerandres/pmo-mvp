import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getById(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId, changes) => {
    if (!user?.canEdit) {
      alert('No tienes permiso para editar este proyecto');
      return;
    }

    // Calculate impact preview
    const task = project.tasks.find(t => t.id === taskId);
    const newActualProgress = changes.actualProgress ?? task.actual_progress;
    const newDelayDays = changes.delayDays ?? task.delay_days;
    
    // Calculate new status
    const deviation = newActualProgress - task.planned_progress;
    let newStatus = 'En Curso';
    if (newActualProgress >= 100) {
      newStatus = 'Completado';
    } else if (deviation <= -30 || newDelayDays > 10) {
      newStatus = 'Crítico';
    } else if (deviation < -10 || newDelayDays > 0) {
      newStatus = 'Retrasado';
    }

    setPendingChanges({ taskId, changes, task, newStatus });
    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    try {
      await projectsAPI.updateTask(id, pendingChanges.taskId, pendingChanges.changes);
      setShowConfirmModal(false);
      setPendingChanges(null);
      await loadProject(); // Reload to get updated status
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al actualizar la tarea');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando proyecto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Proyecto no encontrado</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Volver a proyectos
        </button>
      </div>
    );
  }

  const canEdit = user?.canEdit && (user?.role === 'Admin' || user?.projects?.includes(parseInt(id)));

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-neutral-100 rounded-md transform hover:-translate-y-0.5 transition duration-150"
          aria-label="Volver a proyectos"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-neutral-900">{project.name}</h1>
          <p className="text-neutral-600 mt-1">{project.category}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 hover:shadow-sm">Export</button>
          <button className="px-3 py-2 rounded-md bg-neutral-50 border border-neutral-200 hover:shadow-sm">Share</button>
        </div>
      </div>

      {project.description && (
        <div className="card-elevated p-6">
          <p className="text-neutral-800 leading-relaxed">{project.description}</p>
        </div>
      )}

      <div className="card-elevated overflow-hidden">
        <div className="px-8 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Tareas del Proyecto <span className="text-sm text-neutral-600 ml-2">({project.tasks?.length || 0})</span></h2>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-2 border border-neutral-200 rounded-md text-sm">
              <option>Filtrar</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 table-hover">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Tarea</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Responsable</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Peso</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Programado</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Real</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Retraso</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Estado</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Fecha Est.</th>
                {canEdit && (
                  <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-700 uppercase">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {project.tasks?.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  canEdit={canEdit}
                  onUpdate={(changes) => handleTaskUpdate(task.id, changes)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
            <h3 className="text-2xl font-bold mb-4">Confirmar Actualización</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Tarea:</strong> {pendingChanges.task.name}
              </p>
              {pendingChanges.changes.actualProgress !== undefined && (
                <p className="text-sm text-gray-600">
                  <strong>Avance Real:</strong> {pendingChanges.task.actual_progress}% → {pendingChanges.changes.actualProgress}%
                </p>
              )}
              {pendingChanges.changes.delayDays !== undefined && (
                <p className="text-sm text-gray-600">
                  <strong>Días de Retraso:</strong> {pendingChanges.task.delay_days} → {pendingChanges.changes.delayDays}
                </p>
              )}
              <p className="text-sm text-gray-600">
                <strong>Nuevo Estado:</strong>{' '}
                <span className={`font-semibold ${
                  pendingChanges.newStatus === 'Crítico' ? 'text-red-600' :
                  pendingChanges.newStatus === 'Retrasado' ? 'text-yellow-600' :
                  pendingChanges.newStatus === 'Completado' ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {pendingChanges.newStatus}
                </span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingChanges(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, canEdit, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    actualProgress: task.actual_progress,
    delayDays: task.delay_days,
    comments: task.comments || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    setEditing(false);
  };

  const statusColors = {
    Completado: 'bg-green-100 text-green-800',
    'En Curso': 'bg-blue-100 text-blue-800',
    Retrasado: 'bg-yellow-100 text-yellow-800',
    Crítico: 'bg-red-100 text-red-800'
  };

  return (
    <tr className="align-middle">
      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-neutral-900">
        {task.name}
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-700">{(task.responsible || 'U').charAt(0)}</div>
          <div>{task.responsible}</div>
        </div>
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        {task.weight}
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        {task.planned_progress}%
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        {editing ? (
          <input
            type="number"
            min="0"
            max="100"
            value={formData.actualProgress}
            onChange={(e) => setFormData({ ...formData, actualProgress: parseFloat(e.target.value) || 0 })}
            className="w-24 px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${task.actual_progress}%` }} />
            </div>
            <span className="font-medium text-neutral-900">{task.actual_progress}%</span>
          </div>
        )}
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        {editing ? (
          <input
            type="number"
            min="0"
            value={formData.delayDays}
            onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
            className="w-24 px-3 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-warning-300"
          />
        ) : (
          <span className={task.delay_days > 0 ? 'font-medium text-danger-600' : 'text-neutral-600'}>
            {task.delay_days} días
          </span>
        )}
      </td>
      <td className="px-8 py-5 whitespace-nowrap">
        <span className={`status-badge ${statusColors[task.status]}`}>{task.status}</span>
      </td>
      <td className="px-8 py-5 whitespace-nowrap text-sm text-neutral-600">
        {task.estimated_date ? new Date(task.estimated_date).toLocaleDateString('es-ES') : '-'}
      </td>
      {canEdit && (
        <td className="px-8 py-5 whitespace-nowrap text-sm">
          {editing ? (
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-success-50 text-success-600 rounded-md hover:bg-success-100"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    actualProgress: task.actual_progress,
                    delayDays: task.delay_days,
                    comments: task.comments || ''
                  });
                }}
                className="px-3 py-2 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-2 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-100"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

