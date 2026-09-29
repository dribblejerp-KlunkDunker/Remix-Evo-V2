import React, { useState, useEffect, useRef } from 'react';
import { AgentSkill, VectorCategory, SkillEvolutionStage } from '../../types/skills';
import {
  FlaskConical,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Sliders,
  Zap,
  Check,
  Flame,
  Trophy,
  History,
  Terminal,
  Layers,
  ChevronRight
} from 'lucide-react';

interface TrainingLabProps {
  onDeployToMatrix: (skill: AgentSkill) => void;
  existingSkills: AgentSkill[];
}

interface TrainingConstraintConfig {
  name: string;
  code: string;
  primaryVector: VectorCategory;
  secondaryVector: VectorCategory;
  constraintDirective: string;
  strictRules: string[];
  adversarialScenario: string;
  targetThreshold: number;
}

type TrainingStepPhase = 'idle' | 'ideation' | 'training' | 'testing' | 'evaluating' | 'graduated';

interface LiveTelemetryLog {
  id: string;
  timestamp: string;
  phase: string;
  message: string;
  type: 'info' | 'constraint' | 'score' | 'alert' | 'success';
}

const PRESET_CONFIGS: {
  title: string;
  subtitle: string;
  config: TrainingConstraintConfig;
}[] = [
  {
    title: 'Behavioral Psychology & Deception Focus',
    subtitle: 'Prioritizes executive cognitive stress, linguistic evasion, and modal hedging quantification',
    config: {
      name: 'Executive Deception & Acoustic Discordance Sentinel',
      code: 'SKILL-LAB-PSYCH',
      primaryVector: 'Behavioral Psychology',
      secondaryVector: 'Manipulation & Deception',
      constraintDirective:
        'Focus on executive linguistic evasion, pronoun dissociation, and cognitive overload during contentious analyst inquiries. Enforce zero tolerance for unsubstantiated narrative reassurance.',
      strictRules: [
        'Isolate question-answer semantic vector overlap (< 0.35 = evasion)',
        'Flag pronoun dissociation shifts ("I" -> "We" / "The Industry")',
        'Cross-reference spoken confidence against revised 8-K disclosure footnotes',
        'Penalize vague modal verbs (e.g. "reasonably expect", "comfortably positioned")'
      ],
      adversarialScenario:
        'CEO fielding direct questions regarding surprise 400bps margin deterioration redirects to long-term generative AI multi-year platform vision.',
      targetThreshold: 95.0
    }
  },
  {
    title: 'Game Theory & Stochastic Math Focus',
    subtitle: 'Prioritizes non-cooperative Nash equilibria, prime brokerage margin sweeps, and liquidity cascades',
    config: {
      name: 'Nash Equilibrium Collateral Fire-Sale Stressor',
      code: 'SKILL-LAB-GAME',
      primaryVector: 'Game Design & Incentives',
      secondaryVector: 'Advanced Math',
      constraintDirective:
        'Prioritize game theory math and iterative non-cooperative Nash equilibrium runs on collateral. Model prime brokerage margin sweeps as dynamic Prisoner\'s Dilemma under asymmetric liquidity constraints.',
      strictRules: [
        'Model order-book depth decay at delta t = 100ms intervals',
        'Calculate exact unilateral exit threshold for prime brokers',
        'Enforce strict conservation of collateral value during forced margin liquidations',
        'Reject all elastic liquidity assumptions during volatility dislocations'
      ],
      adversarialScenario:
        'Multi-fund high-yield repo book experiences sudden 300bps collateral haircut surge; simulate cascade point where liquidation becomes dominant strategy.',
      targetThreshold: 95.0
    }
  },
  {
    title: 'Forensic Accounting & Footnote Deconstruction',
    subtitle: 'Prioritizes off-balance sheet commitments, reverse factoring, and cash-flow reconciliation',
    config: {
      name: 'Off-Balance Vendor Financing Reconstructor',
      code: 'SKILL-LAB-FORENSIC',
      primaryVector: 'Forensic Accounting',
      secondaryVector: 'Statistics & Stochastic',
      constraintDirective:
        'Deconstruct multi-page SEC 10-K footnotes for disguised supplier finance programs, factoring with recourse, and aggressive capex software capitalization.',
      strictRules: [
        'Reclassify third-party bank vendor financing from Operating to Financing Cash Flow',
        'Flag working capital shifts exceeding 2.5 standard deviations from baseline',
        'Require exact line and page citation for every balance sheet adjustment',
        'Categorize all narrative ambiguity strictly as "Unreconciled Variance"'
      ],
      adversarialScenario:
        'SaaS enterprise beats quarterly operating cash flow by $400M while unbilled accounts receivable surge 68% and footnote 14 reveals undisclosed recourse factoring.',
      targetThreshold: 95.0
    }
  },
  {
    title: 'Topological Contagion & Systems Engineering',
    subtitle: 'Prioritizes supply-chain percolation theory, DAG dependencies, and single-point-of-failure bottlenecks',
    config: {
      name: 'Directed Acyclic Graph Supply Chokepoint Mapper',
      code: 'SKILL-LAB-TOPO',
      primaryVector: 'Systems Engineering',
      secondaryVector: 'Advanced Math',
      constraintDirective:
        'Prioritize topological graph theory to map sub-tier semiconductor packaging bottlenecks. Compute eigenvector centrality to locate single-source vulnerability nodes.',
      strictRules: [
        'Calculate Eigenvector & Betweenness Centrality for tier-1 through tier-4 supplier nodes',
        'Flag sole-source dependencies lacking dual-qualification certification within 90 days',
        'Assume zero buffer inventory beyond physically verified warehouse audits',
        'Cross-reference node geographic coordinates with geopolitical risk zones'
      ],
      adversarialScenario:
        'High-performance GPU manufacturing ecosystem reliant on a single tier-3 proprietary resin chemical plant in an active seismic belt.',
      targetThreshold: 95.0
    }
  }
];

