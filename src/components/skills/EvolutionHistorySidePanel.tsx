import React, { useState, useMemo, useEffect } from 'react';
import {
  AgentSkill,
  ChampionEvolutionLineageAudit,
  EvolutionIteration,
  ParentSeedDetail,
  SkillEvolutionStage
} from '../../types/skills';
import {
  getSkillEvolutionHistory,
  simulateNextGenerationMutation
} from '../../data/evolutionHistoryHelper';
import {
  X,
  GitFork,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  ExternalLink,
  Layers,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Copy,
  Cpu,
  FlaskConical,
  Wrench,
  Lightbulb,
  Network
} from 'lucide-react';

export interface EvolutionHistorySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  skills: AgentSkill[];
  selectedSkillId?: string;
  onSelectSkill: (skillId: string) => void;
  onUpdateSkill?: (updatedSkill: AgentSkill) => void;
  onRemixSkill?: (skill: AgentSkill) => void;
  onRunTest?: (skill: AgentSkill) => void;
  onOpenForceGraph?: (skill: AgentSkill) => void;
  onPromoteSkill?: (skill: AgentSkill) => void;
}

export const EvolutionHistorySidePanel: React.FC<EvolutionHistorySidePanelProps> = ({
  isOpen,
  onClose,
  skills,
  selectedSkillId,
  onSelectSkill,
  onUpdateSkill,
  onRemixSkill,
  onRunTest,
  onOpenForceGraph,
  onPromoteSkill
}) => {
  // Current target skill
  const currentSkill: AgentSkill = useMemo(() => {
    if (selectedSkillId) {
      const found = skills.find((s) => s.id === selectedSkillId || s.code === selectedSkillId);
      if (found) return found;
    }
    // Default to first champion skill or first skill
    return skills.find((s) => s.stage === 'champion') || skills[0];
  }, [skills, selectedSkillId]);

  // Active view tab inside side panel
  const [activeTab, setActiveTab] = useState<'all' | 'parents' | 'timeline' | 'diff'>('all');
  // Stage filter for timeline
  const [stageFilter, setStageFilter] = useState<'all' | SkillEvolutionStage>('all');
  // Expand/collapse map for iterations
  const [expandedIterations, setExpandedIterations] = useState<Record<number, boolean>>({});
  // Is simulating next-gen mutation
  const [isSimulatingMutation, setIsSimulatingMutation] = useState(false);
  // Newly added mutation alert
  const [lastMutatedEpoch, setLastMutatedEpoch] = useState<string | null>(null);
  // Copy status
  const [copyFeedback, setCopyFeedback] = useState(false);
  // Docked mode vs floating overlay
  const [isDocked, setIsDocked] = useState(false);

  // Compute evolution history audit object
  const [auditData, setAuditData] = useState<ChampionEvolutionLineageAudit>(() =>
    getSkillEvolutionHistory(currentSkill, skills)
  );

  // Re-sync audit data when target skill changes
  useEffect(() => {
    if (currentSkill) {
      const audit = getSkillEvolutionHistory(currentSkill, skills);
      setAuditData(audit);
      // Expand latest iteration by default
      if (audit.iterations.length > 0) {
        const lastIterNum = audit.iterations[audit.iterations.length - 1].iterationNumber;
        setExpandedIterations((prev) => ({
          ...prev,
          [lastIterNum]: true,
          1: true // also expand seed fusion
        }));
      }
    }
  }, [currentSkill?.id, currentSkill?.benchmarkScore, skills]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDocked) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDocked, onClose]);

  if (!isOpen && !isDocked) return null;

  // Navigation: Previous & Next skill in the list
  const currentIndex = skills.findIndex((s) => s.id === currentSkill.id);
  const handlePrevSkill = () => {
    const prevIdx = (currentIndex - 1 + skills.length) % skills.length;
    onSelectSkill(skills[prevIdx].id);
  };
  const handleNextSkill = () => {
    const nextIdx = (currentIndex + 1) % skills.length;
    onSelectSkill(skills[nextIdx].id);
  };

  // Toggle single iteration card
  const toggleIteration = (iterNum: number) => {
    setExpandedIterations((prev) => ({
      ...prev,
      [iterNum]: !prev[iterNum]
    }));
  };

  // Expand / collapse all iterations
  const toggleExpandAll = () => {
    const allExpanded = auditData.iterations.every((it) => expandedIterations[it.iterationNumber]);
    const newState: Record<number, boolean> = {};
    auditData.iterations.forEach((it) => {
      newState[it.iterationNumber] = !allExpanded;
    });
    setExpandedIterations(newState);
  };

  // Trigger live next-gen mutation simulation
  const handleSimulateNextGen = async () => {
    setIsSimulatingMutation(true);
    setLastMutatedEpoch(null);

    // Simulate multi-step adversarial matrix optimization delay
    await new Promise((r) => setTimeout(r, 900));

    const { updatedAudit, updatedSkill, newIteration } = simulateNextGenerationMutation(
      auditData,
      currentSkill
    );

    setAuditData(updatedAudit);
    setExpandedIterations((prev) => ({
      ...prev,
      [newIteration.iterationNumber]: true
    }));
    setLastMutatedEpoch(newIteration.epoch);

    if (onUpdateSkill) {
      onUpdateSkill(updatedSkill);
    }

    setIsSimulatingMutation(false);

    // Clear mutation banner after 5s
    setTimeout(() => {
      setLastMutatedEpoch(null);
    }, 5000);
  };

  // Copy JSON lineage to clipboard
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(auditData, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Filter iterations by stage
  const displayedIterations =
    stageFilter === 'all'
      ? auditData.iterations
      : auditData.iterations.filter((it) => it.stage === stageFilter);

  // Helper for stage colors & icons
  const getStageStyle = (stage: SkillEvolutionStage) => {
    switch (stage) {
      case 'champion':
        return {
          label: 'Champion Tier',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: Trophy
        };
      case 'testing':
        return {
          label: 'Testing Tier',
          color: 'text-purple-400',
          bg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
          dot: 'bg-purple-400',
          icon: FlaskConical
        };
      case 'training':
        return {
          label: 'Training Tier',
          color: 'text-blue-400',
          bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
          dot: 'bg-blue-400',
          icon: Wrench
        };
      case 'idea':
      default:
        return {
          label: 'Idea Tier',
          color: 'text-amber-400',
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          icon: Lightbulb
        };
    }
  };

  const targetStageStyle = getStageStyle(currentSkill.stage);
  const StageIcon = targetStageStyle.icon;

  return (
    <>
      {/* Semi-transparent backdrop when not docked */}
      {isOpen && !isDocked && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Slide-out Side Panel */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col font-sans transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDocked ? 'w-full md:w-[620px] lg:w-[680px] xl:w-[720px]' : 'w-full sm:w-[560px] md:w-[640px] lg:w-[700px] xl:w-[760px]'}`}
        aria-label="Evolution History Side Panel"
      >
        {/* Top Control Bar */}
        <div className="bg-stone-950 border-b border-stone-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-950/80 border border-purple-500/40 text-purple-300">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Evolution History
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-800 text-stone-300 border border-stone-700">
                  Side Panel
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-sans">
                Mutation tracking & parent merger lineage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dock / Undock Toggle */}
            <button
              onClick={() => setIsDocked(!isDocked)}
              className={`p-1.5 transition-colors text-xs font-mono flex items-center gap-1 border ${
                isDocked
                  ? 'bg-purple-900/50 border-purple-500 text-purple-300'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title={isDocked ? 'Undock from side (Floating mode)' : 'Dock to side'}
            >
              {isDocked ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px]">{isDocked ? 'Docked' : 'Dock'}</span>
            </button>

            {/* Copy JSON */}
            <button
              onClick={handleCopyJSON}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Copy lineage audit JSON"
            >
              {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-stone-900 hover:bg-red-950/40 hover:text-red-300 border border-stone-800 hover:border-red-900/60 text-stone-400 transition-colors"
              title="Close side panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skill Selector & Navigator Bar */}
        <div className="bg-stone-950/80 border-b border-stone-800/80 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrevSkill}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Previous skill"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextSkill}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Next skill"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Select Dropdown */}
          <div className="flex-1 min-w-0">
            <select
              value={currentSkill.id}
              onChange={(e) => onSelectSkill(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-xs font-mono px-3 py-1.5 truncate outline-none cursor-pointer focus:border-purple-500"
            >
              <optgroup label="🏆 Active Champions (≥ 95% Threshold)">
                {skills
                  .filter((s) => s.stage === 'champion')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      ★ {s.code}: {s.name} ({s.benchmarkScore.toFixed(1)}%)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🧪 Testing Candidates">
                {skills
                  .filter((s) => s.stage === 'testing')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name} ({s.benchmarkScore.toFixed(1)}%)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🔧 Training Stage">
                {skills
                  .filter((s) => s.stage === 'training')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name} ({s.benchmarkScore.toFixed(1)}%)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="💡 Idea Genesis">
                {skills
                  .filter((s) => s.stage === 'idea')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name} ({s.benchmarkScore.toFixed(1)}%)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="text-[11px] font-mono text-stone-500 shrink-0">
            <span>{currentIndex + 1}</span> of <span>{skills.length}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Target Skill Summary Hero Card */}
          <div className="bg-stone-950/70 border border-stone-800 p-4 relative overflow-hidden">
            {/* Stage accent gradient in corner */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${
                currentSkill.stage === 'champion'
                  ? 'from-emerald-500/10'
                  : currentSkill.stage === 'testing'
                  ? 'from-purple-500/10'
                  : 'from-amber-500/10'
              } to-transparent pointer-events-none`}
            />

            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 border text-[11px] font-bold ${targetStageStyle.bg}`}>
                    <span className="flex items-center gap-1.5">
                      <StageIcon className="w-3 h-3" />
                      {targetStageStyle.label}
                    </span>
                  </span>
                  <span className="text-stone-400 font-semibold">{currentSkill.code}</span>
                  <span aria-hidden="true" className="text-stone-600">·</span>
                  <span className="text-stone-300 font-mono">GEN-{currentSkill.generation}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                  {currentSkill.name}
                </h3>
                <p className="text-xs text-purple-300/90 font-mono mt-0.5">
                  {currentSkill.specialistRole}
                </p>
              </div>

              {/* Score indicator */}
              <div className="text-right shrink-0 bg-stone-900 border border-stone-800/80 px-3 py-2">
                <div
                  className={`font-mono text-2xl font-bold ${
                    currentSkill.benchmarkScore >= 95 ? 'text-emerald-400' : 'text-purple-300'
                  }`}
                >
                  {currentSkill.benchmarkScore.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                  Benchmark Score
                </div>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xs text-stone-300 font-sans leading-relaxed mb-3">
              {currentSkill.tagline || currentSkill.description}
            </p>

            {/* Metric Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-stone-800/80 text-xs font-mono">
              <div className="bg-stone-900/60 p-2 border border-stone-800/60">
                <div className="text-[10px] text-stone-500 uppercase">Net Mutation Gain</div>
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{auditData.totalPerformanceDelta.toFixed(1)}%
                </div>
              </div>
              <div className="bg-stone-900/60 p-2 border border-stone-800/60">
                <div className="text-[10px] text-stone-500 uppercase">Seed Baseline</div>
                <div className="text-stone-300 font-bold">{auditData.initialScore.toFixed(1)}%</div>
              </div>
              <div className="bg-stone-900/60 p-2 border border-stone-800/60">
                <div className="text-[10px] text-stone-500 uppercase">Avg Mutation Rate</div>
                <div className="text-purple-300 font-bold">{auditData.averageMutationRate.toFixed(1)}%</div>
              </div>
              <div className="bg-stone-900/60 p-2 border border-stone-800/60">
                <div className="text-[10px] text-stone-500 uppercase">Hallucination Rate</div>
                <div className="text-emerald-400 font-bold">
                  {currentSkill.hallucinationRate?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-800 pb-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 transition-all ${
                activeTab === 'all'
                  ? 'bg-stone-800 text-white font-bold border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Full History
            </button>
            <button
              onClick={() => setActiveTab('parents')}
              className={`px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                activeTab === 'parents'
                  ? 'bg-purple-950/80 text-purple-300 font-bold border border-purple-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <GitFork className="w-3 h-3 text-purple-400" />
              <span>Merged Parents ({auditData.parentSeeds.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-stone-800 text-white font-bold border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Epoch Timeline ({auditData.iterations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 transition-all ${
                activeTab === 'diff'
                  ? 'bg-stone-800 text-emerald-300 font-bold border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Rule Evolution Diff
            </button>
          </div>

          {/* Live Mutation Alert Banner */}
          {lastMutatedEpoch && (
            <div className="bg-purple-950/60 border border-purple-500/80 p-3 text-xs font-mono text-purple-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>
                  🔥 Generated <strong>{lastMutatedEpoch}</strong>! Score upgraded to{' '}
                  <strong className="text-emerald-400">{currentSkill.benchmarkScore.toFixed(1)}%</strong>
                </span>
              </div>
              <span className="text-[10px] text-purple-400 uppercase">Generation {currentSkill.generation}</span>
            </div>
          )}

          {/* SECTION 1: MERGED PARENT SKILLS & GENETIC FUSION (Crucial User Requirement) */}
          {(activeTab === 'all' || activeTab === 'parents') && (
            <section className="space-y-4" aria-label="Parent Skills Merged to Create this Skill">
              <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-serif font-bold text-white tracking-wide">
                    Merged Parent Skills & Fusion Architecture
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-950/40 border border-purple-900/60 px-2 py-0.5">
                  Genetic Crossover
                </span>
              </div>

              <p className="text-xs text-stone-400 font-sans leading-relaxed">
                This higher-level skill was synthesized through genetic crossover of the following upstream parent specialist seeds. Traits, boundary rules, and stochastic variance filters were blended:
              </p>

              {/* Vector Combo Tag */}
              <div className="bg-stone-950 border border-stone-800 p-2.5 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-500 text-[11px] uppercase tracking-wider">
                  Remix Vector Synthesis:
                </span>
                <span className="text-purple-300 font-semibold truncate ml-2">
                  {auditData.remixVectorCombo}
                </span>
              </div>

              {/* Visual Flow Diagram / Recombination Junction */}
              <div className="bg-stone-950/90 border border-stone-800 p-4 space-y-3">
                <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recombination & Fusion Flowchart</span>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Parent A Input Row */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <div className="w-28 sm:w-36 text-stone-400 text-right truncate text-[11px]">
                      Parent A ({auditData.parentSeeds[0]?.contributionWeight || 58}%)
                    </div>
                    <div className="flex-1 bg-stone-900 border border-purple-900/60 p-2 text-purple-200 truncate flex items-center justify-between">
                      <span className="font-semibold truncate">
                        {auditData.parentSeeds[0]?.name || 'Primary Upstream Seed'}
                      </span>
                      <span className="text-[10px] text-stone-500 shrink-0 ml-2">
                        {auditData.parentSeeds[0]?.seedScore}% Score
                      </span>
                    </div>
                  </div>

                  {/* Junction Indicator */}
                  <div className="flex items-center gap-2 pl-28 sm:pl-36">
                    <div className="h-4 border-l-2 border-stone-700 ml-4" />
                    <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Pareto Crossover & Adversarial Invariant Injection</span>
                    </div>
                  </div>

                  {/* Parent B Input Row */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <div className="w-28 sm:w-36 text-stone-400 text-right truncate text-[11px]">
                      Parent B ({auditData.parentSeeds[1]?.contributionWeight || 42}%)
                    </div>
                    <div className="flex-1 bg-stone-900 border border-blue-900/60 p-2 text-blue-200 truncate flex items-center justify-between">
                      <span className="font-semibold truncate">
                        {auditData.parentSeeds[1]?.name || 'Secondary Filter Seed'}
                      </span>
                      <span className="text-[10px] text-stone-500 shrink-0 ml-2">
                        {auditData.parentSeeds[1]?.seedScore}% Score
                      </span>
                    </div>
                  </div>

                  {/* Arrow down to Resulting Champion */}
                  <div className="flex items-center gap-2 pl-28 sm:pl-36 my-1">
                    <div className="w-4 flex justify-center text-emerald-400 font-bold">↓</div>
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                      Resulting Evolved Skill: {currentSkill.name} ({currentSkill.benchmarkScore.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                {/* Proportional Contribution Bar */}
                <div className="space-y-1 pt-2 border-t border-stone-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                    <span>{auditData.parentSeeds[0]?.name} ({auditData.parentSeeds[0]?.contributionWeight}%)</span>
                    <span>{auditData.parentSeeds[1]?.name} ({auditData.parentSeeds[1]?.contributionWeight}%)</span>
                  </div>
                  <div className="h-2 w-full bg-stone-800 flex overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${auditData.parentSeeds[0]?.contributionWeight || 58}%` }}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${auditData.parentSeeds[1]?.contributionWeight || 42}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Parent Seed Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {auditData.parentSeeds.map((parent, idx) => {
                  const matchedParentSkill = skills.find(
                    (s) => s.code.toLowerCase() === parent.code.toLowerCase() || s.id.toLowerCase() === parent.id.toLowerCase()
                  );

                  return (
                    <div
                      key={parent.id || idx}
                      className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 p-3.5 space-y-2 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Parent Code & Weight */}
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className={idx === 0 ? 'text-purple-400' : 'text-blue-400'}>
                            {parent.code}
                          </span>
                          <span className="text-stone-300 font-bold bg-stone-900 px-1.5 py-0.5 border border-stone-800">
                            {parent.contributionWeight}% Weight
                          </span>
                        </div>

                        {/* Parent Name */}
                        <h5 className="text-sm font-serif font-bold text-white leading-snug">
                          {parent.name}
                        </h5>

                        {/* Specialist Role */}
                        <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                          {parent.role}
                        </p>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-mono text-stone-500">
                          <span>Vector: <strong className="text-stone-300">{parent.vector}</strong></span>
                          <span>·</span>
                          <span>Origin: <strong className="text-stone-300">{parent.source}</strong></span>
                        </div>
                      </div>

                      {/* Seed Score and Link */}
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-stone-500 text-[10px]">Seed Score: </span>
                          <span className="text-stone-200 font-semibold">{parent.seedScore}%</span>
                        </div>

                        {matchedParentSkill && (
                          <button
                            onClick={() => onSelectSkill(matchedParentSkill.id)}
                            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors"
                          >
                            <span>Inspect Parent</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lineage Summary Narrative */}
              {auditData.lineageSummary && (
                <div className="bg-stone-950/40 border border-stone-800/70 p-3 font-mono text-[11px] text-stone-400 leading-relaxed">
                  <span className="text-stone-500 font-semibold">Evolutionary Synthesis Note: </span>
                  <span className="text-stone-300">{auditData.lineageSummary}</span>
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: MUTATION TIMELINE OVER TIME (Crucial User Requirement) */}
          {(activeTab === 'all' || activeTab === 'timeline') && (
            <section className="space-y-4" aria-label="Mutation Timeline Over Time">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-serif font-bold text-white tracking-wide">
                    Mutation Progression Over Time ({auditData.iterations.length} Epochs)
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {/* Stage filter */}
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as any)}
                    className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] px-2 py-1 outline-none"
                  >
                    <option value="all">All Stages</option>
                    <option value="idea">Idea Epochs</option>
                    <option value="training">Training Epochs</option>
                    <option value="testing">Testing Epochs</option>
                    <option value="champion">Champion Epochs</option>
                  </select>

                  <button
                    onClick={toggleExpandAll}
                    className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 border border-stone-800 bg-stone-950"
                  >
                    Expand/Collapse
                  </button>
                </div>
              </div>

              {/* Mutation Epoch Cards */}
              <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-stone-800">
                {displayedIterations.map((iter) => {
                  const isExpanded = !!expandedIterations[iter.iterationNumber];
                  const iterStageStyle = getStageStyle(iter.stage);
                  const isPositiveDelta = iter.performanceDelta > 0;

                  return (
                    <div
                      key={iter.iterationNumber}
                      className="relative pl-9 group"
                    >
                      {/* Timeline node marker */}
                      <div
                        className={`absolute left-2.5 top-3.5 w-3 h-3 rounded-full -translate-x-1/2 border-2 border-stone-950 ${
                          iter.stage === 'champion'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : iter.stage === 'testing'
                            ? 'bg-purple-400'
                            : iter.stage === 'training'
                            ? 'bg-blue-400'
                            : 'bg-amber-400'
                        }`}
                      />

                      <div className="bg-stone-950 border border-stone-800 hover:border-stone-700 transition-all">
                        {/* Epoch Header Clickable */}
                        <div
                          onClick={() => toggleIteration(iter.iterationNumber)}
                          className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs font-mono mb-1 flex-wrap">
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${iterStageStyle.bg}`}>
                                {iterStageStyle.label}
                              </span>
                              <span className="text-white font-bold">{iter.epoch}</span>
                              <span aria-hidden="true" className="text-stone-600">·</span>
                              <span className="text-stone-400 text-[11px]">{iter.timestamp}</span>
                            </div>

                            <div className="text-xs text-stone-300 font-mono flex items-center gap-2 flex-wrap">
                              <span className="text-purple-300 font-medium">{iter.mutationType}</span>
                              <span aria-hidden="true" className="text-stone-600">·</span>
                              <span className="text-stone-400">{iter.mutationPercentage}% mutation</span>
                            </div>
                          </div>

                          {/* Score progression & Delta */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-xs text-stone-400">
                                {iter.scoreBefore.toFixed(1)}% →{' '}
                                <strong className="text-white font-bold">
                                  {iter.scoreAfter.toFixed(1)}%
                                </strong>
                              </div>
                              <div
                                className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                                  isPositiveDelta ? 'text-emerald-400' : 'text-stone-400'
                                }`}
                              >
                                {isPositiveDelta ? `+${iter.performanceDelta.toFixed(1)}%` : `${iter.performanceDelta}%`}
                              </div>
                            </div>

                            <button className="text-stone-500 hover:text-stone-300 p-1">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-stone-800/80 text-xs font-mono">
                            {/* Recombination Strategy */}
                            <div className="bg-stone-900/60 p-2.5 border border-stone-800/60">
                              <div className="text-[10px] text-purple-300 font-semibold uppercase mb-1">
                                Recombination Strategy:
                              </div>
                              <p className="text-stone-300 text-[11px] leading-relaxed font-sans">
                                {iter.recombinationStrategy}
                              </p>
                              <p className="text-stone-400 text-[11px] leading-relaxed font-sans mt-1">
                                {iter.mutationDetails}
                              </p>
                            </div>

                            {/* Strict Rule Diff */}
                            {iter.ruleDiff && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] text-stone-500 uppercase font-semibold">
                                  Rule Mutation Diff:
                                </div>
                                {iter.ruleDiff.added && iter.ruleDiff.added.length > 0 && (
                                  <div className="space-y-1">
                                    {iter.ruleDiff.added.map((rule, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 p-2 text-[11px] flex items-start gap-1.5"
                                      >
                                        <span className="text-emerald-400 font-bold shrink-0">+</span>
                                        <span className="font-mono">{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {iter.ruleDiff.modified && iter.ruleDiff.modified.length > 0 && (
                                  <div className="space-y-1">
                                    {iter.ruleDiff.modified.map((rule, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="bg-amber-950/30 border border-amber-800/50 text-amber-300 p-2 text-[11px] flex items-start gap-1.5"
                                      >
                                        <span className="text-amber-400 font-bold shrink-0">~</span>
                                        <span className="font-mono">{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {iter.ruleDiff.pruned && iter.ruleDiff.pruned.length > 0 && (
                                  <div className="space-y-1">
                                    {iter.ruleDiff.pruned.map((rule, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="bg-red-950/30 border border-red-800/50 text-red-300 p-2 text-[11px] flex items-start gap-1.5"
                                      >
                                        <span className="text-red-400 font-bold shrink-0">-</span>
                                        <span className="font-mono line-through opacity-75">{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Testbench Pass Rate & Telemetry */}
                            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/60 flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Passed {iter.testPassRate}% ({iter.testCasesRun} runs)</span>
                              </div>
                              <span className="text-stone-500">
                                Status: <strong className="text-stone-300">SURVIVED</strong>
                              </span>
                            </div>

                            {/* Evolutionary Key Insight Box */}
                            {iter.keyInsight && (
                              <div className="bg-stone-900/40 border-l-2 border-purple-500 pl-2.5 py-1 text-[11px] text-stone-300 italic font-sans leading-relaxed">
                                "{iter.keyInsight}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Mutation Action: Mutate Next Gen */}
              <div className="pt-2">
                <button
                  onClick={handleSimulateNextGen}
                  disabled={isSimulatingMutation}
                  className="w-full py-2.5 px-4 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-600/70 text-purple-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                >
                  <Sparkles
                    className={`w-4 h-4 text-purple-400 ${
                      isSimulatingMutation ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'
                    }`}
                  />
                  <span>
                    {isSimulatingMutation
                      ? 'Simulating Adversarial Genetic Mutation...'
                      : `Mutate Next Generation (Gen-${currentSkill.generation + 1} Experiment)`}
                  </span>
                </button>
                <p className="text-[10px] font-mono text-stone-500 text-center mt-1.5">
                  Adversarially mutates the prompt genome, tests against edge cases, and logs a new epoch.
                </p>
              </div>
            </section>
          )}

          {/* SECTION 3: RULE EVOLUTION DIFF SUMMARY */}
          {activeTab === 'diff' && (
            <section className="space-y-3" aria-label="Strict Rules Evolution">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="text-sm font-serif font-bold text-white">
                  Active Strict Rules Invariant Matrix ({currentSkill.strictRules.length})
                </h4>
                <span className="text-[10px] font-mono text-emerald-400">Zero Hallucination Tolerance</span>
              </div>

              <div className="space-y-2">
                {currentSkill.strictRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-950 border border-stone-800 p-3 text-xs font-mono text-stone-200 flex items-start gap-2.5"
                  >
                    <div className="p-1 bg-stone-900 border border-stone-800 text-emerald-400 text-[10px] font-bold shrink-0 mt-0.5">
                      R{idx + 1}
                    </div>
                    <div className="leading-relaxed">{rule}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Quick Action Bar */}
        <div className="bg-stone-950 border-t border-stone-800 p-4 shrink-0 flex items-center gap-2 flex-wrap">
          {onRunTest && (
            <button
              onClick={() => onRunTest(currentSkill)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-stone-950 hover:bg-stone-200 text-xs font-mono font-bold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Skill</span>
            </button>
          )}

          {onRemixSkill && (
            <button
              onClick={() => onRemixSkill(currentSkill)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-mono border border-stone-800 hover:border-stone-700 transition-colors"
              title="Remix this skill with another parent"
            >
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>Remix</span>
            </button>
          )}

          {onOpenForceGraph && (
            <button
              onClick={() => onOpenForceGraph(currentSkill)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono border border-cyan-800/80 transition-colors"
              title="Locate in D3 Force Graph"
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>View in Graph</span>
            </button>
          )}

          {currentSkill.stage === 'testing' && currentSkill.benchmarkScore >= 94.0 && onPromoteSkill && (
            <button
              onClick={() => onPromoteSkill(currentSkill)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-mono border border-emerald-800 transition-colors"
              title="Promote to Champion"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Promote</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
