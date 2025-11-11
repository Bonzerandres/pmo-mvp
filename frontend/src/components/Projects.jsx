import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { projectsAPI } from '../services/api';
import { FolderKanban, Edit, Eye, RefreshCw, Plus, Trash2, BarChart3 } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
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

  const handleDeleteClick = (project, e) => {
    if (e) e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

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

  const handleProjectCreated = async () => {
    // Parent handles toast and dataset refresh per review comment
    toast.showSuccess('Proyecto creado exitosamente');
    setLoading(true);
    await loadProjects();
    setShowCreateModal(false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-600">Cargando proyectos...</div>
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
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            user={user}
            onView={() => navigate(`/projects/${project.id}`)}
            onDeleteClick={(e) => handleDeleteClick(project, e)}
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

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleProjectCreated} />
    </div>
  );
}

function ProjectCard({ project, onView, user, onDeleteClick }) {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'Completado').length || 0;
  const criticalTasks = project.tasks?.filter(t => t.status === 'Crítico').length || 0;
  const delayedTasks = project.tasks?.filter(t => t.status === 'Retrasado' || t.status === 'Crítico').length || 0;

  // Calculate average progress
  const avgProgress = project.tasks?.length > 0
    ? project.tasks.reduce((sum, t) => sum + t.actual_progress, 0) / project.tasks.length
    : 0;

  return (
    <div className="card-elevated p-8 hover:shadow-card-md transform transition-all duration-200 relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-neutral-900 mb-1 truncate">{project.name}</h3>
          <p className="text-sm text-neutral-600 flex items-center"><span className="mr-2">{project.category}</span></p>
        </div>
        {criticalTasks > 0 && (
          <span className="px-3 py-1 bg-danger-50 text-danger-600 rounded-full text-sm font-semibold animate-pulse">
            {criticalTasks} crítico{criticalTasks > 1 ? 's' : ''}
          </span>
        )}
        {user?.role === 'Admin' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteClick && onDeleteClick(e); }}
            aria-label="Eliminar proyecto"
            className="absolute top-4 right-4 delete-button-icon-only"
            title="Eliminar proyecto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600 font-medium">Progreso</span>
          <span className="font-semibold text-neutral-900">{avgProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-xs text-neutral-600 uppercase tracking-wide">Tareas</p>
          <p className="font-semibold text-neutral-900">{totalTasks}</p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-xs text-neutral-600 uppercase tracking-wide">Completadas</p>
          <p className="font-semibold text-success-500">{completedTasks}</p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-xs text-neutral-600 uppercase tracking-wide">En Curso</p>
          <p className="font-semibold text-brand-600">{totalTasks - completedTasks - delayedTasks}</p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-xs text-neutral-600 uppercase tracking-wide">Retrasadas</p>
          <p className="font-semibold text-danger-500">{delayedTasks}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onView}
          className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-md hover:bg-brand-700 hover:shadow-md flex items-center justify-center transition duration-200"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalles
        </button>
        <button
          onClick={() => navigate(`/progress-tracker?projectId=${project.id}`)}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 hover:shadow-md flex items-center justify-center transition duration-200"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Avance
        </button>
      </div>
    </div>
  );
}

