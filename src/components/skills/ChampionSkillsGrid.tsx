import React from 'react';
import { AgentSkill } from '../../types/skills';
import { SkillConflictPair } from '../../types/skillConflicts';
import { Trophy, Shield, Cpu, Play, Eye, GitFork, CheckCircle, Activity, Sparkles, Sliders, AlertTriangle, Scale, FlaskConical } from 'lucide-react';

interface ChampionSkillsGridProps {
  championSkills: AgentSkill[];
  conflicts?: SkillConflictPair[];
  onInspectSkill: (skill: AgentSkill) => void;
  onRunTest: (skill: AgentSkill) => void;
  onRemixSkill: (skill: AgentSkill) => void;
  onBenchmarkSkill?: (skill: AgentSkill) => void;
  onViewLineageAudit?: (skill: AgentSkill) => void;
  onSimulateMutation?: (skill: AgentSkill) => void;
  onOpenEvolutionHistory?: (skill: AgentSkill) => void;
  onViewConflict?: (conflictId: string) => void;
  onCompareSkill?: (skill: AgentSkill) => void;
  onOpenSandbox?: (skill: AgentSkill) => void;
}

export const ChampionSkillsGrid: React.FC<ChampionSkillsGridProps> = ({
  championSkills,
  conflicts = [],
  onInspectSkill,
  onRunTest,
  onRemixSkill,
  onBenchmarkSkill,
  onViewLineageAudit,
  onSimulateMutation,
  onOpenEvolutionHistory,
  onViewConflict,
  onCompareSkill,
  onOpenSandbox
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
              Active Champion Skills
              <span className="font-mono text-xs text-emerald-400 font-normal">
                ({championSkills.length} Field-Deployed · Under Continuous Testing)
              </span>
            </h3>
            <p className="text-xs text-stone-400 font-sans">
              High-tier specialist skills that surpassed the 95.0% qualification barrier. Actively tested against production SEC filings & adversarial market vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Zero-Hallucination Enforced
          </span>
          <span aria-hidden="true" className="text-stone-700">·</span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-stone-400" />
            24/7 Stress Testing
          </span>
        </div>
      </div>

      {/* Grid of Champion Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {championSkills.map((skill) => {
          const activeConflictForSkill = conflicts.find(
            (c) => c.status === 'ACTIVE_FLAGGED' && (c.skillAId === skill.id || c.skillBId === skill.id)
          );
          const conflictingPartnerCode = activeConflictForSkill
            ? (activeConflictForSkill.skillAId === skill.id ? activeConflictForSkill.skillBCode : activeConflictForSkill.skillACode)
            : null;

          return (
            <div
              key={skill.id}
              className={`bg-stone-900/80 border p-5 transition-all flex flex-col justify-between group relative overflow-hidden ${
                activeConflictForSkill
                  ? 'border-rose-800/80 shadow-md shadow-rose-950/20'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              {/* Subtle accent corner highlight */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none" />

              <div>
                {/* Active Conflict Visual Alert */}
                {activeConflictForSkill && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewConflict?.(activeConflictForSkill.id);
                    }}
                    className="mb-3 px-3 py-1.5 bg-rose-950/80 border border-rose-600/80 text-rose-200 text-[11px] font-mono flex items-center justify-between gap-2 cursor-pointer hover:bg-rose-900/90 transition-all shadow-xs"
                    title="Click to inspect and arbitrate contradictory axioms"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                      <span className="font-bold uppercase tracking-wider text-rose-300">Contradiction Alert:</span>
                      <span className="text-stone-300 truncate">Clashes with {conflictingPartnerCode} ({activeConflictForSkill.conflictDomain})</span>
                    </div>
                    <span className="text-amber-400 hover:text-white font-bold shrink-0 underline text-[10px]">
                      Arbitrate →
                    </span>
                  </div>
                )}

                {/* Top kicker and identity */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-1">
                      <span className="text-emerald-400 font-semibold">{skill.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>GEN-{skill.generation}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-stone-300 font-medium">Champion Tier</span>
                    </div>
                    <h4 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {skill.name}
                    </h4>
                  </div>

                  {/* Benchmark score indicator */}
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xl font-bold text-emerald-400">
                      {skill.benchmarkScore.toFixed(1)}%
                    </div>
                    <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                      Benchmark Score
                    </div>
                  </div>
                </div>

                {/* Vectors - Clean typographic presentation (Zero-Pill discipline) */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-stone-400 mb-3 pb-3 border-b border-stone-800/80">
                  <span className="text-stone-500 text-[11px] uppercase tracking-wider">Vectors:</span>
                  {skill.vectors.map((vec, i) => (
                    <React.Fragment key={vec}>
                      {i > 0 && <span aria-hidden="true" className="text-stone-700">·</span>}
                      <span className="text-stone-300">{vec}</span>
                    </React.Fragment>
                  ))}
                </div>

                {/* Tagline & Description */}
                <p className="text-xs text-stone-300 leading-relaxed font-sans mb-3 line-clamp-2">
                  {skill.description}
                </p>

                {/* Active Testbench Card */}
                <div className="bg-stone-950/70 border border-stone-800/90 p-3 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-amber-400 font-medium flex items-center gap-1.5">
                      <Activity className="w-3 h-3 animate-pulse" />
                      Active Testbench Being Tested:
                    </span>
                    <span className="text-stone-400">
                      {skill.activeTestBench.totalRunsToday} runs today
                    </span>
                  </div>
                  <div className="text-xs font-medium text-stone-200 truncate mb-1">
                    {skill.activeTestBench.name}
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono truncate">
                    Stress Vector: <span className="text-stone-300">{skill.activeTestBench.stressVector}</span>
                  </div>
                </div>

                {/* Live Thought Loop Readout */}
                <div className="p-2.5 bg-stone-950/40 border border-stone-800/60 font-mono text-[11px] text-stone-400 flex items-start gap-2 mb-4">
                  <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="line-clamp-2 leading-relaxed">
                    <span className="text-stone-500">Autonomous loop: </span>
                    <span className="text-stone-300">{skill.autonomousThought}</span>
                  </div>
                </div>
              </div>

              {/* Metrics row & Actions */}
              <div>
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-800 text-xs font-mono mb-4 text-center">
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase">Win Rate</div>
                    <div className="text-stone-200 font-semibold">{skill.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase">Stability</div>
                    <div className="text-stone-200 font-semibold">{skill.stabilityIndex}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase">Strict Rules</div>
                    <div className="text-emerald-400 font-semibold">{skill.strictRules.length} Enforced</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRunTest(skill)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-stone-950 hover:bg-stone-200 text-xs font-mono font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Live Test</span>
                  </button>

                  {onBenchmarkSkill && (
                    <button
                      onClick={() => onBenchmarkSkill(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-mono font-medium border border-amber-600/70 hover:border-amber-400 transition-colors shadow-xs"
                      title="Run quantitative historical market stress-test benchmark"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Stress Benchmark</span>
                    </button>
                  )}

                  {onOpenEvolutionHistory && (
                    <button
                      onClick={() => onOpenEvolutionHistory(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-mono font-medium border border-purple-600/70 transition-colors shadow-xs"
                      title="Open Evolution History side panel to track mutations & merged parents"
                    >
                      <GitFork className="w-3.5 h-3.5 text-purple-400" />
                      <span>Evolution History</span>
                    </button>
                  )}

                  {onViewLineageAudit && !onOpenEvolutionHistory && (
                    <button
                      onClick={() => onViewLineageAudit(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-950/70 hover:bg-purple-900 text-purple-300 text-xs font-mono font-medium border border-purple-800 transition-colors"
                      title="Track parent combinations, mutation percentage, and performance deltas across all iterations"
                    >
                      <GitFork className="w-3.5 h-3.5 text-purple-400" />
                      <span>Lineage Audit</span>
                    </button>
                  )}

                  {onSimulateMutation && (
                    <button
                      onClick={() => onSimulateMutation(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-mono font-medium border border-amber-500/30 hover:border-amber-400 transition-colors"
                      title="Simulate mutation and adjust personality hyper-parameters"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulate Mutation</span>
                    </button>
                  )}

                  {onCompareSkill && (
                    <button
                      onClick={() => onCompareSkill(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-mono font-medium border border-amber-600/60 transition-colors"
                      title="Compare side-by-side with another champion skill in Comparison Matrix"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>Compare</span>
                    </button>
                  )}

                  {onOpenSandbox && (
                    <button
                      onClick={() => onOpenSandbox(skill)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-mono font-medium border border-amber-500/70 transition-colors"
                      title="Launch into Sandboxed Skill Simulator with custom parameters"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sandbox</span>
                    </button>
                  )}

                  <button
                    onClick={() => onInspectSkill(skill)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-medium border border-stone-700 transition-colors"
                    title="Inspect prompt matrix, rules, and lineage"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => onRemixSkill(skill)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-medium border border-stone-700 transition-colors"
                    title="Cross-breed and remix this champion into a new Idea skill"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Remix</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
