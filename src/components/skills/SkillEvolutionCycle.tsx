import React from 'react';
import { SkillEvolutionStage, EvolutionStats } from '../../types/skills';
import { Lightbulb, Wrench, FlaskConical, Trophy, ArrowRight, Activity, Flame, ShieldCheck, Network, GitFork, TrendingUp } from 'lucide-react';

interface SkillEvolutionCycleProps {
  stats: EvolutionStats;
  selectedStage: SkillEvolutionStage | 'all';
  onSelectStage: (stage: SkillEvolutionStage | 'all') => void;
  onSimulateTick: () => void;
  isSimulating?: boolean;
  onOpenForceGraph?: () => void;
  onOpenEvolutionHistory?: () => void;
  onOpenMetrics?: () => void;
}

export const SkillEvolutionCycle: React.FC<SkillEvolutionCycleProps> = ({
  stats,
  selectedStage,
  onSelectStage,
  onSimulateTick,
  isSimulating = false,
  onOpenForceGraph,
  onOpenEvolutionHistory,
  onOpenMetrics,
}) => {
  const stages: {
    key: SkillEvolutionStage;
    label: string;
    sublabel: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    glowColor: string;
    borderActive: string;
    bgActive: string;
    badgeText: string;
    description: string;
    metricLabel: string;
    metricValue: string;
  }[] = [
    {
      key: 'idea',
      label: 'Idea',
      sublabel: 'Vector Seed & Hypothesis',
      count: stats.ideaCount,
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
      color: 'text-amber-400',
      glowColor: 'from-amber-500/20 to-transparent',
      borderActive: 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      bgActive: 'bg-amber-950/20',
      badgeText: 'Stage 01 · Genesis',
      description: 'Cross-domain vector remixing (Psychology, Math, Forensics, Game Theory). Novel hypotheses spawned autonomously.',
      metricLabel: 'Novelty Yield',
      metricValue: '14/hr'
    },
    {
      key: 'training',
      label: 'Training',
      sublabel: 'Constraint & Rule Alignment',
      count: stats.trainingCount,
      icon: <Wrench className="w-5 h-5 text-blue-400" />,
      color: 'text-blue-400',
      glowColor: 'from-blue-500/20 to-transparent',
      borderActive: 'border-blue-400/80 shadow-[0_0_20px_rgba(96,165,250,0.15)]',
      bgActive: 'bg-blue-950/20',
      badgeText: 'Stage 02 · Alignment',
      description: 'Distilling specialist prompt directives, enforcing strict failure rules, and mapping rigorous boundary conditions.',
      metricLabel: 'Rule Rigor',
      metricValue: '100% adherence'
    },
    {
      key: 'testing',
      label: 'Testing',
      sublabel: 'Adversarial Benchmarks',
      count: stats.testingCount,
      icon: <FlaskConical className="w-5 h-5 text-purple-400" />,
      color: 'text-purple-400',
      glowColor: 'from-purple-500/20 to-transparent',
      borderActive: 'border-purple-400/80 shadow-[0_0_20px_rgba(192,132,252,0.15)]',
      bgActive: 'bg-purple-950/20',
      badgeText: 'Stage 03 · Benchmark',
      description: 'Graded against 50+ real-world historical fraud cases and market shocks. Must hit ≥ 95.0% threshold to pass.',
      metricLabel: 'Pass Threshold',
      metricValue: '≥ 95.0% score'
    },
    {
      key: 'champion',
      label: 'Champion',
      sublabel: 'Active Field Deployment',
      count: stats.championCount,
      icon: <Trophy className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-400',
      glowColor: 'from-emerald-500/20 to-transparent',
      borderActive: 'border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.2)]',
      bgActive: 'bg-emerald-950/20',
      badgeText: 'Stage 04 · Elite Active',
      description: 'Tested in live production analysis runs. Defends title against challengers in continuous autonomous cycles.',
      metricLabel: 'Avg Win Rate',
      metricValue: '98.2%'
    }
  ];

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-none p-6 shadow-xl relative overflow-hidden">
      {/* Decorative ambient background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header bar with autonomous matrix status */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Autonomous Evolution Matrix · Active Run
            </span>
            <span className="text-stone-600 font-mono text-xs">/</span>
            <span className="font-mono text-xs text-stone-400">Zero True Downtime</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Skill Evolution Lifecycle
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl font-sans">
            Continuous agent mutation engine. Skills evolve across four stages, disciplined by strict mathematical rules and tested until breaking the 95.0% threshold.
          </p>
        </div>

        {/* Action button & overall metrics */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
          {onOpenMetrics && (
            <button
              onClick={onOpenMetrics}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/60 hover:border-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              title="Open Recharts visual metrics tracking Idea, Training, Testing, and Champion counts over time"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Over-Time Metrics</span>
            </button>
          )}

          {onOpenForceGraph && (
            <button
              onClick={onOpenForceGraph}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-700/60 hover:border-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              title="Open interactive D3.js force-directed graph of skill evolution and migration"
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>D3 Force Migration Graph</span>
            </button>
          )}

          {onOpenEvolutionHistory && (
            <button
              onClick={onOpenEvolutionHistory}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-700/60 hover:border-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              title="Open Evolution History side panel to track mutations & merged parent seeds"
            >
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>Evolution History Panel</span>
            </button>
          )}

          <button
            onClick={onSimulateTick}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 hover:text-white border border-stone-700 hover:border-stone-600 transition-all disabled:opacity-50"
            title="Trigger an autonomous cycle tick to grade and mutate skills"
          >
            <Flame className={`w-3.5 h-3.5 text-amber-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Running Cycle...' : 'Pulse Evolution Tick'}</span>
          </button>

          <button
            onClick={() => onSelectStage('all')}
            className={`px-3 py-2 text-xs font-mono transition-colors border ${
              selectedStage === 'all'
                ? 'bg-stone-800 text-white border-stone-600'
                : 'bg-transparent text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            Show All ({stats.totalSkills})
          </button>
        </div>
      </div>

      {/* The 4 Stage Pipeline visualization */}
      <div className="relative z-10 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {stages.map((stage, idx) => {
            const isSelected = selectedStage === stage.key;
            return (
              <div key={stage.key} className="relative flex flex-col">
                {/* Arrow connector between stages on desktop */}
                {idx < stages.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center text-stone-600">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onSelectStage(stage.key)}
                  className={`text-left w-full h-full p-4 border transition-all flex flex-col justify-between group ${
                    isSelected
                      ? `${stage.borderActive} ${stage.bgActive}`
                      : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-800/40'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-none bg-stone-800/80 border border-stone-700/60">
                        {stage.icon}
                      </div>
                      <span className="font-mono text-xs uppercase tracking-wider text-stone-400">
                        {stage.badgeText}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-stone-100">
                        {stage.label}
                      </h3>
                      <span className="font-mono text-xl font-bold text-white">
                        {stage.count}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 tracking-tight mb-2">
                      {stage.sublabel}
                    </div>

                    <p className="text-xs text-stone-400 leading-relaxed font-sans line-clamp-3 mb-4">
                      {stage.description}
                    </p>
                  </div>

                  {/* Stage metric footer */}
                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-500">{stage.metricLabel}</span>
                    <span className={`font-semibold ${stage.color}`}>{stage.metricValue}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Autonomous Agent Status & Qualification Rules Bar */}
        <div className="mt-5 p-3.5 bg-stone-950/70 border border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-stone-300 font-mono">
              <span className="text-white font-semibold">Active Agent Loop:</span> Autonomous agents continually grade candidate skills against 10-K disclosures & extreme market shocks. Even when idle, agents evaluate and cross-breed.
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-stone-400 shrink-0 self-end md:self-auto">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Champion Gate: <span className="text-amber-300 font-semibold">Score ≥ 95.0%</span> & <span className="text-amber-300 font-semibold">0 Hallucinations</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
