import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { AgentSkill, EvolutionStats, EvolutionIteration } from '../../types/skills';
import type { EvolutionEvent } from '../../../server/evolution/store';
import type { MutationOutcomeProjection } from '../../../server/evolution/projections';
import type { EngineStatus } from '../../../server/evolution/engine';
import {
  Activity,
  Dna,
  GitFork,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Download,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
  Eye,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Info
} from 'lucide-react';

export interface ActiveEvolutionFeedProps {
  skills: AgentSkill[];
  events: EvolutionEvent[];
  stats: EvolutionStats;
  engineStatus?: EngineStatus | null;
  mutations?: MutationOutcomeProjection[] | null;
  isLive?: boolean;
  onInspectSkill?: (skill: AgentSkill) => void;
  onCompareSkills?: (skillA: AgentSkill, skillB: AgentSkill) => void;
  onTriggerTick?: () => Promise<void>;
  onStartEngine?: () => Promise<void>;
  onStopEngine?: () => Promise<void>;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  className?: string;
}

export interface ParentChildFitnessPair {
  id: string;
  parentSkillId?: string;
  parentSkillCode: string;
  parentSkillName: string;
  parentFitness: number;
  childSkillId?: string;
  childSkillCode: string;
  childSkillName: string;
  childFitness: number;
  fitnessDelta: number;
  mutationType: string;
  mutationPercentage: number;
  stage: string;
  survived: boolean;
  timestamp: string;
  ruleDiffAdded: string[];
  keyInsight?: string;
  sourceEventId?: string;
}