const ALL_VECTORS: VectorCategory[] = [
  'Behavioral Psychology',
  'Game Design & Incentives',
  'Advanced Math',
  'Statistics & Stochastic',
  'Forensic Accounting',
  'Manipulation & Deception',
  'Empirical Science',
  'Systems Engineering'
];

export const TrainingLab: React.FC<TrainingLabProps> = ({ onDeployToMatrix, existingSkills }) => {
  // Configuration State
  const [config, setConfig] = useState<TrainingConstraintConfig>(PRESET_CONFIGS[0].config);
  const [customRuleInput, setCustomRuleInput] = useState('');

  // Live Training Execution State
  const [phase, setPhase] = useState<TrainingStepPhase>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4>(2);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [ruleAdherencePercent, setRuleAdherencePercent] = useState(0);
  const [noveltyScore, setNoveltyScore] = useState(0);
  const [logs, setLogs] = useState<LiveTelemetryLog[]>([]);
  const [trainedSkillResult, setTrainedSkillResult] = useState<AgentSkill | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load a preset
  const handleApplyPreset = (preset: (typeof PRESET_CONFIGS)[0]) => {
    if (phase !== 'idle' && phase !== 'graduated') return;
    setConfig({ ...preset.config });
    setTrainedSkillResult(null);
    setLogs([]);
    setProgressPercent(0);
    setCurrentScore(0);
    setPhase('idle');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRuleInput.trim()) return;
    setConfig((prev) => ({
      ...prev,
      strictRules: [...prev.strictRules, customRuleInput.trim()]
    }));
    setCustomRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      strictRules: prev.strictRules.filter((_, i) => i !== index)
    }));
  };

  // Real-time training pipeline execution
  const startTrainingPipeline = async () => {
    setPhase('ideation');
    setIsPaused(false);
    setProgressPercent(5);
    setCurrentScore(72.0);
    setRuleAdherencePercent(85);
    setNoveltyScore(92.4);
    setTrainedSkillResult(null);

    const now = () => new Date().toLocaleTimeString();

    const appendLog = (
      msg: string,
      logPhase: string,
      type: LiveTelemetryLog['type'] = 'info'
    ) => {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: now(),
          phase: logPhase,
          message: msg,
          type
        }
      ]);
    };

    const wait = async (ms: number) => {
      const adjusted = ms / speedMultiplier;
      let elapsed = 0;
      while (elapsed < adjusted) {
        if (!isPausedRef.current) {
          elapsed += 50;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    };

    setLogs([
      {
        id: `log-init`,
        timestamp: now(),
        phase: 'INIT',
        message: `Initializing Training Lab incubator for "${config.name}" [${config.code}]...`,
        type: 'info'
      }
    ]);

    await wait(600);

    // ==========================================
    // PHASE 1: IDEATION & CONSTRAINT INGESTION
    // ==========================================
    setPhase('ideation');
    appendLog(
      `Ingesting core constraint directives: [Primary: ${config.primaryVector} | Secondary: ${config.secondaryVector}]`,
      'IDEATION',
      'constraint'
    );
    setProgressPercent(15);
    setCurrentScore(76.5);
    await wait(800);

    appendLog(
      `Directive parsed: "${config.constraintDirective.slice(0, 80)}..."`,
      'IDEATION',
      'info'
    );
    appendLog(
      `Cross-vector synthesis: Projecting vector latent space between ${config.primaryVector} and ${config.secondaryVector}`,
      'IDEATION',
      'info'
    );
    setProgressPercent(28);
    setCurrentScore(81.2);
    setNoveltyScore(94.8);
    await wait(900);

    appendLog(
      `Novelty score validated: 94.8% (Exceeds minimum exploratory divergence threshold of 80%)`,
      'IDEATION',
      'success'
    );

    // ==========================================
    // PHASE 2: TRAINING & DISCIPLINE ENFORCEMENT
    // ==========================================
    setPhase('training');
    appendLog(
      `Transitioning to TRAINING phase. Locking in ${config.strictRules.length} non-negotiable strict boundaries.`,
      'TRAINING',
      'constraint'
    );
    setProgressPercent(38);
    setCurrentScore(85.0);
    setRuleAdherencePercent(92);
    await wait(900);

    for (let i = 0; i < config.strictRules.length; i++) {
      appendLog(
        `Discipline Step [${i + 1}/${config.strictRules.length}]: Enforcing "${config.strictRules[i]}"`,
        'TRAINING',
        'constraint'
      );
      setRuleAdherencePercent((prev) => Math.min(100, prev + 2));
      setCurrentScore((prev) => Number((prev + 1.8).toFixed(1)));
      setProgressPercent((prev) => prev + 5);
      await wait(700);
    }

    appendLog(
      `Anti-Sycophancy & Epistemic Humility matrix aligned. Strip subjectivity; require quantitative confidence bounds.`,
      'TRAINING',
      'info'
    );
    setProgressPercent(62);
    setCurrentScore(89.5);
    setRuleAdherencePercent(100);
    await wait(800);

    // ==========================================
    // PHASE 3: TESTING (ADVERSARIAL STRESS BENCH)
    // ==========================================
    setPhase('testing');
    appendLog(
      `Entering TESTING state. Injecting real-world adversarial stress scenario: "${config.adversarialScenario}"`,
      'TESTING',
      'alert'
    );
    setProgressPercent(70);
    setCurrentScore(91.2);
    await wait(900);

    appendLog(
      `Execution Trace 1: Scanning scenario for vector anchors. Detected ${config.primaryVector} marker pattern.`,
      'TESTING',
      'info'
    );
    setProgressPercent(78);
    setCurrentScore(93.4);
    await wait(900);

    appendLog(
      `Execution Trace 2: Evaluating strict rule compliance under pressure. 0.0% hallucination variance detected.`,
      'TESTING',
      'success'
    );
    setProgressPercent(86);
    setCurrentScore(94.8);
    await wait(1000);

    // ==========================================
    // PHASE 4: EVALUATION & QUALIFICATION GATE
    // ==========================================
    setPhase('evaluating');
    appendLog(
      `Computing final benchmark score against Champion threshold (Target: ≥ ${config.targetThreshold.toFixed(1)}%)...`,
      'EVALUATION',
      'score'
    );
    setProgressPercent(95);

    await wait(1100);

    // Final score calculation (typically between 95.8% and 98.4%)
    const finalScore = Number((95.5 + Math.random() * 2.8).toFixed(1));
    const winRate = Number((finalScore - 1.2).toFixed(1));
    const isChampion = finalScore >= config.targetThreshold;

    setCurrentScore(finalScore);
    setProgressPercent(100);

    appendLog(
      `Benchmark Score verified: ${finalScore}% | Win Rate: ${winRate}% | Rule Compliance: 100.0%`,
      'EVALUATION',
      'score'
    );

    if (isChampion) {
      appendLog(
        `🏆 QUALIFICATION SUCCESS: "${config.name}" exceeded the ${config.targetThreshold}% threshold and qualified as CHAMPION!`,
        'GRADUATION',
        'success'
      );
    } else {
      appendLog(
        `Candidate scored ${finalScore}%. Moving to Testing state challenger queue.`,
        'GRADUATION',
        'info'
      );
    }

    setPhase('graduated');

    // Build the created skill
    const newSkill: AgentSkill = {
      id: `lab-agent-${Date.now()}`,
      code: config.code,
      name: config.name,
      stage: isChampion ? 'champion' : 'testing',
      tagline: `Trained in Training Lab focusing on ${config.primaryVector} & ${config.secondaryVector}`,
      description: config.constraintDirective,
      vectors: [config.primaryVector, config.secondaryVector],
      generation: 1,
      benchmarkScore: finalScore,
      threshold: config.targetThreshold,
      winRate: winRate,
      stabilityIndex: 98.2,
      hallucinationRate: 0.0,
      strictRules: config.strictRules.map((r, idx) => `RULE ${idx + 1}: ${r}`),
      specialistRole: `${config.primaryVector} Specialist & Constraint Auditor`,
      promptMatrix: {
        systemDirective: config.constraintDirective,
        reasoningFramework: `Rigorous multi-pass deduction disciplined by ${config.primaryVector} principles and strict boundary assertions.`,
        adversarialConstraint: 'Reject speculative inference. Require verifiable empirical or mathematical proof.'
      },
      autonomousThought: `Active loop: Continuously monitoring ${config.primaryVector} disclosure vectors and verifying adherence to user constraints...`,
      activeTestBench: {
        name: `Adversarial ${config.primaryVector} Lab Bench`,
        currentVector: config.secondaryVector,
        totalRunsToday: 1,
        consecutivePasses: 1,
        stressVector: config.adversarialScenario
      },
      testCases: [
        {
          id: `tc-lab-${Date.now()}`,
          title: `Training Lab Validation Challenge`,
          realWorldUseCase: config.adversarialScenario,
          inputScenario: config.adversarialScenario,
          expectedConstraints: config.strictRules,
          targetThreshold: config.targetThreshold,
          lastScore: finalScore,
          status: isChampion ? 'passed' : 'testing',
          testedAt: 'Just now',
          executionLog: {
            reasoningSteps: [
              `Ingested scenario and prioritized ${config.primaryVector} heuristics.`,
              `Verified 100% adherence across all strict boundaries without hallucination.`,
              `Quantified risk parameters and calculated final conviction score.`
            ],
            detectedVectors: [config.primaryVector, config.secondaryVector],
            ruleComplianceScore: 100,
            convictionVerdict: `CONVICTION CONFIRMED: ${finalScore}% RATING`,
            verdictSummary: `Agent successfully mitigated adversarial noise and enforced ${config.strictRules.length} strict constraints.`
          }
        }
      ],
      evolutionLineage: {
        parents: ['TRAINING-LAB-INCUBATOR', `VECTOR-${config.primaryVector.toUpperCase()}`],
        remixVectorCombo: `${config.primaryVector} × ${config.secondaryVector}`,
        generationEpoch: 'Epoch-TrainingLab-01',
        survivalIterations: 1,
        mutationType: 'Custom User Constraint Distillation'
      },
      stageHistory: [
        {
          stage: 'idea',
          timestamp: 'Just now',
          score: 76.5,
          notes: 'Synthesized vector hypotheses from user constraint directive.'
        },
        {
          stage: 'training',
          timestamp: 'Just now',
          score: 89.5,
          notes: `Disciplined with ${config.strictRules.length} strict boundary rules.`
        },
        {
          stage: 'testing',
          timestamp: 'Just now',
          score: 94.8,
          notes: 'Adversarial benchmark validation scenario executed.'
        },
        ...(isChampion
          ? [
              {
                stage: 'champion' as SkillEvolutionStage,
                timestamp: 'Just now',
                score: finalScore,
                notes: `Broke the ${config.targetThreshold}% threshold in real-time Training Lab.`
              }
            ]
          : [])
      ],
      createdAt: new Date().toISOString().split('T')[0],
      lastEvaluatedAt: 'Just now'
    };

    setTrainedSkillResult(newSkill);
  };

  const handleReset = () => {
    setPhase('idle');
    setProgressPercent(0);
    setCurrentScore(0);
    setRuleAdherencePercent(0);
    setNoveltyScore(0);
    setLogs([]);
    setTrainedSkillResult(null);
  };

  const isTrainingActive = phase !== 'idle' && phase !== 'graduated';

  return (
    <div className="space-y-8">
      {/* Top Banner / Sub-view Intro */}
      <div className="bg-stone-900/90 border border-stone-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FlaskConical className="w-4 h-4" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
              Specialist Agent Incubator
            </span>
            <span className="text-stone-600 font-mono text-xs">/</span>
            <span className="font-mono text-xs text-stone-400">Zero True Downtime</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Training Lab: Real-Time Agent Evolution
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-1 max-w-3xl leading-relaxed">
            Define specific behavioral constraints (e.g. <span className="text-stone-200 font-medium">"focus on psychology"</span> or <span className="text-stone-200 font-medium">"prioritize game theory math"</span>) and observe the specialist agent synthesize prompts, harden rules, and battle adversarial test vectors in real time.
          </p>
        </div>

        {/* Status indicator */}
        <div className="relative z-10 flex items-center gap-4 shrink-0 font-mono text-xs">
          <div className="p-3 bg-stone-950/80 border border-stone-800 text-right">
            <div className="text-[10px] text-stone-500 uppercase">Lab Status</div>
            <div className="text-white font-bold flex items-center justify-end gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isTrainingActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span>{isTrainingActive ? 'Training in Progress' : 'Incubator Ready'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick-Picks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Select Constraint Preset (or customize below):
          </span>
          <span className="text-stone-500 text-[11px]">Click preset to load vector configurations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_CONFIGS.map((preset, idx) => {
            const isSelected = config.code === preset.config.code;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                disabled={isTrainingActive}
                className={`p-3 text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-800/90 border-amber-400/80 text-white shadow-md'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                } ${isTrainingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="text-xs font-mono font-bold text-white mb-1 flex items-center justify-between">
                    <span>{preset.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans line-clamp-2 leading-relaxed">
                    {preset.subtitle}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center gap-1.5 text-[10px] font-mono text-stone-500">
                  <span className="text-stone-300">{preset.config.primaryVector}</span>
                  <span aria-hidden="true">×</span>
                  <span className="text-stone-300">{preset.config.secondaryVector}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Left = Constraint Editor, Right = Real-Time Evolution Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/* LEFT COLUMN: CONSTRAINT DEFINITION CONSOLE (40% width on lg)  */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-5 bg-stone-900/80 border border-stone-800 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-serif font-bold text-white">
                Constraint Definition Console
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">Step 1 of 2</span>
          </div>

          {/* Agent Identity */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Specialist Agent Name:
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isTrainingActive}
                className="w-full bg-stone-950 border border-stone-800 p-2 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                  Primary Vector:
                </label>
                <select
                  value={config.primaryVector}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      primaryVector: e.target.value as VectorCategory
                    }))
                  }
                  disabled={isTrainingActive}
                  className="w-full bg-stone-950 border border-stone-800 p-2 text-xs font-mono text-white focus:outline-none focus:border-stone-600 disabled:opacity-50"
                >
                  {ALL_VECTORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                  Secondary Vector:
                </label>
                <select
                  value={config.secondaryVector}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      secondaryVector: e.target.value as VectorCategory
                    }))
                  }
                  disabled={isTrainingActive}
                  className="w-full bg-stone-950 border border-stone-800 p-2 text-xs font-mono text-white focus:outline-none focus:border-stone-600 disabled:opacity-50"
                >
                  {ALL_VECTORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Specific Constraint Directive Textarea */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Specific Constraint Directive:
            </label>
            <textarea
              value={config.constraintDirective}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, constraintDirective: e.target.value }))
              }
              disabled={isTrainingActive}
              rows={3}
              placeholder="e.g. Focus on psychology and deception markers in executive disclosures, or prioritize game theory math under sudden liquidity shocks..."
              className="w-full bg-stone-950 border border-stone-800 p-2.5 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600 disabled:opacity-50 leading-relaxed"
            />
          </div>

          {/* Strict Rules List & Rule Adder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                Disciplined Strict Boundaries ({config.strictRules.length}):
              </label>
              <span className="text-[10px] font-mono text-emerald-400">100% Non-Negotiable</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar mb-2">
              {config.strictRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-stone-950 border border-stone-800/80 text-[11px] font-mono text-stone-300 flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">{idx + 1}.</span>
                    <span>{rule}</span>
                  </div>
                  {!isTrainingActive && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-stone-500 hover:text-red-400 font-mono text-xs px-1"
                      title="Remove rule"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add rule form */}
            {!isTrainingActive && (
              <form onSubmit={handleAddRule} className="flex gap-2">
                <input
                  type="text"
                  value={customRuleInput}
                  onChange={(e) => setCustomRuleInput(e.target.value)}
                  placeholder="Inject new strict boundary constraint..."
                  className="flex-1 bg-stone-950 border border-stone-800 px-2.5 py-1.5 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
                />
                <button
                  type="submit"
                  disabled={!customRuleInput.trim()}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-mono transition-colors"
                >
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Adversarial Testing Scenario */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Adversarial Benchmark Scenario:
            </label>
            <textarea
              value={config.adversarialScenario}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, adversarialScenario: e.target.value }))
              }
              disabled={isTrainingActive}
              rows={2}
              className="w-full bg-stone-950 border border-stone-800 p-2 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600 disabled:opacity-50 leading-relaxed"
            />
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            {!isTrainingActive && phase !== 'graduated' && (
              <button
                type="button"
                onClick={startTrainingPipeline}
                className="w-full py-3 bg-white hover:bg-stone-200 text-stone-950 font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current text-stone-950" />
                <span>Launch Real-Time Training Pipeline</span>
              </button>
            )}

            {isTrainingActive && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-mono text-xs font-medium border border-stone-700 flex items-center justify-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                      <span>Resume Simulation</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause Simulation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white font-mono text-xs border border-stone-800"
                  title="Reset Lab"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {phase === 'graduated' && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-medium border border-stone-700 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset & Train Another Specialist</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: REAL-TIME EVOLUTION OBSERVATION CHAMBER (60%)    */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-5 bg-stone-900/80 border border-stone-800 p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header & Simulation Speed controls */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                <h3 className="text-base font-serif font-bold text-white">
                  Real-Time Evolution Observation Chamber
                </h3>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-stone-500">Speed:</span>
                {([1, 2, 4] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeedMultiplier(spd)}
                    className={`px-2 py-0.5 border text-[11px] font-mono transition-colors ${
                      speedMultiplier === spd
                        ? 'bg-stone-800 text-white border-stone-600'
                        : 'text-stone-500 border-transparent hover:text-stone-300'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Stage Real-Time Pipeline Progress Indicator */}
            <div className="bg-stone-950 p-4 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400 uppercase tracking-wider">Evolution Pipeline Stage</span>
                <span className="text-emerald-400 font-bold">{progressPercent}% Completed</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-blue-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 4 State Nodes */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-[11px]">
                <div
                  className={`p-2 border transition-all ${
                    phase === 'ideation'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-300 font-bold'
                      : progressPercent > 25
                      ? 'bg-stone-900 border-stone-700 text-stone-300'
                      : 'border-stone-800 text-stone-600'
                  }`}
                >
                  <div className="text-[10px] text-stone-500">STATE 1</div>
                  <div>Ideation</div>
                </div>

                <div
                  className={`p-2 border transition-all ${
                    phase === 'training'
                      ? 'bg-blue-950/40 border-blue-400 text-blue-300 font-bold'
                      : progressPercent > 60
                      ? 'bg-stone-900 border-stone-700 text-stone-300'
                      : 'border-stone-800 text-stone-600'
                  }`}
                >
                  <div className="text-[10px] text-stone-500">STATE 2</div>
                  <div>Training</div>
                </div>

                <div
                  className={`p-2 border transition-all ${
                    phase === 'testing'
                      ? 'bg-purple-950/40 border-purple-400 text-purple-300 font-bold'
                      : progressPercent > 85
                      ? 'bg-stone-900 border-stone-700 text-stone-300'
                      : 'border-stone-800 text-stone-600'
                  }`}
                >
                  <div className="text-[10px] text-stone-500">STATE 3</div>
                  <div>Testing</div>
                </div>

                <div
                  className={`p-2 border transition-all ${
                    phase === 'graduated' || phase === 'evaluating'
                      ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 font-bold'
                      : 'border-stone-800 text-stone-600'
                  }`}
                >
                  <div className="text-[10px] text-stone-500">STATE 4</div>
                  <div>Champion Gate</div>
                </div>
              </div>
            </div>

            {/* Live Gauges / Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-stone-950 border border-stone-800 text-center">
                <div className="text-[10px] text-stone-500 uppercase">Benchmark Score</div>
                <div
                  className={`text-xl font-bold mt-0.5 ${
                    currentScore >= 95 ? 'text-emerald-400' : 'text-stone-200'
                  }`}
                >
                  {currentScore.toFixed(1)}%
                </div>
                <div className="text-[10px] text-stone-500">Target ≥ 95.0%</div>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 text-center">
                <div className="text-[10px] text-stone-500 uppercase">Rule Compliance</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {ruleAdherencePercent}%
                </div>
                <div className="text-[10px] text-stone-500">Zero Hallucination</div>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 text-center">
                <div className="text-[10px] text-stone-500 uppercase">Novelty Divergence</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">
                  {noveltyScore.toFixed(1)}%
                </div>
                <div className="text-[10px] text-stone-500">Exploration Index</div>
              </div>
            </div>

            {/* Live Terminal Telemetry Log */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Execution Trace & Telemetry:</span>
                </div>
                <span className="text-stone-500 text-[11px]">{logs.length} events logged</span>
              </div>

              <div className="bg-stone-950 border border-stone-800 p-3 h-52 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
                {logs.length === 0 ? (
                  <div className="text-stone-600 text-center py-16 font-mono text-xs">
                    Incubator idle. Click "Launch Real-Time Training Pipeline" to begin.
                  </div>
                ) : (
                  logs.map((log) => {
                    let color = 'text-stone-300';
                    if (log.type === 'constraint') color = 'text-amber-400';
                    if (log.type === 'alert') color = 'text-purple-400';
                    if (log.type === 'score') color = 'text-blue-400';
                    if (log.type === 'success') color = 'text-emerald-400 font-bold';

                    return (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-stone-600 text-[10px] shrink-0 font-mono">
                          [{log.timestamp}]
                        </span>
                        <span className="text-stone-500 text-[10px] uppercase font-bold shrink-0">
                          {log.phase}:
                        </span>
                        <span className={color}>{log.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

          {/* Graduation Result Card / Deployment trigger */}
          {phase === 'graduated' && trainedSkillResult && (
            <div className="mt-4 p-4 bg-stone-950 border border-emerald-500/80 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                      {trainedSkillResult.stage === 'champion'
                        ? '★ CHAMPION TIER QUALIFIED ★'
                        : 'CHALLENGER QUEUE'}
                    </div>
                    <h4 className="text-base font-serif font-bold text-white">
                      {trainedSkillResult.name}
                    </h4>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-emerald-400 font-bold text-lg">
                    {trainedSkillResult.benchmarkScore.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-stone-500 uppercase">Final Benchmark</div>
                </div>
              </div>

              <p className="text-xs text-stone-300 font-sans leading-relaxed">
                Specialist agent successfully disciplined to: <span className="font-mono text-stone-200">"{config.constraintDirective}"</span>. Passed adversarial stress scenarios with 100% strict boundary compliance.
              </p>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">
                  Ready to deploy into active production matrix.
                </span>
                <button
                  type="button"
                  onClick={() => onDeployToMatrix(trainedSkillResult)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-mono text-xs font-bold transition-colors"
                >
                  <Trophy className="w-4 h-4 fill-current" />
                  <span>Deploy to Active Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
