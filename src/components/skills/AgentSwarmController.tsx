import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LiveSwarmRunner } from './LiveSwarmRunner';
import type { AgentSkill } from '../../types/skills';
import type { SwarmRunResult } from '../../../server/evolution/runs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  FinancialLogicPuzzle,
  CompetingAgentInstance,
  CompetitionRound
} from '../../types/swarmController';
import {
  FINANCIAL_LOGIC_PUZZLES,
  INITIAL_COMPETING_AGENTS
} from '../../data/swarmControllerData';
import { EvolutionaryFitnessLeaderboard } from './EvolutionaryFitnessLeaderboard';
import {
  Cpu,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Sliders,
  Eye,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Dna,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export interface AgentSwarmControllerProps {
  onInspectGlobalSkill?: (skillId: string) => void;
  className?: string;
  /**
   * Real swarm runs. When supplied, this view renders the live runner in place of
   * the seeded puzzle simulation — its competing agents and scores were canned.
   */
  live?: {
    skills: AgentSkill[];
    runSwarm: (scenarioId: string, skillIds: string[]) => Promise<SwarmRunResult>;
  };
}

export const AgentSwarmController: React.FC<AgentSwarmControllerProps> = ({
  onInspectGlobalSkill,
  className = '',
  live
}) => {
  if (live) {
    return (
      <LiveSwarmRunner
        skills={live.skills}
        runSwarm={live.runSwarm}
        onInspectSkill={onInspectGlobalSkill}
        className={className}
      />
    );
  }
  return <SimulatedSwarmController onInspectGlobalSkill={onInspectGlobalSkill} className={className} />;
};

/** The original seeded simulation, kept as the no-engine fallback. */
const SimulatedSwarmController: React.FC<AgentSwarmControllerProps> = ({
  onInspectGlobalSkill,
  className = ''
}) => {
  const [puzzles, setPuzzles] = useState<FinancialLogicPuzzle[]>(FINANCIAL_LOGIC_PUZZLES);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number>(0);
  const [agents, setAgents] = useState<CompetingAgentInstance[]>(INITIAL_COMPETING_AGENTS);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(INITIAL_COMPETING_AGENTS[0].id);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'arena' | 'fitness-chart'>('arena');
  const [competitionTick, setCompetitionTick] = useState<number>(0);
  const [roundStatus, setRoundStatus] = useState<'competing' | 'evaluating' | 'completed'>('competing');
  const [recentNotification, setRecentNotification] = useState<string | null>(
    '⚡ Swarm Controller initialized. 8 parallel AI agents competing on Puzzle #1.'
  );

  const activePuzzle = puzzles[activePuzzleIndex] || puzzles[0];

  // Selected agent detail
  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Real-time competition tick engine
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(300, 1200 / simulationSpeed);
    const timer = setInterval(() => {
      setCompetitionTick((t) => t + 1);

      setAgents((prevAgents) => {
        return prevAgents.map((agent) => {
          // Progress simulation
          let nextProgress = agent.stepProgress + Math.floor(Math.random() * 15 * simulationSpeed) + 5;
          let nextStatus = agent.status;
          let newFitness = agent.evolutionaryFitness;
          let nextPuzzlesSolved = agent.puzzlesSolved;
          let delta = agent.fitnessDelta;

          if (nextProgress >= 100) {
            nextProgress = 100;
            nextStatus = 'solved';
            // Successful solve
            if (agent.status !== 'solved') {
              nextPuzzlesSolved += 1;
              const bonus = Number((Math.random() * 0.4 + 0.1).toFixed(2));
              newFitness = Math.min(99.8, Number((agent.evolutionaryFitness + bonus).toFixed(2)));
              delta = bonus;
            }
          } else if (nextProgress > 70) {
            nextStatus = 'submitting';
          } else if (nextProgress > 45) {
            nextStatus = 'calculating';
          } else if (nextProgress > 20) {
            nextStatus = 'cross_verifying';
          } else {
            nextStatus = 'analyzing';
          }

          // Random thought update
          const thoughts = [
            `Cross-footing footnote 12 lease discounting against SOFR baseline...`,
            `Integrating characteristic function over non-Gaussian Poisson distribution...`,
            `Evaluating dominant Nash liquidation threshold at price ${((Math.random() * 5) + 12).toFixed(2)}...`,
            `Cosine distance to margin inquiry = ${(Math.random() * 0.2 + 0.1).toFixed(3)}; high evasion detected...`,
            `Verifying Benjamini-Hochberg FDR threshold across 42 factor combinations...`,
            `Checking multi-tier vertex graph connectivity under simulated Shizuoka disruption...`
          ];
          const newThought = Math.random() > 0.65 ? thoughts[Math.floor(Math.random() * thoughts.length)] : agent.currentThoughtTrace;

          return {
            ...agent,
            stepProgress: nextProgress,
            status: nextStatus,
            evolutionaryFitness: newFitness,
            fitnessDelta: delta,
            puzzlesSolved: nextPuzzlesSolved,
            currentThoughtTrace: newThought,
            latencyMs: Math.max(850, agent.latencyMs + Math.floor(Math.random() * 80 - 40))
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simulationSpeed]);

  // Recalculate ranks when evolutionary fitness changes
  useEffect(() => {
    setAgents((prev) => {
      const sorted = [...prev].sort((a, b) => b.evolutionaryFitness - a.evolutionaryFitness);
      return sorted.map((agent, idx) => ({
        ...agent,
        previousRank: agent.rank,
        rank: idx + 1
      }));
    });
  }, [competitionTick]);

  // Trigger New Puzzle Round
  const handleNextPuzzle = () => {
    const nextIdx = (activePuzzleIndex + 1) % puzzles.length;
    setActivePuzzleIndex(nextIdx);
    setRoundStatus('competing');

    // Reset agents step progress
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        stepProgress: Math.floor(Math.random() * 15),
        status: 'analyzing',
        latencyMs: Math.floor(Math.random() * 500 + 1100)
      }))
    );

    setRecentNotification(`🏁 Switched to Puzzle #${nextIdx + 1}: "${puzzles[nextIdx].title}"`);
    setTimeout(() => setRecentNotification(null), 4000);
  };

  // Inject Adversarial Trap
  const handleInjectAdversarialTrap = () => {
    setRecentNotification(`⚠️ Injected Adversarial Cognitive Trap into active puzzle! Evaluating agent paranoia...`);

    setAgents((prev) =>
      prev.map((agent) => {
        // High adversarial paranoia avoids trap
        const avoidsTrap = agent.hyperparameters.adversarialParanoia >= 85 || Math.random() > 0.4;
        if (avoidsTrap) {
          const bonus = 0.5;
          return {
            ...agent,
            trapsAvoidedCount: agent.trapsAvoidedCount + 1,
            evolutionaryFitness: Math.min(99.9, Number((agent.evolutionaryFitness + bonus).toFixed(2))),
            fitnessDelta: +bonus,
            currentThoughtTrace: `🛡️ Trap Isolated! Flagged synthetic non-GAAP discrepancy in Footnote 12.`
          };
        } else {
          const penalty = 0.8;
          return {
            ...agent,
            stepProgress: Math.max(10, agent.stepProgress - 25),
            evolutionaryFitness: Math.max(75.0, Number((agent.evolutionaryFitness - penalty).toFixed(2))),
            fitnessDelta: -penalty,
            status: 'analyzing',
            currentThoughtTrace: `❌ Hit Trap: Unverified narrative optimistic guidance caused false positive.`
          };
        }
      })
    );

    setTimeout(() => setRecentNotification(null), 4000);
  };

  // Crossbreed Top 2 Agents (Evolutionary Genetic Recombination)
  const handleCrossbreedChampions = () => {
    const sorted = [...agents].sort((a, b) => b.evolutionaryFitness - a.evolutionaryFitness);
    const parentA = sorted[0];
    const parentB = sorted[1];

    const childGen = Math.max(parentA.generation, parentB.generation) + 1;
    const childId = `agent-cross-${Date.now().toString(36)}`;
    const childName = `Titan-Synthesis-Gen${childGen}`;

    const childHyperparameters = {
      logicBias: Math.round((parentA.hyperparameters.logicBias + parentB.hyperparameters.logicBias) / 2),
      riskAversion: Math.round((parentA.hyperparameters.riskAversion + parentB.hyperparameters.riskAversion) / 2),
      creativity: Math.round((parentA.hyperparameters.creativity + parentB.hyperparameters.creativity) / 2) + 5,
      adversarialParanoia: Math.max(parentA.hyperparameters.adversarialParanoia, parentB.hyperparameters.adversarialParanoia),
      mutationEntropy: Math.round((parentA.hyperparameters.mutationEntropy + parentB.hyperparameters.mutationEntropy) / 2)
    };

    const initialFitness = Number(((parentA.evolutionaryFitness + parentB.evolutionaryFitness) / 2 + 0.3).toFixed(2));

    const newAgent: CompetingAgentInstance = {
      id: childId,
      code: `AGENT-HYBRID-${childGen}`,
      name: childName,
      archetype: `Pareto Recombinant of ${parentA.name} × ${parentB.name}`,
      generation: childGen,
      strategyProfile: `Crossbred synthesis combining ${parentA.archetype} and ${parentB.archetype}.`,
      hyperparameters: childHyperparameters,
      color: '#10b981',
      avatarIcon: 'Dna',
      status: 'analyzing',
      currentThoughtTrace: `Inherited Pareto traits; formulating unified multi-vector proof strategy...`,
      solutionAttempt: 'Formulating hybrid reconciliatory solution...',
      stepProgress: 10,
      latencyMs: 1200,
      evolutionaryFitness: initialFitness,
      fitnessDelta: +0.6,
      historicalFitness: [parentA.evolutionaryFitness - 2, parentB.evolutionaryFitness - 1, initialFitness],
      accuracyScore: 99.0,
      ruleCompliance: 100,
      puzzlesSolved: 0,
      puzzlesAttempted: 1,
      eloRating: Math.round((parentA.eloRating + parentB.eloRating) / 2 + 30),
      trapsAvoidedCount: 0,
      rank: 1,
      previousRank: 2
    };

    setAgents((prev) => [newAgent, ...prev.slice(0, 7)]);
    setSelectedAgentId(childId);
    setRecentNotification(`🧬 Crossbred ${parentA.name} & ${parentB.name} into Champion "${childName}"!`);
    setTimeout(() => setRecentNotification(null), 5000);
  };

  // Recharts Chart Data: Fitness vs Accuracy / Latency
  const fitnessChartData = useMemo(() => {
    return agents.map((agent) => ({
      name: agent.name.length > 14 ? agent.name.slice(0, 12) + '..' : agent.name,
      fullName: agent.name,
      fitness: agent.evolutionaryFitness,
      accuracy: agent.accuracyScore,
      latencySec: Number((agent.latencyMs / 1000).toFixed(2)),
      elo: agent.eloRating,
      solved: agent.puzzlesSolved,
      rank: agent.rank,
      color: agent.color
    }));
  }, [agents]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Controller Header Banner */}
      <div className="bg-stone-900/60 border border-stone-800/90 p-5 backdrop-blur-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-36 bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Agent Swarm Controller & Competition Arena
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-950 border border-purple-600/70 text-purple-300 font-bold">
                Parallel Multi-Agent Arena
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Engine Active
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-2xl">
              Real-time competitive proving ground where parallel autonomous agents race to solve complex financial logic puzzles.
              Each agent instance is continually evaluated with multi-objective <strong className="text-emerald-400">Evolutionary Fitness</strong> scoring and dynamic leader-board re-ranking.
            </p>
          </div>

          {/* Arena Control Toolbar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold transition-all border ${
                isPlaying
                  ? 'bg-amber-950/80 border-amber-600/70 text-amber-300 hover:bg-amber-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 border-emerald-500'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Arena' : 'Resume Arena'}</span>
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`px-2 py-1 text-[11px] transition-colors ${
                    simulationSpeed === speed
                      ? 'bg-stone-800 text-emerald-400 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPuzzle}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
              title="Advance to next financial logic puzzle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Next Puzzle</span>
            </button>

            <button
              onClick={handleInjectAdversarialTrap}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-600/70 transition-colors"
              title="Test agent paranoia by injecting an adversarial cognitive trap"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Inject Trap</span>
            </button>

            <button
              onClick={handleCrossbreedChampions}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-600/70 transition-colors"
              title="Crossbreed Rank #1 and #2 champions into next-gen agent"
            >
              <Dna className="w-3.5 h-3.5 text-purple-400" />
              <span>Crossbreed Top 2</span>
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {recentNotification && (
          <div className="p-2.5 bg-stone-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono mb-4 animate-pulse flex items-center justify-between">
            <span>{recentNotification}</span>
            <span className="text-stone-500 text-[10px]">Tick #{competitionTick}</span>
          </div>
        )}

        {/* 2. Active Financial Logic Puzzle Spotlight Card */}
        <div className="p-4 bg-stone-950/80 border border-stone-800 space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-stone-900 border border-stone-700 text-stone-300">
                Puzzle {activePuzzleIndex + 1} of {puzzles.length}
              </span>
              <span className="text-xs font-bold text-white tracking-wide truncate">
                {activePuzzle.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-stone-400">
                Discipline: <strong className="text-purple-300">{activePuzzle.category}</strong>
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-amber-600/70 bg-amber-950/70 text-amber-300">
                {activePuzzle.difficulty}
              </span>
              <span className="text-stone-400">
                Time Limit: <strong className="text-stone-200">{activePuzzle.timeLimitSec}s</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs font-sans">
            <div className="space-y-1 lg:col-span-2">
              <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Problem Statement:</div>
              <p className="text-stone-200 text-xs leading-relaxed font-sans">{activePuzzle.problemStatement}</p>
              <div className="text-[11px] text-stone-400 mt-1 italic font-sans">{activePuzzle.scenarioBrief}</div>
            </div>

            <div className="space-y-2 p-3 bg-stone-900/60 border border-stone-800/80 font-mono text-xs">
              <div>
                <div className="text-[10px] text-amber-400 font-bold uppercase">Mathematical Invariant:</div>
                <div className="text-[11px] text-stone-300 truncate" title={activePuzzle.expectedInvariant}>
                  {activePuzzle.expectedInvariant}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-rose-400 font-bold uppercase">Hidden Adversarial Traps:</div>
                <div className="text-[10px] text-stone-400 list-disc">
                  {activePuzzle.hiddenTraps[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-View Mode Switcher */}
      <div className="flex items-center justify-between bg-stone-900/40 border border-stone-800 p-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-bold uppercase">Swarm View:</span>
          <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
            <button
              onClick={() => setViewMode('arena')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'arena'
                  ? 'bg-stone-800 text-purple-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Real-Time Arena Grid</span>
            </button>

            <button
              onClick={() => setViewMode('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'leaderboard'
                  ? 'bg-stone-800 text-amber-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulated Leaderboard</span>
            </button>

            <button
              onClick={() => setViewMode('fitness-chart')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                viewMode === 'fitness-chart'
                  ? 'bg-stone-800 text-emerald-300 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evolutionary Fitness Charts (Recharts)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-stone-400 text-xs">
          <span>Active Contenders: <strong className="text-white">{agents.length} Agents</strong></span>
          <span>·</span>
          <span>Lead Fitness: <strong className="text-emerald-400">{agents[0]?.evolutionaryFitness}%</strong></span>
        </div>
      </div>

      {/* 4. VIEW MODE 1: REAL-TIME ARENA GRID */}
      {viewMode === 'arena' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const isLeader = agent.rank === 1;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-900/90 border-purple-500 shadow-lg ring-1 ring-purple-500/40'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Glow accent */}
                {isLeader && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-xl pointer-events-none" />
                )}

                <div>
                  {/* Top Bar: Rank & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 flex items-center justify-center font-bold text-[10px] border ${
                          agent.rank === 1
                            ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                            : agent.rank === 2
                            ? 'bg-stone-800 border-stone-600 text-stone-200'
                            : agent.rank === 3
                            ? 'bg-amber-950/40 border-amber-700 text-amber-500'
                            : 'bg-stone-900 border-stone-800 text-stone-500'
                        }`}
                      >
                        #{agent.rank}
                      </span>
                      <div className="truncate max-w-[140px]">
                        <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                        <div className="text-[10px] text-stone-500 truncate">Gen-{agent.generation}</div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border ${
                        agent.status === 'solved'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                          : agent.status === 'submitting'
                          ? 'bg-purple-950/70 border-purple-500 text-purple-300'
                          : agent.status === 'cross_verifying'
                          ? 'bg-blue-950/70 border-blue-500 text-blue-300'
                          : 'bg-stone-900 border-stone-700 text-stone-400'
                      }`}
                    >
                      {agent.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar for Active Puzzle Step */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>Reasoning Progress</span>
                      <span className="text-white font-bold">{agent.stepProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 border border-stone-800 overflow-hidden">
                      <div
                        style={{
                          width: `${agent.stepProgress}%`,
                          backgroundColor: agent.color
                        }}
                        className="h-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Real-time Thought Trace */}
                  <div className="p-2 bg-stone-950 border border-stone-900 text-[10px] text-stone-400 line-clamp-2 h-9 mb-2 font-mono">
                    {agent.currentThoughtTrace}
                  </div>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase">Fitness</span>
                    <span className="font-bold text-emerald-400 text-xs">
                      {agent.evolutionaryFitness}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase">Speed</span>
                    <span className="text-stone-300 text-xs">{agent.latencyMs}ms</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block uppercase">Solved</span>
                    <span className="text-amber-400 font-bold text-xs">{agent.puzzlesSolved}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE 2: SIMULATED LEADERBOARD */}
      {viewMode === 'leaderboard' && (
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Simulated AI Agent Leaderboard & Evolutionary Standings
              </span>
            </div>
            <span className="text-stone-500 text-[11px]">Ranked by Evolutionary Fitness Score</span>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Agent Instance</th>
                  <th className="p-3">Archetype Strategy</th>
                  <th className="p-3 text-right">Evolutionary Fitness</th>
                  <th className="p-3 text-right">Accuracy %</th>
                  <th className="p-3 text-right">Rule Compliance</th>
                  <th className="p-3 text-right">Latency</th>
                  <th className="p-3 text-right">Puzzles Solved</th>
                  <th className="p-3 text-right">Elo Rating</th>
                  <th className="p-3 text-center">Traps Avoided</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 bg-stone-950 text-xs">
                {agents.map((agent) => {
                  const isTop3 = agent.rank <= 3;

                  return (
                    <tr
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="hover:bg-stone-900/60 transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-center">
                        <span
                          className={`w-6 h-6 inline-flex items-center justify-center font-bold text-xs border ${
                            agent.rank === 1
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : agent.rank === 2
                              ? 'bg-stone-800 border-stone-600 text-stone-200'
                              : agent.rank === 3
                              ? 'bg-amber-950/40 border-amber-700 text-amber-500'
                              : 'bg-stone-900 border-stone-800 text-stone-500'
                          }`}
                        >
                          {agent.rank}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: agent.color }}
                          />
                          <span>{agent.name}</span>
                        </div>
                        <div className="text-[10px] text-stone-500">{agent.code} · Gen {agent.generation}</div>
                      </td>

                      <td className="p-3 text-stone-300">
                        <span className="truncate max-w-[200px] block" title={agent.archetype}>
                          {agent.archetype}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-bold text-emerald-400 text-sm">
                          {agent.evolutionaryFitness}%
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {agent.fitnessDelta >= 0 ? `+${agent.fitnessDelta}` : agent.fitnessDelta}
                        </div>
                      </td>

                      <td className="p-3 text-right font-semibold text-white">
                        {agent.accuracyScore}%
                      </td>

                      <td className="p-3 text-right text-stone-300">
                        {agent.ruleCompliance}%
                      </td>

                      <td className="p-3 text-right text-stone-400">
                        {agent.latencyMs}ms
                      </td>

                      <td className="p-3 text-right font-bold text-amber-400">
                        {agent.puzzlesSolved} / {agent.puzzlesAttempted}
                      </td>

                      <td className="p-3 text-right font-mono text-purple-300">
                        {agent.eloRating}
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-stone-300 font-bold">
                          {agent.trapsAvoidedCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VIEW MODE 3: EVOLUTIONARY FITNESS CHARTS (RECHARTS) */}
      {viewMode === 'fitness-chart' && (
        <div className="bg-stone-950 border border-stone-800 p-5 space-y-5 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Evolutionary Fitness & Accuracy Standings (Recharts)
              </h3>
              <p className="text-[11px] text-stone-400 font-sans mt-0.5">
                Multi-objective fitness formula: 40% Accuracy + 30% Rule Compliance + 15% Latency + 15% Trap Invariant Defense.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 bg-emerald-500 inline-block" />
                <span>Evolutionary Fitness %</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-400">
                <span className="w-3 h-3 bg-purple-500 inline-block" />
                <span>Accuracy %</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fitnessChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#737373"
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  stroke="#737373"
                  domain={[80, 100]}
                  tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  unit="%"
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-950 border border-stone-700 p-3 shadow-xl text-xs font-mono">
                          <div className="font-bold text-white mb-1.5 border-b border-stone-800 pb-1">
                            {data.fullName} (Rank #{data.rank})
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4 text-emerald-400">
                              <span>Fitness Score:</span>
                              <strong>{data.fitness}%</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-purple-400">
                              <span>Accuracy:</span>
                              <strong>{data.accuracy}%</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-stone-300">
                              <span>Latency:</span>
                              <span>{data.latencySec}s</span>
                            </div>
                            <div className="flex justify-between gap-4 text-amber-400">
                              <span>Puzzles Solved:</span>
                              <span>{data.solved}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-purple-300">
                              <span>Elo Rating:</span>
                              <span>{data.elo}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={95}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Champion Threshold (95%)',
                    fill: '#eab308',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'top'
                  }}
                />
                <Bar dataKey="fitness" name="Fitness" fill="#10b981">
                  {fitnessChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fitness >= 95 ? '#10b981' : '#059669'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="accuracy" name="Accuracy" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 7. Selected Agent Genome & Thought Inspection Drawer */}
      {selectedAgent && (
        <div className="bg-stone-900/50 border border-stone-800 p-5 space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 border flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: `${selectedAgent.color}20`,
                  borderColor: selectedAgent.color,
                  color: selectedAgent.color
                }}
              >
                #{selectedAgent.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{selectedAgent.name}</h4>
                  <span className="px-2 py-0.5 text-[10px] bg-stone-900 border border-stone-700 text-stone-300">
                    Gen {selectedAgent.generation}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Fitness: {selectedAgent.evolutionaryFitness}%
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">{selectedAgent.strategyProfile}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-stone-300">
                Elo Rating: <strong className="text-purple-300">{selectedAgent.eloRating}</strong>
              </span>
              <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-stone-300">
                Puzzles Solved: <strong className="text-amber-400">{selectedAgent.puzzlesSolved}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reasoning & Current Solution */}
            <div className="space-y-3 p-3.5 bg-stone-950 border border-stone-800/80">
              <div className="text-[10px] text-purple-400 font-bold uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Active Real-Time Logic Stream:</span>
              </div>
              <div className="p-2.5 bg-stone-900/60 border border-stone-800 text-stone-200 text-xs font-mono leading-relaxed">
                {selectedAgent.currentThoughtTrace}
              </div>

              <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Formulated Solution Output:</span>
              </div>
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-600/40 text-emerald-300 text-xs font-mono">
                {selectedAgent.solutionAttempt}
              </div>
            </div>

            {/* Hyperparameters Genome */}
            <div className="space-y-3 p-3.5 bg-stone-950 border border-stone-800/80">
              <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Agent Hyperparameter Genome:</span>
              </div>

              <div className="space-y-2">
                {Object.entries(selectedAgent.hyperparameters).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <strong className="text-white">{val}%</strong>
                    </div>
                    <div className="w-full h-1 bg-stone-900 border border-stone-800 overflow-hidden">
                      <div
                        style={{ width: `${val}%` }}
                        className="bg-purple-500 h-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
