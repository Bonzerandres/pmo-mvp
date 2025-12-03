import React from 'react';

export default function ProgressBar({ actualProgress = 0, plannedProgress = null, showLabel = true, showPlannedMarker = false, size = 'md', animated = true }) {
  const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
  const deviation = typeof plannedProgress === 'number' ? actualProgress - plannedProgress : 0;
  let fillClass = 'from-brand-400 to-brand-600';
  if (plannedProgress !== null) {
    if (actualProgress >= plannedProgress) fillClass = 'from-green-400 to-green-600';
    else if (plannedProgress - actualProgress <= 10) fillClass = 'from-yellow-400 to-yellow-600';
    else fillClass = 'from-red-400 to-red-600';
  }

  return (
    <div className="w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(actualProgress)}>
      <div className={`relative bg-neutral-100 rounded-full overflow-hidden ${height}`} aria-hidden>
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r ${fillClass} ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, actualProgress))}%` }}
        />

        {showPlannedMarker && typeof plannedProgress === 'number' && (
          <div className="absolute top-0 bottom-0" style={{ left: `${Math.max(0, Math.min(100, plannedProgress))}%`, transform: 'translateX(-50%)' }}>
            <div className="w-px h-full bg-neutral-400 opacity-80" />
          </div>
        )}
      </div>

      {showLabel && (
        <div className="text-xs text-neutral-700 mt-1 flex items-center justify-between">
          <div>{actualProgress}%</div>
          {plannedProgress !== null && <div className="text-neutral-500">Plan: {plannedProgress}%</div>}
        </div>
      )}
    </div>
  );
}
