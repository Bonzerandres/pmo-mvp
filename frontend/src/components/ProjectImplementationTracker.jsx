import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ProjectImplementationTracker() {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadProject();
    } else {
      toast.showError('No se especificó un proyecto');
      setLoading(false);
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.showError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await projectsAPI.updateTask(projectId, taskId, {
        actualProgress: 100,
        delayDays: 0,
        comments: 'Tarea completada'
      });
      toast.showSuccess('Tarea marcada como completada');
      await loadProject();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.showError('Error al completar la tarea');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="h-64 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-neutral-600">Proyecto no encontrado</p>
          <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-md">Volver a Proyectos</button>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const tasks = project.tasks || [];
  const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
  
  const calculatePV = (task) => {
    if (!task.estimated_date) return task.planned_progress || 0;
    const estimated = new Date(task.estimated_date);
    const today = new Date();
    return estimated <= today ? 100 : (task.planned_progress || 0);
  };

  const weightedPV = tasks.reduce((sum, t) => {
    const weight = t.weight || 1;
    return sum + (calculatePV(t) * weight);
  }, 0);
  
  const weightedEV = tasks.reduce((sum, t) => {
    const weight = t.weight || 1;
    return sum + ((t.actual_progress || 0) * weight);
  }, 0);

  const plannedValue = totalWeight > 0 ? weightedPV / totalWeight : 0;
  const earnedValue = totalWeight > 0 ? weightedEV / totalWeight : 0;
  const scheduleVariance = earnedValue - plannedValue;

  // Calculate demography by responsible
  const responsibleStats = {};
  tasks.forEach(task => {
    const resp = task.responsible || 'Sin Asignar';
    if (!responsibleStats[resp]) {
      responsibleStats[resp] = { totalTasks: 0, totalSV: 0 };
    }
    responsibleStats[resp].totalTasks += 1;
    const pv = calculatePV(task);
    const ev = task.actual_progress || 0;
    const sv = ev - pv;
    responsibleStats[resp].totalSV += sv;
  });
  const demographyData = Object.entries(responsibleStats).map(([responsible, stats]) => ({
    responsible,
    averageSV: stats.totalTasks > 0 ? stats.totalSV / stats.totalTasks : 0
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
            title="Volver a Proyectos"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-600 mt-1">{project.category}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="PV (Planned Value)"
          value={`${plannedValue.toFixed(1)}%`}
          icon={<Calendar className="w-6 h-6" />}
          color="indigo"
          subtitle="Avance Programado"
        />
        <MetricCard
          title="EV (Earned Value)"
          value={`${earnedValue.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          subtitle="Avance Real"
        />
        <MetricCard
          title="SV (Schedule Variance)"
          value={`${scheduleVariance > 0 ? '+' : ''}${scheduleVariance.toFixed(1)}%`}
          icon={scheduleVariance < -10 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          color={scheduleVariance < -10 ? 'red' : scheduleVariance < 0 ? 'yellow' : 'green'}
          subtitle="Desviación de Cronograma"
        />
      </div>

      {/* WBS Table (Excel-like) */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <h2 className="text-xl font-semibold">Etapas de Implementación</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Peso</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PV</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">EV</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Est.</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Retraso</th>
                {user?.canEdit && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const pv = calculatePV(task);
                const ev = task.actual_progress || 0;
                const taskSV = ev - pv;
                return (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="max-w-md truncate" title={task.name}>{task.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.responsible}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900 font-semibold">{task.weight || 1}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pv}%` }} />
                        </div>
                        <span className="text-indigo-600 font-semibold">{pv.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${ev}%` }} />
                        </div>
                        <span className="text-green-600 font-semibold">{ev.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {task.estimated_date ? new Date(task.estimated_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {task.delay_days > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          {task.delay_days} días
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {user?.canEdit && task.status !== 'Completado' && (
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs font-semibold"
                        >
                          Completar
                        </button>
                      </td>
                    )}
                    {user?.canEdit && task.status === 'Completado' && (
                      <td className="px-6 py-4 text-sm text-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demography Chart */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <h2 className="text-xl font-semibold">Demografía de Desempeño por Responsable</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demographyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="responsible" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Desviación Promedio']} />
              <Bar dataKey="averageSV">
                {demographyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.averageSV < 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    'Completado': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completado' },
    'En Curso': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En Curso' },
    'Retrasado': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Retrasado' },
    'Crítico': { bg: 'bg-red-100', text: 'text-red-700', label: 'Crítico' }
  };

  const config = statusConfig[status] || statusConfig['En Curso'];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
