import React, { useState, useRef, useEffect } from 'react';

export default function ProgressTooltip({ content, position = 'top', children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!visible || !ref.current || !tipRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    const tipRect = tipRef.current.getBoundingClientRect();
    let top = 0, left = 0;
    if (position === 'top') {
      top = rect.top - tipRect.height - 8 + window.scrollY;
      left = rect.left + rect.width / 2 - tipRect.width / 2 + window.scrollX;
    } else if (position === 'bottom') {
      top = rect.bottom + 8 + window.scrollY;
      left = rect.left + rect.width / 2 - tipRect.width / 2 + window.scrollX;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2 - tipRect.height / 2 + window.scrollY;
      left = rect.left - tipRect.width - 8 + window.scrollX;
    } else {
      top = rect.top + rect.height / 2 - tipRect.height / 2 + window.scrollY;
      left = rect.right + 8 + window.scrollX;
    }

    // Clamp to viewport
    const pad = 8;
    left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - tipRect.height - pad));

    setCoords({ top, left });
  }, [visible, position]);

  return (
    <span
      className="relative inline-flex"
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          ref={tipRef}
          role="tooltip"
          className="z-50 pointer-events-none bg-neutral-900 text-white text-xs rounded-md px-3 py-2 shadow-lg transition-opacity duration-150"
          style={{ position: 'absolute', top: coords.top, left: coords.left }}
        >
          <div className="tooltip-arrow" />
          <div>{content}</div>
        </div>
      )}
    </span>
  );
}

