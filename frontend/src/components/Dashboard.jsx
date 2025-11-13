import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { AlertCircle, Clock, CheckCircle, AlertTriangle, RefreshCw, Info, TrendingUp } from 'lucide-react';
import ProgressTooltip from './ProgressTooltip';
import ProgressBar from './ProgressBar';
import { useToast } from '../context/ToastContext';


const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('all'); // all, high, medium
  const toast = useToast();


  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [
        kpisData, 
        alertsData, 
        summaryData
      ] = await Promise.all([
        dashboardAPI.getKPIs(),
        dashboardAPI.getAlerts(),
        dashboardAPI.getPortfolioSummary()
      ]);

      setKpis(kpisData.data);
      setAlerts(alertsData.data);
      setPortfolioSummary(summaryData.data);
      setLastUpdated(new Date());
      toast.showSuccess('Datos actualizados');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.showError('Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  // Pie chart and analytics removed for executive-only dashboard
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Dashboard Ejecutivo</h1>
            <p className="text-sm text-neutral-600 mt-1">Vista general del portafolio de proyectos</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="loader" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card-elevated p-6">
              <div className="h-6 w-48 skeleton mb-3" />
              <div className="h-10 w-32 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard Ejecutivo</h1>
          <p className="text-sm text-neutral-600 mt-1">Vista general del portafolio de proyectos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => { setRefreshing(true); await loadData(); toast.showInfo('Actualizando datos'); }}
            disabled={refreshing}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm transition duration-200 ${refreshing ? 'bg-neutral-200 text-neutral-600' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>

          {lastUpdated && (
            <div className="text-xs text-neutral-500">Última actualización: {lastUpdated.toLocaleTimeString()}</div>
          )}
        </div>
      </div>


      {/* KPIs - 6 card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total de Proyectos"
          value={kpis?.totalProjects || 0}
          icon={<CheckCircle className="w-8 h-8" />}
          color="blue"
        />
        <KPICard
          title="Proyectos Completados"
          value={kpis?.completedProjects || 0}
          icon={<CheckCircle className="w-8 h-8" />}
          color="green"
        />
        <KPICard
          title="Proyectos con Retraso"
          value={kpis?.delayedProjects || 0}
          icon={<AlertTriangle className="w-8 h-8" />}
          color="yellow"
        />
        <KPICard
          title="Avance Promedio"
          value={`${(kpis?.averageProgress || 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-8 h-8" />}
          color="indigo"
        />
        <KPICard
          title="Días de Retraso Acumulados"
          value={kpis?.totalDelayDays || 0}
          icon={<Clock className="w-8 h-8" />}
          color="red"
        />
        <KPICard
          title="Proyectos de Alta Prioridad"
          value={kpis?.highPriorityProjects || 0}
          icon={<AlertCircle className="w-8 h-8" />}
          color="red"
        />
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Centro de Alertas
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Críticas
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Medias
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay alertas</p>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.projectName} - {alert.taskName}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      {/* Portfolio Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Resumen del Portafolio</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>Desviación</span>
                    <ProgressTooltip content={<div>Desviación = Real - Programado</div>}><Info className="w-4 h-4 text-neutral-400"/></ProgressTooltip>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tareas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolioSummary.map((project) => {
                const deviation = project.actualProgress - project.plannedProgress;
                return (
                  <tr key={project.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="max-w-xs truncate" title={project.name}>
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.category}
                    </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          deviation < -10 ? 'bg-red-50 text-red-700 rounded-md px-2 py-1' : deviation < 0 ? 'bg-yellow-50 text-yellow-700 rounded-md px-2 py-1' : 'bg-green-50 text-green-700 rounded-md px-2 py-1'
                        }`}>
                          {deviation < -20 ? '⚠️ ' : deviation < 0 ? '⚡ ' : '✓ '}{deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.totalTasks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };
  const safeColor = color && colorClasses[color] ? color : 'blue';
  return (
    <div className="card-elevated p-6 lg:p-8 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-neutral-600 uppercase">{title}</p>
          <p className="text-4xl lg:text-5xl font-bold text-neutral-900 mt-3">{value}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm`} style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.02))'}}>
          <div className={`${colorClasses[safeColor] || colorClasses.blue} p-3 rounded-lg`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}



