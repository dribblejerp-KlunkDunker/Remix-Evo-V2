import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Zap,
  Activity,
  CheckCircle2,
  Layers,
  Dna,
  FlaskConical,
  Cpu,
  Scale,
  Trophy,
  Brain,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AgentSkill } from '../../types/skills';
import { WORKFLOW_STAGES, WorkflowStageInfo } from './UserGuideModal';

interface AutomatedWorkflowRunnerProps {
  isActive: boolean;
  onClose: () => void;
  currentSubView: string;
  onSwitchSubView: (subView: string) => void;
  skills: AgentSkill[];
  stats: {
    totalSkills: number;
    championCount: number;
    inTrainingCount: number;
    testingCount: number;
    ideaCount: number;
    avgFitness: number;
    thresholdRequirement: number;
  };
  activeConflictsCount: number;
  onTriggerTick?: () => Promise<void>;
  onOpenGuide: () => void;
}

export const AutomatedWorkflowRunner: React.FC<AutomatedWorkflowRunnerProps> = ({
  isActive,
  onClose,
  currentSubView,
  onSwitchSubView,
  skills,
  stats,
  activeConflictsCount,
  onTriggerTick,
  onOpenGuide
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [stepDurationSeconds, setStepDurationSeconds] = useState<number>(8);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(8);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const currentStage: WorkflowStageInfo = WORKFLOW_STAGES[currentStepIndex] || WORKFLOW_STAGES[0];

  // Keep subview synced with stage
  useEffect(() => {
    if (isActive && currentStage) {
      if (currentSubView !== currentStage.subViewId) {
        onSwitchSubView(currentStage.subViewId);
      }
    }
  }, [isActive, currentStepIndex, currentStage, currentSubView, onSwitchSubView]);

  // Auto-play timer
  useEffect(() => {
    if (!isActive || !isAutoPlaying) return;

    setSecondsRemaining(stepDurationSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance to next step or loop back to 0
          setCurrentStepIndex((curr) => (curr + 1) % WORKFLOW_STAGES.length);
          return stepDurationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isAutoPlaying, currentStepIndex, stepDurationSeconds]);

  // Navigate to step
  const handleGoToStep = (index: number) => {
    setCurrentStepIndex(index);
    setSecondsRemaining(stepDurationSeconds);
  };

  const handleNext = () => {
    handleGoToStep((currentStepIndex + 1) % WORKFLOW_STAGES.length);
  };

  const handlePrev = () => {
    handleGoToStep((currentStepIndex - 1 + WORKFLOW_STAGES.length) % WORKFLOW_STAGES.length);
  };

  // Perform action for current step
  const handleExecuteStepAction = async () => {
    setActionFeedback('Executing phase benchmark...');
    try {
      if (onTriggerTick) {
        await onTriggerTick();
      }
      setActionFeedback(`Phase ${currentStage.step} telemetry updated!`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback(`Simulated Phase ${currentStage.step} cycle completed.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Step-specific chart and stat data
  const stepData = useMemo(() => {
    switch (currentStage.step) {
      case 1: {
        // Population Distribution by Stage
        const data = [
          { name: 'Idea', count: stats.ideaCount, fill: '#78716c' },
          { name: 'Training', count: stats.inTrainingCount, fill: '#3b82f6' },
          { name: 'Testing', count: stats.testingCount, fill: '#eab308' },
          { name: 'Champion', count: stats.championCount, fill: '#10b981' }
        ];
        return {
          chartType: 'bar',
          data,
          xKey: 'name',
          yKey: 'count',
          label: 'Skill Count by Stage',
          stats: [
            { label: 'Active Population', value: `${stats.totalSkills} bots` },
            { label: 'Mean Fitness', value: `${stats.avgFitness.toFixed(1)}%` },
            { label: 'Champion Threshold', value: `≥ ${stats.thresholdRequirement.toFixed(1)}%` },
            { label: 'Ecosystem Balance', value: 'Optimal (4 Stages)' }
          ]
        };
      }
      case 2: {
        // Mutation variance & synthetic test runs
        const data = [
          { name: 'Base A', passRate: 74, rate: 0.12 },
          { name: 'Branch B', passRate: 82, rate: 0.28 },
          { name: 'Segment C', passRate: 89, rate: 0.45 },
          { name: 'Segment D', passRate: 94, rate: 0.35 },
          { name: 'Synthesized', passRate: 96, rate: 0.18 }
        ];
        return {
          chartType: 'area',
          data,
          xKey: 'name',
          yKey: 'passRate',
          label: 'Synthetic Pass Rate (%)',
          stats: [
            { label: 'Mutation Rate', value: '0.24 σ' },
            { label: 'Recombination Temp', value: '0.65 T' },
            { label: 'Synthetic Pass Rate', value: '92.4%' },
            { label: 'Viable Genomes', value: '18 Synthesized' }
          ]
        };
      }
      case 3: {
        // Epoch convergence & cognitive load
        const data = [
          { epoch: 'E1', loss: 0.82, cognitiveLoad: 42 },
          { epoch: 'E2', loss: 0.58, cognitiveLoad: 56 },
          { epoch: 'E3', loss: 0.39, cognitiveLoad: 68 },
          { epoch: 'E4', loss: 0.24, cognitiveLoad: 61 },
          { epoch: 'E5', loss: 0.14, cognitiveLoad: 54 }
        ];
        return {
          chartType: 'area',
          data,
          xKey: 'epoch',
          yKey: 'cognitiveLoad',
          label: 'Cognitive Load Index',
          stats: [
            { label: 'Training Incubators', value: `${stats.inTrainingCount} in Epochs` },
            { label: 'Attention Entropy', value: '1.42 nats' },
            { label: 'Token Efficiency', value: '1,420 t/min' },
            { label: 'Convergence Loss', value: '0.142 (Stabilized)' }
          ]
        };
      }
      case 4: {
        // Arena Stress Testing & Logic Puzzle Win Rates
        const data = [
          { scenario: 'Nash', winRate: 91 },
          { scenario: 'Bayes', winRate: 88 },
          { scenario: 'Forensic', winRate: 95 },
          { scenario: 'Crisis', winRate: 86 },
          { scenario: 'Collusion', winRate: 93 }
        ];
        return {
          chartType: 'bar',
          data,
          xKey: 'scenario',
          yKey: 'winRate',
          label: 'Arena Stress Win Rate (%)',
          stats: [
            { label: 'Arena Win Rate', value: '90.6%' },
            { label: 'Logic Puzzles Solved', value: '14,280 / 15k' },
            { label: 'Red-Team Defense', value: '98.2% Defended' },
            { label: 'Edge-Case Coverage', value: '94.5% Matrix' }
          ]
        };
      }
      case 5: {
        // Conflicts & Lineage Audits
        const data = [
          { gen: 'Gen 1', collisions: 5, resolved: 5 },
          { gen: 'Gen 2', collisions: 8, resolved: 7 },
          { gen: 'Gen 3', collisions: 4, resolved: 4 },
          { gen: 'Gen 4', collisions: activeConflictsCount + 2, resolved: 2 },
          { gen: 'Gen 5', collisions: activeConflictsCount, resolved: Math.max(0, 3 - activeConflictsCount) }
        ];
        return {
          chartType: 'bar',
          data,
          xKey: 'gen',
          yKey: 'resolved',
          label: 'Conflicts Arbitrated',
          stats: [
            { label: 'Active Conflicts', value: `${activeConflictsCount} Pending` },
            { label: 'Semantic Overlap', value: activeConflictsCount > 0 ? '12.4% Cosine' : '0.0% Isolated' },
            { label: 'Lineage Depth', value: '5 Generations' },
            { label: 'Provenance Hashes', value: '100% Cryptographic' }
          ]
        };
      }
      case 6:
      default: {
        // Top 5 Champion Leaderboard
        const top5 = [...skills]
          .filter((s) => s.stage === 'champion')
          .sort((a, b) => b.benchmarkScore - a.benchmarkScore)
          .slice(0, 5)
          .map((s, idx) => ({
            name: `#${idx + 1} ${s.name.split(' ')[0]}`,
            score: s.benchmarkScore,
            fill: idx === 0 ? '#f59e0b' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#b45309' : '#10b981'
          }));

        return {
          chartType: 'bar',
          data: top5,
          xKey: 'name',
          yKey: 'score',
          label: 'Champion Fitness Score',
          stats: [
            { label: 'Champion Count', value: `${stats.championCount} Active` },
            { label: 'Highest Score', value: `${top5[0]?.score?.toFixed(1) ?? '98.5'}%` },
            { label: 'Stress Benchmark', value: '96.2% Crisis Pass' },
            { label: 'Status', value: 'Certified for Swarm' }
          ]
        };
      }
    }
  }, [currentStage.step, stats, skills, activeConflictsCount]);

  if (!isActive) return null;

  const StageIcon = currentStage.icon;
  const progressPercent = ((stepDurationSeconds - secondsRemaining) / stepDurationSeconds) * 100;

  return (
    <div
      aria-label="Automated Evolution Pipeline HUD"
      className="sticky top-0 z-40 bg-stone-950/95 border-b-2 border-amber-500 shadow-2xl backdrop-blur-md text-stone-200 transition-all duration-300"
    >
      {/* Progress countdown ticker bar */}
      <div className="w-full bg-stone-900 h-1 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isAutoPlaying ? 'bg-amber-400' : 'bg-stone-600'
          }`}
          style={{ width: `${isAutoPlaying ? progressPercent : 100}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Step Info & Stage Description */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <StageIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-bold uppercase tracking-wider text-[10px]">
                  Step {currentStage.step} of 6
                </span>
                <span className="text-amber-400 font-bold">
                  {currentStage.name}
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-stone-400 text-[11px]">
                  Viewing tab: <strong className="text-stone-200">{currentStage.subViewId}</strong>
                </span>
                {isAutoPlaying && (
                  <span className="text-[11px] font-mono text-amber-300/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Auto-advancing in {secondsRemaining}s</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-300 font-sans mt-1 line-clamp-2 leading-relaxed">
                <strong className="text-amber-300 font-mono">Order of Execution: </strong>
                {currentStage.tagline}
              </p>
            </div>
          </div>

          {/* Center: Real-Time Stats & Micro Graph */}
          <div className="flex items-center gap-4 bg-stone-900/80 border border-stone-800 p-2.5 shrink-0 min-w-[320px]">
            {/* 4 Key Stat Pills */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono shrink-0">
              {stepData.stats.map((s, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] text-stone-500 uppercase truncate">{s.label}</span>
                  <span className="text-stone-200 font-bold truncate">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Embedded Micro-Chart */}
            <div className="w-32 h-14 bg-stone-950/60 border border-stone-800/80 p-1 shrink-0 relative">
              <span className="absolute top-1 right-1 text-[8px] font-mono text-stone-500 pointer-events-none">
                {stepData.label}
              </span>
              <ResponsiveContainer width="100%" height="100%">
                {stepData.chartType === 'bar' ? (
                  <BarChart data={stepData.data as any[]} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Bar dataKey={stepData.yKey} isAnimationActive={false}>
                      {(stepData.data as any[]).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={stepData.data as any[]} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Area
                      type="monotone"
                      dataKey={stepData.yKey}
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Controller Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {actionFeedback && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-600/70 px-2 py-1 animate-in fade-in">
                {actionFeedback}
              </span>
            )}

            <button
              onClick={handleExecuteStepAction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/60 text-xs font-mono transition-colors cursor-pointer"
              title="Simulate / Refresh this phase telemetry"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Run Phase Tick</span>
            </button>

            <div className="flex items-center bg-stone-900 border border-stone-800 p-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Previous Workflow Step"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
                title={isAutoPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Next Workflow Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenGuide}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-mono text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Open Full User Guide & Workflow Encyclopedia"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-900 transition-colors cursor-pointer"
              title="Close Workflow HUD"
              aria-label="Close Workflow HUD"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stage step breadcrumbs */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-900 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider shrink-0 mr-1">
            Pipeline Sequence:
          </span>
          {WORKFLOW_STAGES.map((stage, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={stage.id}
                onClick={() => handleGoToStep(idx)}
                className={`text-[10px] font-mono px-2 py-0.5 transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  isCurrent
                    ? 'bg-amber-600 text-stone-950 font-bold border-amber-400'
                    : 'bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-stone-800'
                }`}
              >
                <span>{stage.step}. {stage.name}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
