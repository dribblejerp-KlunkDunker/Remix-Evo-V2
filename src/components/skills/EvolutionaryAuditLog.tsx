import React, { useState, useMemo } from 'react';
import { AgentSkill } from '../../types/skills';
import {
  CHAMPION_EVOLUTION_AUDIT_LOGS,
  EVOLUTIONARY_AUDIT_STATS
} from '../../data/evolutionAuditData';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  GitFork,
  Trophy,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Search,
  Download,
  Play,
  Cpu,
  Layers,
  Flame,
  Check,
  ChevronRight,
  History,
  Info
} from 'lucide-react';

interface EvolutionaryAuditLogProps {
  skills?: AgentSkill[];
  selectedSkillId?: string;
  onInspectSkill?: (skill: AgentSkill) => void;
  onOpenRemixWithParents?: (parentNames: string[]) => void;
}

export const EvolutionaryAuditLog: React.FC<EvolutionaryAuditLogProps> = ({
  skills = [],
  selectedSkillId,
  onInspectSkill,
  onOpenRemixWithParents
}) => {
  // State for logs (allowing live simulated mutations to add iterations)
  const [auditLogs, setAuditLogs] = useState(CHAMPION_EVOLUTION_AUDIT_LOGS);
  const [selectedChampionId, setSelectedChampionId] = useState<string>(
    selectedSkillId || CHAMPION_EVOLUTION_AUDIT_LOGS[0].championId
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | 'idea' | 'training' | 'testing' | 'champion'>('all');
  const [expandedIterations, setExpandedIterations] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });
  const [isSimulatingMutation, setIsSimulatingMutation] = useState(false);
  const [activeIterationSnapshot, setActiveIterationSnapshot] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Active selected audit
  const activeAudit = useMemo(() => {
    return (
      auditLogs.find((log) => log.championId === selectedChampionId) ||
      auditLogs[0]
    );
  }, [auditLogs, selectedChampionId]);

  // Filtered list of champions for the selector
  const filteredChampions = useMemo(() => {
    return auditLogs.filter((audit) => {
      const query = searchQuery.toLowerCase();
      return (
        audit.championName.toLowerCase().includes(query) ||
        audit.championCode.toLowerCase().includes(query) ||
        audit.remixVectorCombo.toLowerCase().includes(query) ||
        audit.parentSeeds.some((p) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query))
      );
    });
  }, [auditLogs, searchQuery]);

  // Filtered iterations within the active audit
  const displayedIterations = useMemo(() => {
    if (selectedStageFilter === 'all') return activeAudit.iterations;
    return activeAudit.iterations.filter((iter) => iter.stage === selectedStageFilter);
  }, [activeAudit, selectedStageFilter]);

  // Toggle iteration details
  const toggleIteration = (iterNum: number) => {
    setExpandedIterations((prev) => ({
      ...prev,
      [iterNum]: !prev[iterNum]
    }));
  };

  // Recharts Chart Data: Performance progression vs Mutation Percentage
  const chartData = useMemo(() => {
    const points: any[] = [];
    // Initial Seed Point
    points.push({
      name: 'Seed',
      score: activeAudit.initialScore,
      mutationRate: 0,
      delta: 0,
      stage: 'Seed Stage',
      epoch: 'Seed Recombination'
    });

    activeAudit.iterations.forEach((iter) => {
      points.push({
        name: `Iter ${iter.iterationNumber}`,
        score: iter.scoreAfter,
        mutationRate: iter.mutationPercentage,
        delta: iter.performanceDelta,
        stage: iter.stage.toUpperCase(),
        epoch: iter.epoch
      });
    });

    return points;
  }, [activeAudit]);

  // Simulate Evolutionary Step on active champion
  const handleSimulateMutationStep = async () => {
    setIsSimulatingMutation(true);
    await new Promise((r) => setTimeout(r, 700));

    const nextIterationNumber = activeAudit.iterations.length + 1;
    const currentScore = activeAudit.currentScore;
    // As skills get closer to 100, mutations become smaller and more surgical
    const mutationPct = Number((Math.random() * 2.5 + 1.2).toFixed(1));
    const deltaGain = Number((Math.random() * 0.4 + 0.1).toFixed(1));
    const newScore = Math.min(99.8, Number((currentScore + deltaGain).toFixed(1)));
    const epochName = `Epoch-Omega-${nextIterationNumber + 14} (Hyper-Tuning)`;

    const newIteration = {
      iterationNumber: nextIterationNumber,
      epoch: epochName,
      timestamp: 'Just now',
      stage: 'champion' as const,
      parentSkillIds: activeAudit.parentSeeds.map((p) => p.code),
      parentSkillNames: activeAudit.parentSeeds.map((p) => p.name),
      mutationPercentage: mutationPct,
      scoreBefore: currentScore,
      scoreAfter: newScore,
      performanceDelta: deltaGain,
      recombinationStrategy: 'Live Dynamic Mutation: Surgical constraint reinforcement on edge-case stressbench.',
      mutationType: 'Surgical Prompt Micro-Calibration',
      mutationDetails:
        'Refined zero-shot numerical sensitivity threshold by +0.05σ. Calibrated deterministic output token budget.',
      ruleDiff: {
        added: [
          `RULE: Epoch-Omega constraint: Enforce strict sub-15ms parsing latency on multi-million cell tabular inputs.`
        ],
        modified: [
          `Re-verified zero-tolerance threshold against latest SEC restatement corpus.`
        ]
      },
      testPassRate: 99.5,
      testCasesRun: 600 + nextIterationNumber * 25,
      survived: true,
      keyInsight: `Live evolutionary step achieved a +${deltaGain}% performance improvement delta with ${mutationPct}% prompt genome mutation.`
    };

    setAuditLogs((prev) =>
      prev.map((item) => {
        if (item.championId === activeAudit.championId) {
          const updatedIterations = [...item.iterations, newIteration];
          return {
            ...item,
            currentScore: newScore,
            totalPerformanceDelta: Number((item.totalPerformanceDelta + deltaGain).toFixed(1)),
            averageMutationRate: Number(
              (
                updatedIterations.reduce((acc, curr) => acc + curr.mutationPercentage, 0) /
                updatedIterations.length
              ).toFixed(1)
            ),
            iterations: updatedIterations
          };
        }
        return item;
      })
    );

    setExpandedIterations((prev) => ({
      ...prev,
      [nextIterationNumber]: true
    }));

    setIsSimulatingMutation(false);
  };

  // Export provenance JSON
  const handleExportProvenance = () => {
    const exportData = {
      auditTimestamp: new Date().toISOString(),
      provenanceStandard: 'AgentSkills.io/v1-Evolutionary-Provenance',
      champion: {
        id: activeAudit.championId,
        code: activeAudit.championCode,
        name: activeAudit.championName,
        currentScore: activeAudit.currentScore,
        qualificationThreshold: 95.0,
        totalPerformanceDelta: `+${activeAudit.totalPerformanceDelta}%`,
        averageMutationRate: `${activeAudit.averageMutationRate}%`,
        remixVectorCombo: activeAudit.remixVectorCombo,
        parents: activeAudit.parentSeeds
      },
      evolutionIterations: activeAudit.iterations.map((iter) => ({
        iteration: iter.iterationNumber,
        epoch: iter.epoch,
        timestamp: iter.timestamp,
        stage: iter.stage,
        parentSeedsCombined: iter.parentSkillNames,
        mutationPercentage: `${iter.mutationPercentage}%`,
        performanceDelta: `${iter.performanceDelta >= 0 ? '+' : ''}${iter.performanceDelta}%`,
        scoreTrajectory: `${iter.scoreBefore}% -> ${iter.scoreAfter}%`,
        recombinationStrategy: iter.recombinationStrategy,
        mutationType: iter.mutationType,
        ruleDiff: iter.ruleDiff,
        testPassRate: `${iter.testPassRate}%`,
        survived: iter.survived,
        keyInsight: iter.keyInsight
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeAudit.championCode}-evolutionary-lineage-audit.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopyStatus('Audit JSON Downloaded!');
    setTimeout(() => setCopyStatus(null), 3000);
  };

  return (
    <div className="space-y-8 font-sans text-stone-200">
      {/* 1. TOP AUDIT BANNER & SYSTEMIC METRICS */}
      <section className="bg-stone-950/80 border border-stone-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3 h-3 text-purple-400" />
                Lineage Provenance & Gene Audit
              </span>
              <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-400 font-mono text-[10px]">
                Voyager & PromptBreeder Mutation Architecture
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Evolutionary Audit Log</span>
              <span className="text-xs font-mono font-normal text-stone-400">
                (Skill Lineage, Mutation % & Performance Deltas)
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Track the exact parent skills combined (remixed) to breed each Champion.
              Inspect prompt genome mutation rates, rule diffs, and the empirical performance
              improvement delta (<span className="text-emerald-400 font-mono">Δ</span>) across every generational iteration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateMutationStep}
              disabled={isSimulatingMutation}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-md"
            >
              <Cpu className={`w-4 h-4 ${isSimulatingMutation ? 'animate-spin' : ''}`} />
              <span>{isSimulatingMutation ? 'Computing Mutation...' : 'Step Evolution Iteration'}</span>
            </button>

            <button
              onClick={handleExportProvenance}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-mono text-xs transition-colors"
              title="Download reproducible provenance audit"
            >
              <Download className="w-4 h-4 text-stone-400" />
              <span>{copyStatus || 'Export Audit Log'}</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-stone-800/80 font-mono">
          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Audited Champions</div>
            <div className="text-lg font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <Trophy className="w-4 h-4" />
              <span>{EVOLUTIONARY_AUDIT_STATS.totalAuditedChampions}</span>
            </div>
            <div className="text-[10px] text-stone-500">100% ≥ 95.0% Gate</div>
          </div>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Total Iterations</div>
            <div className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
              <History className="w-4 h-4 text-purple-400" />
              <span>
                {auditLogs.reduce((acc, curr) => acc + curr.iterations.length, 0)}
              </span>
            </div>
            <div className="text-[10px] text-stone-500">Recorded Lineage Epochs</div>
          </div>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Avg Mutation Rate</div>
            <div className="text-lg font-bold text-purple-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-4 h-4" />
              <span>{EVOLUTIONARY_AUDIT_STATS.averageMutationRate}%</span>
            </div>
            <div className="text-[10px] text-stone-500">Decays as skill stabilizes</div>
          </div>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Avg Δ Gain / Iter</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4" />
              <span>+{EVOLUTIONARY_AUDIT_STATS.averagePerformanceDelta}%</span>
            </div>
            <div className="text-[10px] text-stone-500">Empirical Fitness Delta</div>
          </div>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Net Systemic Delta</div>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">
              +{auditLogs.reduce((acc, curr) => acc + curr.totalPerformanceDelta, 0).toFixed(1)}%
            </div>
            <div className="text-[10px] text-stone-500">Cumulative Seed-to-Champ</div>
          </div>

          <div className="p-3 bg-stone-900/60 border border-stone-800/80">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Hallucination Rate</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>0.0%</span>
            </div>
            <div className="text-[10px] text-stone-500">Strict Rule Constraint</div>
          </div>
        </div>
      </section>

      {/* 2. CHAMPION LINEAGE SELECTOR STRIP */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
              Select Champion Lineage to Audit ({filteredChampions.length} Available)
            </span>
          </div>

          {/* Search Champion */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by champion or parent skill..."
              className="w-full bg-stone-900 border border-stone-800 pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
            />
          </div>
        </div>

        {/* Champion Cards Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {filteredChampions.map((audit) => {
            const isSelected = audit.championId === activeAudit.championId;
            return (
              <button
                key={audit.championId}
                onClick={() => {
                  setSelectedChampionId(audit.championId);
                  setActiveIterationSnapshot(null);
                }}
                className={`p-3 text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/80 shadow-lg ring-1 ring-purple-500/50'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] mb-1">
                    <span className="text-stone-500">{audit.championCode}</span>
                    <span className="px-1.5 py-0.2 bg-amber-400/10 text-amber-400 font-bold border border-amber-400/30">
                      {audit.currentScore.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {audit.championName}
                  </h4>
                  <div className="text-[10px] text-purple-300 font-mono line-clamp-1 mt-0.5">
                    {audit.remixVectorCombo}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-stone-500">
                    {audit.iterations.length} Iterations
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Δ +{audit.totalPerformanceDelta.toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. VISUAL LINEAGE GRAPH / TREE: PARENTS -> ITERATION PIPELINE -> CHAMPION */}
      <section className="bg-stone-950 border border-stone-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/80 text-amber-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Active Champion Target
              </span>
              <span className="text-stone-500 font-mono text-xs">{activeAudit.championCode}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {activeAudit.championName}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5 max-w-3xl">
              {activeAudit.lineageSummary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onInspectSkill && skills.find((s) => s.id === activeAudit.championId) && (
              <button
                onClick={() => {
                  const s = skills.find((sk) => sk.id === activeAudit.championId);
                  if (s) onInspectSkill(s);
                }}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Inspect in Skill Modal</span>
              </button>
            )}

            {onOpenRemixWithParents && (
              <button
                onClick={() =>
                  onOpenRemixWithParents(activeAudit.parentSeeds.map((p) => p.name))
                }
                className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Remix Parents Again</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Lineage Flow: Parent Seeds -> Generational Iteration Pipeline -> Champion */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Interactive Lineage Recombination Flow</span>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/80 p-5 rounded-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* PARENT SEEDS (Left, 4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Combined Parent Seeds (Genetic Donors)
                </div>

                {activeAudit.parentSeeds.map((seed, idx) => (
                  <div
                    key={seed.id}
                    className="p-3 bg-stone-950 border border-purple-900/40 relative font-mono group hover:border-purple-600 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-purple-300 font-bold">{seed.code}</span>
                      <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 text-[9px]">
                        Weight: {seed.contributionWeight}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{seed.name}</div>
                    <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-between">
                      <span>Vector: <strong className="text-stone-300">{seed.vector}</strong></span>
                      <span className="text-stone-500">Seed Score: {seed.seedScore.toFixed(1)}%</span>
                    </div>
                    <div className="text-[9px] text-stone-500 mt-1 italic">
                      Source: {seed.source}
                    </div>
                  </div>
                ))}

                <div className="text-[11px] text-stone-500 font-mono text-center pt-1">
                  Recombination Vector: <span className="text-purple-300">{activeAudit.remixVectorCombo}</span>
                </div>
              </div>

              {/* FLOW CONNECTOR (Center, 1 col) */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-2 text-stone-600 py-2">
                <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-purple-500 to-transparent" />
                <div className="p-1.5 bg-stone-900 border border-stone-800 rounded-full text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="hidden lg:block w-px h-8 bg-gradient-to-t from-emerald-500 to-transparent" />
              </div>

              {/* ITERATION STEPS PIPELINE (Center-Right, 5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Iteration Convergence Chain ({activeAudit.iterations.length} Epochs)
                  </span>
                  <span className="text-[10px] text-stone-500">Click node to inspect</span>
                </div>

                <div className="space-y-2">
                  {activeAudit.iterations.map((iter) => {
                    const isSnapshotActive = activeIterationSnapshot === iter.iterationNumber;
                    return (
                      <button
                        key={iter.iterationNumber}
                        onClick={() => {
                          setActiveIterationSnapshot(
                            isSnapshotActive ? null : iter.iterationNumber
                          );
                          setExpandedIterations((prev) => ({
                            ...prev,
                            [iter.iterationNumber]: true
                          }));
                        }}
                        className={`w-full p-2.5 text-left font-mono text-xs border transition-all flex items-center justify-between ${
                          isSnapshotActive
                            ? 'bg-emerald-950/40 border-emerald-400 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {iter.iterationNumber}
                          </span>
                          <div>
                            <div className="text-[11px] font-bold text-white truncate max-w-[190px]">
                              {iter.epoch}
                            </div>
                            <div className="text-[10px] text-stone-500 flex items-center gap-2">
                              <span>Mut: <strong className="text-purple-400">{iter.mutationPercentage}%</strong></span>
                              <span>·</span>
                              <span>Score: {iter.scoreBefore.toFixed(1)}% → {iter.scoreAfter.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-[10px]">
                            Δ +{iter.performanceDelta.toFixed(1)}%
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-stone-500 transition-transform ${
                              isSnapshotActive ? 'rotate-90 text-emerald-400' : ''
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FLOW CONNECTOR (Center, 1 col) */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-2 text-stone-600 py-2">
                <ChevronRight className="w-5 h-5 text-amber-400 hidden lg:block" />
              </div>

              {/* FINAL CHAMPION NODE (Right, 1 col) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-center p-3 bg-amber-950/30 border border-amber-500/60 font-mono">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-400 mb-2">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                  Champion
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activeAudit.currentScore.toFixed(1)}%
                </div>
                <div className="text-[8px] text-emerald-400 font-bold mt-0.5">
                  Δ +{activeAudit.totalPerformanceDelta.toFixed(1)}%
                </div>
                <span className="mt-1.5 px-1 py-0.2 bg-stone-900 border border-stone-800 text-[8px] text-stone-400">
                  ≥95% Pass
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RECHARTS: PERFORMANCE CONVERGENCE VS MUTATION RATE DECAY */}
        <div className="space-y-3 pt-4 border-t border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="uppercase tracking-wider text-stone-300 font-bold">
                Evolution Convergence Trajectory (Benchmark Score vs Mutation Rate)
              </span>
            </div>
            <div className="text-[11px] font-mono text-stone-500">
              Notice: Mutation rate decays as prompt genome converges & score crosses 95% threshold
            </div>
          </div>

          <div className="bg-stone-950 p-4 border border-stone-800/80 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#78716c"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  domain={[70, 100]}
                  stroke="#10b981"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  label={{
                    value: 'Score (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#10b981',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 40]}
                  stroke="#c084fc"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  label={{
                    value: 'Mutation %',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#c084fc',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-stone-900 border border-stone-700 p-3 font-mono text-xs shadow-xl space-y-1">
                        <div className="font-bold text-white">{data.epoch || data.name}</div>
                        <div className="text-[11px] text-stone-400">Stage: {data.stage}</div>
                        <div className="text-emerald-400">
                          Score: <strong>{data.score}%</strong> (Δ +{data.delta}%)
                        </div>
                        <div className="text-purple-400">
                          Mutation Rate: <strong>{data.mutationRate}%</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    paddingTop: '6px'
                  }}
                />
                <ReferenceLine
                  y={95.0}
                  yAxisId="left"
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{
                    value: '95% Champion Threshold Gate',
                    fill: '#eab308',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'top'
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="mutationRate"
                  name="Mutation % (Prompt Genome)"
                  fill="#7e22ce"
                  opacity={0.65}
                  barSize={20}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  name="Benchmark Score %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 5. DETAILED ITERATION LOG & COMPARISON MATRIX (EVERY ITERATION) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Generational Iteration Audit Trail</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Inspect granular prompt mutations, constraint changes, and rule diffs for each evolutionary step.
            </p>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-stone-500 text-[11px] mr-1">Filter Stage:</span>
            {(['all', 'idea', 'training', 'testing', 'champion'] as const).map((stg) => (
              <button
                key={stg}
                onClick={() => setSelectedStageFilter(stg)}
                className={`px-2.5 py-1 uppercase text-[10px] transition-colors ${
                  selectedStageFilter === stg
                    ? 'bg-stone-200 text-stone-950 font-bold'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>

        {/* Iterations List */}
        <div className="space-y-4">
          {displayedIterations.map((iter) => {
            const isExpanded = expandedIterations[iter.iterationNumber] ?? true;
            return (
              <div
                key={iter.iterationNumber}
                id={`iteration-${iter.iterationNumber}`}
                className={`bg-stone-950 border transition-all ${
                  activeIterationSnapshot === iter.iterationNumber
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/40'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Iteration Header Row */}
                <div
                  onClick={() => toggleIteration(iter.iterationNumber)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-stone-900/40 hover:bg-stone-900/70"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                      #{iter.iterationNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {iter.epoch}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border ${
                            iter.stage === 'champion'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : iter.stage === 'testing'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : iter.stage === 'training'
                              ? 'bg-orange-950 text-orange-300 border-orange-800'
                              : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                          }`}
                        >
                          {iter.stage}
                        </span>
                        <span className="text-stone-500 font-mono text-[11px]">
                          · {iter.timestamp}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                        {iter.mutationType} · {iter.recombinationStrategy}
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics Pills */}
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase">Mutation %</div>
                      <div className="text-xs font-bold text-purple-400">
                        {iter.mutationPercentage.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase">Score Trajectory</div>
                      <div className="text-xs font-mono text-stone-300">
                        {iter.scoreBefore.toFixed(1)}% → <span className="font-bold text-white">{iter.scoreAfter.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase">Performance Delta</div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{iter.performanceDelta.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="text-stone-500 pl-2">
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-90 text-white' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-stone-800/80 space-y-5 text-xs font-sans">
                    {/* Visual Progress Delta Bar */}
                    <div className="bg-stone-900/60 p-3 border border-stone-800/60 space-y-2">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-stone-400">
                          Pre-Iteration Score: <strong className="text-stone-200">{iter.scoreBefore.toFixed(1)}%</strong>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          Empirical Gain: +{iter.performanceDelta.toFixed(1)}%
                        </span>
                        <span className="text-stone-400">
                          Post-Iteration Score: <strong className="text-white">{iter.scoreAfter.toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-stone-600"
                          style={{ width: `${iter.scoreBefore}%` }}
                        />
                        <div
                          className="h-full bg-emerald-400 absolute top-0"
                          style={{
                            left: `${iter.scoreBefore}%`,
                            width: `${iter.performanceDelta}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Mutation Details & Recombination Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Mutation specifics */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Recombination & Mutation Strategy</span>
                        </div>
                        <div className="p-3 bg-stone-900 border border-stone-800 text-stone-300 leading-relaxed font-mono text-[11px]">
                          {iter.mutationDetails}
                        </div>

                        <div className="text-[11px] font-mono text-stone-400">
                          Combined Parents in this Step:{' '}
                          <span className="text-stone-200 font-bold">
                            {iter.parentSkillNames.join(' + ')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Testbench & Survival Verification */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Testbench Survival & Pass Rate</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 font-mono text-center">
                          <div className="p-2.5 bg-stone-900 border border-stone-800">
                            <div className="text-[10px] text-stone-500">Pass Rate</div>
                            <div className="text-sm font-bold text-emerald-400 mt-0.5">
                              {iter.testPassRate.toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2.5 bg-stone-900 border border-stone-800">
                            <div className="text-[10px] text-stone-500">Test Cases</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {iter.testCasesRun}
                            </div>
                          </div>
                          <div className="p-2.5 bg-stone-900 border border-stone-800">
                            <div className="text-[10px] text-stone-500">Fitness Filter</div>
                            <div className="text-sm font-bold text-emerald-400 mt-0.5">
                              SURVIVED
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-stone-900/40 border border-stone-800/80 font-mono text-[11px] text-stone-300">
                          <strong className="text-amber-400">Key Insight: </strong>
                          {iter.keyInsight}
                        </div>
                      </div>
                    </div>

                    {/* Strict Rules Diff (Added, Modified, Pruned) */}
                    <div className="pt-2 border-t border-stone-800/80 space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Prompt Matrix & Strict Rule Mutations (Diff)</span>
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        {iter.ruleDiff.added && iter.ruleDiff.added.map((rule, rIdx) => (
                          <div
                            key={`added-${rIdx}`}
                            className="p-2 bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 flex items-start gap-2"
                          >
                            <span className="text-emerald-400 font-bold shrink-0">[+]</span>
                            <span>{rule}</span>
                          </div>
                        ))}

                        {iter.ruleDiff.modified && iter.ruleDiff.modified.map((rule, rIdx) => (
                          <div
                            key={`mod-${rIdx}`}
                            className="p-2 bg-amber-950/30 border border-amber-900/50 text-amber-200 flex items-start gap-2"
                          >
                            <span className="text-amber-400 font-bold shrink-0">[~]</span>
                            <span>{rule}</span>
                          </div>
                        ))}

                        {iter.ruleDiff.pruned && iter.ruleDiff.pruned.map((rule, rIdx) => (
                          <div
                            key={`pruned-${rIdx}`}
                            className="p-2 bg-rose-950/30 border border-rose-900/50 text-rose-300 flex items-start gap-2"
                          >
                            <span className="text-rose-400 font-bold shrink-0">[-]</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
