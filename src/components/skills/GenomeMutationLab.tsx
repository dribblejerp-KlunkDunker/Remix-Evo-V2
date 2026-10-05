import React, { useState, useMemo, useEffect } from 'react';
import type { AgentSkill, VectorCategory } from '../../types/skills';
import {
  Dna,
  Cpu,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Check,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  PieChart,
  Terminal,
  ExternalLink,
  FlaskConical,
  Scale,
  GitFork,
  Radio,
  Sliders,
  Scissors
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';

export interface GenomeSegment {
  id: string;
  name: string;
  locusKey: string;
  category: 'Directive' | 'Procedure' | 'Constraint' | 'Rule' | 'Vector' | 'Cognition';
  currentContent: string;
  randomizationProb: number; // 0-100%
  combinationProb: number; // 0-100%
  conservationProb: number; // 0-100%
  volatilityTier: 'Ultra-Volatile' | 'Adaptive' | 'Conserved' | 'Rigid';
  activeStrategy: string;
  volatileTokens: string[];
  historicalMutationImpact: number; // e.g. +3.2%
}

export interface MutationStrategySpec {
  name: string;
  tag: string;
  targetSegments: string[];
  baseProbability: number;
  winRate: number;
  description: string;
  typicalDelta: string;
}

export interface GenomeMutationLabProps {
  skills: AgentSkill[];
  initialSkillId?: string;
  onInspectSkill?: (skill: AgentSkill) => void;
  onDeployMutatedGenome?: (mutatedSkill: AgentSkill) => void;
  onUpdateSkill?: (updatedSkill: AgentSkill) => void;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  className?: string;
}

export const MUTATION_STRATEGIES: MutationStrategySpec[] = [
  {
    name: 'Adversarial Constraint Hardening',
    tag: 'Strict Invariance',
    targetSegments: ['Adversarial Constraints', 'Strict Rules'],
    baseProbability: 28,
    winRate: 74.2,
    description: 'Injects unyielding refusal constraints prohibiting unhedged conclusions or unverified management assertions.',
    typicalDelta: '+3.8% avg'
  },
  {
    name: 'Reasoning Framework Restructure',
    tag: 'Procedural Architecture',
    targetSegments: ['Procedural Reasoning', 'Directive Stance'],
    baseProbability: 22,
    winRate: 68.5,
    description: 'Swaps or restructures verification steps (e.g. transitioning from linear audit to Bayesian odds ratio tests).',
    typicalDelta: '+2.4% avg'
  },
  {
    name: 'Rule Specificity Injection',
    tag: 'Metric Checkability',
    targetSegments: ['Strict Rules Array', 'Test Vector Profile'],
    baseProbability: 24,
    winRate: 81.0,
    description: 'Replaces generic aspirations with binary checkable rules (e.g., requiring specific footnote citations and DPO thresholds).',
    typicalDelta: '+4.5% avg'
  },
  {
    name: 'Epistemic Calibration Tightening',
    tag: 'Uncertainty Bounds',
    targetSegments: ['Cognitive Thought Vector', 'Conviction Modifiers'],
    baseProbability: 14,
    winRate: 62.0,
    description: 'Adjusts probability thresholds and dampens overconfidence on incomplete or ambiguous financial filings.',
    typicalDelta: '+1.6% avg'
  },
  {
    name: 'Failure Mode Immunisation',
    tag: 'Trap Falsification',
    targetSegments: ['Adversarial Constraints', 'Directive Stance'],
    baseProbability: 12,
    winRate: 78.4,
    description: 'Encodes explicit defenses against known deception patterns observed in historical regression evaluations.',
    typicalDelta: '+3.1% avg'
  }
];

export const GenomeMutationLab: React.FC<GenomeMutationLabProps> = ({
  skills,
  initialSkillId,
  onInspectSkill,
  onDeployMutatedGenome,
  onUpdateSkill,
  isOpenAsOverlay = false,
  onCloseOverlay,
  className = '',
}) => {
  // Primary agent selection
  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    initialSkillId || skills[0]?.id || ''
  );

  const activeSkill: AgentSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || skills[0];
  }, [skills, selectedSkillId]);

  // Optional Crossover Partner Agent
  const [crossoverPartnerId, setCrossoverPartnerId] = useState<string>(
    skills[1]?.id || skills[0]?.id || ''
  );

  const crossoverPartner: AgentSkill = useMemo(() => {
    return skills.find((s) => s.id === crossoverPartnerId) || skills[1] || skills[0];
  }, [skills, crossoverPartnerId]);

  // Interactive Mutation Probability Control Levers
  const [globalMutationRate, setGlobalMutationRate] = useState<number>(65); // 0-100%
  const [crossoverRatio, setCrossoverRatio] = useState<number>(35); // 0-100%
  const [temperatureEntropy, setTemperatureEntropy] = useState<number>(0.35); // 0.0-1.0
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'segments' | 'strategies' | 'simulation'>('segments');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('seg-rules-0');

  // Interactive Manual Genome Editing state
  const [isManualEditMode, setIsManualEditMode] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');

  // Simulation state
  const [isSimulatingCycle, setIsSimulatingCycle] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    generation: number;
    mutatedSegments: string[];
    combinedSegments: string[];
    conservedSegments: string[];
    projectedDelta: number;
    diffSummary: string[];
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Compute Genome Segments with dynamic probability distributions based on levers
  const genomeSegments: GenomeSegment[] = useMemo(() => {
    const rules = activeSkill?.strictRules || [
      'RULE 1: Require balance sheet reconciliation for every operating cash flow item.',
      'RULE 2: Flag unquantified supplier finance / SPV arrangements as financing activities.'
    ];

    const baseRandFactor = globalMutationRate / 100;
    const baseCombFactor = crossoverRatio / 100;
    const entropyFactor = temperatureEntropy;

    const segs: GenomeSegment[] = [
      {
        id: 'seg-directive',
        name: 'System Directive & Operating Stance',
        locusKey: 'LOCUS-01-DIR',
        category: 'Directive',
        currentContent: activeSkill?.promptMatrix?.systemDirective || 'Operate as an unyielding forensic accounting specialist.',
        randomizationProb: Math.round(Math.min(95, Math.max(10, 45 * baseRandFactor + entropyFactor * 25))),
        combinationProb: Math.round(Math.min(95, Math.max(10, 50 * baseCombFactor))),
        conservationProb: 0,
        volatilityTier: 'Adaptive',
        activeStrategy: 'Reasoning Framework Restructure',
        volatileTokens: ['forensic', 'unyielding', 'specialist', 'stance', 'operating'],
        historicalMutationImpact: 2.8
      },
      {
        id: 'seg-framework',
        name: 'Procedural Reasoning Framework',
        locusKey: 'LOCUS-02-RSN',
        category: 'Procedure',
        currentContent: activeSkill?.promptMatrix?.reasoningFramework || '1. Ingest SEC disclosures. 2. Verify cash flow reconciliation. 3. Check covenant math.',
        randomizationProb: Math.round(Math.min(95, Math.max(10, 60 * baseRandFactor + entropyFactor * 20))),
        combinationProb: Math.round(Math.min(95, Math.max(10, 65 * baseCombFactor))),
        conservationProb: 0,
        volatilityTier: 'Ultra-Volatile',
        activeStrategy: 'Reasoning Framework Restructure',
        volatileTokens: ['reconciliation', 'covenant', 'ingest', 'procedure', 'verification'],
        historicalMutationImpact: 3.4
      },
      {
        id: 'seg-adversarial',
        name: 'Adversarial Rejection Constraints',
        locusKey: 'LOCUS-03-ADV',
        category: 'Constraint',
        currentContent: activeSkill?.promptMatrix?.adversarialConstraint || 'Refuse to conclude cash flow quality is sound without verifying working capital footnote details.',
        randomizationProb: Math.round(Math.min(98, Math.max(15, 78 * baseRandFactor + entropyFactor * 18))),
        combinationProb: Math.round(Math.min(95, Math.max(10, 42 * baseCombFactor))),
        conservationProb: 0,
        volatilityTier: 'Ultra-Volatile',
        activeStrategy: 'Adversarial Constraint Hardening',
        volatileTokens: ['refuse', 'conclude', 'without verifying', 'footnote', 'working capital'],
        historicalMutationImpact: 4.8
      }
    ];

    // Add strict rule segments
    rules.forEach((rule, idx) => {
      const isConserved = idx === 0 && activeSkill.stage === 'champion';
      const randProb = isConserved
        ? Math.round(Math.max(8, 25 * baseRandFactor))
        : Math.round(Math.min(92, Math.max(20, 72 * baseRandFactor + entropyFactor * 15)));
      const combProb = Math.round(Math.min(90, Math.max(15, 60 * baseCombFactor)));

      segs.push({
        id: `seg-rules-${idx}`,
        name: `Strict Rule [LOC-${idx + 1}]: ${rule.slice(0, 32)}...`,
        locusKey: `LOCUS-04-RUL-${idx + 1}`,
        category: 'Rule',
        currentContent: rule,
        randomizationProb: randProb,
        combinationProb: combProb,
        conservationProb: 0,
        volatilityTier: isConserved ? 'Conserved' : 'Adaptive',
        activeStrategy: 'Rule Specificity Injection',
        volatileTokens: rule.split(' ').slice(0, 5),
        historicalMutationImpact: isConserved ? 1.5 : 4.1
      });
    });

    // Add Cognitive Thought & Vector segments
    segs.push({
      id: 'seg-thought',
      name: 'Autonomous Thought & Cognitive Stance',
      locusKey: 'LOCUS-05-COG',
      category: 'Cognition',
      currentContent: activeSkill?.autonomousThought || 'Scrutinizing supplier finance footnote disclosures for disguised bank borrowings.',
      randomizationProb: Math.round(Math.min(99, Math.max(30, 85 * baseRandFactor + entropyFactor * 25))),
      combinationProb: Math.round(Math.min(85, Math.max(10, 30 * baseCombFactor))),
      conservationProb: 0,
      volatilityTier: 'Ultra-Volatile',
      activeStrategy: 'Epistemic Calibration Tightening',
      volatileTokens: ['scrutinizing', 'disguised', 'borrowings', 'supplier finance'],
      historicalMutationImpact: 2.1
    });

    segs.push({
      id: 'seg-vectors',
      name: 'Domain Capability Vectors',
      locusKey: 'LOCUS-06-VEC',
      category: 'Vector',
      currentContent: activeSkill?.vectors?.join(' × ') || 'Forensic Accounting × Statistics',
      randomizationProb: Math.round(Math.max(5, 18 * baseRandFactor)),
      combinationProb: Math.round(Math.min(95, Math.max(25, 75 * baseCombFactor))),
      conservationProb: 0,
      volatilityTier: 'Rigid',
      activeStrategy: 'Failure Mode Immunisation',
      volatileTokens: activeSkill?.vectors || ['Forensic Accounting'],
      historicalMutationImpact: 1.2
    });

    // Normalize conservation probabilities so they sum gracefully
    return segs.map((s) => {
      const remaining = Math.max(0, 100 - (s.randomizationProb * 0.55 + s.combinationProb * 0.45));
      return {
        ...s,
        conservationProb: Math.round(remaining)
      };
    });
  }, [activeSkill, globalMutationRate, crossoverRatio, temperatureEntropy]);

  const activeSegment = useMemo(() => {
    return genomeSegments.find((s) => s.id === selectedSegmentId) || genomeSegments[0];
  }, [genomeSegments, selectedSegmentId]);

  // Keep edited content in sync when selected segment changes
  useEffect(() => {
    if (activeSegment) {
      setEditedContent(activeSegment.currentContent);
    }
  }, [activeSegment?.id, activeSegment?.currentContent]);

  // Save changes to current segment directly to skill
  const handleSaveSegment = () => {
    if (!activeSegment) return;

    let updatedSkill: AgentSkill = { ...activeSkill };

    if (activeSegment.id === 'seg-directive') {
      updatedSkill = {
        ...updatedSkill,
        promptMatrix: {
          ...updatedSkill.promptMatrix,
          systemDirective: editedContent,
        },
      };
    } else if (activeSegment.id === 'seg-framework') {
      updatedSkill = {
        ...updatedSkill,
        promptMatrix: {
          ...updatedSkill.promptMatrix,
          reasoningFramework: editedContent,
        },
      };
    } else if (activeSegment.id === 'seg-adversarial') {
      updatedSkill = {
        ...updatedSkill,
        promptMatrix: {
          ...updatedSkill.promptMatrix,
          adversarialConstraint: editedContent,
        },
      };
    } else if (activeSegment.id === 'seg-thought') {
      updatedSkill = {
        ...updatedSkill,
        autonomousThought: editedContent,
      };
    } else if (activeSegment.id.startsWith('seg-rules-')) {
      const ruleIdx = parseInt(activeSegment.id.replace('seg-rules-', ''), 10);
      const newRules = [...(updatedSkill.strictRules || [])];
      newRules[ruleIdx] = editedContent;
      updatedSkill = {
        ...updatedSkill,
        strictRules: newRules,
      };
    }

    if (onUpdateSkill) {
      onUpdateSkill(updatedSkill);
    }
    setNotification(`✓ Successfully saved edits to locus ${activeSegment.locusKey} for [${activeSkill.code}]!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Add a new strict rule locus to the agent
  const handleAddNewRuleLocus = () => {
    const ruleNum = (activeSkill.strictRules?.length || 0) + 1;
    const newRuleText = `RULE ${ruleNum}: Require independent verification and cross-footing before concluding on financial assertions.`;
    const updatedSkill: AgentSkill = {
      ...activeSkill,
      strictRules: [...(activeSkill.strictRules || []), newRuleText],
    };
    if (onUpdateSkill) {
      onUpdateSkill(updatedSkill);
    }
    setSelectedSegmentId(`seg-rules-${(activeSkill.strictRules?.length || 0)}`);
    setNotification(`✓ Injected new genetic rule locus (RULE ${ruleNum}) into [${activeSkill.code}]!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Execute Simulated Mutation Cycle
  const handleSimulateMutationCycle = () => {
    setIsSimulatingCycle(true);

    setTimeout(() => {
      const mutated: string[] = [];
      const combined: string[] = [];
      const conserved: string[] = [];
      const diffs: string[] = [];

      genomeSegments.forEach((seg) => {
        const roll = Math.random() * 100;
        if (roll < seg.randomizationProb * 0.6) {
          mutated.push(seg.name);
          diffs.push(`[MUTATED ${seg.locusKey}]: Injected targeted specificity into ${seg.name}`);
        } else if (roll < (seg.randomizationProb * 0.6 + seg.combinationProb * 0.4)) {
          combined.push(seg.name);
          diffs.push(`[RECOMBINED ${seg.locusKey}]: Spliced allele from Partner [${crossoverPartner.code}] into ${seg.name}`);
        } else {
          conserved.push(seg.name);
          diffs.push(`[CONSERVED ${seg.locusKey}]: High-fitness invariant preserved without alteration.`);
        }
      });

      const netDelta = Number(((mutated.length * 0.8 + combined.length * 0.6) - (temperatureEntropy > 0.6 ? 1.2 : 0)).toFixed(1));

      setSimulationResult({
        generation: activeSkill.generation + 1,
        mutatedSegments: mutated,
        combinedSegments: combined,
        conservedSegments: conserved,
        projectedDelta: netDelta,
        diffSummary: diffs
      });

      setIsSimulatingCycle(false);
      setActiveTab('simulation');
      setNotification(`Simulated Genome Cycle completed: Generation ${activeSkill.generation + 1} created!`);
      setTimeout(() => setNotification(null), 3500);
    }, 450);
  };

  // Recharts Chart Data for Segment Volatility
  const chartData = useMemo(() => {
    return genomeSegments.map((s) => ({
      name: s.name.length > 22 ? s.name.slice(0, 22) + '...' : s.name,
      locus: s.locusKey,
      'Randomize (Mutation)': s.randomizationProb,
      'Combine (Crossover)': s.combinationProb,
      'Conserve (Invariant)': s.conservationProb
    }));
  }, [genomeSegments]);

  return (
    <div
      className={`bg-stone-950 border border-stone-800 flex flex-col font-mono text-stone-200 transition-all ${
        isOpenAsOverlay
          ? 'fixed inset-4 z-50 shadow-2xl overflow-hidden'
          : `w-full rounded-none ${className}`
      }`}
    >
      {/* 1. COMPONENT HEADER */}
      <header className="p-4 bg-stone-900/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-950/80 border border-purple-500/60 rounded-xs">
            <Dna className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
                Genome Editor & Mutation Lab
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-950 border border-purple-600 text-purple-300">
                  GENETIC LOCI & DIRECT CODE EDITOR
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-400">
              Interactive Genome Editor: directly edit system directives and strict rules, or simulate stochastic mutation and cross-over splicing.
            </p>
          </div>
        </div>

        {/* Primary Agent & Crossover Partner Selectors */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 px-2.5 py-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-500 text-[11px] uppercase">Agent:</span>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="bg-transparent text-stone-200 font-bold focus:outline-hidden cursor-pointer"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id} className="bg-stone-900 text-stone-200">
                  [{s.code}] {s.name} ({s.stage})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 px-2.5 py-1.5">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-stone-500 text-[11px] uppercase">Partner:</span>
            <select
              value={crossoverPartnerId}
              onChange={(e) => setCrossoverPartnerId(e.target.value)}
              className="bg-transparent text-stone-200 font-bold focus:outline-hidden cursor-pointer"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id} className="bg-stone-900 text-stone-200">
                  [{s.code}] {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSimulateMutationCycle}
            disabled={isSimulatingCycle}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all border ${
              isSimulatingCycle
                ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-xs cursor-pointer'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSimulatingCycle ? 'animate-spin' : ''}`} />
            <span>{isSimulatingCycle ? 'Mutating...' : 'Simulate Mutation Cycle'}</span>
          </button>

          {isOpenAsOverlay && onCloseOverlay && (
            <button
              onClick={onCloseOverlay}
              className="p-1.5 bg-stone-950 hover:bg-rose-950 border border-stone-800 hover:border-rose-700 text-stone-400 hover:text-rose-200"
              title="Close Genome Lab"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="px-4 py-2 bg-purple-950/90 border-b border-purple-600 text-purple-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. PROBABILITY GOVERNOR STRIP */}
      <section className="bg-stone-900/60 border-b border-stone-800 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5 p-2 bg-stone-950 border border-stone-800">
          <div className="flex justify-between items-center">
            <span className="text-stone-400 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Global Mutation Rate P(Mutate)
            </span>
            <span className="text-rose-400 font-bold">{globalMutationRate}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            value={globalMutationRate}
            onChange={(e) => setGlobalMutationRate(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500">
            <span>Conservative (10%)</span>
            <span>Exploratory (65%)</span>
            <span>Hyper-Volatile (95%)</span>
          </div>
        </div>

        <div className="space-y-1.5 p-2 bg-stone-950 border border-stone-800">
          <div className="flex justify-between items-center">
            <span className="text-stone-400 font-bold flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              Recombination Crossover Ratio P(Cross)
            </span>
            <span className="text-cyan-400 font-bold">{crossoverRatio}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={crossoverRatio}
            onChange={(e) => setCrossoverRatio(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500">
            <span>Single-Parent (0%)</span>
            <span>Balanced (35%)</span>
            <span>Obligate Recombination (100%)</span>
          </div>
        </div>

        <div className="space-y-1.5 p-2 bg-stone-950 border border-stone-800">
          <div className="flex justify-between items-center">
            <span className="text-stone-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Temperature / Entropy Level
            </span>
            <span className="text-amber-400 font-bold">{temperatureEntropy.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={temperatureEntropy}
            onChange={(e) => setTemperatureEntropy(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500">
            <span>0.05 (Targeted)</span>
            <span>0.35 (Optimal)</span>
            <span>1.0 (Maximum Variance)</span>
          </div>
        </div>
      </section>

      {/* 3. SUB-VIEW TABS */}
      <div className="p-3 bg-stone-900/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
          <button
            onClick={() => setActiveTab('segments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'segments'
                ? 'bg-stone-800 text-purple-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-purple-400" />
            <span>Genome Loci Segments ({genomeSegments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('strategies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'strategies'
                ? 'bg-stone-800 text-cyan-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Mutation Operators ({MUTATION_STRATEGIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'simulation'
                ? 'bg-stone-800 text-emerald-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cycle Simulation & Splicing Diff</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 bg-rose-500 inline-block" />
            Randomize / Mutate
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 bg-cyan-500 inline-block" />
            Combine / Recombine
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 bg-emerald-500 inline-block" />
            Conserved / Stable
          </span>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[720px] bg-stone-950/90 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: GENOME LOCI SEGMENTS WITH PROBABILITIES */}
        {/* ========================================================================= */}
        {activeTab === 'segments' && (
          <div className="space-y-6">
            {/* Visual Probability Distribution Chart (Stacked Recharts) */}
            <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Segment Volatility Matrix: Randomization vs Combination Likelihood
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Calculated probabilities of each code locus being modified during an autonomous evolution tick.
                  </p>
                </div>
                <span className="text-[10px] text-stone-500 font-bold bg-stone-950 px-2 py-1 border border-stone-800">
                  Total Segments: {genomeSegments.length}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid stroke="#292524" strokeDasharray="3 3" />
                    <XAxis dataKey="locus" stroke="#78716c" tick={{ fontSize: 10, fill: '#a8a29e' }} angle={-25} textAnchor="end" />
                    <YAxis domain={[0, 100]} stroke="#78716c" tick={{ fontSize: 10, fill: '#a8a29e' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0c0a09', borderColor: '#44403c', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`${val}%`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Randomize (Mutation)" stackId="a" fill="#f43f5e" />
                    <Bar dataKey="Combine (Crossover)" stackId="a" fill="#06b6d4" />
                    <Bar dataKey="Conserve (Invariant)" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Interactive Segments List & Code Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Segments List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Code Segments Loci Browser
                  </h4>
                  <button
                    onClick={handleAddNewRuleLocus}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-[10px] font-bold cursor-pointer transition-colors"
                    title="Add a new invariant strict rule locus to this agent"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Rule Locus</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {genomeSegments.map((seg) => (
                    <div
                      key={seg.id}
                      onClick={() => setSelectedSegmentId(seg.id)}
                      className={`p-3 border cursor-pointer transition-all space-y-2 ${
                        selectedSegmentId === seg.id
                          ? 'bg-purple-950/30 border-purple-500 shadow-sm'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-300 flex items-center gap-1.5">
                          <Dna className="w-3.5 h-3.5 text-purple-400" />
                          {seg.locusKey} · {seg.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 uppercase font-bold border ${
                            seg.volatilityTier === 'Ultra-Volatile'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                              : seg.volatilityTier === 'Adaptive'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          }`}
                        >
                          {seg.volatilityTier}
                        </span>
                      </div>

                      {/* Multi-Bar Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-stone-400">
                          <span>Mutate: <strong className="text-rose-400">{seg.randomizationProb}%</strong></span>
                          <span>Combine: <strong className="text-cyan-400">{seg.combinationProb}%</strong></span>
                          <span>Conserved: <strong className="text-emerald-400">{seg.conservationProb}%</strong></span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-950 flex overflow-hidden">
                          <div style={{ width: `${seg.randomizationProb * 0.5}%` }} className="h-full bg-rose-500" />
                          <div style={{ width: `${seg.combinationProb * 0.5}%` }} className="h-full bg-cyan-500" />
                          <div style={{ width: `${seg.conservationProb * 0.5}%` }} className="h-full bg-emerald-500" />
                        </div>
                      </div>

                      <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800/80">
                        <span>Target Strategy: <strong className="text-stone-300">{seg.activeStrategy}</strong></span>
                        <span className="text-emerald-400 font-bold">+{seg.historicalMutationImpact}% Impact</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Code Locus Inspector & Volatile Token Highlighter */}
              <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-4">
                <div className="border-b border-stone-800 pb-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase font-bold">{activeSegment.locusKey}</span>
                    <h3 className="text-xs font-bold text-white uppercase">{activeSegment.name}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-stone-950 border border-stone-800 text-stone-300">
                    Category: {activeSegment.category}
                  </span>
                </div>

                {/* Mode Selector & Actual Code Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-stone-400 font-bold uppercase flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      <span>Segment Genetic Code ({activeSegment.locusKey})</span>
                    </label>

                    <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5 text-[10px]">
                      <button
                        onClick={() => setIsManualEditMode(false)}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${
                          !isManualEditMode ? 'bg-stone-800 text-purple-300 font-bold' : 'text-stone-500'
                        }`}
                      >
                        Allele Tokens
                      </button>
                      <button
                        onClick={() => setIsManualEditMode(true)}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${
                          isManualEditMode ? 'bg-purple-900/80 text-purple-200 font-bold' : 'text-stone-500'
                        }`}
                      >
                        Direct Live Editor
                      </button>
                    </div>
                  </div>

                  {!isManualEditMode ? (
                    <div className="p-3 bg-stone-950 border border-stone-800 text-xs font-mono leading-relaxed text-stone-200">
                      {activeSegment.currentContent.split(' ').map((word, wIdx) => {
                        const isVolatile = activeSegment.volatileTokens.some(
                          (vt) => word.toLowerCase().includes(vt.toLowerCase())
                        );
                        return (
                          <span
                            key={wIdx}
                            className={`mr-1 inline-block transition-colors ${
                              isVolatile
                                ? 'bg-rose-950/80 text-rose-200 border-b border-rose-500 font-bold px-1'
                                : 'text-stone-300'
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                      <div className="mt-2 text-[10px] text-stone-500 flex items-center justify-between border-t border-stone-900 pt-1.5">
                        <span className="text-rose-400">● Red underlined words = volatile alleles subject to mutation</span>
                        <button
                          onClick={() => setIsManualEditMode(true)}
                          className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
                        >
                          Switch to Live Editor →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-stone-950 border border-purple-500/50 p-3">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={4}
                        className="w-full bg-stone-900 border border-stone-700 p-2 text-xs font-mono text-stone-100 focus:outline-none focus:border-purple-400 resize-y"
                        placeholder="Enter genetic code, directive, or invariant rule text..."
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-stone-500">Insert Codons:</span>
                          <button
                            onClick={() =>
                              setEditedContent((prev) => prev + ' Require SOFR benchmark reconciliation.')
                            }
                            className="text-[9px] px-1.5 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300"
                          >
                            + SOFR Reconcile
                          </button>
                          <button
                            onClick={() =>
                              setEditedContent((prev) => prev + ' Reject unhedged management assertions without footnote proof.')
                            }
                            className="text-[9px] px-1.5 py-0.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300"
                          >
                            + Strict Refusal
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditedContent(activeSegment.currentContent)}
                            className="text-[10px] px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-700"
                          >
                            Reset
                          </button>
                          <button
                            onClick={handleSaveSegment}
                            className="text-[10px] px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold flex items-center gap-1 border border-emerald-400 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Locus to Genome</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Probabilities Breakdown Cards */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">P(Randomize)</span>
                    <div className="font-bold text-rose-400 text-base mt-0.5">{activeSegment.randomizationProb}%</div>
                    <span className="text-[10px] text-stone-500">LLM rewrite risk</span>
                  </div>

                  <div className="p-2.5 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">P(Combine)</span>
                    <div className="font-bold text-cyan-400 text-base mt-0.5">{activeSegment.combinationProb}%</div>
                    <span className="text-[10px] text-stone-500">Inheritance from Partner</span>
                  </div>

                  <div className="p-2.5 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">P(Conserve)</span>
                    <div className="font-bold text-emerald-400 text-base mt-0.5">{activeSegment.conservationProb}%</div>
                    <span className="text-[10px] text-stone-500">Immutable baseline</span>
                  </div>
                </div>

                {/* Crossover Splicing Preview */}
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-400 font-bold">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Scissors className="w-3.5 h-3.5" />
                      Crossover Splicing Partner Source
                    </span>
                    <span className="text-[10px] text-stone-500">[{crossoverPartner.code}]</span>
                  </div>
                  <p className="text-[11px] text-stone-400 italic">
                    If recombination trips on this locus, this segment will be spliced with "{crossoverPartner.name}" ({crossoverPartner.specialistRole}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CURRENT MUTATION STRATEGIES MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="border border-stone-800 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 text-[11px] uppercase">
                    <th className="py-3 px-3">Mutation Strategy Operator</th>
                    <th className="py-3 px-3">Target Genome Segments</th>
                    <th className="py-3 px-3 text-right">Base Prob</th>
                    <th className="py-3 px-3 text-right">Win Rate</th>
                    <th className="py-3 px-3 text-right">Avg Delta</th>
                    <th className="py-3 px-3">Operational Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80 bg-stone-950/60">
                  {MUTATION_STRATEGIES.map((strat) => (
                    <tr key={strat.name} className="hover:bg-stone-900/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span>{strat.name}</span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-normal pl-4">{strat.tag}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {strat.targetSegments.map((ts, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.2 bg-stone-900 border border-stone-800 text-stone-300">
                              {ts}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-cyan-300">{strat.baseProbability}%</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">{strat.winRate}%</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300">{strat.typicalDelta}</td>
                      <td className="py-3 px-3 text-stone-400 text-[11px] max-w-sm leading-relaxed">
                        {strat.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SIMULATION RESULT & SPLICING DIFF */}
        {/* ========================================================================= */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            {!simulationResult ? (
              <div className="p-12 text-center border border-dashed border-stone-800 text-stone-500 space-y-3">
                <Dna className="w-10 h-10 mx-auto text-purple-500/60 animate-pulse" />
                <h4 className="text-sm font-bold text-stone-300 uppercase">No Mutation Cycle Run Yet</h4>
                <p className="text-xs max-w-md mx-auto">
                  Click the "Simulate Mutation Cycle" button to step through an autonomous evolution tick and view exact randomized vs recombined loci diffs.
                </p>
                <button
                  onClick={handleSimulateMutationCycle}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs border border-purple-400 shadow-md transition-colors"
                >
                  Run Simulation Cycle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Overview Cards */}
                <div className="p-4 bg-stone-900/60 border border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">Offspring Generation</span>
                    <div className="text-base font-bold text-purple-400 mt-1">Generation {simulationResult.generation}</div>
                    <span className="text-[10px] text-stone-500">Parent: {activeSkill.code}</span>
                  </div>

                  <div className="p-3 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">Mutated (Randomized)</span>
                    <div className="text-base font-bold text-rose-400 mt-1">{simulationResult.mutatedSegments.length} Segments</div>
                    <span className="text-[10px] text-rose-400">Targeted rewrites</span>
                  </div>

                  <div className="p-3 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">Combined (Crossover)</span>
                    <div className="text-base font-bold text-cyan-400 mt-1">{simulationResult.combinedSegments.length} Segments</div>
                    <span className="text-[10px] text-cyan-400">From {crossoverPartner.code}</span>
                  </div>

                  <div className="p-3 bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase">Projected Fitness Delta</span>
                    <div className="text-base font-bold text-emerald-400 mt-1">
                      {simulationResult.projectedDelta > 0 ? `+${simulationResult.projectedDelta}%` : `${simulationResult.projectedDelta}%`}
                    </div>
                    <span className="text-[10px] text-emerald-400">Surpassed baseline</span>
                  </div>
                </div>

                {/* Execution Diff Stream */}
                <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Evolutionary Loci Mutation Trace & Gene Splicing Log
                  </h4>

                  <div className="p-3 bg-stone-950 border border-stone-800 font-mono text-xs text-stone-300 space-y-2 max-h-64 overflow-y-auto">
                    {simulationResult.diffSummary.map((diff, dIdx) => (
                      <div key={dIdx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-purple-400 font-bold">&gt;&gt;</span>
                        <span className={diff.includes('[MUTATED') ? 'text-rose-400 font-bold' : diff.includes('[RECOMBINED') ? 'text-cyan-400 font-bold' : 'text-emerald-400'}>
                          {diff}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {onDeployMutatedGenome && (
                    <button
                      onClick={() => {
                        const mutatedSkill: AgentSkill = {
                          ...activeSkill,
                          id: `skill-mut-${Date.now().toString(36)}`,
                          code: `${activeSkill.code}-MUT`,
                          name: `${activeSkill.name} (Mutated G${simulationResult.generation})`,
                          generation: simulationResult.generation,
                          benchmarkScore: Math.min(99.0, Number((activeSkill.benchmarkScore + simulationResult.projectedDelta).toFixed(1))),
                          stage: 'training'
                        };
                        onDeployMutatedGenome(mutatedSkill);
                        setNotification(`Successfully deployed ${mutatedSkill.name} to Training Lab!`);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-2 border border-emerald-400"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Deploy Mutated Offspring to Evolution Matrix</span>
                    </button>
                  )}

                  <button
                    onClick={handleSimulateMutationCycle}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-2 border border-stone-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Run Another Mutation Cycle</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FOOTER STATUS BAR */}
      <footer className="p-3 bg-stone-900/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-400 shrink-0">
        <div className="flex items-center gap-2">
          <Dna className="w-3.5 h-3.5 text-purple-400" />
          <span>Genome Mutation Lab:</span>
          <span className="text-white font-bold">[{activeSkill.code}] {activeSkill.name}</span>
          <span>·</span>
          <span>Crossover Partner: <strong className="text-cyan-400">[{crossoverPartner.code}]</strong></span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span>Target Loci: <strong className="text-stone-300">{genomeSegments.length} Segments</strong></span>
          <span>·</span>
          <span>Strategy: <strong className="text-purple-300">Targeted Stochastic Search</strong></span>
        </div>
      </footer>
    </div>
  );
};
