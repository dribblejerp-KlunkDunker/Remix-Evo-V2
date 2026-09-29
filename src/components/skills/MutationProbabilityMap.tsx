import React, { useState, useMemo } from 'react';
import { AgentSkill, VectorCategory } from '../../types/skills';
import {
  MutationPairwiseProbability,
  SkillBreakthroughCandidate,
  buildMutationProbabilityMatrix,
  calculateMutationPair
} from '../../data/mutationProbabilityData';
import {
  Dna,
  Trophy,
  Sparkles,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Filter,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface MutationProbabilityMapProps {
  skills: AgentSkill[];
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  onInitiateMutation?: (parentA: AgentSkill, parentB: AgentSkill) => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
}

type StageFilter = 'all' | 'incubator' | 'champions_vs_pipeline';
type MatrixViewMode = 'heatmap' | 'candidates' | 'hotspots';

export const MutationProbabilityMap: React.FC<MutationProbabilityMapProps> = ({
  skills,
  isOpenAsOverlay = false,
  onCloseOverlay,
  onInitiateMutation,
  onInspectSkill,
  className = ''
}) => {
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [minProbability, setMinProbability] = useState<number>(50); // filter cells
  const [viewMode, setViewMode] = useState<MatrixViewMode>('heatmap');
  const [selectedPair, setSelectedPair] = useState<MutationPairwiseProbability | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [isSimulatingMutation, setIsSimulatingMutation] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  // Filter skills according to stage selector
  const activeSkills = useMemo(() => {
    if (stageFilter === 'incubator') {
      return skills.filter((s) => s.stage === 'testing' || s.stage === 'training' || s.stage === 'idea');
    }
    if (stageFilter === 'champions_vs_pipeline') {
      const champions = skills.filter((s) => s.stage === 'champion').slice(0, 4);
      const pipeline = skills.filter((s) => s.stage !== 'champion');
      return [...champions, ...pipeline];
    }
    return skills;
  }, [skills, stageFilter]);

  // Compute probability matrix and hotspots
  const { matrix, flatPairs, topHotspots, breakthroughCandidates } = useMemo(() => {
    return buildMutationProbabilityMatrix(activeSkills);
  }, [activeSkills]);

  // Auto-select top hotspot if nothing selected
  const activePair = useMemo(() => {
    if (selectedPair) return selectedPair;
    return topHotspots[0] || matrix[0]?.[0] || null;
  }, [selectedPair, topHotspots, matrix]);

  // Heatmap color generator
  const getCellColorClass = (prob: number) => {
    if (prob < minProbability) {
      return 'bg-stone-900/40 text-stone-600 border-stone-900';
    }
    if (prob >= 94.0) {
      return 'bg-emerald-500 text-stone-950 font-bold border-emerald-400 shadow-xs shadow-emerald-500/20';
    }
    if (prob >= 88.0) {
      return 'bg-emerald-600/90 text-white font-semibold border-emerald-500';
    }
    if (prob >= 80.0) {
      return 'bg-teal-600/80 text-white border-teal-500';
    }
    if (prob >= 70.0) {
      return 'bg-cyan-700/80 text-white border-cyan-600';
    }
    if (prob >= 60.0) {
      return 'bg-amber-600/70 text-amber-100 border-amber-500';
    }
    return 'bg-stone-800 text-stone-400 border-stone-700';
  };

  // Simulate Instant Mutation Action
  const handleSimulatePairMutation = async (pair: MutationPairwiseProbability) => {
    setIsSimulatingMutation(true);
    setSimulationLog(`🧬 Recombining [${pair.parentACode}] × [${pair.parentBCode}]...`);

    await new Promise((r) => setTimeout(r, 650));
    setSimulationLog(`Synthesizing invariant rules & injecting anti-hallucination constraint proofs...`);

    await new Promise((r) => setTimeout(r, 650));
    setSimulationLog(`⚡ Breakthrough Verified! Mutation achieved ${pair.projectedBenchmarkScore}% (Passed ≥ 95.0% Champion Barrier).`);

    setTimeout(() => {
      setIsSimulatingMutation(false);
      setSimulationLog(null);
    }, 3200);
  };

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Telemetry Overview */}
      <div className="bg-stone-900/60 border border-stone-800/90 p-5 backdrop-blur-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-36 bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Dna className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Mutation Probability Map
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-bold">
                Predictive Heatmap Matrix
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-950 border border-purple-600/70 text-purple-300 font-bold">
                Cycle #15 Forecast
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-2xl">
              Heatmap forecasting which agent skills are statistically most likely to successfully merge and mutate into{' '}
              <strong className="text-emerald-400 font-semibold">Champion status (≥ 95.0%)</strong> in the upcoming evolution cycle,
              derived from current win rates, vector complementarity synergies, and stability indices.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 bg-stone-950/80 border border-stone-800 text-stone-300 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Prime Hotspots:</span>
              <strong className="text-emerald-400">
                {flatPairs.filter((p) => p.championProbability >= 92.0).length} Pairs
              </strong>
            </div>

            <div className="px-3 py-1.5 bg-stone-950/80 border border-stone-800 text-stone-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Highest Prob:</span>
              <strong className="text-emerald-400">
                {topHotspots[0]?.championProbability || 98.4}%
              </strong>
            </div>

            {isOpenAsOverlay && onCloseOverlay && (
              <button
                onClick={onCloseOverlay}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Close Mutation Map"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Top 3 High-Yield Mutation Opportunities Spotlight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 font-bold uppercase text-white">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Champion Breakthrough Hotspots (Next Cycle Forecast):</span>
            </span>
            <span className="text-[11px] text-emerald-400">P(Champion) ≥ 94.0%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            {topHotspots.slice(0, 3).map((hotspot, idx) => (
              <div
                key={hotspot.id}
                onClick={() => setSelectedPair(hotspot)}
                className={`p-3 border transition-all cursor-pointer relative overflow-hidden group ${
                  activePair?.id === hotspot.id
                    ? 'bg-stone-900 border-emerald-400 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/70">
                    Hotspot #{idx + 1}
                  </span>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400">
                      {hotspot.championProbability}%
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase block">Champion Prob</span>
                  </div>
                </div>

                <div className="font-bold text-white text-xs truncate group-hover:text-emerald-300 transition-colors">
                  {hotspot.parentAName} × {hotspot.parentBName}
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-900">
                  <span>Target: <strong className="text-white">{hotspot.projectedBenchmarkScore}%</strong></span>
                  <span className="text-emerald-400 font-semibold">+{hotspot.synergyDelta}% Synergy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar & Sub-views */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-900/40 border border-stone-800 p-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-stone-800 text-emerald-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pairwise Matrix ({activeSkills.length}×{activeSkills.length})</span>
            </button>

            <button
              onClick={() => setViewMode('candidates')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'candidates'
                  ? 'bg-stone-800 text-purple-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Candidate Breakthrough Pipeline</span>
            </button>

            <button
              onClick={() => setViewMode('hotspots')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'hotspots'
                  ? 'bg-stone-800 text-amber-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>High-Synergy Ranked Pairs ({flatPairs.length})</span>
            </button>
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1.5 pl-2">
            <span className="text-stone-500">Candidate Fleet:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StageFilter)}
              className="bg-stone-950 border border-stone-800 px-2 py-1 text-stone-200 focus:outline-none focus:border-stone-600"
            >
              <option value="all">All Skills (Full Matrix)</option>
              <option value="incubator">Incubator Only (Testing & Training)</option>
              <option value="champions_vs_pipeline">Champions × Pipeline Crossovers</option>
            </select>
          </div>
        </div>

        {/* Heatmap Probability Filter Slider */}
        <div className="flex items-center gap-3">
          <span className="text-stone-400">Min Prob: <strong className="text-emerald-400">{minProbability}%</strong></span>
          <input
            type="range"
            min={40}
            max={90}
            step={5}
            value={minProbability}
            onChange={(e) => setMinProbability(Number(e.target.value))}
            className="w-28 accent-emerald-500 cursor-pointer"
          />

          {/* Heatmap Legend */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] pl-2 border-l border-stone-800">
            <span className="w-3 h-3 bg-stone-800 inline-block" title="<60% Moderate" />
            <span className="w-3 h-3 bg-amber-600 inline-block" title="60-75% Viable" />
            <span className="w-3 h-3 bg-teal-600 inline-block" title="75-88% Promising" />
            <span className="w-3 h-3 bg-emerald-500 inline-block" title=">=90% Prime Champion" />
            <span className="text-stone-500 ml-1">Color Scale</span>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY VIEW: 2D PAIRWISE HEATMAP MATRIX */}
      {viewMode === 'heatmap' && (
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono text-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
            <span className="text-stone-400 uppercase font-bold text-xs">
              Cross-Breeding & Mutation Probability Heatmap Grid
            </span>
            <span className="text-stone-500 text-[11px]">
              Cell value = P(Mutating into Champion ≥ 95%) in Next Cycle
            </span>
          </div>

          {/* Scrollable Heatmap Table */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              {/* Header row with column labels */}
              <div className="flex items-center">
                {/* Top-left corner spacer */}
                <div className="w-32 sm:w-40 shrink-0 p-2 text-[10px] text-stone-500 uppercase font-bold text-right pr-3">
                  Parent A \ Parent B
                </div>

                {/* Column Headers */}
                <div className="flex gap-1">
                  {activeSkills.map((skill, colIdx) => {
                    const isHoveredCol = hoveredCell?.colIdx === colIdx;
                    return (
                      <div
                        key={skill.id}
                        className={`w-14 sm:w-16 h-20 shrink-0 p-1 flex flex-col justify-end text-center transition-colors ${
                          isHoveredCol ? 'bg-stone-800/80 text-white' : 'text-stone-400'
                        }`}
                        title={`${skill.code}: ${skill.name} (${skill.benchmarkScore}%)`}
                      >
                        <span
                          className={`w-1.5 h-1.5 mx-auto rounded-full mb-1 ${
                            skill.stage === 'champion'
                              ? 'bg-emerald-400'
                              : skill.stage === 'testing'
                              ? 'bg-blue-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-[10px] font-bold truncate block">
                          {skill.code.replace('SKILL-', '')}
                        </span>
                        <span className="text-[9px] text-stone-500 block truncate">
                          {skill.benchmarkScore}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-1 mt-1">
                {matrix.map((row, rowIdx) => {
                  const skillA = activeSkills[rowIdx];
                  const isHoveredRow = hoveredCell?.rowIdx === rowIdx;

                  return (
                    <div key={skillA.id} className="flex items-center">
                      {/* Row Label */}
                      <div
                        className={`w-32 sm:w-40 shrink-0 p-1.5 text-right pr-3 transition-colors ${
                          isHoveredRow ? 'bg-stone-800/80 text-white font-bold' : 'text-stone-400'
                        }`}
                        title={`${skillA.name} (${skillA.stage})`}
                      >
                        <div className="text-[10px] font-bold truncate flex items-center justify-end gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              skillA.stage === 'champion'
                                ? 'bg-emerald-400'
                                : skillA.stage === 'testing'
                                ? 'bg-blue-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="truncate">{skillA.code.replace('SKILL-', '')}</span>
                        </div>
                        <div className="text-[9px] text-stone-500 truncate">{skillA.name.slice(0, 18)}</div>
                      </div>

                      {/* Cells in row */}
                      <div className="flex gap-1">
                        {row.map((cell, colIdx) => {
                          const isDiagonal = rowIdx === colIdx;
                          const isSelected =
                            activePair?.parentAId === cell.parentAId &&
                            activePair?.parentBId === cell.parentBId;
                          const colorClass = getCellColorClass(cell.championProbability);

                          return (
                            <button
                              key={cell.id}
                              onClick={() => setSelectedPair(cell)}
                              onMouseEnter={() => setHoveredCell({ rowIdx, colIdx })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`w-14 sm:w-16 h-10 shrink-0 border flex flex-col items-center justify-center transition-all cursor-pointer relative ${colorClass} ${
                                isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-105 hover:z-10'
                              } ${isDiagonal ? 'font-bold' : ''}`}
                              title={`${cell.parentAName} × ${cell.parentBName}: ${cell.championProbability}% Champion Probability`}
                            >
                              <span className="text-[11px]">{cell.championProbability}%</span>
                              {isDiagonal && (
                                <span className="text-[8px] uppercase tracking-tighter opacity-80">
                                  Solo
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-900">
            <div>
              💡 <strong>Diagonal cells</strong> represent solo mutation probability. <strong>Off-diagonal cells</strong> represent cross-breeding pair merge synergies.
            </div>
            <div className="text-stone-400">
              Click any cell to inspect projected offspring traits and initiate recombination.
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE 2: CANDIDATE BREAKTHROUGH PIPELINE */}
      {viewMode === 'candidates' && (
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-stone-400 uppercase font-bold text-xs">
              Candidate Breakthrough Standings (Proximity to 95.0% Champion Threshold)
            </span>
            <span className="text-stone-500 text-[11px]">Sorted by closest threshold gap</span>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="p-3">Skill Code & Name</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Current Score</th>
                  <th className="p-3 text-right">Gap to Gate</th>
                  <th className="p-3 text-right">Solo Prob</th>
                  <th className="p-3">Optimal Cross-Breed Partner</th>
                  <th className="p-3 text-right">Boosted Prob</th>
                  <th className="p-3 text-center">Cycles to Champion</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 bg-stone-950">
                {breakthroughCandidates.map((cand) => {
                  const isChampion = cand.thresholdGap <= 0;
                  return (
                    <tr key={cand.skill.id} className="hover:bg-stone-900/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white truncate max-w-[200px]">
                          {cand.skill.name}
                        </div>
                        <div className="text-[10px] text-stone-500">{cand.skill.code}</div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                            cand.skill.stage === 'champion'
                              ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
                              : cand.skill.stage === 'testing'
                              ? 'bg-blue-950/70 border-blue-600/70 text-blue-300'
                              : 'bg-amber-950/70 border-amber-600/70 text-amber-300'
                          }`}
                        >
                          {cand.skill.stage}
                        </span>
                      </td>

                      <td className="p-3 text-right font-bold text-white">
                        {cand.currentScore}%
                      </td>

                      <td className="p-3 text-right font-bold">
                        {isChampion ? (
                          <span className="text-emerald-400">QUALIFIED</span>
                        ) : (
                          <span className="text-amber-400">-{cand.thresholdGap}%</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono text-stone-300">
                        {cand.soloMutationProbability}%
                      </td>

                      <td className="p-3">
                        {cand.bestPartnerSkill ? (
                          <div>
                            <span className="font-bold text-purple-300">
                              {cand.bestPartnerSkill.code}
                            </span>
                            <span className="text-stone-400 text-[10px] block truncate max-w-[160px]">
                              {cand.bestPartnerSkill.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-500">—</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                        {cand.bestPartnerProbability}%
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-200">
                          {isChampion ? '0 (Champion)' : `~${cand.estimatedCyclesToChampion} Cycle`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {cand.bestPartnerSkill && (
                          <button
                            onClick={() => {
                              const pair = calculateMutationPair(cand.skill, cand.bestPartnerSkill!);
                              setSelectedPair(pair);
                              setViewMode('heatmap');
                            }}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono border border-stone-700 transition-colors cursor-pointer"
                          >
                            Inspect Pair
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VIEW MODE 3: HIGH-SYNERGY RANKED PAIRS */}
      {viewMode === 'hotspots' && (
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-stone-400 uppercase font-bold text-xs">
              Ranked Recombination Opportunities (Sorted by Champion Probability)
            </span>
            <span className="text-stone-500 text-[11px]">{flatPairs.length} Distinct Pairs Evaluated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flatPairs.slice(0, 12).map((pair, idx) => (
              <div
                key={pair.id}
                onClick={() => setSelectedPair(pair)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  activePair?.id === pair.id
                    ? 'bg-stone-900 border-emerald-400 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center font-bold text-[10px] border bg-stone-900 border-stone-700 text-stone-300">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-xs truncate max-w-[200px]">
                      {pair.parentAName} × {pair.parentBName}
                    </span>
                  </div>

                  <span className="text-base font-bold text-emerald-400">
                    {pair.championProbability}%
                  </span>
                </div>

                <div className="p-2 bg-stone-900/60 border border-stone-900 text-[11px] text-stone-300 font-sans line-clamp-1 mb-2">
                  {pair.synergyMechanisms[0]}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-900">
                  <span>Projected Offspring: <strong className="text-white">{pair.projectedBenchmarkScore}%</strong></span>
                  <span className="text-emerald-400">+{pair.synergyDelta}% Synergy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ACTIVE SELECTED PAIR GENOMIC INSPECTOR & MUTATION SIMULATOR */}
      {activePair && (
        <div className="bg-stone-900/50 border border-stone-800 p-5 space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
                <Dna className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {activePair.parentAName} × {activePair.parentBName}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                      activePair.championProbability >= 92.0
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-teal-950/80 border-teal-500 text-teal-300'
                    }`}
                  >
                    {activePair.readinessTier.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Projected Offspring: <strong className="text-white">{activePair.projectedOffspringName}</strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulatePairMutation(activePair)}
                disabled={isSimulatingMutation}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isSimulatingMutation ? 'animate-spin' : ''}`} />
                <span>{isSimulatingMutation ? 'Simulating Recombination...' : 'Simulate This Mutation'}</span>
              </button>

              {onInitiateMutation && (
                <button
                  onClick={() => {
                    const skillA = skills.find((s) => s.id === activePair.parentAId) || skills[0];
                    const skillB = skills.find((s) => s.id === activePair.parentBId) || skills[1];
                    onInitiateMutation(skillA, skillB);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/70 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open in Remix Lab</span>
                </button>
              )}
            </div>
          </div>

          {/* Simulation Log Notification */}
          {simulationLog && (
            <div className="p-2.5 bg-stone-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono animate-pulse">
              ⚡ {simulationLog}
            </div>
          )}

          {/* Metric Quad Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Champion Probability</div>
              <div className="text-2xl font-bold text-emerald-400">{activePair.championProbability}%</div>
              <div className="text-[10px] text-stone-400">Likelihood of ≥ 95% qualification</div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Projected Score</div>
              <div className="text-2xl font-bold text-white">{activePair.projectedBenchmarkScore}%</div>
              <div className="text-[10px] text-stone-400">+{activePair.synergyDelta}% synergy delta</div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Parent A ({activePair.parentACode})</div>
              <div className="text-xl font-bold text-stone-200">{activePair.parentAScore}%</div>
              <div className="text-[10px] text-stone-400 uppercase">{activePair.parentAStage} Stage</div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Parent B ({activePair.parentBCode})</div>
              <div className="text-xl font-bold text-stone-200">{activePair.parentBScore}%</div>
              <div className="text-[10px] text-stone-400 uppercase">{activePair.parentBStage} Stage</div>
            </div>
          </div>

          {/* Synergy Mechanisms Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5 font-sans">
              <div className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Genetic Synergy Mechanism:</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {activePair.synergyMechanisms[0]}
              </p>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5 font-sans">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Invariant Proof Hardening:</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {activePair.vulnerabilityMitigated}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If rendering as a full-screen overlay modal
  if (isOpenAsOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-stone-950 border border-stone-700/80 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-stone-200 font-sans relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render inline in dashboard
  return content;
};
