import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { projectsAPI } from '../services/api';
import { FolderKanban, Eye, RefreshCw, Plus, Trash2, BarChart3, CheckCircle2, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import ProjectCompletionModal from './ProjectCompletionModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [projectToComplete, setProjectToComplete] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  function handleDeleteClick(project, e) {
    if (e) e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const res = await projectsAPI.delete(projectToDelete.id);
      toast.showSuccess(res?.data?.message || 'Proyecto eliminado correctamente');
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setLoading(true);
      await loadProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al eliminar el proyecto';
      toast.showError(msg);
    } finally {
      setDeleting(false);
    }
  };

  function handleCompleteClick(project, e) {
    if (e) e.stopPropagation();
    setProjectToComplete(project);
    setShowCompletionModal(true);
  }

  const handleCompleteConfirm = async (notes) => {
    if (!projectToComplete) return;
    setCompleting(true);
    try {
      await projectsAPI.markComplete(projectToComplete.id, notes);
      toast.showSuccess('¡Proyecto marcado como completado! 🎉');
      setShowCompletionModal(false);
      setProjectToComplete(null);
      setLoading(true);
      await loadProjects();
    } catch (err) {
      console.error('Error completing project', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al completar el proyecto';
      toast.showError(msg);
    } finally {
      setCompleting(false);
    }
  };

  async function handleProjectCreated() {
    toast.showSuccess('Proyecto creado exitosamente');
    setLoading(true);
    await loadProjects();
    setShowCreateModal(false);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Mis Proyectos</h1>
          <p className="text-sm text-neutral-600 mt-1">Gestiona y monitorea tus proyectos asignados</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => { setLoading(true); await loadProjects(); toast.showInfo('Actualizando proyectos'); }}
            className="px-4 py-2 bg-brand-600 text-white rounded-md shadow-sm hover:bg-brand-700 transition duration-200 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Actualizar
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-success-600 text-white rounded-md shadow-sm hover:bg-success-700 transition duration-200 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Crear Proyecto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            user={user}
            index={index}
            onView={() => navigate(`/projects/${project.id}`)}
            onDeleteClick={(e) => handleDeleteClick(project, e)}
            onCompleteClick={(e) => handleCompleteClick(project, e)}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
            <FolderKanban className="w-12 h-12 text-neutral-400" />
          </div>
          <p className="text-neutral-600">No tienes proyectos asignados</p>
          <div className="mt-4">
            {user?.role === 'Admin' ? (
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-success-600 text-white rounded-md">Crear Proyecto</button>
            ) : (
              <button className="px-4 py-2 bg-brand-600 text-white rounded-md">Solicitar acceso</button>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setProjectToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        projectName={projectToDelete?.name}
        taskCount={projectToDelete?.tasks?.length || 0}
        isDeleting={deleting}
      />

      <ProjectCompletionModal
        isOpen={showCompletionModal}
        onClose={() => { setShowCompletionModal(false); setProjectToComplete(null); }}
        project={projectToComplete}
        onConfirm={handleCompleteConfirm}
        isSubmitting={completing}
      />

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleProjectCreated} />
    </div>
  );
}

function ProjectCard({ project, onView, user, onDeleteClick, onCompleteClick, index }) {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'Completado').length || 0;
  const criticalTasks = project.tasks?.filter(t => t.status === 'Crítico').length || 0;
  let delayedTasks = project.tasks?.filter(t => t.status === 'Retrasado' || t.status === 'Crítico').length || 0;

  const avgProgress = totalTasks > 0
    ? project.tasks.reduce((sum, t) => sum + (t.actual_progress || 0), 0) / totalTasks
    : 0;

  function getProjectHealth() {
    const isCompleted = project.completed || avgProgress >= 100;
    if (isCompleted) return 'completed';
    if (criticalTasks > 0 || delayedTasks > totalTasks * 0.5) return 'critical';
    if (delayedTasks > 0 || avgProgress < 50) return 'at-risk';
    if (avgProgress >= 80) return 'excellent';
    return 'good';
  }

  const health = getProjectHealth();
  const canComplete = (user?.role === 'Admin' || user?.role === 'PM') && avgProgress >= 95 && !project.completed;

  const healthConfig = {
    excellent: { label: 'Excelente', icon: TrendingUp, class: 'health-badge-excellent' },
    good: { label: 'Bien', icon: CheckCircle2, class: 'health-badge-good' },
    'at-risk': { label: 'En Riesgo', icon: AlertCircle, class: 'health-badge-at-risk' },
    critical: { label: 'Crítico', icon: AlertCircle, class: 'health-badge-critical' },
    completed: { label: 'Completado', icon: Sparkles, class: 'health-badge-completed' }
  };

  const { label, icon: HealthIcon, class: healthClass } = healthConfig[health];

  return (
    <div className={`project-card project-card-${health} card-enter stagger-${(index % 6) + 1} p-6 relative group`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`health-badge ${healthClass}`}>
          <HealthIcon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>

        {user?.role === 'Admin' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteClick && onDeleteClick(e); }}
            aria-label="Eliminar proyecto"
            className="opacity-0 group-hover:opacity-100 transition-opacity delete-button-icon-only"
            title="Eliminar proyecto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold text-neutral-900 mb-1 truncate" title={project.name}>{project.name}</h3>
        <p className="text-sm text-neutral-600 truncate" title={project.category}>{project.category}</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600 font-medium">Progreso</span>
          <span className="font-bold text-neutral-900">{avgProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 progress-fill-animated"
            style={{ '--progress-width': `${avgProgress}%`, width: `${avgProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="stat-pill">
          <span className="text-xs text-neutral-600">Tareas</span>
          <span className="font-bold text-neutral-900">{totalTasks}</span>
        </div>
        <div className="stat-pill stat-pill-success">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-bold">{completedTasks}</span>
        </div>
        <div className="stat-pill">
          <span className="text-xs text-neutral-600">En Curso</span>
          <span className="font-bold text-brand-600">{totalTasks - completedTasks - delayedTasks}</span>
        </div>
        <div className="stat-pill stat-pill-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="font-bold">{delayedTasks}</span>
        </div>
      </div>

      {criticalTasks > 0 && (
        <div className="mb-4">
          <span className="px-3 py-1.5 bg-danger-50 text-danger-600 rounded-full text-xs font-bold border border-danger-200 inline-flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            {criticalTasks} crítico{criticalTasks > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {canComplete ? (
          <>
            <button
              onClick={onView}
              className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center justify-center transition duration-200 text-sm font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver
            </button>
            <button
              onClick={(e) => onCompleteClick && onCompleteClick(e)}
              className="flex-1 px-4 py-2.5 btn-gradient-success flex items-center justify-center text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Completar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onView}
              className="flex-1 px-4 py-2.5 btn-gradient-primary flex items-center justify-center text-sm"
            >
              <Eye className="w-4 h-4 mr-2 icon-slide" />
              Ver Detalles
            </button>
            <button
              onClick={() => window.location.href = `/projects/${project.id}/avance`}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center transition duration-200 text-sm font-medium shadow-md hover:shadow-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2 icon-slide" />
              Avance
            </button>
          </>
        )}
      </div>

      {project.completed && (
        <div className="absolute top-4 right-4">
          <div className="completion-badge">
            <Sparkles className="w-4 h-4" />
            <span>Completado</span>
          </div>
        </div>
      )}
    </div>
  );
}
