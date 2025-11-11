import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { calendarAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import WeeklyProgressModal from './WeeklyProgressModal';

const STATUS_COLORS = {
  P: 'bg-success-100 text-success-800 hover:bg-success-200',
  R: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
  RP: 'bg-danger-100 text-danger-800 hover:bg-danger-200',
  empty: 'bg-neutral-50 text-neutral-400'
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarView({ projectId, tasks = [], editable = false, onSnapshotUpdate }) {
  const [calendarData, setCalendarData] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      startYear: now.getFullYear(),
      startMonth: now.getMonth() + 1,
      endYear: now.getFullYear(),
      endMonth: now.getMonth() + 1
    };
  });
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, [projectId, dateRange]);

  async function loadCalendarData() {
    try {
      setLoading(true);
      const data = await calendarAPI.getCalendarData(projectId, dateRange);
      setCalendarData(data);
    } catch (error) {
      showToast('Error al cargar calendario', 'error');
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMonthColumns() {
    const months = [];
    let currentDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
    const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);

    while (currentDate <= endDate) {
      months.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        name: MONTH_NAMES[currentDate.getMonth()]
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  }

  function handleCellClick(taskId, year, month, week) {
    if (!editable) return;
    
    setSelectedCell({
      taskId,
      taskName: tasks.find(t => t.id === taskId)?.name,
      year,
      month,
      week,
      data: calendarData?.find(t => t.id === taskId)?.weeks
        ?.find(w => w.year === year && w.month === month && w.week === week)
    });
    setShowEditModal(true);
  }

  async function handleSnapshotSave(data) {
    try {
      await calendarAPI.createSnapshot(projectId, selectedCell.taskId, {
        year: selectedCell.year,
        month: selectedCell.month,
        weekNumber: selectedCell.week,
        ...data
      });
      showToast('Progreso actualizado', 'success');
      loadCalendarData();
      if (onSnapshotUpdate) onSnapshotUpdate();
    } catch (error) {
      showToast('Error al actualizar progreso', 'error');
      console.error('Failed to save snapshot:', error);
    } finally {
      setShowEditModal(false);
      setSelectedCell(null);
    }
  }

  function navigateMonth(direction) {
    const newDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
    newDate.setMonth(newDate.getMonth() + direction);
    setDateRange({
      startYear: newDate.getFullYear(),
      startMonth: newDate.getMonth() + 1,
      endYear: newDate.getFullYear(),
      endMonth: newDate.getMonth() + 1
    });
  }

  function resetToCurrentMonth() {
    const now = new Date();
    setDateRange({
      startYear: now.getFullYear(),
      startMonth: now.getMonth() + 1,
      endYear: now.getFullYear(),
      endMonth: now.getMonth() + 1
    });
  }

  const months = getMonthColumns();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-100 rounded mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-neutral-100 rounded-full"
            aria-label="Mes anterior"
          >
            <Calendar className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={resetToCurrentMonth}
            className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-md"
          >
            Mes actual
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-neutral-100 rounded-full"
            aria-label="Mes siguiente"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-full">
          {/* Month headers */}
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-white border-r w-48"></th>
              {months.map(month => (
                <th 
                  key={`${month.year}-${month.month}`}
                  colSpan={4}
                  className="text-center py-2 font-semibold text-sm text-neutral-700 bg-neutral-50 border-b"
                >
                  {month.name} {month.year}
                </th>
              ))}
            </tr>
            {/* Week headers */}
            <tr>
              <th className="sticky left-0 z-20 bg-white border-r"></th>
              {months.map(month => (
                <React.Fragment key={`weeks-${month.year}-${month.month}`}>
                  {[1, 2, 3, 4].map(week => (
                    <th key={week} className="text-center py-2 text-xs font-medium text-neutral-600 bg-neutral-50 border-b w-24">
                      S{week}
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* Calendar body */}
          <tbody>
            {calendarData?.map(task => (
              <tr key={task.id} className="border-b last:border-b-0 hover:bg-neutral-50">
                {/* Task name (sticky) */}
                <td className="sticky left-0 z-10 bg-white border-r px-4 py-3">
                  <div className="font-medium text-sm text-neutral-900">{task.name}</div>
                </td>

                {/* Week cells */}
                {months.map(month => (
                  <React.Fragment key={`cells-${month.year}-${month.month}-${task.id}`}>
                    {[1, 2, 3, 4].map(week => {
                      const snapshot = task.weeks?.find(
                        w => w.year === month.year && w.month === month.month && w.week === week
                      );
                      const status = snapshot?.actualStatus || 'empty';
                      return (
                        <td
                          key={week}
                          onClick={() => handleCellClick(task.id, month.year, month.month, week)}
                          className={`text-center py-3 cursor-pointer transition-all duration-150 ${STATUS_COLORS[status]}`}
                          title={snapshot ? `Progreso: ${snapshot.actualProgress}%${snapshot.comments ? `\n${snapshot.comments}` : ''}` : ''}
                        >
                          {status !== 'empty' && (
                            <>
                              <div className="font-bold">{status}</div>
                              <div className="text-xs mt-1">{snapshot.actualProgress}%</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status legend */}
      <div className="mt-4 flex items-center justify-end space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-success-100 mr-2"></div>
          <span>Programado (P)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-warning-100 mr-2"></div>
          <span>Real (R)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-danger-100 mr-2"></div>
          <span>Reprogramado (RP)</span>
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && selectedCell && (
        <WeeklyProgressModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCell(null);
          }}
          onSave={handleSnapshotSave}
          projectId={projectId}
          taskId={selectedCell.taskId}
          taskName={selectedCell.taskName}
          year={selectedCell.year}
          month={selectedCell.month}
          weekNumber={selectedCell.week}
          initialData={selectedCell.data}
        />
      )}
    </div>
  );
}