'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../utils/api.js';

export function VisitorRenderTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Increment counter by +2 for every render / route visit
    api.post('/stats/visitor-render', {}).catch(() => {});
  }, [pathname]);

  return null;
}

export function FloatingBottomLeftCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/stats/visitor-render');
        if (res.data?.success && typeof res.data?.count === 'number') {
          const safeVal = Math.max(10000, res.data.count);
          setCount(safeVal);
        }
      } catch (e) {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  if (count === null || count === undefined) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border-1.5 border-[#FFCCE1] shadow-[0_4px_16px_rgba(255,42,109,0.18)] hover:scale-105 transition-all duration-300 pointer-events-auto select-none"
      title="Live Website Views & Renders (+2 per visit/render)"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
      </span>
      <span className="text-[10px] uppercase font-black tracking-wider text-[#684E67]">
        Visitors
      </span>
      <span className="text-xs font-mono font-black text-[#FF2A6D] bg-[#FFF0F3] px-2 py-0.5 rounded-full border border-[#FFCCE1]">
        {count.toLocaleString()}
      </span>
    </div>
  );
}
