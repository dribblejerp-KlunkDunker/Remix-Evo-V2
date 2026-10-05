import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Brush,
} from 'recharts';
import type { AgentSkill, EvolutionStats, SkillEvolutionStage } from '../../types/skills';
import { INITIAL_SKILLS, INITIAL_EVOLUTION_STATS } from '../../data/skillsData';
import {
  TrendingUp,
  Lightbulb,
  Wrench,
  FlaskConical,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Download,
  Info,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Play,
  Zap,
} from 'lucide-react';

export interface EvolutionMetricsProps {
  skills?: AgentSkill[];
  stats?: EvolutionStats;
  onInspectSkill?: (skill: AgentSkill) => void;
  onSelectStage?: (stage: SkillEvolutionStage | 'all') => void;
  className?: string;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  compact?: boolean;
}

export type MetricsChartType = 'stacked-area' | 'lines' | 'stacked-bar' | 'percentage';
export type MetricsTimeGranularity = 'generations' | 'epochs' | 'timeline';

export interface StageTimePoint {
  id: string;
  label: string;
  epoch: string;
  generation: number;
  dateStr: string;
  ideas: number;
  training: number;
  testing: number;
  champions: number;
  total: number;
  ideaPercent: number;
  trainingPercent: number;
  testingPercent: number;
  championPercent: number;
  graduationRate: number; // champions / total %
  noveltyYield: number; // new ideas spawned
  promotedToTesting: number;
  promotedToChampion: number;
  topPromotedSkill?: string;
  milestone?: string;
}

const STAGE_CONFIG = {
  idea: {
    label: 'Idea (Genesis)',
    short: 'Ideas',
    color: '#f59e0b', // amber-500
    fillColor: 'url(#colorIdeas)',
    stroke: '#f59e0b',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    description: 'Autonomous cross-vector hypotheses & seeds',
  },
  training: {
    label: 'Training (Alignment)',
    short: 'Training',
    color: '#3b82f6', // blue-500
    fillColor: 'url(#colorTraining)',
    stroke: '#3b82f6',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    description: 'Disciplined rule injection & boundary limits',
  },
  testing: {
    label: 'Testing (Benchmark)',
    short: 'Testing',
    color: '#a855f7', // purple-500
    fillColor: 'url(#colorTesting)',
    stroke: '#a855f7',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    description: 'Adversarial edge-case validation suites',
  },
  champion: {
    label: 'Champion (Fielded)',
    short: 'Champions',
    color: '#10b981', // emerald-500
    fillColor: 'url(#colorChampions)',
    stroke: '#10b981',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    description: 'Production-ready agents exceeding ≥ 95.0%',
  },
} as const;

