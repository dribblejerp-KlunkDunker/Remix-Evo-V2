import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  AgentSkill,
  EvolutionStats,
  VectorCategory,
  ScenarioHeatmapPoint,
  ChampionEvolutionLineageAudit,
  ScenarioDefinition,
} from '../types/skills';
import type { SkillConflictPair } from '../types/skillConflicts';
import { INITIAL_SKILLS, INITIAL_EVOLUTION_STATS } from '../data/skillsData';
import type { BenchmarkReport, SwarmRunResult } from '../../server/evolution/runs';
import type { LineageGraph } from '../../server/evolution/lineageGraph';
import type { EngineStatus } from '../../server/evolution/engine';
import type { CognitiveProfileProjection, MutationOutcomeProjection } from '../../server/evolution/projections';
import type { EvolutionEvent } from '../../server/evolution/store';

// Extract and clean #operator=<token> on module load
if (typeof window !== 'undefined') {
  const hash = window.location.hash;
  const match = hash.match(/[#&]operator=([^&]+)/);
  if (match) {
    try {
      sessionStorage.setItem('evolution.operatorToken', decodeURIComponent(match[1]));
    } catch {
      // storage unavailable
    }
    const newHash = hash.replace(/[#&]operator=[^&]+/, '').replace(/^#$/, '');
    const newUrl = window.location.pathname + window.location.search + (newHash ? '#' + newHash : '');
    window.history.replaceState(null, '', newUrl);
  }
}

async function operatorPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const getToken = () => {
    try {
      return sessionStorage.getItem('evolution.operatorToken') || '';
    } catch {
      return '';
    }
  };

  const setToken = (t: string) => {
    try {
      sessionStorage.setItem('evolution.operatorToken', t);
    } catch {
      // ignore
    }
  };

  const clearToken = () => {
    try {
      sessionStorage.removeItem('evolution.operatorToken');
    } catch {
      // ignore
    }
  };

  const doFetch = async (token: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(path, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = getToken();
  let res = await doFetch(token);

  if (res.status === 401) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Operator authorization required.');
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const waitTime = errJson.retryAfter ? `${errJson.retryAfter}s` : 'a few moments';
      throw new Error(errJson.error || `Rate limit reached. Quota resets in ${waitTime}.`);
    }
    throw new Error(errJson.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function pollJob<T>(jobId: string): Promise<T> {
  let interval = 1500;
  const maxInterval = 6000;
  const deadline = Date.now() + 20 * 60 * 1000; // 20-minute deadline

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const res = await fetch(`/api/evolution/jobs/${jobId}`);
    if (res.status === 404) {
      throw new Error('Job not found or expired.');
    }
    if (!res.ok) {
      throw new Error(`Failed to check job status: HTTP ${res.status}`);
    }
    const job = await res.json();
    if (job.status === 'done') {
      return job.result as T;
    }
    if (job.status === 'failed') {
      throw new Error(job.error || 'Job failed.');
    }
    interval = Math.min(maxInterval, Math.round(interval * 1.4));
  }
  throw new Error('Job timed out after 20 minutes.');
}

export interface HeatmapProjection {
  points: ScenarioHeatmapPoint[];
  scenarios: ScenarioDefinition[];
  specialists: Array<{ id: string; name: string; vector: string; stage: string }>;
}

export interface AuditStats {
  totalAuditedChampions: number;
  totalIterations: number;
  averageMutationRate: number;
  averagePerformanceDelta: number;
}

export interface AuditProjection {
  audits: ChampionEvolutionLineageAudit[];
  stats: AuditStats;
}

export function useEvolution() {
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [isFallback, setIsFallback] = useState(true);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [skills, setSkills] = useState<AgentSkill[]>(INITIAL_SKILLS);
  const [stats, setStats] = useState<EvolutionStats>(INITIAL_EVOLUTION_STATS);
  const [events, setEvents] = useState<EvolutionEvent[]>([]);

  // Projections
  const [heatmap, setHeatmap] = useState<HeatmapProjection | null>(null);
  const [audit, setAudit] = useState<AuditProjection | null>(null);
  const [cognition, setCognition] = useState<CognitiveProfileProjection[] | null>(null);
  const [mutations, setMutations] = useState<MutationOutcomeProjection[] | null>(null);
  const [conflicts, setConflicts] = useState<SkillConflictPair[] | null>(null);
  const [lineageGraph, setLineageGraph] = useState<LineageGraph | null>(null);

  const isFetchingProjections = useRef(false);
  const lastProjectionFetchTime = useRef(0);

  // Status broadcast
  useEffect(() => {
    const payload = {
      connection,
      isFallback,
      running: Boolean(status?.running),
    };
    window.__evolutionStatus = payload;
    window.dispatchEvent(new CustomEvent('evolution:status', { detail: payload }));
  }, [connection, isFallback, status?.running]);

  const refreshProjections = useCallback(async (force = false) => {
    const now = Date.now();
    if (isFetchingProjections.current) return;
    if (!force && now - lastProjectionFetchTime.current < 4000) return;

    isFetchingProjections.current = true;
    lastProjectionFetchTime.current = now;

    try {
      const [hmRes, audRes, cogRes, mutRes, confRes, linRes] = await Promise.all([
        fetch('/api/evolution/heatmap').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/evolution/audit').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/evolution/cognition').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/evolution/mutations').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/evolution/conflicts').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/evolution/lineage-graph').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (hmRes) setHeatmap(hmRes);
      if (audRes) setAudit(audRes);
      if (cogRes?.profiles) setCognition(cogRes.profiles);
      if (mutRes?.outcomes) setMutations(mutRes.outcomes);
      if (confRes?.conflicts) setConflicts(confRes.conflicts);
      if (linRes) setLineageGraph(linRes);
    } catch (err) {
      console.warn('[useEvolution] Projection fetch error:', err);
    } finally {
      isFetchingProjections.current = false;
    }
  }, []);

  // Initial fetch for state snapshot on first paint
  useEffect(() => {
    let cancelled = false;
    fetch('/api/evolution/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.skills) setSkills(data.skills);
        if (data.stats) setStats(data.stats);
        if (data.events) setEvents(data.events);
        if (data.status) setStatus(data.status);
        setIsFallback(false);
        setConnection('live');
        void refreshProjections(true);
      })
      .catch(() => {
        if (!cancelled) {
          setConnection('offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshProjections]);

  // Server-sent events stream
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let attempts = 0;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      try {
        es = new EventSource('/api/evolution/stream');

        es.addEventListener('state', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.skills) setSkills(data.skills);
            if (data.stats) setStats(data.stats);
            if (data.status) setStatus(data.status);
            if (data.events) setEvents(data.events);
            setIsFallback(false);
            setConnection('live');
            attempts = 0;
            void refreshProjections();
          } catch (err) {
            console.warn('[useEvolution] State parse error:', err);
          }
        });

        es.addEventListener('activity', (e) => {
          try {
            const evt: EvolutionEvent = JSON.parse(e.data);
            setEvents((prev) => [evt, ...prev.slice(0, 119)]);
          } catch (err) {
            console.warn('[useEvolution] Activity parse error:', err);
          }
        });

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          if (unmounted) return;
          setConnection('offline');
          attempts++;
          const delay = Math.min(30000, 1500 * Math.pow(2, Math.min(attempts, 5)));
          reconnectTimer = setTimeout(connect, delay);
        };
      } catch (err) {
        setConnection('offline');
        attempts++;
        const delay = Math.min(30000, 1500 * Math.pow(2, Math.min(attempts, 5)));
        reconnectTimer = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [refreshProjections]);

  // Actions
  const tick = useCallback(async (): Promise<void> => {
    await operatorPost('/api/evolution/control', { action: 'tick' });
  }, []);

  const control = useCallback(async (action: 'start' | 'pause' | 'tick' | 'reset') => {
    return operatorPost<{ ok: boolean; status: EngineStatus }>('/api/evolution/control', { action });
  }, []);

  const seed = useCallback(async (vectors: VectorCategory[]) => {
    return operatorPost<{ skill: AgentSkill }>('/api/evolution/seed', { vectors });
  }, []);

  const remix = useCallback(async (parentAId: string, parentBId: string) => {
    return operatorPost<{ skill: AgentSkill }>('/api/evolution/remix', { parentAId, parentBId });
  }, []);

  const benchmark = useCallback(async (skillId: string): Promise<BenchmarkReport> => {
    const { jobId } = await operatorPost<{ jobId: string }>('/api/evolution/benchmark', { skillId });
    return pollJob<BenchmarkReport>(jobId);
  }, []);

  const swarm = useCallback(async (scenarioId: string, skillIds: string[]): Promise<SwarmRunResult> => {
    const { jobId } = await operatorPost<{ jobId: string }>('/api/evolution/swarm', { scenarioId, skillIds });
    return pollJob<SwarmRunResult>(jobId);
  }, []);

  const fetchLineage = useCallback(async (skillId: string): Promise<ChampionEvolutionLineageAudit | null> => {
    try {
      const res = await fetch(`/api/evolution/skills/${encodeURIComponent(skillId)}/lineage`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.lineage ?? null;
    } catch (err) {
      console.warn('Failed to fetch lineage for', skillId, err);
      return null;
    }
  }, []);

  return {
    connection,
    isFallback,
    status,
    skills,
    stats,
    events,
    heatmap,
    audit,
    cognition,
    mutations,
    conflicts,
    lineageGraph,
    tick,
    control,
    seed,
    remix,
    benchmark,
    swarm,
    lineage: fetchLineage,
    refreshProjections,
  };
}
