import React, { useEffect, useState } from 'react';

type EngineStatus = { connection: 'connecting' | 'live' | 'offline'; isFallback: boolean; running: boolean };

declare global {
  interface Window {
    __evolutionStatus?: EngineStatus;
  }
}

/**
 * Header badge that reports what the engine is actually doing.
 *
 * It used to read "MATRIX ACTIVE" unconditionally — including when no engine was
 * connected and every number on screen was bundled sample data. It now listens
 * for the status useEvolution publishes, so it can say Seed Data or Paused.
 */
export const EngineBadge: React.FC = () => {
  const [status, setStatus] = useState<EngineStatus>(
    () => window.__evolutionStatus ?? { connection: 'connecting', isFallback: true, running: false },
  );

  useEffect(() => {
    const onStatus = (e: Event) => setStatus((e as CustomEvent<EngineStatus>).detail);
    window.addEventListener('evolution:status', onStatus);
    // The dashboard may have published before this listener attached.
    if (window.__evolutionStatus) setStatus(window.__evolutionStatus);
    return () => window.removeEventListener('evolution:status', onStatus);
  }, []);

  const { label, tone, title } =
    status.connection === 'connecting'
      ? { label: 'Connecting', tone: 'text-stone-400 bg-stone-900/60 border-stone-700', title: 'Contacting the evolution engine' }
      : status.isFallback
        ? { label: 'Seed Data', tone: 'text-amber-400 bg-amber-950/60 border-amber-800/60', title: 'No engine connected. Numbers are bundled sample data.' }
        : status.running
          ? { label: 'Matrix Active', tone: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60', title: 'Engine connected and evolving' }
          : { label: 'Engine Paused', tone: 'text-stone-300 bg-stone-900/60 border-stone-600', title: 'Engine connected; the autonomous loop is paused' };

  return (
    <span title={title} className={`font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 border ${tone}`}>
      {label}
    </span>
  );
};