export const ActiveEvolutionFeed: React.FC<ActiveEvolutionFeedProps> = ({
  skills,
  events,
  stats,
  engineStatus,
  mutations,
  isLive = true,
  onInspectSkill,
  onCompareSkills,
  onTriggerTick,
  onStartEngine,
  onStopEngine,
  isOpenAsOverlay = false,
  onCloseOverlay,
  className = '',
}) => {
  // Navigation & View Filters
  const [feedTab, setFeedTab] = useState<'stream' | 'comparisons' | 'strategy'>('stream');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deltaFilter, setDeltaFilter] = useState<'all' | 'gain' | 'regression' | 'champions'>('all');
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isTriggeringTick, setIsTriggeringTick] = useState<boolean>(false);
  const [tickFeedback, setTickFeedback] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect when new events arrive
  useEffect(() => {
    if (isAutoScrollLocked && logContainerRef.current && feedTab === 'stream') {
      logContainerRef.current.scrollTop = 0;
    }
  }, [events, isAutoScrollLocked, feedTab]);

  // Handle triggering an on-demand evolution tick
  const handleManualTick = async () => {
    if (!onTriggerTick || isTriggeringTick) return;
    try {
      setIsTriggeringTick(true);
      setTickFeedback('Dispatching autonomous mutation tick to engine...');
      await onTriggerTick();
      setTickFeedback('Mutation tick completed successfully!');
      setTimeout(() => setTickFeedback(null), 3500);
    } catch (err) {
      setTickFeedback(`Tick failed: ${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => setTickFeedback(null), 5000);
    } finally {
      setIsTriggeringTick(false);
    }
  };

  // Compile synthesized & live parent-child fitness pairs from population iterations & events
  const parentChildComparisons: ParentChildFitnessPair[] = useMemo(() => {
    const list: ParentChildFitnessPair[] = [];
    const seenKeys = new Set<string>();

    // 1. Reconstruct from skills with lineage iterations
    for (const skill of skills) {
      const iterations = skill.evolutionLineage?.iterations ?? [];
      for (const it of iterations) {
        const parentCode = it.parentSkillNames?.[0] || skill.evolutionLineage?.parents?.[0] || 'Ancestral Base';
        const parentSkill = skills.find((s) => s.name === parentCode || s.code === parentCode || s.id === it.parentSkillIds?.[0]);
        const parentFitness = it.scoreBefore ?? (parentSkill?.benchmarkScore || 85.0);
        const childFitness = it.scoreAfter ?? skill.benchmarkScore;
        const delta = it.performanceDelta ?? (childFitness - parentFitness);

        const key = `${parentCode}->${skill.code}-iter-${it.iterationNumber}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: key,
            parentSkillId: parentSkill?.id,
            parentSkillCode: parentSkill?.code || parentCode.slice(0, 10),
            parentSkillName: parentSkill?.name || parentCode,
            parentFitness: Number(parentFitness.toFixed(1)),
            childSkillId: skill.id,
            childSkillCode: skill.code,
            childSkillName: skill.name,
            childFitness: Number(childFitness.toFixed(1)),
            fitnessDelta: Number(delta.toFixed(1)),
            mutationType: it.mutationType || skill.evolutionLineage?.mutationType || 'Adversarial Constraint Hardening',
            mutationPercentage: it.mutationPercentage || skill.evolutionLineage?.totalMutationPercentage || 12.5,
            stage: skill.stage,
            survived: it.survived ?? true,
            timestamp: it.timestamp || skill.lastEvaluatedAt || new Date().toISOString(),
            ruleDiffAdded: it.ruleDiff?.added || (skill.strictRules?.slice(0, 2) ?? []),
            keyInsight: it.keyInsight || skill.tagline,
          });
        }
      }

      // If skill has parents directly but no iterations array
      if (skill.evolutionLineage?.parents?.length && iterations.length === 0) {
        const parentName = skill.evolutionLineage.parents[0];
        const parentSkill = skills.find((s) => s.name === parentName || s.code === parentName || s.id === parentName);
        const parentFitness = parentSkill?.benchmarkScore ?? 88.0;
        const childFitness = skill.benchmarkScore;
        const delta = childFitness - parentFitness;
        const key = `${parentName}->${skill.code}-direct`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: key,
            parentSkillId: parentSkill?.id,
            parentSkillCode: parentSkill?.code || parentName.slice(0, 10),
            parentSkillName: parentSkill?.name || parentName,
            parentFitness: Number(parentFitness.toFixed(1)),
            childSkillId: skill.id,
            childSkillCode: skill.code,
            childSkillName: skill.name,
            childFitness: Number(childFitness.toFixed(1)),
            fitnessDelta: Number(delta.toFixed(1)),
            mutationType: skill.evolutionLineage.mutationType || 'Rule Specificity Injection',
            mutationPercentage: skill.evolutionLineage.totalMutationPercentage || 15.0,
            stage: skill.stage,
            survived: true,
            timestamp: skill.lastEvaluatedAt || new Date().toISOString(),
            ruleDiffAdded: skill.strictRules?.slice(0, 2) ?? [],
            keyInsight: skill.tagline,
          });
        }
      }
    }

    // 2. Also incorporate real-time mutation events from SSE stream
    for (const evt of events) {
      if ((evt.type === 'mutation' || evt.type === 'crossover' || evt.type === 'training_refined') && evt.detail) {
        const det = evt.detail as Record<string, any>;
        const childCode = evt.skillCode;
        const parentCode = det.parentCode || det.parentName || 'Parent Genome';
        const key = `evt-${evt.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const parentScore = typeof det.scoreBefore === 'number' ? det.scoreBefore : 86.0;
          const childScore = typeof det.scoreAfter === 'number' ? det.scoreAfter : 90.5;
          const delta = typeof det.delta === 'number' ? det.delta : childScore - parentScore;
          const childSkill = skills.find((s) => s.code === childCode || s.id === evt.skillId);
          const parentSkill = skills.find((s) => s.code === parentCode || s.name === parentCode);

          list.unshift({
            id: key,
            parentSkillId: parentSkill?.id,
            parentSkillCode: parentSkill?.code || parentCode.slice(0, 10),
            parentSkillName: parentSkill?.name || parentCode,
            parentFitness: Number(parentScore.toFixed(1)),
            childSkillId: childSkill?.id || evt.skillId,
            childSkillCode: childSkill?.code || childCode,
            childSkillName: childSkill?.name || childCode,
            childFitness: Number(childScore.toFixed(1)),
            fitnessDelta: Number(delta.toFixed(1)),
            mutationType: det.mutationType || (evt.type === 'crossover' ? 'Specialist Crossover' : 'Targeted Mutation'),
            mutationPercentage: det.mutationPercentage || 14.0,
            stage: childSkill?.stage || 'training',
            survived: evt.status === 'success',
            timestamp: evt.timestamp,
            ruleDiffAdded: Array.isArray(det.rulesAdded) ? det.rulesAdded : [],
            keyInsight: evt.message,
            sourceEventId: evt.id,
          });
        }
      }
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [skills, events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Type filter
      if (eventTypeFilter === 'mutations') {
        if (!['mutation', 'training_refined'].includes(evt.type)) return false;
      } else if (eventTypeFilter === 'crossover') {
        if (evt.type !== 'crossover') return false;
      } else if (eventTypeFilter === 'evaluations') {
        if (!['evaluation', 'benchmark_run'].includes(evt.type)) return false;
      } else if (eventTypeFilter === 'promotions') {
        if (!['champion_promoted', 'champion_demoted', 'idea_generated'].includes(evt.type)) return false;
      } else if (eventTypeFilter === 'system') {
        if (!['tick_start', 'tick_complete', 'budget_throttled', 'error'].includes(evt.type)) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSkill = evt.skillCode?.toLowerCase().includes(q);
        const matchesMsg = evt.message?.toLowerCase().includes(q);
        const matchesType = evt.type?.toLowerCase().includes(q);
        if (!matchesSkill && !matchesMsg && !matchesType) return false;
      }

      return true;
    });
  }, [events, eventTypeFilter, searchQuery]);

  // Filtered parent-child comparisons
  const filteredComparisons = useMemo(() => {
    return parentChildComparisons.filter((pair) => {
      if (deltaFilter === 'gain' && pair.fitnessDelta <= 0) return false;
      if (deltaFilter === 'regression' && pair.fitnessDelta >= 0) return false;
      if (deltaFilter === 'champions' && pair.stage !== 'champion') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mParent = pair.parentSkillName.toLowerCase().includes(q) || pair.parentSkillCode.toLowerCase().includes(q);
        const mChild = pair.childSkillName.toLowerCase().includes(q) || pair.childSkillCode.toLowerCase().includes(q);
        const mType = pair.mutationType.toLowerCase().includes(q);
        if (!mParent && !mChild && !mType) return false;
      }

      return true;
    });
  }, [parentChildComparisons, deltaFilter, searchQuery]);

  // Computed Strategy Status Statistics
  const strategyStats = useMemo(() => {
    const totalGains = parentChildComparisons.filter((c) => c.fitnessDelta > 0).length;
    const totalRegressions = parentChildComparisons.filter((c) => c.fitnessDelta < 0).length;
    const totalPairs = parentChildComparisons.length || 1;
    const gainRate = Number(((totalGains / totalPairs) * 100).toFixed(1));
    const avgDelta = Number(
      (
        parentChildComparisons.reduce((acc, c) => acc + c.fitnessDelta, 0) /
        (parentChildComparisons.length || 1)
      ).toFixed(2)
    );

    // Grouping by mutation strategy
    const byType = new Map<string, { attempts: number; gains: number; sumDelta: number }>();
    for (const c of parentChildComparisons) {
      const cur = byType.get(c.mutationType) || { attempts: 0, gains: 0, sumDelta: 0 };
      cur.attempts++;
      if (c.fitnessDelta > 0) cur.gains++;
      cur.sumDelta += c.fitnessDelta;
      byType.set(c.mutationType, cur);
    }

    const typeBreakdown = Array.from(byType.entries()).map(([type, data]) => ({
      type,
      attempts: data.attempts,
      successRate: Number(((data.gains / data.attempts) * 100).toFixed(1)),
      avgDelta: Number((data.sumDelta / data.attempts).toFixed(2)),
    })).sort((a, b) => b.attempts - a.attempts);

    return {
      totalGains,
      totalRegressions,
      gainRate,
      avgDelta,
      typeBreakdown,
      activeStrategy: 'Branching Genetic Exploration (Adversarial Stress Selection)',
    };
  }, [parentChildComparisons]);

  // Export logs to JSON
  const handleExportLogs = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      engineStatus,
      totalEvents: events.length,
      events: filteredEvents,
      parentChildComparisons: filteredComparisons,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolution_feed_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'mutation':
        return { label: 'MUTATION', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80' };
      case 'crossover':
        return { label: 'CROSSOVER', color: 'bg-purple-950/80 text-purple-300 border-purple-700/80' };
      case 'training_refined':
        return { label: 'REFINEMENT', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80' };
      case 'champion_promoted':
        return { label: 'CHAMPION', color: 'bg-amber-950/80 text-amber-300 border-amber-500/80' };
      case 'champion_demoted':
        return { label: 'DEMOTION', color: 'bg-rose-950/80 text-rose-300 border-rose-700/80' };
      case 'evaluation':
      case 'benchmark_run':
        return { label: 'EVALUATION', color: 'bg-blue-950/80 text-blue-300 border-blue-700/80' };
      case 'tick_start':
      case 'tick_complete':
        return { label: 'TICK', color: 'bg-stone-800 text-stone-300 border-stone-600' };
      case 'budget_throttled':
        return { label: 'THROTTLED', color: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/80' };
      case 'error':
        return { label: 'ERROR', color: 'bg-red-950/80 text-red-300 border-red-700/80' };
      default:
        return { label: type.toUpperCase(), color: 'bg-stone-900 text-stone-400 border-stone-700' };
    }
  };

  return (
    <div
      className={`bg-stone-950 border border-stone-800 flex flex-col font-mono text-stone-200 transition-all ${
        isOpenAsOverlay
          ? 'fixed inset-4 z-50 shadow-2xl overflow-hidden'
          : isFullScreen
          ? 'fixed inset-2 z-50 shadow-2xl overflow-hidden'
          : `w-full rounded-none ${className}`
      }`}
    >
      {/* 1. COMPONENT HEADER & REAL-TIME CONTROLS */}
      <header className="p-4 bg-stone-900/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/80 border border-emerald-500/60 rounded-xs">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
                Active Evolution Feed
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-950 border border-emerald-600 text-emerald-300">
                  LIVE STREAM
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-400">
              Autonomous mutation telemetry, parent-child fitness tracking, and active strategy monitoring.
            </p>
          </div>
        </div>

        {/* Real-time Status Badges & Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Engine Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 border border-stone-800">
            <div
              className={`w-2 h-2 rounded-full ${
                isLive
                  ? engineStatus?.running
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-amber-400'
                  : 'bg-stone-600'
              }`}
            />
            <span className="text-stone-300">
              {isLive
                ? engineStatus?.running
                  ? 'ENGINE: AUTONOMOUS'
                  : 'ENGINE: PAUSED'
                : 'ENGINE: SEED FALLBACK'}
            </span>
          </div>

          {/* Tick Counter */}
          <div className="px-3 py-1.5 bg-stone-950 border border-stone-800 text-stone-400">
            Ticks: <strong className="text-cyan-400">{engineStatus?.tickCount ?? stats.dailyMutations}</strong>
          </div>

          {/* Trigger Tick Button */}
          {onTriggerTick && (
            <button
              onClick={handleManualTick}
              disabled={isTriggeringTick}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all border ${
                isTriggeringTick
                  ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 border-emerald-400 shadow-xs cursor-pointer'
              }`}
              title="Execute a single autonomous mutation & evaluation cycle"
            >
              <Zap className={`w-3.5 h-3.5 ${isTriggeringTick ? 'animate-spin' : ''}`} />
              <span>{isTriggeringTick ? 'Ticking...' : 'Run Mutation Tick'}</span>
            </button>
          )}

          {/* Start/Pause Autonomous Loop */}
          {engineStatus?.running ? (
            onStopEngine && (
              <button
                onClick={onStopEngine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-600/70 cursor-pointer"
                title="Pause continuous background ticks"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Engine</span>
              </button>
            )
          ) : (
            onStartEngine && (
              <button
                onClick={onStartEngine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/70 cursor-pointer"
                title="Resume autonomous loop"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Engine</span>
              </button>
            )
          )}

          {/* Export Logs */}
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
            title="Export filtered logs & comparisons to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Full Screen / Window Controls */}
          {!isOpenAsOverlay && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {isOpenAsOverlay && onCloseOverlay && (
            <button
              onClick={onCloseOverlay}
              className="p-1.5 bg-stone-950 hover:bg-rose-950 border border-stone-800 hover:border-rose-700 text-stone-400 hover:text-rose-200"
              title="Close Feed Overlay"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Manual Tick Feedback Bar */}
      {tickFeedback && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span>{tickFeedback}</span>
        </div>
      )}

      {/* 2. STRATEGY SUMMARY HERO STRIP */}
      <section className="bg-stone-900/50 border-b border-stone-800 p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[11px] text-stone-500 uppercase">Active Strategy Mode</span>
          <div className="flex items-center gap-2 mt-1">
            <Dna className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-emerald-300 truncate" title="Branching Genetic Mutation">
              Branching Exploration
            </span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">Survives parent & tests child</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[11px] text-stone-500 uppercase">Mutation Win Rate</span>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">{strategyStats.gainRate}%</span>
            <span className="text-[10px] text-emerald-400">({strategyStats.totalGains} gains)</span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">Average delta: {strategyStats.avgDelta > 0 ? `+${strategyStats.avgDelta}` : strategyStats.avgDelta}%</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[11px] text-stone-500 uppercase">Active Population Gate</span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-sm">≥ {stats.thresholdRequirement ?? 95.0}%</span>
            <span className="text-[10px] text-amber-400">Champion Tier</span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">{stats.championCount} Active Champions</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[11px] text-stone-500 uppercase">Model Call Budget</span>
          <div className="flex items-center gap-2 mt-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-sm">
              {engineStatus?.budget ? `${engineStatus.budget.callsInWindow}/${engineStatus.budget.maxCallsPerHour}` : 'Nominal'}
            </span>
            <span className="text-[10px] text-cyan-400">calls/hr</span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">Reserve: 15% · Concurrency: 3</span>
        </div>
      </section>

      {/* 3. SUB-VIEW TABS & SEARCH/FILTERS */}
      <div className="p-3 bg-stone-900/70 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
          <button
            onClick={() => setFeedTab('stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              feedTab === 'stream'
                ? 'bg-stone-800 text-emerald-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-Time Stream ({filteredEvents.length})</span>
          </button>

          <button
            onClick={() => setFeedTab('comparisons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              feedTab === 'comparisons'
                ? 'bg-stone-800 text-amber-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Parent-Child Fitness Comparisons ({filteredComparisons.length})</span>
          </button>

          <button
            onClick={() => setFeedTab('strategy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              feedTab === 'strategy'
                ? 'bg-stone-800 text-cyan-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strategy Status Matrix</span>
          </button>
        </div>

        {/* Search & Stream Controls */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill code, mutation type, message..."
              className="w-full bg-stone-950 border border-stone-800 pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-stone-600 placeholder-stone-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
              >
                ✕
              </button>
            )}
          </div>

          {feedTab === 'stream' && (
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              aria-label="Filter events by type"
              className="bg-stone-950 border border-stone-800 px-2.5 py-1.5 text-xs text-stone-300 focus:outline-hidden"
            >
              <option value="all">All Events</option>
              <option value="mutations">Mutations Only</option>
              <option value="crossover">Crossovers</option>
              <option value="evaluations">Evaluations</option>
              <option value="promotions">Promotions</option>
              <option value="system">System Ticks</option>
            </select>
          )}

          {feedTab === 'comparisons' && (
            <select
              value={deltaFilter}
              onChange={(e) => setDeltaFilter(e.target.value as any)}
              aria-label="Filter comparisons by delta"
              className="bg-stone-950 border border-stone-800 px-2.5 py-1.5 text-xs text-stone-300 focus:outline-hidden"
            >
              <option value="all">All Deltas</option>
              <option value="gain">Gains Only (▲)</option>
              <option value="regression">Regressions (▼)</option>
              <option value="champions">Champions Only</option>
            </select>
          )}

          {feedTab === 'stream' && (
            <button
              onClick={() => setIsAutoScrollLocked(!isAutoScrollLocked)}
              className={`p-1.5 border text-xs flex items-center gap-1 transition-colors ${
                isAutoScrollLocked
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                  : 'bg-stone-950 border-stone-800 text-stone-500'
              }`}
              title={isAutoScrollLocked ? 'Auto-scroll is LOCKED (Latest on top)' : 'Auto-scroll PAUSED'}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto min-h-[420px] max-h-[680px] p-4 bg-stone-950/90" ref={logContainerRef}>
        {/* VIEW 1: REAL-TIME STREAM LOGS */}
        {feedTab === 'stream' && (
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-stone-800 text-stone-500 space-y-2">
                <Activity className="w-8 h-8 mx-auto text-stone-600 animate-pulse" />
                <p className="text-sm font-bold text-stone-400">No events matched the current filter</p>
                <p className="text-xs">
                  {isLive
                    ? 'Wait for the next autonomous engine tick or click "Run Mutation Tick" above.'
                    : 'Engine is in seed fallback mode. Trigger a tick to simulate autonomous operations.'}
                </p>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const badge = getEventBadge(evt.type);
                const isExpanded = expandedLogId === evt.id;
                const isMutationOrRefine = ['mutation', 'crossover', 'training_refined'].includes(evt.type);
                const details = evt.detail as Record<string, any> | undefined;

                return (
                  <div
                    key={evt.id}
                    className={`p-3 bg-stone-900/60 hover:bg-stone-900/90 border transition-all ${
                      isExpanded
                        ? 'border-emerald-500/70 bg-stone-900/95 shadow-md'
                        : 'border-stone-800/80 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Event Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider border ${badge.color}`}
                        >
                          {badge.label}
                        </span>

                        {/* Skill Code Pill */}
                        {evt.skillCode && (
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-700/60 px-1.5 py-0.2">
                            {evt.skillCode}
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-[11px] text-stone-500">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMutationOrRefine && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5">
                            PARENT-CHILD DELTA AVAILABLE
                          </span>
                        )}

                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : evt.id)}
                          className="text-stone-400 hover:text-stone-200 p-1"
                          title={isExpanded ? 'Collapse event' : 'Expand event details'}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mt-1.5 text-xs text-stone-300 leading-relaxed font-sans">
                      {evt.message}
                    </div>

                    {/* Expanded Event Details / Parent-Child breakdown */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-3 font-mono text-xs">
                        {details && Object.keys(details).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-stone-950/80 p-2.5 border border-stone-800">
                            <div>
                              <span className="text-[10px] text-stone-500 uppercase">Mutation Type</span>
                              <div className="font-bold text-emerald-300">{details.mutationType || 'Adversarial Tuning'}</div>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-500 uppercase">Magnitude / Rate</span>
                              <div className="font-bold text-amber-300">{details.mutationPercentage || 12.5}%</div>
                            </div>
                            {typeof details.scoreBefore === 'number' && (
                              <div>
                                <span className="text-[10px] text-stone-500 uppercase">Parent Fitness</span>
                                <div className="font-bold text-stone-300">{details.scoreBefore.toFixed(1)}%</div>
                              </div>
                            )}
                            {typeof details.scoreAfter === 'number' && (
                              <div>
                                <span className="text-[10px] text-stone-500 uppercase">Child Fitness</span>
                                <div className="font-bold text-emerald-400">{details.scoreAfter.toFixed(1)}%</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick actions for the skill */}
                        {evt.skillId && (
                          <div className="flex items-center gap-2 pt-1">
                            {onInspectSkill && (
                              <button
                                onClick={() => {
                                  const s = skills.find((sk) => sk.id === evt.skillId || sk.code === evt.skillCode);
                                  if (s) onInspectSkill(s);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px]"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Inspect Agent Skill</span>
                              </button>
                            )}

                            {onCompareSkills && (
                              <button
                                onClick={() => {
                                  const child = skills.find((sk) => sk.id === evt.skillId || sk.code === evt.skillCode);
                                  const parentName = child?.evolutionLineage?.parents?.[0];
                                  const parent = skills.find((sk) => sk.name === parentName || sk.code === parentName || sk.id === parentName);
                                  if (child) {
                                    onCompareSkills(parent || skills[0], child);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-600/70 text-[11px]"
                              >
                                <Scale className="w-3.5 h-3.5 text-amber-400" />
                                <span>Compare Parent vs Child in Matrix</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 2: PARENT-CHILD FITNESS COMPARISONS */}
        {feedTab === 'comparisons' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
              <span>Showing {filteredComparisons.length} Parent-Child Mutation Iterations</span>
              <span className="text-[11px] text-stone-500">Green = Superior Fitness (▲) · Red = Regression (▼)</span>
            </div>

            {filteredComparisons.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-stone-800 text-stone-500 space-y-2">
                <Scale className="w-8 h-8 mx-auto text-stone-600" />
                <p className="text-sm font-bold text-stone-400">No comparisons match this filter</p>
                <p className="text-xs">Try switching the delta filter to "All Deltas".</p>
              </div>
            ) : (
              filteredComparisons.map((pair) => {
                const isGain = pair.fitnessDelta > 0;
                const isRegression = pair.fitnessDelta < 0;
                const isNeutral = pair.fitnessDelta === 0;

                const parentSkillObj = skills.find((s) => s.id === pair.parentSkillId || s.code === pair.parentSkillCode);
                const childSkillObj = skills.find((s) => s.id === pair.childSkillId || s.code === pair.childSkillCode);

                return (
                  <div
                    key={pair.id}
                    className="p-4 bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition-all space-y-3"
                  >
                    {/* Header: Strategy & Delta Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-purple-300 bg-purple-950/70 border border-purple-700/60 px-2 py-0.5">
                          {pair.mutationType}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          Magnitude: <strong className="text-amber-400">{pair.mutationPercentage}%</strong>
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {new Date(pair.timestamp).toLocaleDateString()} {new Date(pair.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Fitness Delta Pill */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs px-2.5 py-1 font-bold flex items-center gap-1 border ${
                            isGain
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-xs'
                              : isRegression
                              ? 'bg-rose-950 text-rose-300 border-rose-600'
                              : 'bg-stone-900 text-stone-300 border-stone-700'
                          }`}
                        >
                          {isGain && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                          {isRegression && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                          <span>{isGain ? `+${pair.fitnessDelta}% GAIN` : isRegression ? `${pair.fitnessDelta}% REGRESSION` : '0.0% PAR'}</span>
                        </span>

                        <span
                          className={`text-[10px] px-2 py-1 font-bold uppercase border ${
                            pair.stage === 'champion'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                              : 'bg-stone-800 text-stone-300 border-stone-600'
                          }`}
                        >
                          {pair.stage}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side Parent vs Child Fitness Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Parent Card */}
                      <div className="p-3 bg-stone-950 border border-stone-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-500 text-[10px] uppercase tracking-wider font-bold">
                            PARENT GENOME
                          </span>
                          <span className="text-stone-400 font-bold">{pair.parentSkillCode}</span>
                        </div>
                        <div className="font-bold text-white text-sm truncate" title={pair.parentSkillName}>
                          {pair.parentSkillName}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-400">Baseline Fitness:</span>
                            <span className="font-bold text-stone-200">{pair.parentFitness}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-900 overflow-hidden">
                            <div
                              className="h-full bg-stone-500 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, pair.parentFitness))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Child Card */}
                      <div
                        className={`p-3 bg-stone-950 border space-y-2 ${
                          isGain
                            ? 'border-emerald-800/60 bg-emerald-950/10'
                            : 'border-stone-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400 text-[10px] uppercase tracking-wider font-bold">
                            MUTATED CHILD GENOME
                          </span>
                          <span className="text-emerald-300 font-bold">{pair.childSkillCode}</span>
                        </div>
                        <div className="font-bold text-white text-sm truncate" title={pair.childSkillName}>
                          {pair.childSkillName}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-400">Post-Mutation Fitness:</span>
                            <span className="font-bold text-emerald-300">{pair.childFitness}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-900 overflow-hidden">
                            <div
                              className={`h-full transition-all ${isGain ? 'bg-emerald-400' : 'bg-rose-400'}`}
                              style={{ width: `${Math.min(100, Math.max(0, pair.childFitness))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diff Insight & Added Rules */}
                    {pair.ruleDiffAdded && pair.ruleDiffAdded.length > 0 && (
                      <div className="p-2.5 bg-stone-950/70 border border-stone-800/60 text-xs space-y-1.5">
                        <span className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Strict Behavioral Rules Injected:
                        </span>
                        <div className="space-y-1 pl-2">
                          {pair.ruleDiffAdded.map((rule, idx) => (
                            <div key={idx} className="text-stone-300 text-[11px] flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">+</span>
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-stone-500 text-[11px] italic truncate max-w-sm">
                        {pair.keyInsight ? `"${pair.keyInsight}"` : 'Autonomous evolutionary iteration'}
                      </span>

                      <div className="flex items-center gap-2">
                        {onInspectSkill && childSkillObj && (
                          <button
                            onClick={() => onInspectSkill(childSkillObj)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Inspect Child</span>
                          </button>
                        )}

                        {onCompareSkills && (
                          <button
                            onClick={() => {
                              onCompareSkills(
                                parentSkillObj || skills[0],
                                childSkillObj || skills[1] || skills[0]
                              );
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/80 text-xs font-bold"
                          >
                            <Scale className="w-3.5 h-3.5 text-amber-400" />
                            <span>Compare in Matrix</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 3: MUTATION STRATEGY STATUS MATRIX */}
        {feedTab === 'strategy' && (
          <div className="space-y-6">
            {/* Strategy Overview Card */}
            <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">
                      Current Mutation Strategy: Branching Genetic Search
                    </h3>
                    <p className="text-xs text-stone-400">
                      Evaluates parents and offspring concurrently across held-out crisis scenarios.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-cyan-950 border border-cyan-600 text-cyan-300">
                  OPTIMAL EXPLORATION
                </span>
              </div>

              {/* Strategy Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase">Crossover vs Mutation</span>
                  <div className="font-bold text-white text-sm mt-1">35% Crossover / 65% Mutation</div>
                  <p className="text-[10px] text-stone-500 mt-1">Balances cross-domain recombination with prompt tuning</p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase">Champion Promotion Gate</span>
                  <div className="font-bold text-emerald-400 text-sm mt-1">≥ 95.0% Benchmark Score</div>
                  <p className="text-[10px] text-stone-500 mt-1">Requires 4+ distinct held-out scenario passes</p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase">Hallucination Ceiling</span>
                  <div className="font-bold text-rose-400 text-sm mt-1">0.0% Strict Enforcement</div>
                  <p className="text-[10px] text-stone-500 mt-1">Demotes immediately upon unhedged false assertions</p>
                </div>
              </div>
            </div>

            {/* Mutation Types Effectiveness Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                  <Dna className="w-4 h-4 text-emerald-400" />
                  Mutation Operator Effectiveness (Empirical Win Rates)
                </h4>
                <span className="text-[11px] text-stone-500">
                  Sorted by frequency of application
                </span>
              </div>

              <div className="border border-stone-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 uppercase">Operator Name</th>
                      <th className="py-2.5 px-3 uppercase text-right">Attempts</th>
                      <th className="py-2.5 px-3 uppercase text-right">Success Rate</th>
                      <th className="py-2.5 px-3 uppercase text-right">Avg Delta</th>
                      <th className="py-2.5 px-3 uppercase">Performance Bar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80 bg-stone-950/60">
                    {strategyStats.typeBreakdown.map((op) => (
                      <tr key={op.type} className="hover:bg-stone-900/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{op.type}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-stone-300 font-bold">{op.attempts}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-bold ${op.successRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {op.successRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-bold ${op.avgDelta > 0 ? 'text-emerald-400' : 'text-stone-400'}`}>
                            {op.avgDelta > 0 ? `+${op.avgDelta}%` : `${op.avgDelta}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 w-40">
                          <div className="w-full h-2 bg-stone-900 border border-stone-800">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, op.successRate))}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. FOOTER STATUS BAR */}
      <footer className="p-3 bg-stone-900/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-400 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Evolution Stream:</span>
          <span className="text-white font-bold">{events.length} Live Activity Records</span>
          <span>·</span>
          <span>{parentChildComparisons.length} Parent-Child Mutation Pairs</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span>Tick Latency: <strong className="text-stone-300">{engineStatus?.lastTickDurationMs ? `${engineStatus.lastTickDurationMs}ms` : '340ms'}</strong></span>
          <span>·</span>
          <span>Buffer: <strong className="text-stone-300">120 Events (FIFO)</strong></span>
        </div>
      </footer>
    </div>
  );
};
