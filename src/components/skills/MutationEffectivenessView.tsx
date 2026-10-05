import React, { useMemo } from 'react';
import type { AgentSkill } from '../../types/skills';
import type { MutationOutcomeProjection } from '../../../server/evolution/projections';
import type { LineageGraph, LineageEdge } from '../../../server/evolution/lineageGraph';
import { Dna, GitFork, ArrowUpRight, TrendingUp, TrendingDown, Info, ShieldAlert } from 'lucide-react';

export interface MutationEffectivenessViewProps {
  outcomes: MutationOutcomeProjection[];
  lineageGraph: LineageGraph | null;
  skills: AgentSkill[];
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
}

export const MutationEffectivenessView: React.FC<MutationEffectivenessViewProps> = ({
  outcomes,
  lineageGraph,
  skills,
  onInspectSkill,
  className = '',
}) => {
  // Extract and compute crossover events against stronger parent
  const crossovers = useMemo(() => {
    if (!lineageGraph) return [];

    const nodesMap = new Map(lineageGraph.nodes.map((n) => [n.skillId, n]));
    const incomingCrossovers = new Map<string, LineageEdge[]>();

    for (const edge of lineageGraph.edges) {
      if (edge.kind === 'crossover') {
        const arr = incomingCrossovers.get(edge.targetSkillId) ?? [];
        arr.push(edge);
        incomingCrossovers.set(edge.targetSkillId, arr);
      }
    }

    const items: Array<{
      childId: string;
      childCode: string;
      childName: string;
      childScore: number;
      parentAId: string;
      parentACode: string;
      parentAScore: number;
      parentBId: string;
      parentBCode: string;
      parentBScore: number;
      strongerParentScore: number;
      deltaText: string;
      isPositive: boolean | null;
    }> = [];

    for (const [childId, edges] of incomingCrossovers.entries()) {
      if (edges.length < 2) continue; // Expect 2 parents for crossover
      const child = nodesMap.get(childId);
      if (!child) continue;

      const pA = nodesMap.get(edges[0].sourceSkillId);
      const pB = nodesMap.get(edges[1].sourceSkillId);
      if (!pA || !pB) continue;

      const strongerParent = pA.benchmarkScore >= pB.benchmarkScore ? pA : pB;
      const childUnscored = child.benchmarkScore === 0;
      const parentUnscored = pA.benchmarkScore === 0 || pB.benchmarkScore === 0;

      let deltaText = 'pending';
      let isPositive: boolean | null = null;

      if (!childUnscored && !parentUnscored) {
        const delta = Number((child.benchmarkScore - strongerParent.benchmarkScore).toFixed(1));
        deltaText = delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
        isPositive = delta > 0;
      }

      items.push({
        childId: child.skillId,
        childCode: child.code,
        childName: child.name,
        childScore: child.benchmarkScore,
        parentAId: pA.skillId,
        parentACode: pA.code,
        parentAScore: pA.benchmarkScore,
        parentBId: pB.skillId,
        parentBCode: pB.code,
        parentBScore: pB.benchmarkScore,
        strongerParentScore: strongerParent.benchmarkScore,
        deltaText,
        isPositive,
      });
    }

    return items;
  }, [lineageGraph]);

  return (
    <div className={`space-y-6 font-mono text-stone-200 ${className}`}>
      {/* Header */}
      <div className="bg-stone-900/90 border border-stone-800 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Dna className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Mutation & Crossover Effectiveness
          </h2>
          <span className="px-2 py-0.5 text-[10px] uppercase bg-stone-800 text-stone-300 border border-stone-700">
            Measured Outcomes
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans max-w-3xl">
          Empirical telemetry measuring which mutation categories and crossover combinations yield
          statistically significant fitness improvements. Success rates are withheld below 3 attempts.
        </p>
      </div>

      {/* Mutation Outcomes Table */}
      <div className="bg-stone-900/80 border border-stone-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold text-stone-300 tracking-wider flex items-center gap-2">
            <span>Recorded Mutation Types</span>
            <span className="text-stone-500 font-normal">({outcomes.length} tracked)</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-sans">
            Rates withheld for sample size &lt; 3 attempts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase text-stone-400 font-mono">
                <th className="p-3">Mutation Type</th>
                <th className="p-3 text-right">Attempts</th>
                <th className="p-3 text-right">Success Rate</th>
                <th className="p-3 text-right">Average Delta</th>
                <th className="p-3 text-right">Avg Distance</th>
                <th className="p-3 text-right">Best / Worst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {outcomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-stone-500 font-sans">
                    No mutation iterations recorded by the evolution engine yet.
                  </td>
                </tr>
              ) : (
                outcomes.map((row) => (
                  <tr key={row.mutationType} className="hover:bg-stone-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{row.mutationType}</td>
                    <td className="p-3 text-right text-stone-300">{row.attempts}</td>
                    <td className="p-3 text-right font-bold">
                      {row.successRate !== null ? (
                        <span
                          className={
                            row.successRate >= 60
                              ? 'text-emerald-400'
                              : row.successRate >= 40
                              ? 'text-amber-400'
                              : 'text-stone-400'
                          }
                        >
                          {row.successRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-stone-500 italic text-[11px] font-sans">
                          too few attempts
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {row.averageDelta !== null ? (
                        <span
                          className={
                            row.averageDelta > 0
                              ? 'text-emerald-400'
                              : row.averageDelta < 0
                              ? 'text-rose-400'
                              : 'text-stone-400'
                          }
                        >
                          {row.averageDelta > 0 ? `+${row.averageDelta}` : row.averageDelta} pts
                        </span>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-stone-400">
                      {row.averageMutationPercentage !== null
                        ? `${row.averageMutationPercentage.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="p-3 text-right text-[11px]">
                      {row.bestDelta !== null && row.worstDelta !== null ? (
                        <span>
                          <span className="text-emerald-400">+{row.bestDelta}</span>
                          <span className="text-stone-600"> / </span>
                          <span className="text-rose-400">{row.worstDelta}</span>
                        </span>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crossovers Table */}
      <div className="bg-stone-900/80 border border-stone-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold text-stone-300 tracking-wider flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Recorded Crossovers</span>
            <span className="text-stone-500 font-normal">({crossovers.length} events)</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-sans">
            Scored against the stronger parent's benchmark
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase text-stone-400 font-mono">
                <th className="p-3">Child Skill</th>
                <th className="p-3">Parent A</th>
                <th className="p-3">Parent B</th>
                <th className="p-3 text-right">Stronger Parent</th>
                <th className="p-3 text-right">Child Score</th>
                <th className="p-3 text-right">Net Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {crossovers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-stone-500 font-sans">
                    No crossover events recorded in the current ancestry graph.
                  </td>
                </tr>
              ) : (
                crossovers.map((cross) => (
                  <tr key={cross.childId} className="hover:bg-stone-800/40 transition-colors">
                    <td className="p-3">
                      <button
                        onClick={() => {
                          const sk = skills.find((s) => s.id === cross.childId);
                          if (sk && onInspectSkill) onInspectSkill(sk);
                        }}
                        className="text-left font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <div>{cross.childCode}</div>
                        <div className="text-[10px] text-stone-400 font-sans font-normal truncate max-w-xs">
                          {cross.childName}
                        </div>
                      </button>
                    </td>
                    <td className="p-3 text-stone-300">
                      <div className="font-mono text-xs">{cross.parentACode}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{cross.parentAScore.toFixed(1)}%</div>
                    </td>
                    <td className="p-3 text-stone-300">
                      <div className="font-mono text-xs">{cross.parentBCode}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{cross.parentBScore.toFixed(1)}%</div>
                    </td>
                    <td className="p-3 text-right text-stone-300 font-mono font-bold">
                      {cross.strongerParentScore.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {cross.childScore > 0 ? `${cross.childScore.toFixed(1)}%` : 'unscored'}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {cross.deltaText === 'pending' ? (
                        <span className="text-stone-500 font-sans italic text-[11px]">pending</span>
                      ) : (
                        <span
                          className={
                            cross.isPositive
                              ? 'text-emerald-400'
                              : cross.isPositive === false
                              ? 'text-rose-400'
                              : 'text-stone-400'
                          }
                        >
                          {cross.deltaText}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
