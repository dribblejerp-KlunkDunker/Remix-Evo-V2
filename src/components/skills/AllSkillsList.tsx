import React from 'react';
import { AgentSkill, SkillEvolutionStage } from '../../types/skills';
import { Play, Eye, GitFork, ArrowUpRight, FlaskConical, Wrench, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AllSkillsListProps {
  skills: AgentSkill[];
  activeStageFilter: SkillEvolutionStage | 'all';
  onInspectSkill: (skill: AgentSkill) => void;
  onRunTest: (skill: AgentSkill) => void;
  onPromoteSkill?: (skill: AgentSkill) => void;
  onOpenEvolutionHistory?: (skill: AgentSkill) => void;
}

export const AllSkillsList: React.FC<AllSkillsListProps> = ({
  skills,
  activeStageFilter,
  onInspectSkill,
  onRunTest,
  onPromoteSkill,
  onOpenEvolutionHistory
}) => {
  const getStageBadge = (stage: SkillEvolutionStage) => {
    switch (stage) {
      case 'idea':
        return {
          icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Idea State',
          color: 'text-amber-400',
          borderColor: 'border-amber-500/30'
        };
      case 'training':
        return {
          icon: <Wrench className="w-3.5 h-3.5 text-blue-400" />,
          label: 'Training State',
          color: 'text-blue-400',
          borderColor: 'border-blue-500/30'
        };
      case 'testing':
        return {
          icon: <FlaskConical className="w-3.5 h-3.5 text-purple-400" />,
          label: 'Testing State',
          color: 'text-purple-400',
          borderColor: 'border-purple-500/30'
        };
      case 'champion':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Champion State',
          color: 'text-emerald-400',
          borderColor: 'border-emerald-500/30'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <h4 className="text-sm font-mono text-stone-300 uppercase tracking-wider">
          {activeStageFilter === 'all'
            ? `All Matrix Skills (${skills.length})`
            : `${activeStageFilter.toUpperCase()} Stage Registry (${skills.length})`}
        </h4>
        <div className="text-xs font-mono text-stone-500">
          Threshold Gate: ≥ 95.0% Benchmark Score
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => {
          const stageInfo = getStageBadge(skill.stage);
          const gapToChampion = (skill.threshold - skill.benchmarkScore).toFixed(1);
          const isCloseToChampion = skill.stage === 'testing' && skill.benchmarkScore >= 93.5;

          return (
            <div
              key={skill.id}
              className="bg-stone-900/60 border border-stone-800 hover:border-stone-700 p-4 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Stage info and Code */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-800/60 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    {stageInfo.icon}
                    <span className={stageInfo.color}>{stageInfo.label}</span>
                  </div>
                  <span className="text-stone-400">{skill.code}</span>
                </div>

                {/* Skill Name */}
                <h5 className="text-base font-serif font-bold text-white mb-1 group-hover:text-stone-200">
                  {skill.name}
                </h5>

                {/* Vectors */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-stone-400 mb-2">
                  {skill.vectors.map((vec, i) => (
                    <React.Fragment key={vec}>
                      {i > 0 && <span aria-hidden="true" className="text-stone-700">·</span>}
                      <span>{vec}</span>
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-xs text-stone-400 font-sans leading-relaxed line-clamp-2 mb-3">
                  {skill.description}
                </p>

                {/* Progress bar towards Champion threshold */}
                <div className="bg-stone-950/80 border border-stone-800/80 p-2.5 mb-3 text-xs font-mono">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-stone-500">Score vs 95% Gate:</span>
                    <span className={`font-semibold ${skill.benchmarkScore >= 95 ? 'text-emerald-400' : 'text-stone-200'}`}>
                      {skill.benchmarkScore.toFixed(1)}% / 95.0%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        skill.benchmarkScore >= 95
                          ? 'bg-emerald-400'
                          : skill.stage === 'testing'
                          ? 'bg-purple-400'
                          : skill.stage === 'training'
                          ? 'bg-blue-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, (skill.benchmarkScore / 95) * 100)}%` }}
                    />
                  </div>
                  {skill.stage === 'testing' && Number(gapToChampion) > 0 && (
                    <div className="mt-1 text-[10px] text-purple-300">
                      Needs +{gapToChampion}% to qualify as Champion
                    </div>
                  )}
                </div>

                {/* Strict rules count preview */}
                <div className="text-[11px] font-mono text-stone-500 mb-3 flex items-center justify-between">
                  <span>Strict Rules: {skill.strictRules.length}</span>
                  <span>Gen: {skill.generation}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                <button
                  onClick={() => onRunTest(skill)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-medium border border-stone-700 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test</span>
                </button>
                <button
                  onClick={() => onInspectSkill(skill)}
                  className="py-1.5 px-2.5 bg-transparent hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-mono border border-stone-800 hover:border-stone-700 transition-colors"
                  title="Inspect"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {onOpenEvolutionHistory && (
                  <button
                    onClick={() => onOpenEvolutionHistory(skill)}
                    className="py-1.5 px-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 text-xs font-mono border border-purple-800/60 hover:border-purple-600 transition-colors"
                    title="View Evolution History (Parent Merges & Mutation Epochs)"
                  >
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                )}
                {skill.stage === 'testing' && skill.benchmarkScore >= 94.5 && onPromoteSkill && (
                  <button
                    onClick={() => onPromoteSkill(skill)}
                    className="py-1.5 px-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 text-xs font-mono transition-colors"
                    title="Promote to Champion"
                  >
                    Promote
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