export const EvolutionMetrics: React.FC<EvolutionMetricsProps> = ({
  skills = INITIAL_SKILLS,
  stats = INITIAL_EVOLUTION_STATS,
  onInspectSkill,
  onSelectStage,
  className = '',
  isOpenAsOverlay = false,
  onCloseOverlay,
  compact = false,
}) => {
  const [chartType, setChartType] = useState<MetricsChartType>('stacked-area');
  const [granularity, setGranularity] = useState<MetricsTimeGranularity>('generations');
  const [activeStages, setActiveStages] = useState<Record<SkillEvolutionStage, boolean>>({
    idea: true,
    training: true,
    testing: true,
    champion: true,
  });
  const [selectedPoint, setSelectedPoint] = useState<StageTimePoint | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showBrush, setShowBrush] = useState(false);
  const [showFunnel, setShowFunnel] = useState(true);
  const [generationOffset, setGenerationOffset] = useState<number>(0);

  // Toggle stage filter
  const toggleStage = (stage: SkillEvolutionStage) => {
    setActiveStages((prev) => {
      const next = { ...prev, [stage]: !prev[stage] };
      // Ensure at least one stage is active
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  };

  // Reconstruct time series from skills array and evolution stats
  const timeSeriesData = useMemo<StageTimePoint[]>(() => {
    const currentSkills = skills && skills.length > 0 ? skills : INITIAL_SKILLS;
    
    // Find max generation present in population
    const maxGen = Math.max(...currentSkills.map((s) => s.generation || 1), 14) + generationOffset;
    const minGen = 1;

    // Milestone notes mapped to specific historical generation steps
    const milestones: Record<number, string> = {
      1: 'Genesis: Seeded foundational Vector Archetypes',
      3: 'First Autonomous Mutation: Adversarial Constraints added',
      5: 'Breakthrough: Forensic Dissector passed 90% benchmark',
      8: 'Swarm Expansion: Stochastic Arbitrageur entered testing',
      11: 'Champion Cohort: First multi-vector convergence ≥ 95%',
      14: 'Current Evolution Frontier: Cross-domain genetic recombination',
    };

    const points: StageTimePoint[] = [];

    // Synthesize chronological evolution curve leading up to current live population
    for (let gen = minGen; gen <= maxGen; gen++) {
      // Linear and sigmoid progression factors
      const t = gen / maxGen;
      
      // Calculate realistic cohort distributions advancing from Idea -> Training -> Testing -> Champion
      let ideas: number;
      let training: number;
      let testing: number;
      let champions: number;

      if (gen === maxGen) {
        // Match exact current skills and stats counts at latest step
        ideas = stats.ideaCount || currentSkills.filter((s) => s.stage === 'idea').length;
        training = stats.trainingCount || currentSkills.filter((s) => s.stage === 'training').length;
        testing = stats.testingCount || currentSkills.filter((s) => s.stage === 'testing').length;
        champions = stats.championCount || currentSkills.filter((s) => s.stage === 'champion').length;
      } else {
        // Historical curve modelling: early generations had high ideas, low champions
        const totalHistorical = Math.max(3, Math.round(3 + (stats.totalSkills - 3) * Math.pow(t, 0.8)));
        
        // Champion proportion starts at 0 and grows in later generations
        const champProportion = Math.max(0, Math.pow(Math.max(0, t - 0.25) / 0.75, 1.8));
        champions = Math.max(0, Math.round(stats.championCount * champProportion));
        
        // Testing grows in middle to late
        const testProportion = Math.sin(t * Math.PI * 0.9);
        testing = Math.max(0, Math.round(stats.testingCount * Math.max(0.1, testProportion)));
        
        // Training peaks in middle
        const trainProportion = Math.sin(t * Math.PI * 0.7);
        training = Math.max(1, Math.round(stats.trainingCount * Math.max(0.2, trainProportion)));

        // Ideas are high early on and replenish continually
        const remaining = totalHistorical - (champions + testing + training);
        ideas = Math.max(1, remaining > 0 ? remaining : Math.round(2 + Math.sin(gen * 1.3) * 1.5));
      }

      const total = ideas + training + testing + champions;
      const ideaPercent = Number(((ideas / total) * 100).toFixed(1));
      const trainingPercent = Number(((training / total) * 100).toFixed(1));
      const testingPercent = Number(((testing / total) * 100).toFixed(1));
      const championPercent = Number(((champions / total) * 100).toFixed(1));
      const graduationRate = Number(((champions / total) * 100).toFixed(1));

      // Date projection
      const dayOffset = (maxGen - gen) * 2;
      const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      points.push({
        id: `gen-${gen}`,
        label: granularity === 'generations' ? `Gen ${gen}` : granularity === 'epochs' ? `Epoch ${gen * 3}` : dateStr,
        epoch: `Epoch ${gen * 3 + 2}`,
        generation: gen,
        dateStr,
        ideas,
        training,
        testing,
        champions,
        total,
        ideaPercent,
        trainingPercent,
        testingPercent,
        championPercent,
        graduationRate,
        noveltyYield: Math.max(1, Math.round(ideas * 1.4)),
        promotedToTesting: Math.max(0, Math.round(testing * 0.6)),
        promotedToChampion: Math.max(0, Math.round(champions * 0.4)),
        milestone: milestones[gen] || (gen % 3 === 0 ? `Epoch Cycle ${gen} Re-evaluation` : undefined),
      });
    }

    return points;
  }, [skills, stats, granularity, generationOffset]);

  // Current active totals
  const currentTotal = stats.totalSkills || (stats.ideaCount + stats.trainingCount + stats.testingCount + stats.championCount);
  const championConversionRate = currentTotal > 0 ? ((stats.championCount / currentTotal) * 100).toFixed(1) : '0';
  const testingPassRate = stats.testingCount > 0 ? ((stats.championCount / (stats.testingCount + stats.championCount)) * 100).toFixed(1) : '0';

  // Advance simulated generation
  const handleAdvanceGeneration = () => {
    setGenerationOffset((prev) => prev + 1);
  };

  const handleResetGeneration = () => {
    setGenerationOffset(0);
    setSelectedPoint(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Generation', 'Date', 'Ideas', 'Training', 'Testing', 'Champions', 'Total', 'Champion%'];
    const rows = timeSeriesData.map((d) => [
      d.generation,
      d.dateStr,
      d.ideas,
      d.training,
      d.testing,
      d.champions,
      d.total,
      `${d.championPercent}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skill_evolution_metrics_gen${timeSeriesData.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: StageTimePoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-stone-950/95 border border-stone-800 p-4 rounded-none shadow-2xl backdrop-blur-md max-w-xs text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
          <div className="font-bold text-stone-200 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{label}</span>
          </div>
          <span className="text-[10px] text-stone-500">{data.dateStr}</span>
        </div>

        {data.milestone && (
          <div className="mb-3 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300">
            ★ {data.milestone}
          </div>
        )}

        <div className="space-y-1.5 mb-3">
          {activeStages.champion && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Champions:
              </span>
              <span className="font-bold text-stone-100">
                {data.champions}{' '}
                <span className="text-[10px] text-stone-500 font-normal">({data.championPercent}%)</span>
              </span>
            </div>
          )}

          {activeStages.testing && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Testing:
              </span>
              <span className="font-bold text-stone-100">
                {data.testing}{' '}
                <span className="text-[10px] text-stone-500 font-normal">({data.testingPercent}%)</span>
              </span>
            </div>
          )}

          {activeStages.training && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Training:
              </span>
              <span className="font-bold text-stone-100">
                {data.training}{' '}
                <span className="text-[10px] text-stone-500 font-normal">({data.trainingPercent}%)</span>
              </span>
            </div>
          )}

          {activeStages.idea && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Ideas:
              </span>
              <span className="font-bold text-stone-100">
                {data.ideas}{' '}
                <span className="text-[10px] text-stone-500 font-normal">({data.ideaPercent}%)</span>
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-stone-400">
          <span>Total Population:</span>
          <span className="font-bold text-stone-100">{data.total} Skills</span>
        </div>
        <div className="flex items-center justify-between text-stone-400 text-[10px] mt-0.5">
          <span>Champion Yield:</span>
          <span className="font-semibold text-emerald-400">{data.graduationRate}%</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-stone-900 border border-stone-800 text-stone-100 font-sans transition-all flex flex-col ${
        isFullScreen ? 'fixed inset-0 z-50 p-6 overflow-y-auto' : 'p-4 md:p-6'
      } ${className}`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-amber-500/20 via-purple-500/20 to-emerald-500/20 border border-stone-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight text-stone-100">
                  Skill Evolution Metrics
                </h2>
                <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
                  RECHARTS ENGINE
                </span>
                <span className="px-2 py-0.5 bg-stone-800 border border-stone-700 text-[10px] font-mono text-stone-400">
                  {timeSeriesData.length} GENERATIONS
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Visualizing skill evolution progress over time across Ideas, Training, Testing, and Champions
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5 font-mono text-xs">
            <button
              onClick={() => setChartType('stacked-area')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                chartType === 'stacked-area'
                  ? 'bg-stone-800 text-cyan-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Stacked Area: Cumulative distribution stream"
            >
              Stacked Stream
            </button>
            <button
              onClick={() => setChartType('lines')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                chartType === 'lines'
                  ? 'bg-stone-800 text-cyan-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Line Chart: Individual stage trajectory trends"
            >
              Trajectories
            </button>
            <button
              onClick={() => setChartType('stacked-bar')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                chartType === 'stacked-bar'
                  ? 'bg-stone-800 text-cyan-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Stacked Bar: Generation cohorts breakdown"
            >
              Cohorts
            </button>
            <button
              onClick={() => setChartType('percentage')}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                chartType === 'percentage'
                  ? 'bg-stone-800 text-cyan-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Percentage 100%: Pipeline maturity conversion"
            >
              100% Funnel
            </button>
          </div>

          {/* Granularity switch */}
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5 font-mono text-xs">
            <button
              onClick={() => setGranularity('generations')}
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                granularity === 'generations' ? 'bg-stone-800 text-stone-100 font-bold' : 'text-stone-400'
              }`}
            >
              Generations
            </button>
            <button
              onClick={() => setGranularity('epochs')}
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                granularity === 'epochs' ? 'bg-stone-800 text-stone-100 font-bold' : 'text-stone-400'
              }`}
            >
              Epochs
            </button>
            <button
              onClick={() => setGranularity('timeline')}
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                granularity === 'timeline' ? 'bg-stone-800 text-stone-100 font-bold' : 'text-stone-400'
              }`}
            >
              Timeline
            </button>
          </div>

          {/* Simulation Step Button */}
          <button
            onClick={handleAdvanceGeneration}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold cursor-pointer transition-all active:scale-95"
            title="Advance simulated evolutionary generation"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>+1 Gen</span>
          </button>

          {generationOffset > 0 && (
            <button
              onClick={handleResetGeneration}
              className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-950 border border-stone-800 cursor-pointer"
              title="Reset simulated generations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-950 border border-stone-800 cursor-pointer"
            title="Export CSV data"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Full Screen */}
          <button
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-950 border border-stone-800 cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {isOpenAsOverlay && onCloseOverlay && (
            <button
              onClick={onCloseOverlay}
              className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-950 border border-stone-800 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TOP STATS CARDS: TRACKING THE 4 STAGES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        {/* IDEAS */}
        <div
          onClick={() => {
            toggleStage('idea');
            onSelectStage?.('idea');
          }}
          className={`p-3.5 border transition-all cursor-pointer relative ${
            activeStages.idea
              ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
              : 'bg-stone-950/60 border-stone-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Stage 1 · Ideas
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300">
              {((stats.ideaCount / currentTotal) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-stone-100">{stats.ideaCount}</span>
            <span className="text-xs text-stone-400 font-mono">skills</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Hypotheses & seed mutations
          </p>
          <div className="mt-2 h-1 w-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${(stats.ideaCount / currentTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* TRAINING */}
        <div
          onClick={() => {
            toggleStage('training');
            onSelectStage?.('training');
          }}
          className={`p-3.5 border transition-all cursor-pointer relative ${
            activeStages.training
              ? 'bg-blue-950/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.08)]'
              : 'bg-stone-950/60 border-stone-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Stage 2 · Training
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-300">
              {((stats.trainingCount / currentTotal) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-stone-100">{stats.trainingCount}</span>
            <span className="text-xs text-stone-400 font-mono">skills</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Rule adherence & constraints
          </p>
          <div className="mt-2 h-1 w-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${(stats.trainingCount / currentTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* TESTING */}
        <div
          onClick={() => {
            toggleStage('testing');
            onSelectStage?.('testing');
          }}
          className={`p-3.5 border transition-all cursor-pointer relative ${
            activeStages.testing
              ? 'bg-purple-950/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.08)]'
              : 'bg-stone-950/60 border-stone-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Stage 3 · Testing
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-500/20 text-purple-300">
              {((stats.testingCount / currentTotal) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-stone-100">{stats.testingCount}</span>
            <span className="text-xs text-stone-400 font-mono">skills</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Adversarial cases (target ≥ 95.0%)
          </p>
          <div className="mt-2 h-1 w-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-500"
              style={{ width: `${(stats.testingCount / currentTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* CHAMPION */}
        <div
          onClick={() => {
            toggleStage('champion');
            onSelectStage?.('champion');
          }}
          className={`p-3.5 border transition-all cursor-pointer relative ${
            activeStages.champion
              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
              : 'bg-stone-950/60 border-stone-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Stage 4 · Champions
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300">
              {((stats.championCount / currentTotal) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-stone-100">{stats.championCount}</span>
            <span className="text-xs text-stone-400 font-mono">skills</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">
            Fielded titleholders in production
          </p>
          <div className="mt-2 h-1 w-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${(stats.championCount / currentTotal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FILTER BAR & TOGGLE LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-stone-950/80 border border-stone-800/80 px-3.5 py-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-stone-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Visible Stages:
          </span>
          {(['idea', 'training', 'testing', 'champion'] as SkillEvolutionStage[]).map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const isChecked = activeStages[stage];
            return (
              <button
                key={stage}
                onClick={() => toggleStage(stage)}
                className={`flex items-center gap-1.5 px-2 py-1 transition-all cursor-pointer border ${
                  isChecked
                    ? `${cfg.bg} ${cfg.border} ${cfg.text} font-bold`
                    : 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isChecked ? cfg.stroke : '#57534e' }}
                />
                <span>{cfg.short}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-stone-400 text-[11px]">
          <span>
            Total Population:{' '}
            <strong className="text-stone-200">{timeSeriesData[timeSeriesData.length - 1]?.total}</strong>
          </span>
          <span className="text-stone-700">|</span>
          <span>
            Graduation Rate:{' '}
            <strong className="text-emerald-400">{championConversionRate}%</strong>
          </span>
          <span className="text-stone-700">|</span>
          <button
            onClick={() => setShowBrush((b) => !b)}
            className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
          >
            {showBrush ? 'Hide Zoom Slider' : 'Zoom Slider'}
          </button>
        </div>
      </div>

      {/* MAIN RECHARTS CONTAINER */}
      <div className="bg-stone-950 border border-stone-800 p-4 relative min-h-[360px] flex-1 flex flex-col justify-center">
        {/* SVG Gradients for smooth neon glowing areas */}
        <div className="h-80 md:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'stacked-area' ? (
              <AreaChart
                data={timeSeriesData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorChampions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorTesting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorTraining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <YAxis
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                  label={{
                    value: 'Skill Count',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#78716c',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontFamily: 'monospace', fontSize: 11 }}
                  formatter={(val: string) => (
                    <span className="text-stone-300 font-semibold">{val}</span>
                  )}
                />

                {/* Stacked Areas in lifecycle order: Ideas -> Training -> Testing -> Champions */}
                {activeStages.idea && (
                  <Area
                    type="monotone"
                    dataKey="ideas"
                    name="Ideas"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#colorIdeas)"
                    strokeWidth={2}
                  />
                )}
                {activeStages.training && (
                  <Area
                    type="monotone"
                    dataKey="training"
                    name="Training"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#colorTraining)"
                    strokeWidth={2}
                  />
                )}
                {activeStages.testing && (
                  <Area
                    type="monotone"
                    dataKey="testing"
                    name="Testing"
                    stackId="1"
                    stroke="#a855f7"
                    fill="url(#colorTesting)"
                    strokeWidth={2}
                  />
                )}
                {activeStages.champion && (
                  <Area
                    type="monotone"
                    dataKey="champions"
                    name="Champions"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#colorChampions)"
                    strokeWidth={2}
                  />
                )}
                {showBrush && (
                  <Brush
                    dataKey="label"
                    height={25}
                    stroke="#44403c"
                    fill="#1c1917"
                    tickFormatter={() => ''}
                  />
                )}
              </AreaChart>
            ) : chartType === 'lines' ? (
              <LineChart
                data={timeSeriesData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <YAxis
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                  label={{
                    value: 'Skill Count',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#78716c',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontFamily: 'monospace', fontSize: 11 }}
                  formatter={(val: string) => (
                    <span className="text-stone-300 font-semibold">{val}</span>
                  )}
                />

                {activeStages.idea && (
                  <Line
                    type="monotone"
                    dataKey="ideas"
                    name="Ideas"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    activeDot={{ r: 6, fill: '#fbbf24' }}
                  />
                )}
                {activeStages.training && (
                  <Line
                    type="monotone"
                    dataKey="training"
                    name="Training"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                )}
                {activeStages.testing && (
                  <Line
                    type="monotone"
                    dataKey="testing"
                    name="Testing"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#a855f7' }}
                    activeDot={{ r: 6, fill: '#c084fc' }}
                  />
                )}
                {activeStages.champion && (
                  <Line
                    type="monotone"
                    dataKey="champions"
                    name="Champions"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 7, fill: '#34d399' }}
                  />
                )}
                {showBrush && (
                  <Brush
                    dataKey="label"
                    height={25}
                    stroke="#44403c"
                    fill="#1c1917"
                    tickFormatter={() => ''}
                  />
                )}
              </LineChart>
            ) : chartType === 'stacked-bar' ? (
              <BarChart
                data={timeSeriesData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <YAxis
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontFamily: 'monospace', fontSize: 11 }}
                  formatter={(val: string) => (
                    <span className="text-stone-300 font-semibold">{val}</span>
                  )}
                />

                {activeStages.idea && (
                  <Bar dataKey="ideas" name="Ideas" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                )}
                {activeStages.training && (
                  <Bar dataKey="training" name="Training" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                )}
                {activeStages.testing && (
                  <Bar dataKey="testing" name="Testing" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                )}
                {activeStages.champion && (
                  <Bar dataKey="champions" name="Champions" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                )}
                {showBrush && (
                  <Brush
                    dataKey="label"
                    height={25}
                    stroke="#44403c"
                    fill="#1c1917"
                    tickFormatter={() => ''}
                  />
                )}
              </BarChart>
            ) : (
              /* Percentage Area Chart (100% normalized) */
              <AreaChart
                data={timeSeriesData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                />
                <YAxis
                  stroke="#78716c"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#44403c' }}
                  unit="%"
                  domain={[0, 100]}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontFamily: 'monospace', fontSize: 11 }}
                  formatter={(val: string) => (
                    <span className="text-stone-300 font-semibold">{val}</span>
                  )}
                />

                {activeStages.idea && (
                  <Area
                    type="monotone"
                    dataKey="ideaPercent"
                    name="Ideas %"
                    stackId="pct"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                )}
                {activeStages.training && (
                  <Area
                    type="monotone"
                    dataKey="trainingPercent"
                    name="Training %"
                    stackId="pct"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                )}
                {activeStages.testing && (
                  <Area
                    type="monotone"
                    dataKey="testingPercent"
                    name="Testing %"
                    stackId="pct"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.6}
                  />
                )}
                {activeStages.champion && (
                  <Area
                    type="monotone"
                    dataKey="championPercent"
                    name="Champions %"
                    stackId="pct"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.7}
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SELECTED GENERATION INSPECTOR / DETAILS DRAWER */}
      {selectedPoint && (
        <div className="mt-4 p-4 bg-stone-950 border border-stone-800 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-stone-200">
                Generation Snapshot: {selectedPoint.label} ({selectedPoint.epoch})
              </span>
              <span className="text-stone-500">· Date: {selectedPoint.dateStr}</span>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-stone-500 hover:text-stone-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="p-2.5 bg-stone-900 border border-stone-800">
              <span className="text-amber-400 font-bold block mb-1">Ideas Count</span>
              <span className="text-lg text-stone-100 font-bold">{selectedPoint.ideas}</span>
              <span className="text-[10px] text-stone-500 block">
                {selectedPoint.ideaPercent}% of cohort
              </span>
            </div>
            <div className="p-2.5 bg-stone-900 border border-stone-800">
              <span className="text-blue-400 font-bold block mb-1">Training Count</span>
              <span className="text-lg text-stone-100 font-bold">{selectedPoint.training}</span>
              <span className="text-[10px] text-stone-500 block">
                {selectedPoint.trainingPercent}% of cohort
              </span>
            </div>
            <div className="p-2.5 bg-stone-900 border border-stone-800">
              <span className="text-purple-400 font-bold block mb-1">Testing Count</span>
              <span className="text-lg text-stone-100 font-bold">{selectedPoint.testing}</span>
              <span className="text-[10px] text-stone-500 block">
                {selectedPoint.testingPercent}% of cohort
              </span>
            </div>
            <div className="p-2.5 bg-stone-900 border border-stone-800">
              <span className="text-emerald-400 font-bold block mb-1">Champions Count</span>
              <span className="text-lg text-stone-100 font-bold">{selectedPoint.champions}</span>
              <span className="text-[10px] text-stone-500 block">
                {selectedPoint.championPercent}% of cohort
              </span>
            </div>
          </div>

          {selectedPoint.milestone && (
            <div className="p-2 bg-stone-900/60 border border-amber-500/20 text-stone-300 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Historical Milestone:</span>
              <span>{selectedPoint.milestone}</span>
            </div>
          )}
        </div>
      )}

      {/* PIPELINE FUNNEL CONVERSION SUMMARY */}
      {showFunnel && (
        <div className="mt-4 pt-4 border-t border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Evolution Pipeline Conversion Funnel
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              Graduation Threshold: ≥ {stats.thresholdRequirement || 95.0}% Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono">
            {/* Step 1 */}
            <div className="p-3 bg-stone-950 border border-amber-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>1. Idea Genesis</span>
                <span>{stats.ideaCount}</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Cross-domain vector remixing
              </p>
              <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                <span>Pass to Training:</span>
                <span className="text-stone-300">~100%</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-stone-950 border border-blue-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400 font-bold">
                <span>2. Training Alignment</span>
                <span>{stats.trainingCount}</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Invariant rule distillation
              </p>
              <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                <span>Rule Compliance:</span>
                <span className="text-stone-300">{stats.averageCompliance || 99.4}%</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-stone-950 border border-purple-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-400 font-bold">
                <span>3. Adversarial Testing</span>
                <span>{stats.testingCount}</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Historical stress testbenches
              </p>
              <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                <span>Pass Rate:</span>
                <span className="text-purple-300 font-bold">{testingPassRate}%</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-stone-950 border border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>4. Champion Deployment</span>
                <span>{stats.championCount}</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Elite production field tests
              </p>
              <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                <span>Overall Yield:</span>
                <span className="text-emerald-400 font-bold">{championConversionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
