import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { AgentSkill, VectorCategory, SkillEvolutionStage } from '../../types/skills';
import { INITIAL_SKILLS } from '../../data/skillsData';
import { HEATMAP_DATA, SCENARIO_DEFINITIONS } from '../../data/heatmapData';
import {
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Flame,
  Activity,
  Sliders,
  Play,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Info
} from 'lucide-react';

export interface SuccessRateChartProps {
  skills?: AgentSkill[];
  onSelectCategory?: (category: string) => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
  initialSelectedDomain?: string;
}

export interface DomainPerformanceMetric {
  domain: string;
  shortName: string;
  totalSkills: number;
  championCount: number;
  testingCount: number;
  trainingCount: number;
  ideaCount: number;
  averageScore: number;
  successRate: number; // 0 - 100 %
  failureRate: number; // 0 - 100 %
  totalRuns: number;
  successRuns: number;
  failureRuns: number;
  thresholdDelta: number; // relative to 95.0%
  stabilityIndex: number;
  hallucinationRate: number;
  outperformingTier: 'elite' | 'champion' | 'contender' | 'at-risk';
  topSkill?: AgentSkill;
  skills: AgentSkill[];
  primaryFailureVector: string;
  keyInsight: string;
  rank: number;
}

type ViewMetricMode = 'percentage' | 'volume' | 'delta';
type DomainGrouping = 'vectors' | 'scenarios';
type SortOrder = 'outperforming' | 'highest-failure' | 'volume' | 'alphabetical';
type StageFilter = 'all' | 'champion' | 'pipeline';

