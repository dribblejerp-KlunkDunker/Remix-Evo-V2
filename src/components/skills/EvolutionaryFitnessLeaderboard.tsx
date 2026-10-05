import React, { useState, useMemo } from 'react';
import { CompetingAgentInstance, FinancialLogicPuzzle } from '../../types/swarmController';
import {
  Trophy,
  Zap,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Filter,
  Brain,
  Cpu,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  TrendingUp,
  Flame,
  ArrowUpDown,
  ExternalLink,
  Info,
  RefreshCw
} from 'lucide-react';

export interface EvolutionaryFitnessLeaderboardProps {
  agents: CompetingAgentInstance[];
  activePuzzle?: FinancialLogicPuzzle;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onInspectGlobalSkill?: (skillId: string) => void;
  onInjectTrap?: () => void;
  onCrossbreedChampions?: () => void;
  competitionTick?: number;
  className?: string;
}

export type SortField =
  | 'evolutionaryFitness'
  | 'taskSuccessRate'
  | 'latencyMs'
  | 'cognitiveEfficiency'
  | 'puzzlesSolved'
  | 'eloRating';

export const EvolutionaryFitnessLeaderboard: React.FC<EvolutionaryFitnessLeaderboardProps> = ({
  agents,
  activePuzzle,
  selectedAgentId,
  onSelectAgent,
  onInspectGlobalSkill,
  onInjectTrap,
  onCrossbreedChampions,
  competitionTick = 0,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('evolutionaryFitness');
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [isFormulaExpanded, setIsFormulaExpanded] = useState<boolean>(false);

  // Extract all unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => {
      if (a.domainSpecialization) {
        set.add(a.domainSpecialization);
      }
    });
    return Array.from(set);
  }, [agents]);

  // Handle header sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      // For latency, ascending (faster/lower ms) is usually preferred by default
      setSortAscending(field === 'latencyMs');
    }
  };

  // Filtered and sorted agents
  const processedAgents = useMemo(() => {
    return agents
      .filter((agent) => {
        const matchesSearch =
          searchQuery === '' ||
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (agent.domainSpecialization &&
            agent.domainSpecialization.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDomain =
          domainFilter === 'all' || agent.domainSpecialization === domainFilter;

        return matchesSearch && matchesDomain;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortField) {
          case 'evolutionaryFitness':
            valA = a.evolutionaryFitness;
            valB = b.evolutionaryFitness;
            break;
          case 'taskSuccessRate':
            valA = a.taskSuccessRate ?? a.accuracyScore;
            valB = b.taskSuccessRate ?? b.accuracyScore;
            break;
          case 'latencyMs':
            valA = a.latencyMs;
            valB = b.latencyMs;
            break;
          case 'cognitiveEfficiency':
            valA = a.cognitiveEfficiency ?? 90;
            valB = b.cognitiveEfficiency ?? 90;
            break;
          case 'puzzlesSolved':
            valA = a.puzzlesSolved;
            valB = b.puzzlesSolved;
            break;
          case 'eloRating':
            valA = a.eloRating;
            valB = b.eloRating;
            break;
        }

        if (sortAscending) {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [agents, searchQuery, domainFilter, sortField, sortAscending]);

  // Aggregate Swarm Metrics
  const aggregateMetrics = useMemo(() => {
    const total = agents.length || 1;
    const avgFitness = Number((agents.reduce((acc, a) => acc + a.evolutionaryFitness, 0) / total).toFixed(1));
    const avgSuccess = Number((agents.reduce((acc, a) => acc + (a.taskSuccessRate ?? a.accuracyScore), 0) / total).toFixed(1));
    const avgLatency = Math.round(agents.reduce((acc, a) => acc + a.latencyMs, 0) / total);
    const avgCognitive = Number((agents.reduce((acc, a) => acc + (a.cognitiveEfficiency ?? 90), 0) / total).toFixed(1));
    const totalSolved = agents.reduce((acc, a) => acc + a.puzzlesSolved, 0);

    return { avgFitness, avgSuccess, avgLatency, avgCognitive, totalSolved };
  }, [agents]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header Banner & Aggregate Telemetry Scorecard */}
      <div className="bg-stone-900/80 border border-stone-800 p-5 relative overflow-hidden backdrop-blur-xs font-mono">
        <div className="absolute top-0 right-0 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="p-1.5 bg-amber-950 border border-amber-500/40 text-amber-400">
                <Trophy className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Evolutionary Fitness Swarm Leaderboard
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] uppercase bg-amber-950 border border-amber-600 text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Live Hebbian Ranking
              </span>
              <span className="px-2.5 py-0.5 text-[10px] uppercase bg-stone-900 border border-stone-700 text-stone-300">
                Tick #{competitionTick}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-3xl">
              Tracks the real-time ranking of active agent swarms operating across complex financial tasks. Ranks are determined by a weighted multi-objective evolutionary fitness equation balancing task success rate, execution latency, and cognitive efficiency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-mono transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{isFormulaExpanded ? 'Hide Fitness Formula' : 'Fitness Formula'}</span>
            </button>

            {onInjectTrap && (
              <button
                onClick={onInjectTrap}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/70 text-xs font-mono font-bold transition-colors cursor-pointer"
                title="Inject adversarial trap into active challenge"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Inject Trap</span>
              </button>
            )}

            {onCrossbreedChampions && (
              <button
                onClick={onCrossbreedChampions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-600/70 text-xs font-mono font-bold transition-colors cursor-pointer"
                title="Crossbreed Top 2 Agent Swarms"
              >
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>Crossbreed Leaders</span>
              </button>
            )}
          </div>
        </div>

        {/* Formula Explainer Drawer */}
        {isFormulaExpanded && (
          <div className="p-4 bg-stone-950 border border-amber-900/60 mb-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-300 font-bold uppercase text-[11px]">
              <span>{"Multi-Objective Evolutionary Fitness Equation ($F_{\\text{evo}}$)"}</span>
              <span className="text-stone-500">Auto-calculated in real time</span>
            </div>
            <div className="p-2.5 bg-stone-900 border border-stone-800 text-emerald-400 text-center text-sm font-bold tracking-wider">
              {"$$F_{\\text{evo}} = 0.40 \\cdot \\text{SuccessRate} + 0.35 \\cdot \\text{CognitiveEfficiency} + 0.25 \\cdot \\text{LatencyEfficiency}$$"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-stone-400 font-sans">
              <div>
                <strong className="text-white block font-mono">1. Success Rate (40%)</strong>
                Percentage of verified solutions on multi-page footnotes, Lévy jumps, and Nash equilibria without counter-factual hallucination.
              </div>
              <div>
                <strong className="text-white block font-mono">2. Cognitive Efficiency (35%)</strong>
                Working memory compression, low attention entropy (&lt;1.5 bits), and zero backtracking thrashing during reasoning.
              </div>
              <div>
                <strong className="text-white block font-mono">3. Latency Agility (25%)</strong>
                Sub-second inference speed with normalized penalties for combinatorial graph branching or slow convergence.
              </div>
            </div>
          </div>
        )}

        {/* Aggregate Metrics Quad */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Mean Swarm Fitness</div>
            <div className="text-2xl font-bold text-amber-400">{aggregateMetrics.avgFitness}%</div>
            <div className="text-[10px] text-stone-400">Composite Swarm Index</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Task Success Rate</div>
            <div className="text-2xl font-bold text-emerald-400">{aggregateMetrics.avgSuccess}%</div>
            <div className="text-[10px] text-stone-400">Total Solved: {aggregateMetrics.totalSolved} Tasks</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Mean Inference Latency</div>
            <div className="text-2xl font-bold text-cyan-400">{aggregateMetrics.avgLatency}ms</div>
            <div className="text-[10px] text-stone-400">Multi-Pass Reasoning Time</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Cognitive Efficiency</div>
            <div className="text-2xl font-bold text-purple-400">{aggregateMetrics.avgCognitive}%</div>
            <div className="text-[10px] text-stone-400">Memory & Entropy Conservation</div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-stone-900 border border-stone-800 px-3 py-1.5">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search swarm instance, archetype, domain, or code..."
            className="bg-transparent border-none outline-hidden w-full text-white placeholder-stone-600 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-stone-500 text-[11px] uppercase shrink-0">Domain:</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-stone-200 px-2.5 py-1 text-xs font-mono cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Financial Disciplines ({agents.length})</option>
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Evolutionary Fitness Leaderboard Table */}
      <div className="bg-stone-950 border border-stone-800 overflow-hidden font-mono text-xs shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-900/90 border-b border-stone-800 text-[10px] text-stone-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('evolutionaryFitness')}
                  className="p-3 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-500" />
                  </div>
                </th>

                <th className="p-3">Agent Swarm Instance & Archetype</th>

                <th
                  onClick={() => handleSort('evolutionaryFitness')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Evolutionary Fitness</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'evolutionaryFitness' ? 'text-amber-400' : 'text-stone-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('taskSuccessRate')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Success Rate</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'taskSuccessRate' ? 'text-emerald-400' : 'text-stone-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('latencyMs')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Latency</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'latencyMs' ? 'text-cyan-400' : 'text-stone-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('cognitiveEfficiency')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cognitive Efficiency</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'cognitiveEfficiency' ? 'text-purple-400' : 'text-stone-500'}`} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('puzzlesSolved')}
                  className="p-3 text-right cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Solved Tasks</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'puzzlesSolved' ? 'text-amber-400' : 'text-stone-500'}`} />
                  </div>
                </th>

                <th className="p-3 text-center">Active Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-800/80 bg-stone-950">
              {processedAgents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                const rankDelta = agent.previousRank - agent.rank;
                const successRate = agent.taskSuccessRate ?? agent.accuracyScore;
                const cognitiveEff = agent.cognitiveEfficiency ?? 90;

                // Fitness Tier
                let tierBadge = 'APEX CHAMPION';
                let tierStyle = 'bg-amber-950/80 border-amber-500 text-amber-300';
                if (agent.evolutionaryFitness < 94.0) {
                  tierBadge = 'EXPLORATORY';
                  tierStyle = 'bg-stone-900 border-stone-700 text-stone-400';
                } else if (agent.evolutionaryFitness < 96.0) {
                  tierBadge = 'HIGH FITNESS';
                  tierStyle = 'bg-blue-950/80 border-blue-600 text-blue-300';
                } else if (agent.evolutionaryFitness < 98.0) {
                  tierBadge = 'FIELD READY';
                  tierStyle = 'bg-emerald-950/80 border-emerald-600 text-emerald-300';
                }

                return (
                  <tr
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900/90 ring-1 ring-amber-500/40'
                        : 'hover:bg-stone-900/50'
                    }`}
                  >
                    {/* Rank & Movement Indicator */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`w-6 h-6 flex items-center justify-center font-bold text-xs border ${
                            agent.rank === 1
                              ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-xs'
                              : agent.rank === 2
                              ? 'bg-stone-800 border-stone-500 text-stone-200'
                              : agent.rank === 3
                              ? 'bg-amber-950/50 border-amber-700 text-amber-500'
                              : 'bg-stone-900 border-stone-800 text-stone-500'
                          }`}
                        >
                          {agent.rank}
                        </span>

                        {/* Rank delta arrow */}
                        <span className="text-[10px] w-4 font-mono">
                          {rankDelta > 0 ? (
                            <span className="text-emerald-400 flex items-center font-bold">
                              <ArrowUp className="w-2.5 h-2.5" />
                              {rankDelta}
                            </span>
                          ) : rankDelta < 0 ? (
                            <span className="text-rose-400 flex items-center font-bold">
                              <ArrowDown className="w-2.5 h-2.5" />
                              {Math.abs(rankDelta)}
                            </span>
                          ) : (
                            <span className="text-stone-600">―</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Agent Instance & Archetype */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{agent.name}</span>
                            <span className="text-[10px] text-stone-500 font-normal">
                              ({agent.code})
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                            <span className="text-amber-400 font-semibold">{agent.archetype}</span>
                            <span>·</span>
                            <span>Gen-{agent.generation}</span>
                            {agent.activeSwarmNodesCount && (
                              <>
                                <span>·</span>
                                <span className="text-purple-300">{agent.activeSwarmNodesCount} Nodes</span>
                              </>
                            )}
                          </div>
                          {agent.domainSpecialization && (
                            <div className="text-[9px] text-stone-500 font-sans truncate max-w-xs mt-0.5">
                              {agent.domainSpecialization}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Evolutionary Fitness Score */}
                    <td className="p-3 text-right">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-sm font-bold text-amber-300">
                            {agent.evolutionaryFitness.toFixed(1)}%
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              agent.fitnessDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {agent.fitnessDelta >= 0 ? `+${agent.fitnessDelta}` : agent.fitnessDelta}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-24 h-1.5 bg-stone-900 border border-stone-800 ml-auto overflow-hidden">
                          <div
                            style={{ width: `${agent.evolutionaryFitness}%` }}
                            className="h-full bg-amber-400"
                          />
                        </div>

                        <span className={`inline-block px-1.5 py-0.2 text-[8px] font-bold uppercase border ${tierStyle}`}>
                          {tierBadge}
                        </span>
                      </div>
                    </td>

                    {/* Task Success Rate */}
                    <td className="p-3 text-right">
                      <div className="space-y-0.5">
                        <div className="font-bold text-emerald-400 text-xs">
                          {successRate.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {agent.puzzlesSolved} / {agent.puzzlesAttempted} Solved
                        </div>
                        <div className="w-20 h-1 bg-stone-900 border border-stone-800 ml-auto overflow-hidden">
                          <div
                            style={{ width: `${successRate}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Latency & Agility */}
                    <td className="p-3 text-right">
                      <div className="space-y-0.5">
                        <div className="font-bold text-cyan-300 text-xs">
                          {agent.latencyMs}ms
                        </div>
                        <div className="text-[9px] text-stone-500 font-sans">
                          {agent.latencyMs <= 1450
                            ? 'Ultra Fast'
                            : agent.latencyMs <= 1650
                            ? 'Agile'
                            : 'Exploring'}
                        </div>
                      </div>
                    </td>

                    {/* Cognitive Efficiency */}
                    <td className="p-3 text-right">
                      <div className="space-y-0.5">
                        <div className="font-bold text-purple-300 text-xs">
                          {cognitiveEff.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-stone-500">
                          {agent.workingMemoryMb ? `${agent.workingMemoryMb}MB` : '24MB'} ·{' '}
                          {agent.attentionEntropyBits ? `${agent.attentionEntropyBits}b` : '1.2b'}
                        </div>
                      </div>
                    </td>

                    {/* Puzzles Solved */}
                    <td className="p-3 text-right hidden md:table-cell">
                      <div className="font-bold text-white text-xs">{agent.puzzlesSolved}</div>
                      <div className="text-[10px] text-stone-500">Elo {agent.eloRating}</div>
                    </td>

                    {/* Active Status */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase font-bold border ${
                          agent.status === 'solved'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                            : agent.status === 'submitting'
                            ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                            : agent.status === 'cross_verifying'
                            ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                            : 'bg-stone-900 border-stone-700 text-stone-400'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span>{agent.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAgent(agent.id);
                        }}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 text-[10px] transition-colors cursor-pointer"
                        title="Inspect agent hyperparameters and real-time thought trace"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
