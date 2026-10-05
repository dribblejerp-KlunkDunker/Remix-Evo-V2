import React, { useState, useMemo } from 'react';
import type { AgentSkill, VectorCategory } from '../../types/skills';
import {
  Scale,
  ArrowRightLeft,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  Dna,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  X,
  Swords,
  Copy,
  Check
} from 'lucide-react';

export interface SkillComparisonMatrixProps {
  skills: AgentSkill[];
  initialSkillAId?: string;
  initialSkillBId?: string;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  onRemixPair?: (skillA: AgentSkill, skillB: AgentSkill) => void;
  onRunHeadToHeadSwarm?: (skillAId: string, skillBId: string) => void;
  className?: string;
}

export const SkillComparisonMatrix: React.FC<SkillComparisonMatrixProps> = ({
  skills,
  initialSkillAId,
  initialSkillBId,
  isOpenAsOverlay = false,
  onCloseOverlay,
  onInspectSkill,
  onRemixPair,
  onRunHeadToHeadSwarm,
  className = '',
}) => {
  const [onlyChampions, setOnlyChampions] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'logic' | 'metrics' | 'lineage'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Available skills based on filter
  const candidateSkills = useMemo(() => {
    if (onlyChampions) {
      const champs = skills.filter((s) => s.stage === 'champion');
      return champs.length >= 2 ? champs : skills;
    }
    return skills;
  }, [skills, onlyChampions]);

  // Default selection: pick top 2 champions, or first 2 available
  const [selectedSkillAId, setSelectedSkillAId] = useState<string>(() => {
    if (initialSkillAId && skills.some((s) => s.id === initialSkillAId)) return initialSkillAId;
    const champs = skills.filter((s) => s.stage === 'champion');
    return champs[0]?.id || skills[0]?.id || '';
  });

  const [selectedSkillBId, setSelectedSkillBId] = useState<string>(() => {
    if (initialSkillBId && skills.some((s) => s.id === initialSkillBId)) return initialSkillBId;
    const champs = skills.filter((s) => s.stage === 'champion');
    return champs[1]?.id || (skills[1]?.id ?? skills[0]?.id) || '';
  });

  const skillA = useMemo(() => skills.find((s) => s.id === selectedSkillAId) || skills[0], [skills, selectedSkillAId]);
  const skillB = useMemo(() => skills.find((s) => s.id === selectedSkillBId) || skills[1] || skills[0], [skills, selectedSkillBId]);

  const handleSwap = () => {
    const temp = selectedSkillAId;
    setSelectedSkillAId(selectedSkillBId);
    setSelectedSkillBId(temp);
  };

  const handlePickRandomPair = () => {
    const pool = candidateSkills.length >= 2 ? candidateSkills : skills;
    if (pool.length < 2) return;
    const idxA = Math.floor(Math.random() * pool.length);
    let idxB = Math.floor(Math.random() * (pool.length - 1));
    if (idxB >= idxA) idxB += 1;
    setSelectedSkillAId(pool[idxA].id);
    setSelectedSkillBId(pool[idxB].id);
  };

  // Metrics comparison delta calculations
  const comparisonStats = useMemo(() => {
    if (!skillA || !skillB) return null;

    const winRateDelta = Number((skillA.winRate - skillB.winRate).toFixed(1));
    const scoreDelta = Number((skillA.benchmarkScore - skillB.benchmarkScore).toFixed(1));
    const stabilityDelta = Number((skillA.stabilityIndex - skillB.stabilityIndex).toFixed(1));
    const hallucinationDelta = Number((skillB.hallucinationRate - skillA.hallucinationRate).toFixed(2)); // Positive means A is lower/better
    const passesDelta = skillA.activeTestBench.consecutivePasses - skillB.activeTestBench.consecutivePasses;

    // Tally wins
    let aWins = 0;
    let bWins = 0;
    if (winRateDelta > 0) aWins++; else if (winRateDelta < 0) bWins++;
    if (scoreDelta > 0) aWins++; else if (scoreDelta < 0) bWins++;
    if (stabilityDelta > 0) aWins++; else if (stabilityDelta < 0) bWins++;
    if (hallucinationDelta > 0) aWins++; else if (hallucinationDelta < 0) bWins++;
    if (passesDelta > 0) aWins++; else if (passesDelta < 0) bWins++;

    return {
      winRateDelta,
      scoreDelta,
      stabilityDelta,
      hallucinationDelta,
      passesDelta,
      aWins,
      bWins,
    };
  }, [skillA, skillB]);

  // Vector analysis
  const vectorAnalysis = useMemo(() => {
    if (!skillA || !skillB) return { shared: [], onlyA: [], onlyB: [] };
    const setA = new Set(skillA.vectors);
    const setB = new Set(skillB.vectors);

    const shared = skillA.vectors.filter((v) => setB.has(v));
    const onlyA = skillA.vectors.filter((v) => !setB.has(v));
    const onlyB = skillB.vectors.filter((v) => !setA.has(v));

    return { shared, onlyA, onlyB };
  }, [skillA, skillB]);

  const handleCopySummary = () => {
    if (!skillA || !skillB) return;
    const text = [
      `=== CHAMPION SKILL COMPARISON MATRIX ===`,
      `SKILL A: ${skillA.name} (${skillA.code})`,
      `- Role: ${skillA.specialistRole}`,
      `- Benchmark Score: ${skillA.benchmarkScore}% | Win Rate: ${skillA.winRate}%`,
      `- Stability Index: ${skillA.stabilityIndex}% | Hallucination Rate: ${skillA.hallucinationRate}%`,
      `- Evolution Lineage: ${skillA.evolutionLineage?.mutationType || 'N/A'} (Gen ${skillA.generation})`,
      ``,
      `SKILL B: ${skillB.name} (${skillB.code})`,
      `- Role: ${skillB.specialistRole}`,
      `- Benchmark Score: ${skillB.benchmarkScore}% | Win Rate: ${skillB.winRate}%`,
      `- Stability Index: ${skillB.stabilityIndex}% | Hallucination Rate: ${skillB.hallucinationRate}%`,
      `- Evolution Lineage: ${skillB.evolutionLineage?.mutationType || 'N/A'} (Gen ${skillB.generation})`,
      ``,
      `HEAD-TO-HEAD DELTA (A vs B):`,
      `- Win Rate: ${comparisonStats?.winRateDelta! > 0 ? '+' : ''}${comparisonStats?.winRateDelta}%`,
      `- Benchmark Score: ${comparisonStats?.scoreDelta! > 0 ? '+' : ''}${comparisonStats?.scoreDelta}%`,
      `- Stability Index: ${comparisonStats?.stabilityDelta! > 0 ? '+' : ''}${comparisonStats?.stabilityDelta}%`,
      `- Shared Vectors: ${vectorAnalysis.shared.join(', ') || 'None'}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!skillA || !skillB) {
    return (
      <div className="p-8 text-center bg-stone-900 border border-stone-800 text-stone-400 font-mono text-sm">
        Insufficient skills loaded to render comparison matrix.
      </div>
    );
  }

  const containerContent = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Controls */}
      <div className="bg-stone-900/90 border border-stone-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-1">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold uppercase tracking-wider">Comparative Matrix Analysis</span>
            <span className="text-stone-600">·</span>
            <span>Head-to-Head Logic & Genetic Lineage</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Skill Comparison Matrix
            {comparisonStats && (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 border border-stone-700 bg-stone-800/80 text-stone-300">
                {comparisonStats.aWins > comparisonStats.bWins
                  ? `${skillA.code} Leads (${comparisonStats.aWins}-${comparisonStats.bWins})`
                  : comparisonStats.bWins > comparisonStats.aWins
                  ? `${skillB.code} Leads (${comparisonStats.bWins}-${comparisonStats.aWins})`
                  : `Even Score (${comparisonStats.aWins}-${comparisonStats.bWins})`}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 bg-stone-950 text-stone-300 cursor-pointer hover:border-stone-700">
            <input
              type="checkbox"
              checked={onlyChampions}
              onChange={(e) => setOnlyChampions(e.target.checked)}
              className="accent-amber-500 rounded-none w-3.5 h-3.5"
            />
            <span>Champions Only</span>
          </label>

          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            title="Swap Skill A and Skill B"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-stone-400" />
            <span>Swap</span>
          </button>

          <button
            onClick={handlePickRandomPair}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            title="Pick a random champion pair"
          >
            <Dna className="w-3.5 h-3.5 text-emerald-400" />
            <span>Random Pair</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            title="Copy comparative summary to clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copiedSummary ? 'Copied' : 'Export'}</span>
          </button>

          {onRemixPair && (
            <button
              onClick={() => onRemixPair(skillA, skillB)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition-colors"
              title="Cross-breed and remix these two champion skills"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Remix Pair</span>
            </button>
          )}

          {onRunHeadToHeadSwarm && (
            <button
              onClick={() => onRunHeadToHeadSwarm(skillA.id, skillB.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold transition-colors"
              title="Run head-to-head arena swarm on these two skills"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Head-to-Head Arena</span>
            </button>
          )}

          {isOpenAsOverlay && (
            <div className="flex items-center gap-1 border-l border-stone-800 pl-2">
              <button
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="p-1.5 text-stone-400 hover:text-white"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {onCloseOverlay && (
                <button
                  onClick={onCloseOverlay}
                  className="p-1.5 text-stone-400 hover:text-white"
                  title="Close comparison"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Selection Bar: Skill A & Skill B Picker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector Card A */}
        <div className="bg-stone-900 border-2 border-cyan-800/80 p-4 relative">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 bg-cyan-400 inline-block" />
              Skill Candidate A
            </span>
            <span className="text-stone-500">{skillA.stage.toUpperCase()} TIER</span>
          </div>

          <div className="relative mb-3">
            <select
              value={selectedSkillAId}
              onChange={(e) => setSelectedSkillAId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-white font-mono text-sm py-2 px-3 appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer pr-8"
            >
              {candidateSkills.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedSkillBId}>
                  [{s.code}] {s.name} — {s.winRate}% win rate ({s.benchmarkScore} score)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-stone-400 truncate max-w-[280px]" title={skillA.specialistRole}>
              Role: <strong className="text-stone-200">{skillA.specialistRole}</strong>
            </span>
            {onInspectSkill && (
              <button
                onClick={() => onInspectSkill(skillA)}
                className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
              >
                Inspect <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Selector Card B */}
        <div className="bg-stone-900 border-2 border-purple-800/80 p-4 relative">
          <div className="flex items-center justify-between text-xs font-mono text-purple-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 bg-purple-400 inline-block" />
              Skill Candidate B
            </span>
            <span className="text-stone-500">{skillB.stage.toUpperCase()} TIER</span>
          </div>

          <div className="relative mb-3">
            <select
              value={selectedSkillBId}
              onChange={(e) => setSelectedSkillBId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-white font-mono text-sm py-2 px-3 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer pr-8"
            >
              {candidateSkills.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedSkillAId}>
                  [{s.code}] {s.name} — {s.winRate}% win rate ({s.benchmarkScore} score)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-stone-400 truncate max-w-[280px]" title={skillB.specialistRole}>
              Role: <strong className="text-stone-200">{skillB.specialistRole}</strong>
            </span>
            {onInspectSkill && (
              <button
                onClick={() => onInspectSkill(skillB)}
                className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 cursor-pointer"
              >
                Inspect <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quick Section View Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 border transition-colors ${
            activeTab === 'all'
              ? 'bg-stone-800 text-white border-stone-600 font-bold'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          Comprehensive View
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-3 py-1.5 border transition-colors ${
            activeTab === 'metrics'
              ? 'bg-stone-800 text-emerald-300 border-stone-600 font-bold'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          Win Rates & Performance
        </button>
        <button
          onClick={() => setActiveTab('logic')}
          className={`px-3 py-1.5 border transition-colors ${
            activeTab === 'logic'
              ? 'bg-stone-800 text-cyan-300 border-stone-600 font-bold'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          Logic Parameters & Directives
        </button>
        <button
          onClick={() => setActiveTab('lineage')}
          className={`px-3 py-1.5 border transition-colors ${
            activeTab === 'lineage'
              ? 'bg-stone-800 text-purple-300 border-stone-600 font-bold'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          Evolution Paths & Lineage
        </button>
      </div>

      {/* 4. HEAD-TO-HEAD WIN RATES & PERFORMANCE METRICS */}
      {(activeTab === 'all' || activeTab === 'metrics') && (
        <div className="bg-stone-900 border border-stone-800 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                1. Win Rates & Empirical Metrics
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Benchmark Gate: ≥ 95.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Win Rate */}
            <div className="bg-stone-950 border border-stone-800 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span>WIN RATE</span>
                {comparisonStats && (
                  <span className={`font-bold ${comparisonStats.winRateDelta > 0 ? 'text-cyan-400' : comparisonStats.winRateDelta < 0 ? 'text-purple-400' : 'text-stone-400'}`}>
                    Δ {comparisonStats.winRateDelta > 0 ? `+${comparisonStats.winRateDelta}% (A)` : comparisonStats.winRateDelta < 0 ? `${Math.abs(comparisonStats.winRateDelta)}% (B)` : '0%'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 border ${skillA.winRate >= skillB.winRate ? 'border-cyan-500/80 bg-cyan-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-cyan-400">SKILL A</div>
                  <div className="text-xl font-mono font-bold text-white">{skillA.winRate}%</div>
                </div>
                <div className={`p-2 border ${skillB.winRate >= skillA.winRate ? 'border-purple-500/80 bg-purple-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-purple-400">SKILL B</div>
                  <div className="text-xl font-mono font-bold text-white">{skillB.winRate}%</div>
                </div>
              </div>
              {/* Progress visualizer */}
              <div className="mt-3 space-y-1.5">
                <div className="w-full bg-stone-800 h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all" style={{ width: `${skillA.winRate}%` }} />
                </div>
                <div className="w-full bg-stone-800 h-1.5 overflow-hidden">
                  <div className="bg-purple-400 h-full transition-all" style={{ width: `${skillB.winRate}%` }} />
                </div>
              </div>
            </div>

            {/* Benchmark Score */}
            <div className="bg-stone-950 border border-stone-800 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span>BENCHMARK SCORE</span>
                {comparisonStats && (
                  <span className={`font-bold ${comparisonStats.scoreDelta > 0 ? 'text-cyan-400' : comparisonStats.scoreDelta < 0 ? 'text-purple-400' : 'text-stone-400'}`}>
                    Δ {comparisonStats.scoreDelta > 0 ? `+${comparisonStats.scoreDelta} (A)` : comparisonStats.scoreDelta < 0 ? `${Math.abs(comparisonStats.scoreDelta)} (B)` : '0'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 border ${skillA.benchmarkScore >= skillB.benchmarkScore ? 'border-cyan-500/80 bg-cyan-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-cyan-400">SKILL A</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">{skillA.benchmarkScore}</div>
                </div>
                <div className={`p-2 border ${skillB.benchmarkScore >= skillA.benchmarkScore ? 'border-purple-500/80 bg-purple-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-purple-400">SKILL B</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">{skillB.benchmarkScore}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>Threshold: {skillA.threshold}%</span>
                <span>Margin: +{Math.max(skillA.benchmarkScore, skillB.benchmarkScore) - 95.0}</span>
              </div>
            </div>

            {/* Stability Index */}
            <div className="bg-stone-950 border border-stone-800 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span>STABILITY INDEX</span>
                {comparisonStats && (
                  <span className={`font-bold ${comparisonStats.stabilityDelta > 0 ? 'text-cyan-400' : comparisonStats.stabilityDelta < 0 ? 'text-purple-400' : 'text-stone-400'}`}>
                    Δ {comparisonStats.stabilityDelta > 0 ? `+${comparisonStats.stabilityDelta}% (A)` : comparisonStats.stabilityDelta < 0 ? `${Math.abs(comparisonStats.stabilityDelta)}% (B)` : '0%'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 border ${skillA.stabilityIndex >= skillB.stabilityIndex ? 'border-cyan-500/80 bg-cyan-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-cyan-400">SKILL A</div>
                  <div className="text-xl font-mono font-bold text-white">{skillA.stabilityIndex}%</div>
                </div>
                <div className={`p-2 border ${skillB.stabilityIndex >= skillA.stabilityIndex ? 'border-purple-500/80 bg-purple-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-purple-400">SKILL B</div>
                  <div className="text-xl font-mono font-bold text-white">{skillB.stabilityIndex}%</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-mono text-stone-500 text-center">
                Variance resistance across seeds
              </div>
            </div>

            {/* Hallucination Rate (Lower is better) */}
            <div className="bg-stone-950 border border-stone-800 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span>HALLUCINATION RATE</span>
                <span className="text-[10px] text-stone-500 font-mono">LOWER IS BETTER</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 border ${skillA.hallucinationRate <= skillB.hallucinationRate ? 'border-cyan-500/80 bg-cyan-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-cyan-400">SKILL A</div>
                  <div className="text-xl font-mono font-bold text-amber-300">{skillA.hallucinationRate}%</div>
                </div>
                <div className={`p-2 border ${skillB.hallucinationRate <= skillA.hallucinationRate ? 'border-purple-500/80 bg-purple-950/30' : 'border-stone-800'}`}>
                  <div className="text-[10px] font-mono text-purple-400">SKILL B</div>
                  <div className="text-xl font-mono font-bold text-amber-300">{skillB.hallucinationRate}%</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-mono text-stone-500 text-center">
                {skillA.hallucinationRate === 0 && skillB.hallucinationRate === 0
                  ? 'Both zero-hallucination verified'
                  : skillA.hallucinationRate < skillB.hallucinationRate
                  ? `${skillA.code} is ${skillB.hallucinationRate - skillA.hallucinationRate}% more grounded`
                  : `${skillB.code} is ${skillA.hallucinationRate - skillB.hallucinationRate}% more grounded`}
              </div>
            </div>
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-stone-400 pt-2 border-t border-stone-800">
            <div>
              <span className="text-stone-500 block text-[10px]">GENERATION EPOCH</span>
              <span className="text-white font-bold">{skillA.generation}</span>
              <span className="text-stone-600 mx-1.5">vs</span>
              <span className="text-white font-bold">{skillB.generation}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">TESTS RUN TODAY</span>
              <span className="text-white font-bold">{skillA.activeTestBench.totalRunsToday}</span>
              <span className="text-stone-600 mx-1.5">vs</span>
              <span className="text-white font-bold">{skillB.activeTestBench.totalRunsToday}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">CONSECUTIVE PASSES</span>
              <span className="text-emerald-400 font-bold">{skillA.activeTestBench.consecutivePasses}</span>
              <span className="text-stone-600 mx-1.5">vs</span>
              <span className="text-emerald-400 font-bold">{skillB.activeTestBench.consecutivePasses}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">SURVIVAL ITERATIONS</span>
              <span className="text-purple-400 font-bold">{skillA.evolutionLineage?.survivalIterations ?? 0}</span>
              <span className="text-stone-600 mx-1.5">vs</span>
              <span className="text-purple-400 font-bold">{skillB.evolutionLineage?.survivalIterations ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. DIFFERING LOGIC PARAMETERS MATRIX */}
      {(activeTab === 'all' || activeTab === 'logic') && (
        <div className="bg-stone-900 border border-stone-800 p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                2. Differing Logic Parameters & Directives
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Prompt Matrix & Cognitive Reasoning Structures
            </span>
          </div>

          {/* Vector Overlap Breakdown */}
          <div className="bg-stone-950 border border-stone-800 p-4 space-y-3">
            <div className="text-xs font-mono text-stone-400 flex items-center justify-between">
              <span className="font-bold uppercase text-stone-300">Vector Domain Specializations</span>
              <span className="text-[11px] text-stone-500">
                {vectorAnalysis.shared.length} Shared · {vectorAnalysis.onlyA.length} Unique to A · {vectorAnalysis.onlyB.length} Unique to B
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-900/60 border border-cyan-900/60">
                <span className="text-cyan-400 font-bold block mb-2 text-[11px]">UNIQUE TO {skillA.code}:</span>
                {vectorAnalysis.onlyA.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {vectorAnalysis.onlyA.map((v) => (
                      <span key={v} className="px-2 py-0.5 border border-cyan-800 text-cyan-300 bg-cyan-950/60">
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-stone-500 italic">No exclusive vectors</span>
                )}
              </div>

              <div className="p-3 bg-stone-900/60 border border-emerald-900/60">
                <span className="text-emerald-400 font-bold block mb-2 text-[11px]">SHARED OVERLAPPING VECTORS:</span>
                {vectorAnalysis.shared.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {vectorAnalysis.shared.map((v) => (
                      <span key={v} className="px-2 py-0.5 border border-emerald-800 text-emerald-300 bg-emerald-950/60">
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-stone-500 italic">Zero overlapping vectors (Cross-domain rivals)</span>
                )}
              </div>

              <div className="p-3 bg-stone-900/60 border border-purple-900/60">
                <span className="text-purple-400 font-bold block mb-2 text-[11px]">UNIQUE TO {skillB.code}:</span>
                {vectorAnalysis.onlyB.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {vectorAnalysis.onlyB.map((v) => (
                      <span key={v} className="px-2 py-0.5 border border-purple-800 text-purple-300 bg-purple-950/60">
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-stone-500 italic">No exclusive vectors</span>
                )}
              </div>
            </div>
          </div>

          {/* Side-by-Side Prompt Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Logic Box A */}
            <div className="bg-stone-950 border border-cyan-900/50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-xs font-mono text-cyan-400">
                <span className="font-bold uppercase">Candidate A: {skillA.name}</span>
                <span className="text-stone-500">{skillA.code}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  System Directive
                </span>
                <p className="text-xs font-mono text-stone-200 bg-stone-900/80 p-3 border border-stone-800 leading-relaxed whitespace-pre-wrap">
                  {skillA.promptMatrix.systemDirective}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Reasoning Framework
                </span>
                <p className="text-xs font-mono text-cyan-300 bg-stone-900/80 p-2.5 border border-stone-800">
                  {skillA.promptMatrix.reasoningFramework}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Adversarial Constraint
                </span>
                <p className="text-xs font-mono text-amber-300 bg-stone-900/80 p-2.5 border border-stone-800">
                  {skillA.promptMatrix.adversarialConstraint}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1.5">
                  Strict Behavioral Rules ({skillA.strictRules.length})
                </span>
                <ul className="space-y-1.5 text-xs font-mono text-stone-300">
                  {skillA.strictRules.map((rule, idx) => (
                    <li key={idx} className="p-2 bg-stone-900/60 border border-stone-800 flex items-start gap-2">
                      <span className="text-cyan-500 font-bold shrink-0">{idx + 1}.</span>
                      <span className="leading-snug">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Active Test Stress Vector
                </span>
                <div className="text-xs font-mono text-stone-300 bg-stone-900/60 p-2 border border-stone-800">
                  <strong className="text-stone-400">Bench:</strong> {skillA.activeTestBench.name}
                  <br />
                  <strong className="text-stone-400">Stress:</strong> {skillA.activeTestBench.stressVector}
                </div>
              </div>
            </div>

            {/* Logic Box B */}
            <div className="bg-stone-950 border border-purple-900/50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-xs font-mono text-purple-400">
                <span className="font-bold uppercase">Candidate B: {skillB.name}</span>
                <span className="text-stone-500">{skillB.code}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  System Directive
                </span>
                <p className="text-xs font-mono text-stone-200 bg-stone-900/80 p-3 border border-stone-800 leading-relaxed whitespace-pre-wrap">
                  {skillB.promptMatrix.systemDirective}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Reasoning Framework
                </span>
                <p className="text-xs font-mono text-purple-300 bg-stone-900/80 p-2.5 border border-stone-800">
                  {skillB.promptMatrix.reasoningFramework}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Adversarial Constraint
                </span>
                <p className="text-xs font-mono text-amber-300 bg-stone-900/80 p-2.5 border border-stone-800">
                  {skillB.promptMatrix.adversarialConstraint}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1.5">
                  Strict Behavioral Rules ({skillB.strictRules.length})
                </span>
                <ul className="space-y-1.5 text-xs font-mono text-stone-300">
                  {skillB.strictRules.map((rule, idx) => (
                    <li key={idx} className="p-2 bg-stone-900/60 border border-stone-800 flex items-start gap-2">
                      <span className="text-purple-500 font-bold shrink-0">{idx + 1}.</span>
                      <span className="leading-snug">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">
                  Active Test Stress Vector
                </span>
                <div className="text-xs font-mono text-stone-300 bg-stone-900/60 p-2 border border-stone-800">
                  <strong className="text-stone-400">Bench:</strong> {skillB.activeTestBench.name}
                  <br />
                  <strong className="text-stone-400">Stress:</strong> {skillB.activeTestBench.stressVector}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SIDE-BY-SIDE EVOLUTION PATHS & ANCESTRY MATRIX */}
      {(activeTab === 'all' || activeTab === 'lineage') && (
        <div className="bg-stone-900 border border-stone-800 p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-purple-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                3. Side-by-Side Evolution Paths & Ancestry
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Genetic Heritage, Mutation Strategy & Milestones
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolution Path A */}
            <div className="bg-stone-950 border border-stone-800 p-4 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-stone-800 pb-2">
                <span className="font-bold">{skillA.name} Lineage</span>
                <span>Epoch: {skillA.evolutionLineage?.generationEpoch || `Epoch-${skillA.generation}`}</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Immediate Ancestors:</span>
                  <span className="text-stone-200 font-bold">
                    {skillA.evolutionLineage?.parents?.join(' × ') || 'Root Seed Prototype'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Remix Vector Combo:</span>
                  <span className="text-cyan-300 font-bold">
                    {skillA.evolutionLineage?.remixVectorCombo || skillA.vectors.join(' × ')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Mutation Operator:</span>
                  <span className="text-amber-400">
                    {skillA.evolutionLineage?.mutationType || 'Branching Mutation'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Survival Iterations:</span>
                  <span className="text-white font-bold">
                    {skillA.evolutionLineage?.survivalIterations ?? 100} cycles
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Open Source Pedigree:</span>
                  <span className="text-stone-300">
                    {skillA.openSourceLineage
                      ? `${skillA.openSourceLineage.source}: ${skillA.openSourceLineage.repoOrDataset || skillA.openSourceLineage.standardSpec}`
                      : 'Internal Benchmark Matrix'}
                  </span>
                </div>
              </div>

              {/* Milestone Stage Timeline */}
              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-2">
                  Stage Progression History
                </span>
                <div className="space-y-2">
                  {skillA.stageHistory?.map((sh, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-900/70 border border-stone-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <strong className="text-stone-200 uppercase">{sh.stage}</strong>
                          <span className="text-stone-500 block text-[10px]">{sh.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">{sh.score}%</span>
                        <span className="text-stone-500 block text-[10px] truncate max-w-[140px]">{sh.notes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evolution Path B */}
            <div className="bg-stone-950 border border-stone-800 p-4 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-purple-400 border-b border-stone-800 pb-2">
                <span className="font-bold">{skillB.name} Lineage</span>
                <span>Epoch: {skillB.evolutionLineage?.generationEpoch || `Epoch-${skillB.generation}`}</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Immediate Ancestors:</span>
                  <span className="text-stone-200 font-bold">
                    {skillB.evolutionLineage?.parents?.join(' × ') || 'Root Seed Prototype'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Remix Vector Combo:</span>
                  <span className="text-purple-300 font-bold">
                    {skillB.evolutionLineage?.remixVectorCombo || skillB.vectors.join(' × ')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Mutation Operator:</span>
                  <span className="text-amber-400">
                    {skillB.evolutionLineage?.mutationType || 'Branching Mutation'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Survival Iterations:</span>
                  <span className="text-white font-bold">
                    {skillB.evolutionLineage?.survivalIterations ?? 100} cycles
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-800/80">
                  <span className="text-stone-500">Open Source Pedigree:</span>
                  <span className="text-stone-300">
                    {skillB.openSourceLineage
                      ? `${skillB.openSourceLineage.source}: ${skillB.openSourceLineage.repoOrDataset || skillB.openSourceLineage.standardSpec}`
                      : 'Internal Benchmark Matrix'}
                  </span>
                </div>
              </div>

              {/* Milestone Stage Timeline */}
              <div>
                <span className="text-[10px] font-mono text-stone-500 uppercase block mb-2">
                  Stage Progression History
                </span>
                <div className="space-y-2">
                  {skillB.stageHistory?.map((sh, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-900/70 border border-stone-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div>
                          <strong className="text-stone-200 uppercase">{sh.stage}</strong>
                          <span className="text-stone-500 block text-[10px]">{sh.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">{sh.score}%</span>
                        <span className="text-stone-500 block text-[10px] truncate max-w-[140px]">{sh.notes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isOpenAsOverlay) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn ${
          isFullScreen ? 'p-0' : 'p-4 md:p-8'
        }`}
        onClick={onCloseOverlay}
      >
        <div
          className={`bg-stone-950 border border-stone-800 w-full shadow-2xl overflow-y-auto max-h-[92vh] ${
            isFullScreen ? 'h-full max-h-screen border-0' : 'max-w-7xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {containerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {containerContent}
    </div>
  );
};
