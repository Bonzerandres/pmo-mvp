import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function WeeklyTrends() {
  const [weeklyTrends, setWeeklyTrends] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const toast = useToast();

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [trends, week] = await Promise.all([
        dashboardAPI.getWeeklyTrends(),
        dashboardAPI.getCurrentWeek()
      ]);
      setWeeklyTrends(trends);
      setCurrentWeek(week);
      setLastUpdated(new Date());
    } catch (err) {
      toast.showError('Error al cargar tendencias semanales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Skeleton loader
  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-1/3 bg-neutral-200 rounded mb-6" />
        <div className="h-64 bg-neutral-100 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-brand-600" />
          <h2 className="text-2xl font-bold text-neutral-900">Tendencias Semanales</h2>
          {currentWeek && (
            <span className="flex items-center ml-4 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4 mr-1" />
              S{currentWeek.weekNumber} - {currentWeek.month}/{currentWeek.year}
            </span>
          )}
        </div>
        <button
          className={`ml-4 flex items-center px-3 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 transition ${refreshing ? 'opacity-60 cursor-wait' : ''}`}
          onClick={loadData}
          disabled={refreshing}
          aria-label="Refrescar tendencias"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={weeklyTrends?.trends || []} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgPlannedProgress" name="Avance Programado" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avgActualProgress" name="Avance Real" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Week Summary Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-neutral-800">Resumen de la Semana Actual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentWeek?.projects?.length === 0 && (
            <div className="col-span-full text-neutral-500 text-center py-8">No hay datos para la semana actual.</div>
          )}
          {currentWeek?.projects?.map((proj) => (
            <div key={proj.projectId} className="card-elevated bg-white rounded-xl shadow p-4 flex flex-col gap-2">
              <div className="font-semibold text-brand-700 text-base truncate" title={proj.projectName}>{proj.projectName}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Avance:</span>
                <span className="text-brand-600 font-bold">{proj.actualProgress}%</span>
                <span className="text-neutral-400">/ {proj.plannedProgress}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Desviación:</span>
                <span className={proj.deviation > 0 ? 'text-red-600' : 'text-green-600'}>{proj.deviation > 0 ? '+' : ''}{proj.deviation}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Estado:</span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${proj.status === 'RP' ? 'bg-red-100 text-red-700' : proj.status === 'R' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{proj.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-right text-xs text-neutral-400">
        Última actualización: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
      </div>
    </div>
  );
}
