import React, { useState, useEffect, useMemo } from 'react';
import type { AgentSkill, ScenarioDefinition } from '../../types/skills';
import type { SwarmRunResult, SwarmEntrant } from '../../../server/evolution/runs';
import {
  Trophy,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export interface LiveSwarmRunnerProps {
  skills: AgentSkill[];
  runSwarm: (scenarioId: string, skillIds: string[]) => Promise<SwarmRunResult>;
  onInspectSkill?: (skillId: string) => void;
  className?: string;
}

interface ScenarioData {
  id: string;
  name: string;
  shortName: string;
  category: string;
  adversarialDifficulty: string;
  vectors: string[];
}

export const LiveSwarmRunner: React.FC<LiveSwarmRunnerProps> = ({
  skills,
  runSwarm,
  onInspectSkill,
  className = '',
}) => {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SwarmRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntrantId, setExpandedEntrantId] = useState<string | null>(null);

  // Load scenarios from evolution engine
  useEffect(() => {
    let cancelled = false;
    fetch('/api/evolution/scenarios')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const all: ScenarioData[] = [...(data.training ?? []), ...(data.holdout ?? [])];
        setScenarios(all);
        if (all.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(all[0].id);
        }
      })
      .catch((err) => {
        console.warn('Failed to load scenarios for swarm:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId),
    [scenarios, selectedScenarioId],
  );

  // Filter skills that share at least one vector with the selected scenario
  const matchingSkills = useMemo(() => {
    if (!activeScenario) return skills;
    const scenVecs = new Set(activeScenario.vectors);
    return skills.filter((sk) => sk.vectors.some((v) => scenVecs.has(v)));
  }, [skills, activeScenario]);

  // Default selection when candidate skills change
  useEffect(() => {
    const valid = matchingSkills.map((s) => s.id);
    setSelectedSkillIds((prev) => {
      const filtered = prev.filter((id) => valid.includes(id));
      if (filtered.length >= 2) return filtered.slice(0, 8);
      return valid.slice(0, Math.min(valid.length, 4));
    });
  }, [matchingSkills]);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 8) return prev; // max 8 entrants
      return [...prev, id];
    });
  };

  const handleRunSwarm = async () => {
    if (!selectedScenarioId || selectedSkillIds.length < 2) return;
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await runSwarm(selectedScenarioId, selectedSkillIds);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const callCost = selectedSkillIds.length * 2;

  return (
    <div className={`space-y-6 font-mono text-stone-200 ${className}`}>
      {/* Header */}
      <div className="bg-stone-900/90 border border-stone-800 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Swarm Runner (Head-to-Head Arena)
          </h2>
          <span className="px-2 py-0.5 text-[10px] uppercase bg-stone-800 text-stone-300 border border-stone-700">
            Live Evaluations
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans max-w-3xl">
          Execute a real competitive comparison between active skills against a target adversarial scenario.
          Each entrant is independently evaluated and judged using identical rubrics.
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div className="bg-stone-900/80 border border-stone-800 p-4 space-y-3">
          <label className="block text-xs uppercase font-bold text-stone-400">1. Select Target Scenario</label>
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            disabled={isRunning}
            className="w-full bg-stone-950 border border-stone-700 p-2 text-xs text-stone-200 outline-none"
          >
            {scenarios.map((scen) => (
              <option key={scen.id} value={scen.id}>
                [{scen.shortName}] {scen.name} ({scen.adversarialDifficulty})
              </option>
            ))}
          </select>

          {activeScenario && (
            <div className="p-3 bg-stone-950/60 border border-stone-800/80 space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-stone-500 uppercase">Category:</span>
                <span className="text-stone-300">{activeScenario.category}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-stone-500 uppercase">Difficulty:</span>
                <span
                  className={
                    activeScenario.adversarialDifficulty === 'Extreme'
                      ? 'text-rose-400 font-bold'
                      : 'text-amber-400'
                  }
                >
                  {activeScenario.adversarialDifficulty}
                </span>
              </div>
              <div className="pt-1 text-[11px]">
                <span className="text-stone-500 font-mono block mb-1">Required Vectors:</span>
                <div className="flex flex-wrap gap-1">
                  {activeScenario.vectors.map((vec) => (
                    <span key={vec} className="px-1.5 py-0.5 bg-stone-800 text-cyan-300 text-[10px] font-mono">
                      {vec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Entrant Selection */}
        <div className="lg:col-span-2 bg-stone-900/80 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs uppercase font-bold text-stone-400">
              2. Select Entrant Skills ({selectedSkillIds.length}/8 selected)
            </label>
            <span className="text-[11px] text-stone-500 font-sans">
              Only skills matching at least one target vector are listed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
            {matchingSkills.length === 0 ? (
              <div className="col-span-2 p-4 text-center text-xs text-stone-500">
                No active skills share a vector with this scenario.
              </div>
            ) : (
              matchingSkills.map((sk) => {
                const isSelected = selectedSkillIds.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    onClick={() => toggleSkill(sk.id)}
                    disabled={isRunning}
                    className={`flex items-center justify-between p-2 text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-stone-800 border-cyan-500 text-white shadow-xs'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{sk.code}</span>
                        <span
                          className={`text-[9px] uppercase px-1 border ${
                            sk.stage === 'champion'
                              ? 'border-emerald-600 text-emerald-400'
                              : 'border-cyan-600 text-cyan-400'
                          }`}
                        >
                          {sk.stage}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 truncate font-sans">{sk.name}</div>
                    </div>
                    <div className="text-right text-xs font-bold shrink-0">
                      {sk.benchmarkScore.toFixed(1)}%
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Action button */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-800 flex-wrap gap-3">
            <span className="text-xs text-stone-400 font-sans">
              Cost: <strong className="text-white font-mono">{callCost}</strong> model calls (2 per entrant)
            </span>
            <button
              onClick={handleRunSwarm}
              disabled={isRunning || selectedSkillIds.length < 2}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                isRunning || selectedSkillIds.length < 2
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-200'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isRunning
                  ? 'Executing Swarm...'
                  : `Run Swarm (${callCost} model calls)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block font-bold">Swarm execution failed:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-stone-900/90 border border-stone-800 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Swarm Run Outcome — {result.scenarioShort}
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1 font-sans">
                {result.scenarioName} · Spread: {result.scoreSpread.toFixed(1)} pts · {result.totalCalls} model calls used
              </p>
            </div>

            {result.indecisive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/80 border border-amber-600/70 text-amber-300 text-xs font-sans">
                <Info className="w-4 h-4 shrink-0" />
                <span>Indecisive comparison: all entrants scored within 2.0 points of each other.</span>
              </div>
            )}
          </div>

          {/* Entrants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-[11px] uppercase text-stone-400 font-mono">
                  {!result.indecisive && <th className="p-3 w-16">Rank</th>}
                  <th className="p-3">Skill</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Compliance</th>
                  <th className="p-3">Constraints</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {result.entrants.map((entrant, idx) => {
                  const isExpanded = expandedEntrantId === entrant.skillId;
                  const isWinner = !result.indecisive && idx === 0;

                  return (
                    <React.Fragment key={entrant.skillId}>
                      <tr
                        className={`hover:bg-stone-800/50 transition-colors ${
                          isWinner ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        {!result.indecisive && (
                          <td className="p-3 font-bold">
                            {isWinner ? (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Trophy className="w-3.5 h-3.5" />
                                #1
                              </span>
                            ) : (
                              <span className="text-stone-400">#{entrant.rank}</span>
                            )}
                          </td>
                        )}
                        <td className="p-3">
                          <button
                            onClick={() => onInspectSkill?.(entrant.skillId)}
                            className="text-left font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            <div>{entrant.skillCode}</div>
                            <div className="text-[10px] text-stone-400 font-sans font-normal truncate max-w-xs">
                              {entrant.skillName}
                            </div>
                          </button>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                              entrant.stage === 'champion'
                                ? 'border-emerald-600 text-emerald-400'
                                : 'border-cyan-600 text-cyan-400'
                            }`}
                          >
                            {entrant.stage}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold text-sm ${
                              entrant.score >= 95
                                ? 'text-emerald-400'
                                : entrant.score >= 80
                                ? 'text-amber-400'
                                : 'text-stone-300'
                            }`}
                          >
                            {entrant.score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-stone-300">{entrant.ruleCompliance}%</td>
                        <td className="p-3 text-stone-300">
                          {entrant.constraintsMet}/{entrant.constraintsTotal}
                        </td>
                        <td className="p-3 text-stone-400">{entrant.latencyMs}ms</td>
                        <td className="p-3 text-stone-300 font-sans text-[11px] max-w-xs truncate">
                          {entrant.verdict}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              setExpandedEntrantId(isExpanded ? null : entrant.skillId)
                            }
                            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-[10px] transition-colors cursor-pointer"
                          >
                            {isExpanded ? 'Hide Steps' : 'Reasoning'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-stone-950/80 border-b border-stone-800">
                          <td colSpan={result.indecisive ? 8 : 9} className="p-4 space-y-3 font-sans text-xs">
                            <div className="p-3 bg-stone-900 border border-stone-800">
                              <strong className="block text-stone-400 font-mono text-[10px] uppercase mb-1">
                                Judge Verdict Summary:
                              </strong>
                              <p className="text-stone-200">{entrant.verdictSummary}</p>
                            </div>

                            {entrant.reasoningSteps.length > 0 && (
                              <div className="space-y-1">
                                <strong className="block text-stone-400 font-mono text-[10px] uppercase">
                                  Extracted Reasoning Steps:
                                </strong>
                                <ol className="list-decimal list-inside space-y-1 text-stone-300">
                                  {entrant.reasoningSteps.map((step, sIdx) => (
                                    <li key={sIdx} className="leading-relaxed">
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