export const SuccessRateChart: React.FC<SuccessRateChartProps> = ({
  skills = INITIAL_SKILLS,
  onSelectCategory,
  onInspectSkill,
  className = '',
  initialSelectedDomain
}) => {
  const [metricMode, setMetricMode] = useState<ViewMetricMode>('percentage');
  const [domainGrouping, setDomainGrouping] = useState<DomainGrouping>('vectors');
  const [sortOrder, setSortOrder] = useState<SortOrder>('outperforming');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedDomainName, setSelectedDomainName] = useState<string | null>(initialSelectedDomain || null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSimulatingTest, setIsSimulatingTest] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  // Filter skills by stage
  const stageFilteredSkills = useMemo(() => {
    if (stageFilter === 'champion') {
      return skills.filter((s) => s.stage === 'champion');
    }
    if (stageFilter === 'pipeline') {
      return skills.filter((s) => s.stage === 'testing' || s.stage === 'training' || s.stage === 'idea');
    }
    return skills;
  }, [skills, stageFilter]);

  // All known Vector Categories
  const vectorCategories: VectorCategory[] = useMemo(() => [
    'Forensic Accounting',
    'Statistics & Stochastic',
    'Behavioral Psychology',
    'Manipulation & Deception',
    'Game Design & Incentives',
    'Advanced Math',
    'Systems Engineering',
    'Empirical Science',
    'Engineering'
  ], []);

  // Compute metrics by Vector Category
  const vectorMetrics = useMemo<DomainPerformanceMetric[]>(() => {
    const rawMetrics: Omit<DomainPerformanceMetric, 'rank'>[] = vectorCategories.map((cat) => {
      const catSkills = stageFilteredSkills.filter((s) => s.vectors.includes(cat));
      const totalSkills = catSkills.length;

      // Extract testbench and win rate metrics
      let totalRuns = 0;
      let weightedSuccessSum = 0;
      let totalScoreSum = 0;
      let totalStabilitySum = 0;
      let totalHallucinationSum = 0;

      catSkills.forEach((s) => {
        const runs = s.activeTestBench?.totalRunsToday || (s.generation * 14 + 65);
        totalRuns += runs;
        weightedSuccessSum += (s.winRate ?? s.benchmarkScore) * runs;
        totalScoreSum += s.benchmarkScore;
        totalStabilitySum += s.stabilityIndex;
        totalHallucinationSum += s.hallucinationRate;
      });

      // Default baseline if no skills in stage
      const hasSkills = totalSkills > 0 && totalRuns > 0;
      const successRate = hasSkills
        ? Number((weightedSuccessSum / totalRuns).toFixed(1))
        : 88.0;
      const failureRate = Number((100 - successRate).toFixed(1));
      const successRuns = hasSkills
        ? Math.round(totalRuns * (successRate / 100))
        : 0;
      const failureRuns = totalRuns - successRuns;
      const averageScore = hasSkills
        ? Number((totalScoreSum / totalSkills).toFixed(1))
        : 88.0;
      const stabilityIndex = hasSkills
        ? Number((totalStabilitySum / totalSkills).toFixed(1))
        : 94.0;
      const hallucinationRate = hasSkills
        ? Number((totalHallucinationSum / totalSkills).toFixed(2))
        : 0.05;

      const thresholdDelta = Number((successRate - 95.0).toFixed(1));

      // Determine outperforming tier
      let outperformingTier: DomainPerformanceMetric['outperformingTier'] = 'contender';
      if (successRate >= 98.0) {
        outperformingTier = 'elite';
      } else if (successRate >= 95.0) {
        outperformingTier = 'champion';
      } else if (successRate >= 91.0) {
        outperformingTier = 'contender';
      } else {
        outperformingTier = 'at-risk';
      }

      // Top skill in category
      const topSkill = catSkills.length > 0
        ? [...catSkills].sort((a, b) => b.benchmarkScore - a.benchmarkScore)[0]
        : undefined;

      // Primary failure vector insight
      let primaryFailureVector = 'Adversarial boundary edge cases';
      let keyInsight = 'Demonstrates high general stability across standard prompts.';
      
      if (cat === 'Forensic Accounting') {
        primaryFailureVector = 'Disguised synthetic off-balance lease guarantees';
        keyInsight = 'Dominates balance sheet reconstruction; occasional latency on unquantified recourse clauses.';
      } else if (cat === 'Behavioral Psychology') {
        primaryFailureVector = 'Evasive topic switching under executive Q&A';
        keyInsight = 'Excels at semantic distance quantification; vulnerable to hyper-technical jargon deflection.';
      } else if (cat === 'Manipulation & Deception') {
        primaryFailureVector = 'Reverse spoofing & false-positive dark pool liquidity';
        keyInsight = 'Near-perfect deception conviction rate with 0.0% hallucination baseline.';
      } else if (cat === 'Statistics & Stochastic') {
        primaryFailureVector = 'Fat-tailed non-Gaussian jump diffusion de-pegging';
        keyInsight = 'Exceptional volatility shock tolerance; outperforming standard Gaussian stress models.';
      } else if (cat === 'Game Design & Incentives') {
        primaryFailureVector = 'Multi-agent unilateral fire-sale margin run-ons';
        keyInsight = 'Computes Nash equilibrium collapse thresholds with microsecond precision.';
      } else if (cat === 'Systems Engineering') {
        primaryFailureVector = 'Sub-tier single-point packaging substrate dependencies';
        keyInsight = 'Strong network graph traversal; occasional blindspots on multi-tier geographic clusters.';
      } else if (cat === 'Advanced Math') {
        primaryFailureVector = 'Matrix non-invertibility under extreme volatility drift';
        keyInsight = 'Zero rounding divergence; rigorous formal proof generation.';
      } else if (cat === 'Empirical Science') {
        primaryFailureVector = 'P-hacking false-discovery rates in supplementary tables';
        keyInsight = 'High replication fidelity; rigorous statistical significance enforcement.';
      }

      const shortName = cat.replace(' & ', ' / ').replace('Engineering', 'Eng.');

      return {
        domain: cat,
        shortName,
        totalSkills,
        championCount: catSkills.filter((s) => s.stage === 'champion').length,
        testingCount: catSkills.filter((s) => s.stage === 'testing').length,
        trainingCount: catSkills.filter((s) => s.stage === 'training').length,
        ideaCount: catSkills.filter((s) => s.stage === 'idea').length,
        averageScore,
        successRate,
        failureRate,
        totalRuns,
        successRuns,
        failureRuns,
        thresholdDelta,
        stabilityIndex,
        hallucinationRate,
        outperformingTier,
        topSkill,
        skills: catSkills,
        primaryFailureVector,
        keyInsight
      };
    });

    // Rank by successRate descending
    const sorted = [...rawMetrics].sort((a, b) => b.successRate - a.successRate);
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [stageFilteredSkills, vectorCategories]);

  // Compute metrics by Scenario Domain (from HEATMAP_DATA & SCENARIO_DEFINITIONS)
  const scenarioMetrics = useMemo<DomainPerformanceMetric[]>(() => {
    const categories = Array.from(new Set(SCENARIO_DEFINITIONS.map((s) => s.category)));

    const rawMetrics: Omit<DomainPerformanceMetric, 'rank'>[] = categories.map((cat) => {
      const scenarioPoints = HEATMAP_DATA.filter((p) => p.scenarioCategory === cat);
      const totalPoints = scenarioPoints.length;

      let totalRuns = 0;
      let weightedSuccessSum = 0;

      scenarioPoints.forEach((p) => {
        totalRuns += p.testRuns;
        weightedSuccessSum += p.successRate * p.testRuns;
      });

      const successRate = totalRuns > 0
        ? Number((weightedSuccessSum / totalRuns).toFixed(1))
        : 88.0;
      const failureRate = Number((100 - successRate).toFixed(1));
      const successRuns = Math.round(totalRuns * (successRate / 100));
      const failureRuns = totalRuns - successRuns;
      const thresholdDelta = Number((successRate - 95.0).toFixed(1));

      let outperformingTier: DomainPerformanceMetric['outperformingTier'] = 'contender';
      if (successRate >= 98.0) {
        outperformingTier = 'elite';
      } else if (successRate >= 95.0) {
        outperformingTier = 'champion';
      } else if (successRate >= 91.0) {
        outperformingTier = 'contender';
      } else {
        outperformingTier = 'at-risk';
      }

      // Link to skills matching scenario theme
      const matchedSkills = skills.filter((s) =>
        s.vectors.some((v) => cat.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(cat.toLowerCase()))
      );

      const topSkill = matchedSkills.length > 0
        ? [...matchedSkills].sort((a, b) => b.benchmarkScore - a.benchmarkScore)[0]
        : skills[0];

      const primaryPoint = scenarioPoints[0];

      return {
        domain: cat,
        shortName: cat.replace(' & ', ' / '),
        totalSkills: matchedSkills.length || scenarioPoints.length,
        championCount: matchedSkills.filter((s) => s.stage === 'champion').length,
        testingCount: matchedSkills.filter((s) => s.stage === 'testing').length,
        trainingCount: matchedSkills.filter((s) => s.stage === 'training').length,
        ideaCount: matchedSkills.filter((s) => s.stage === 'idea').length,
        averageScore: successRate,
        successRate,
        failureRate,
        totalRuns,
        successRuns,
        failureRuns,
        thresholdDelta,
        stabilityIndex: 98.0,
        hallucinationRate: 0.02,
        outperformingTier,
        topSkill,
        skills: matchedSkills,
        primaryFailureVector: primaryPoint?.keyInsight || 'Adversarial benchmark perturbations',
        keyInsight: `Evaluated across ${scenarioPoints.length} specialized adversarial stress scenarios.`
      };
    });

    const sorted = [...rawMetrics].sort((a, b) => b.successRate - a.successRate);
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [skills]);

  // Active dataset according to grouping
  const activeMetrics = useMemo(() => {
    const list = domainGrouping === 'vectors' ? vectorMetrics : scenarioMetrics;

    let filtered = list;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter((m) =>
        m.domain.toLowerCase().includes(q) ||
        m.primaryFailureVector.toLowerCase().includes(q) ||
        (m.topSkill?.name.toLowerCase().includes(q) ?? false)
      );
    }

    // Apply Sort Order
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'outperforming') {
        return b.successRate - a.successRate;
      }
      if (sortOrder === 'highest-failure') {
        return b.failureRate - a.failureRate;
      }
      if (sortOrder === 'volume') {
        return b.totalRuns - a.totalRuns;
      }
      if (sortOrder === 'alphabetical') {
        return a.domain.localeCompare(b.domain);
      }
      return 0;
    });

    return sorted;
  }, [domainGrouping, vectorMetrics, scenarioMetrics, searchFilter, sortOrder]);

  // Aggregate high-level stats
  const aggregateSummary = useMemo(() => {
    const totalRuns = activeMetrics.reduce((acc, m) => acc + m.totalRuns, 0);
    const totalSuccessRuns = activeMetrics.reduce((acc, m) => acc + m.successRuns, 0);
    const totalFailureRuns = totalRuns - totalSuccessRuns;
    const avgSuccessRate = totalRuns > 0 ? Number(((totalSuccessRuns / totalRuns) * 100).toFixed(1)) : 0;
    const avgFailureRate = Number((100 - avgSuccessRate).toFixed(1));

    const topPerformer = [...activeMetrics].sort((a, b) => b.successRate - a.successRate)[0];
    const highestFailure = [...activeMetrics].sort((a, b) => b.failureRate - a.failureRate)[0];
    const outperformingCount = activeMetrics.filter((m) => m.successRate >= 95.0).length;

    return {
      totalRuns,
      totalSuccessRuns,
      totalFailureRuns,
      avgSuccessRate,
      avgFailureRate,
      topPerformer,
      highestFailure,
      outperformingCount,
      totalDomains: activeMetrics.length
    };
  }, [activeMetrics]);

  // Selected Domain object
  const selectedDomain = useMemo(() => {
    if (!selectedDomainName) return activeMetrics[0] || null;
    return activeMetrics.find((m) => m.domain === selectedDomainName) || activeMetrics[0] || null;
  }, [selectedDomainName, activeMetrics]);

  // Simulate Live Testbench Run on Domain
  const handleSimulateDomainStressTest = async (domainName: string) => {
    setIsSimulatingTest(true);
    setSimulationLog(`Firing 250 parallel adversarial vectors into [${domainName}]...`);

    await new Promise((resolve) => setTimeout(resolve, 650));
    setSimulationLog(`Stress testing multi-agent collusion & prompt perturbation...`);

    await new Promise((resolve) => setTimeout(resolve, 650));
    setSimulationLog(`✅ Testbench completed: 247/250 vectors passed (98.8% compliance). Log recorded.`);

    setTimeout(() => {
      setIsSimulatingTest(false);
      setSimulationLog(null);
    }, 2800);
  };

  // Recharts Custom Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DomainPerformanceMetric = payload[0].payload;
      const isOutperforming = data.successRate >= 95.0;

      return (
        <div className="bg-stone-950/95 border border-stone-700/80 p-3.5 shadow-2xl backdrop-blur-md max-w-xs text-xs font-mono">
          <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2 mb-2">
            <span className="font-bold text-white tracking-wide truncate">{data.domain}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                isOutperforming
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-400'
              }`}
            >
              #{data.rank} {isOutperforming ? 'Outperforming' : 'Under 95% Gate'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-stone-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success Rate:</span>
              </span>
              <strong className="text-emerald-400 text-sm">{data.successRate}%</strong>
            </div>

            <div className="flex items-center justify-between text-stone-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Failure Rate:</span>
              </span>
              <strong className="text-rose-400 text-sm">{data.failureRate}%</strong>
            </div>

            <div className="flex items-center justify-between text-stone-400 pt-1 border-t border-stone-800/80 text-[11px]">
              <span>Successful Tests:</span>
              <span className="text-emerald-300 font-semibold">{data.successRuns.toLocaleString()} runs</span>
            </div>

            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span>Failed Tests:</span>
              <span className="text-rose-300 font-semibold">{data.failureRuns.toLocaleString()} runs</span>
            </div>

            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span>Threshold Delta (95%):</span>
              <span
                className={`font-semibold ${
                  data.thresholdDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.thresholdDelta >= 0 ? `+${data.thresholdDelta}%` : `${data.thresholdDelta}%`}
              </span>
            </div>

            {data.topSkill && (
              <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                <span className="text-amber-400 font-semibold">Top Champion:</span> {data.topSkill.name} ({data.topSkill.benchmarkScore}%)
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Domain Telemetry Overview Banner */}
      <div className="bg-stone-900/60 border border-stone-800/90 p-5 backdrop-blur-xs relative overflow-hidden">
        {/* Glow corner accent */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Agent Skill Performance: Success vs Failure Metrics
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-bold">
                Recharts Telemetry
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-2xl">
              Comparative analysis of agent skill categories. Track which skill domains are{' '}
              <strong className="text-emerald-400 font-semibold">outperforming</strong> the 95.0% qualification barrier
              versus domains experiencing <strong className="text-rose-400 font-semibold">adversarial failure vulnerability</strong>.
            </p>
          </div>

          {/* Quick Benchmark Stats Pill Matrix */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 bg-stone-950/80 border border-stone-800 text-stone-300 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Outperforming Domains:</span>
              <strong className="text-emerald-400">
                {aggregateSummary.outperformingCount}/{aggregateSummary.totalDomains}
              </strong>
            </div>

            <div className="px-3 py-1.5 bg-stone-950/80 border border-stone-800 text-stone-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Matrix Success Avg:</span>
              <strong className="text-emerald-400">{aggregateSummary.avgSuccessRate}%</strong>
            </div>

            <div className="px-3 py-1.5 bg-stone-950/80 border border-stone-800 text-stone-300 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Failure Rate:</span>
              <strong className="text-rose-400">{aggregateSummary.avgFailureRate}%</strong>
            </div>
          </div>
        </div>

        {/* Highlight Insights: Top Outperformer vs At-Risk Domain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {aggregateSummary.topPerformer && (
            <div
              onClick={() => {
                setSelectedDomainName(aggregateSummary.topPerformer.domain);
                onSelectCategory?.(aggregateSummary.topPerformer.domain);
              }}
              className="cursor-pointer p-3 bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[11px]">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>#1 Outperforming Domain</span>
                  <span className="text-[10px] text-emerald-500/80 font-normal">
                    (+{aggregateSummary.topPerformer.thresholdDelta}% over gate)
                  </span>
                </div>
                <div className="text-white font-bold text-sm group-hover:text-emerald-300 transition-colors">
                  {aggregateSummary.topPerformer.domain}
                </div>
                <div className="text-stone-400 text-[11px] line-clamp-1">
                  Lead Champion: {aggregateSummary.topPerformer.topSkill?.name || 'N/A'} ·{' '}
                  {aggregateSummary.topPerformer.successRuns.toLocaleString()} passed tests
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold text-emerald-400">
                  {aggregateSummary.topPerformer.successRate}%
                </div>
                <div className="text-[10px] text-stone-500 uppercase">Success Rate</div>
              </div>
            </div>
          )}

          {aggregateSummary.highestFailure && (
            <div
              onClick={() => {
                setSelectedDomainName(aggregateSummary.highestFailure.domain);
                onSelectCategory?.(aggregateSummary.highestFailure.domain);
              }}
              className="cursor-pointer p-3 bg-rose-950/20 border border-rose-500/30 hover:border-rose-400 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Highest Adversarial Exposure</span>
                  <span className="text-[10px] text-rose-500/80 font-normal">
                    ({aggregateSummary.highestFailure.failureRate}% failure rate)
                  </span>
                </div>
                <div className="text-white font-bold text-sm group-hover:text-rose-300 transition-colors">
                  {aggregateSummary.highestFailure.domain}
                </div>
                <div className="text-stone-400 text-[11px] line-clamp-1">
                  Vulnerability: {aggregateSummary.highestFailure.primaryFailureVector}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold text-rose-400">
                  {aggregateSummary.highestFailure.failureRate}%
                </div>
                <div className="text-[10px] text-stone-500 uppercase">Failure Rate</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Controls & Filtering Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-900/40 border border-stone-800 p-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Grouping Mode */}
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
            <button
              onClick={() => setDomainGrouping('vectors')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                domainGrouping === 'vectors'
                  ? 'bg-stone-800 text-emerald-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Group by Core Agent Skill Vectors"
            >
              Skill Vectors ({vectorCategories.length})
            </button>
            <button
              onClick={() => setDomainGrouping('scenarios')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                domainGrouping === 'scenarios'
                  ? 'bg-stone-800 text-emerald-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Group by Adversarial Scenario Domains"
            >
              Scenario Domains ({scenarioMetrics.length})
            </button>
          </div>

          {/* Metric View Mode */}
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
            <button
              onClick={() => setMetricMode('percentage')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                metricMode === 'percentage'
                  ? 'bg-stone-800 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Stacked Percentage: Success % vs Failure %"
            >
              Success vs Failure %
            </button>
            <button
              onClick={() => setMetricMode('volume')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                metricMode === 'volume'
                  ? 'bg-stone-800 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Absolute Volume: Passed Runs vs Failed Runs"
            >
              Volume (Runs)
            </button>
            <button
              onClick={() => setMetricMode('delta')}
              className={`px-2.5 py-1 text-xs transition-colors ${
                metricMode === 'delta'
                  ? 'bg-stone-800 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Net Delta relative to 95.0% Champion Gate"
            >
              Delta vs Gate (±%)
            </button>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-stone-500">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StageFilter)}
              className="bg-stone-950 border border-stone-800 px-2 py-1 text-stone-200 focus:outline-none focus:border-stone-600"
            >
              <option value="all">All Skills (Idea to Champion)</option>
              <option value="champion">Champions Only (Surpassed Gate)</option>
              <option value="pipeline">Incubator Pipeline (Testing & Training)</option>
            </select>
          </div>
        </div>

        {/* Sort & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-stone-950 border border-stone-800 px-2 py-1 text-stone-200 focus:outline-none focus:border-stone-600"
            >
              <option value="outperforming">Outperforming First (Highest Win %)</option>
              <option value="highest-failure">Highest Failure Rate First</option>
              <option value="volume">Highest Test Volume</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search category or vector..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 pl-8 pr-2.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-600 w-44"
            />
          </div>
        </div>
      </div>

      {/* 3. Primary Recharts Visualization */}
      <div className="bg-stone-950 border border-stone-800/90 p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
              {metricMode === 'percentage' && 'Domain Success Rate (%) vs Failure Rate (%) — Stacked Benchmark View'}
              {metricMode === 'volume' && 'Adversarial Testbench Volume: Successful Executions vs Failed Assertions'}
              {metricMode === 'delta' && 'Domain Outperformance Margin Relative to 95.0% Qualification Gate'}
            </span>
          </div>

          {/* Legend Badges */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {metricMode === 'percentage' && (
              <>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-emerald-500 rounded-none inline-block" />
                  <span>Success %</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-rose-500 rounded-none inline-block" />
                  <span>Failure %</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />
                  <span>95% Champion Gate</span>
                </div>
              </>
            )}

            {metricMode === 'volume' && (
              <>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-emerald-500 rounded-none inline-block" />
                  <span>Passes (Runs)</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-rose-500 rounded-none inline-block" />
                  <span>Failures (Runs)</span>
                </div>
              </>
            )}

            {metricMode === 'delta' && (
              <>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-emerald-500 rounded-none inline-block" />
                  <span>Exceeding Gate (+)</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <span className="w-3 h-3 bg-rose-500 rounded-none inline-block" />
                  <span>Below Gate (-)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* The Recharts Container */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'percentage' ? (
              <BarChart
                data={activeMetrics}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const item: DomainPerformanceMetric = e.activePayload[0].payload;
                    setSelectedDomainName(item.domain);
                    onSelectCategory?.(item.domain);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  stroke="#737373"
                  domain={[0, 100]}
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  unit="%"
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                {/* 95% Qualification Threshold Line */}
                <ReferenceLine
                  y={95}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Champion Gate (95%)',
                    fill: '#eab308',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'top'
                  }}
                />
                <Bar
                  dataKey="successRate"
                  name="Success Rate"
                  stackId="performance"
                  fill="#10b981"
                  cursor="pointer"
                >
                  {activeMetrics.map((entry, index) => {
                    const isSelected = selectedDomainName === entry.domain;
                    return (
                      <Cell
                        key={`cell-success-${index}`}
                        fill={entry.successRate >= 95 ? '#10b981' : '#059669'}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
                <Bar
                  dataKey="failureRate"
                  name="Failure Rate"
                  stackId="performance"
                  fill="#f43f5e"
                  cursor="pointer"
                >
                  {activeMetrics.map((entry, index) => {
                    const isSelected = selectedDomainName === entry.domain;
                    return (
                      <Cell
                        key={`cell-fail-${index}`}
                        fill={entry.failureRate > 8 ? '#f43f5e' : '#e11d48'}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : metricMode === 'volume' ? (
              <BarChart
                data={activeMetrics}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const item: DomainPerformanceMetric = e.activePayload[0].payload;
                    setSelectedDomainName(item.domain);
                    onSelectCategory?.(item.domain);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Bar dataKey="successRuns" name="Passed Runs" fill="#10b981" cursor="pointer" />
                <Bar dataKey="failureRuns" name="Failed Runs" fill="#f43f5e" cursor="pointer" />
              </BarChart>
            ) : (
              <BarChart
                data={activeMetrics}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const item: DomainPerformanceMetric = e.activePayload[0].payload;
                    setSelectedDomainName(item.domain);
                    onSelectCategory?.(item.domain);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  unit="%"
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <ReferenceLine y={0} stroke="#737373" />
                <Bar dataKey="thresholdDelta" name="Delta vs 95% Gate" cursor="pointer">
                  {activeMetrics.map((entry, index) => (
                    <Cell
                      key={`cell-delta-${index}`}
                      fill={entry.thresholdDelta >= 0 ? '#10b981' : '#f43f5e'}
                      stroke={selectedDomainName === entry.domain ? '#ffffff' : 'none'}
                      strokeWidth={selectedDomainName === entry.domain ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-stone-500 pt-2 border-t border-stone-800/80">
          <div>💡 Tip: Click any bar in the chart to inspect that category's failure vectors and champion skills.</div>
          <div className="text-stone-400">
            Adversarial Testbench Standard: <strong>95.0% Minimum Qualifying Pass Rate</strong>
          </div>
        </div>
      </div>

      {/* 4. Domain Deep-Dive Drilldown Panel */}
      {selectedDomain && (
        <div className="bg-stone-900/50 border border-stone-800 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 border ${
                  selectedDomain.successRate >= 95.0
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                }`}
              >
                {selectedDomain.successRate >= 95.0 ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-mono">{selectedDomain.domain}</h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                      selectedDomain.successRate >= 95.0
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                    }`}
                  >
                    Rank #{selectedDomain.rank} ·{' '}
                    {selectedDomain.successRate >= 95.0 ? 'Outperforming Gate' : 'Failure Vulnerability'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">{selectedDomain.keyInsight}</p>
              </div>
            </div>

            {/* Quick Actions for Selected Domain */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateDomainStressTest(selectedDomain.domain)}
                disabled={isSimulatingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-mono transition-colors disabled:opacity-50"
              >
                <Play className={`w-3 h-3 text-emerald-400 ${isSimulatingTest ? 'animate-spin' : ''}`} />
                <span>{isSimulatingTest ? 'Simulating...' : 'Run Domain Stressbench'}</span>
              </button>

              {onSelectCategory && (
                <button
                  onClick={() => onSelectCategory(selectedDomain.domain)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/70 text-xs font-mono transition-colors"
                >
                  <Filter className="w-3 h-3 text-emerald-400" />
                  <span>Filter Dashboard to Domain</span>
                </button>
              )}
            </div>
          </div>

          {/* Simulation Status Flash */}
          {simulationLog && (
            <div className="p-2.5 bg-stone-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono animate-pulse">
              ⚡ {simulationLog}
            </div>
          )}

          {/* Metric Quad Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[11px] uppercase">Success Rate</div>
              <div className="text-xl font-bold text-emerald-400">{selectedDomain.successRate}%</div>
              <div className="text-[10px] text-stone-400">
                {selectedDomain.successRuns.toLocaleString()} passed evaluations
              </div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[11px] uppercase">Failure Rate</div>
              <div className="text-xl font-bold text-rose-400">{selectedDomain.failureRate}%</div>
              <div className="text-[10px] text-stone-400">
                {selectedDomain.failureRuns.toLocaleString()} failed assertions
              </div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[11px] uppercase">Delta vs 95% Gate</div>
              <div
                className={`text-xl font-bold ${
                  selectedDomain.thresholdDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {selectedDomain.thresholdDelta >= 0
                  ? `+${selectedDomain.thresholdDelta}%`
                  : `${selectedDomain.thresholdDelta}%`}
              </div>
              <div className="text-[10px] text-stone-400">
                {selectedDomain.thresholdDelta >= 0 ? 'Exceeds threshold' : 'Under qualification gate'}
              </div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[11px] uppercase">Active Skills in Domain</div>
              <div className="text-xl font-bold text-white">{selectedDomain.totalSkills}</div>
              <div className="text-[10px] text-stone-400">
                {selectedDomain.championCount} Champions · {selectedDomain.testingCount} Testing
              </div>
            </div>
          </div>

          {/* Failure Vector Diagnostic Analysis */}
          <div className="p-3 bg-stone-950/80 border border-stone-800 space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold uppercase text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Identified Adversarial Failure Vector & Stress Pattern:</span>
            </div>
            <div className="text-stone-200 pl-5 text-xs font-sans">
              <strong className="text-white font-mono">{selectedDomain.primaryFailureVector}</strong>: High failure rates in
              this domain originate when adversarial tests apply severe non-linear perturbations. Autonomous prompt
              hardening rules are actively being synthesized in the Training Lab to eliminate this vector.
            </div>
          </div>

          {/* Associated Skills Table/List */}
          {selectedDomain.skills && selectedDomain.skills.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Skills Deployed in {selectedDomain.domain} ({selectedDomain.skills.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedDomain.skills.map((skill) => (
                  <div
                    key={skill.id}
                    onClick={() => onInspectSkill?.(skill)}
                    className="p-2.5 bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            skill.stage === 'champion'
                              ? 'bg-emerald-400'
                              : skill.stage === 'testing'
                              ? 'bg-blue-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                          {skill.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono truncate">
                        {skill.code} · Gen {skill.generation}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {skill.winRate || skill.benchmarkScore}%
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase font-mono">
                        {skill.stage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Domain Rank Leaderboard / Outperformance Matrix Grid */}
      <div className="bg-stone-900/40 border border-stone-800 p-4 space-y-3 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              Domain Performance Leaderboard & Outperformance Hierarchy
            </span>
          </div>
          <span className="text-stone-500 text-[11px]">Sorted by: {sortOrder}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeMetrics.map((item) => {
            const isSelected = selectedDomainName === item.domain;
            const isOutperforming = item.successRate >= 95.0;

            return (
              <div
                key={item.domain}
                onClick={() => {
                  setSelectedDomainName(item.domain);
                  onSelectCategory?.(item.domain);
                }}
                className={`p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 border-white/50 shadow-md ring-1 ring-white/20'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 flex items-center justify-center font-bold text-[10px] border ${
                        item.rank <= 2
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                          : 'bg-stone-900 border-stone-700 text-stone-400'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <span className="font-bold text-white truncate max-w-[170px]" title={item.domain}>
                      {item.domain}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border ${
                      isOutperforming
                        ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-400'
                        : 'bg-rose-950/70 border-rose-600/70 text-rose-400'
                    }`}
                  >
                    {isOutperforming ? 'Outperforming' : 'Needs Hardening'}
                  </span>
                </div>

                {/* Progress bar visualizing Success vs Failure split */}
                <div className="w-full h-2 bg-stone-900 flex overflow-hidden border border-stone-800 mb-2">
                  <div
                    style={{ width: `${item.successRate}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Success: ${item.successRate}%`}
                  />
                  <div
                    style={{ width: `${item.failureRate}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Failure: ${item.failureRate}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="text-emerald-400 font-semibold">Pass: {item.successRate}%</span>
                  <span className="text-rose-400 font-semibold">Fail: {item.failureRate}%</span>
                  <span className="text-stone-500">{item.totalRuns.toLocaleString()} runs</span>
                </div>

                {item.topSkill && (
                  <div className="mt-2 pt-2 border-t border-stone-900 flex items-center justify-between text-[10px] text-stone-500">
                    <span className="truncate max-w-[150px]">🏆 {item.topSkill.name}</span>
                    <span className="text-stone-400">{item.topSkill.benchmarkScore}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
