import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AgentSkill,
  AgentPersonalityHyperparameters,
  PersonalityArchetypePreset,
  SimulatedGenerationStep,
  SimulationRunResult,
  VectorCategory
} from '../../types/skills';
import {
  DEFAULT_HYPERPARAMETERS,
  PERSONALITY_PRESETS,
  calculateEvolutionTrajectory,
  simulateMonteCarloRun,
  TrajectoryProjectionAnalysis
} from '../../data/mutationSimulatorData';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Sliders,
  Sparkles,
  ShieldAlert,
  Cpu,
  Flame,
  Zap,
  Trophy,
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  RefreshCw,
  Send,
  Check,
  ChevronRight,
  Activity,
  Terminal,
  HelpCircle,
  Copy,
  ExternalLink,
  FastForward,
  FlaskConical
} from 'lucide-react';

interface AgentMutationSimulatorProps {
  onDeploySkillToMatrix?: (skill: AgentSkill) => void;
  onSendToTrainingLab?: (skillParams: {
    name: string;
    directive: string;
    primaryVector: VectorCategory;
    params: AgentPersonalityHyperparameters;
  }) => void;
  existingSkills?: AgentSkill[];
}

export const AgentMutationSimulator: React.FC<AgentMutationSimulatorProps> = ({
  onDeploySkillToMatrix,
  onSendToTrainingLab,
  existingSkills = []
}) => {
  // Current hyper-parameters state
  const [params, setParams] = useState<AgentPersonalityHyperparameters>(DEFAULT_HYPERPARAMETERS);
  const [activePresetId, setActivePresetId] = useState<string>('balanced-champion');
  const [agentName, setAgentName] = useState<string>('Autonomous Genetic Agent Alpha');

  // Monte Carlo simulation state
  const [simulationResult, setSimulationResult] = useState<SimulationRunResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Playback timer ref
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate live trajectory projection whenever params change
  const projection: TrajectoryProjectionAnalysis = useMemo(() => {
    return calculateEvolutionTrajectory(params);
  }, [params]);

  // Radar chart data formatted for Recharts
  const radarData = useMemo(() => {
    return [
      { subject: 'Risk Aversion', value: params.riskAversion, fullMark: 100 },
      { subject: 'Creativity', value: params.creativity, fullMark: 100 },
      { subject: 'Logic Bias', value: params.logicBias, fullMark: 100 },
      { subject: 'Adversarial Skepticism', value: params.adversarialParanoia, fullMark: 100 },
      { subject: 'Psychological ToM', value: params.psychologicalEmpathy, fullMark: 100 },
      { subject: 'Mutation Entropy', value: params.mutationEntropy, fullMark: 100 }
    ];
  }, [params]);

  // Update a single hyper-parameter slider
  const handleParamChange = (key: keyof AgentPersonalityHyperparameters, value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setParams((prev) => ({
      ...prev,
      [key]: clamped
    }));
    setActivePresetId('custom');
  };

  // Apply a personality archetype preset
  const handleApplyPreset = (preset: PersonalityArchetypePreset) => {
    setParams({ ...preset.params });
    setActivePresetId(preset.id);
    setAgentName(`${preset.name} Agent v1`);
    showNotification(`Applied archetype preset: ${preset.name}`);
  };

  // Reset to default balanced parameters
  const handleResetToDefaults = () => {
    setParams(DEFAULT_HYPERPARAMETERS);
    setActivePresetId('balanced-champion');
    setAgentName('Autonomous Genetic Agent Alpha');
    setSimulationResult(null);
    showNotification('Reset hyper-parameters to default baseline');
  };

  // Trigger quick notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Run live Monte Carlo simulation
  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStepIndex(0);

    const fullResult = simulateMonteCarloRun(params, agentName);
    setSimulationResult(fullResult);

    // Animate generation steps sequentially
    let currentStep = 1;
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);

    playbackTimerRef.current = setInterval(() => {
      if (currentStep <= fullResult.steps.length) {
        setSimulationStepIndex(currentStep);
        currentStep++;
      } else {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        setIsSimulating(false);
        showNotification(
          fullResult.reachedChampion
            ? `Champion qualification achieved at Gen ${fullResult.championGen}! Peak: ${fullResult.peakScore}%`
            : `Simulation completed. Peak: ${fullResult.peakScore}% (Below 95.0% Champion Threshold)`
        );
      }
    }, 600);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  // Copy prompt genome snippet to clipboard
  const handleCopyPromptGenome = () => {
    const genomeText = `// SYSTEM DIRECTIVE\n${projection.promptGenomeSnippet.systemDirective}\n\n// REASONING FRAMEWORK\n${projection.promptGenomeSnippet.reasoningFramework}\n\n// ADVERSARIAL CONSTRAINT\n${projection.promptGenomeSnippet.adversarialConstraint}\n\n// SIGNATURE: ${projection.promptGenomeSnippet.mutationSignature}`;
    navigator.clipboard.writeText(genomeText);
    setCopySuccess(true);
    showNotification('Prompt Genome copied to clipboard');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Deploy this simulated persona directly to the Matrix
  const handleDeployToMatrix = () => {
    const newSkill: AgentSkill = {
      id: `skill-mutant-${Date.now().toString(36)}`,
      code: `SKILL-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: agentName || 'Calibrated Mutant Champion',
      stage: projection.estimatedGenToChampion && projection.estimatedGenToChampion <= 3 ? 'training' : 'idea',
      tagline: `${projection.archetypeClassification} calibrated via Mutation Simulator`,
      description: `Synthesized agent with risk-aversion ${params.riskAversion}%, logic ${params.logicBias}%, creativity ${params.creativity}%, and mutation entropy ${params.mutationEntropy}%. Projected peak score: ${projection.peakScore}%.`,
      vectors: (projection.recommendedVectors as VectorCategory[]) || ['Statistics & Stochastic'],
      generation: 1,
      benchmarkScore: projection.trajectory[0].projectedScore,
      threshold: 95.0,
      winRate: Math.max(50, Math.min(99, projection.peakScore - 2)),
      stabilityIndex: projection.stabilityIndex,
      hallucinationRate: projection.hallucinationRisk,
      strictRules: [
        projection.promptGenomeSnippet.adversarialConstraint,
        `Maintain minimum compliance threshold of ${projection.trajectory[0].projectedScore.toFixed(1)}% on initial seed pass`,
        'Enforce axiomatic verification on all multi-hop inference sequences'
      ],
      specialistRole: projection.archetypeClassification,
      promptMatrix: {
        systemDirective: projection.promptGenomeSnippet.systemDirective,
        reasoningFramework: projection.promptGenomeSnippet.reasoningFramework,
        adversarialConstraint: projection.promptGenomeSnippet.adversarialConstraint
      },
      autonomousThought: `Simulated genome calibrated with signature ${projection.promptGenomeSnippet.mutationSignature}. Evaluating convergence towards 95.0% threshold.`,
      activeTestBench: {
        name: 'Genetic Calibration Incubator',
        currentVector: projection.recommendedVectors[0] || 'Statistics & Stochastic',
        totalRunsToday: 1,
        consecutivePasses: 1,
        stressVector: 'Adversarial Counterfactual Injection'
      },
      testCases: [
        {
          id: `tc-mutant-${Date.now()}`,
          title: 'Initial Seed Boundary Stress Verification',
          realWorldUseCase: 'Cross-Vector Empirical Invariance Test',
          inputScenario: 'Evaluate complex multi-party transaction with contradictory footnote disclosures',
          expectedConstraints: ['Verify balance sheet cash flows', 'Flag passive hedging'],
          targetThreshold: 95.0,
          lastScore: projection.trajectory[0].projectedScore,
          status: 'passed',
          testedAt: 'Just now'
        }
      ],
      evolutionLineage: {
        parents: ['Seed-Personality-Simulator', projection.promptGenomeSnippet.mutationSignature],
        remixVectorCombo: projection.recommendedVectors.join(' + '),
        generationEpoch: 'Epoch 1.0 (Calibrated)',
        survivalIterations: 1,
        mutationType: 'Hyper-Parameter Personality Annealing',
        totalMutationPercentage: params.mutationEntropy,
        overallImprovementDelta: Number((projection.peakScore - projection.trajectory[0].projectedScore).toFixed(1))
      },
      stageHistory: [
        {
          stage: 'idea',
          timestamp: new Date().toLocaleTimeString(),
          score: projection.trajectory[0].projectedScore,
          notes: 'Synthesized via Agent Mutation Simulator'
        }
      ],
      createdAt: 'Just now',
      lastEvaluatedAt: 'Just now'
    };

    if (onDeploySkillToMatrix) {
      onDeploySkillToMatrix(newSkill);
      showNotification(`Successfully deployed ${newSkill.name} to Evolution Matrix!`);
    } else {
      showNotification(`Skill ${newSkill.name} compiled with signature ${projection.promptGenomeSnippet.mutationSignature}`);
    }
  };

  // Send to Training Lab
  const handleSendToTrainingLab = () => {
    if (onSendToTrainingLab) {
      onSendToTrainingLab({
        name: agentName,
        directive: projection.promptGenomeSnippet.systemDirective,
        primaryVector: (projection.recommendedVectors[0] as VectorCategory) || 'Statistics & Stochastic',
        params
      });
    } else {
      showNotification('Parameters sent to Training Lab incubator');
    }
  };

  // Helper for slider color
  const getSliderTrackColor = (key: keyof AgentPersonalityHyperparameters, val: number) => {
    if (key === 'riskAversion') return val > 70 ? 'accent-purple-500' : 'accent-stone-400';
    if (key === 'creativity') return val > 70 ? 'accent-amber-400' : 'accent-stone-400';
    if (key === 'logicBias') return val > 75 ? 'accent-cyan-400' : 'accent-stone-400';
    if (key === 'adversarialParanoia') return val > 70 ? 'accent-rose-500' : 'accent-stone-400';
    if (key === 'psychologicalEmpathy') return val > 70 ? 'accent-emerald-400' : 'accent-stone-400';
    return val > 60 ? 'accent-orange-500' : 'accent-stone-400';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-emerald-500/60 shadow-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-stone-900/60 border border-stone-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-semibold uppercase tracking-wider">
                Genetic Calibration Engine
              </span>
              <span>·</span>
              <span className="text-stone-400">Multi-Objective Evolutionary Dynamics</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              Agent Mutation Simulator
            </h2>
            <p className="text-xs md:text-sm text-stone-400 max-w-3xl leading-relaxed font-sans">
              Manually calibrate an AI agent’s cognitive and psychological hyper-parameters—including{' '}
              <strong className="text-purple-300">Risk-Aversion</strong>,{' '}
              <strong className="text-amber-300">Creativity</strong>,{' '}
              <strong className="text-cyan-300">Logic-Bias</strong>,{' '}
              <strong className="text-rose-300">Adversarial Skepticism</strong>, and{' '}
              <strong className="text-emerald-300">Mutation Entropy</strong>.
              Visualize the immediate mathematical impact on its multi-generational evolution trajectory and threshold convergence.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold transition-all ${
                isSimulating
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30'
              }`}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Simulating Gen {simulationStepIndex}/8...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Monte Carlo Trial</span>
                </>
              )}
            </button>

            <button
              onClick={handleDeployToMatrix}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-stone-600 text-xs font-mono font-medium transition-colors"
              title="Deploy as live candidate to Evolution Matrix"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deploy to Matrix</span>
            </button>

            <button
              onClick={handleSendToTrainingLab}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-stone-600 text-xs font-mono font-medium transition-colors"
              title="Send to Training Lab incubator"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>To Training Lab</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="p-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700 text-xs font-mono transition-colors"
              title="Reset parameters to baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Archetype Presets Selector */}
        <div className="mt-6 pt-5 border-t border-stone-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Personality Archetype Presets (1-Click Calibration)
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              Active: <strong className="text-stone-300">{activePresetId}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PERSONALITY_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-left p-2.5 transition-all border ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/80 shadow-sm'
                      : 'bg-stone-900/60 hover:bg-stone-800/70 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold font-mono truncate ${
                        isSelected ? 'text-purple-300' : 'text-stone-200'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 line-clamp-2 leading-snug">
                    {preset.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Control Deck & Real-Time Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 6 Hyper-Parameter Sliders (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-900/50 border border-stone-800 p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Personality Genome Deck
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-500">6 Dimensions</span>
            </div>

            {/* Agent Name Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>Agent Identifier / Persona</span>
                <span className="text-[10px] text-stone-500">{projection.promptGenomeSnippet.mutationSignature}</span>
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Agent name..."
              />
            </div>

            {/* Slider 1: Risk-Aversion */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-semibold text-white">Risk-Aversion</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('riskAversion', params.riskAversion - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-purple-300 w-10 text-center">
                    {params.riskAversion}%
                  </span>
                  <button
                    onClick={() => handleParamChange('riskAversion', params.riskAversion + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.riskAversion}
                onChange={(e) => handleParamChange('riskAversion', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Speculative Gambler</span>
                <span>50% Balanced</span>
                <span>100% Hyper-Defensive</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.riskAversion > 75
                  ? 'Mandates dual-entry audit proof gates. Zero tolerance for unverified extrapolation.'
                  : params.riskAversion < 35
                  ? 'Accepts high hypothesis variance; pursues high-risk non-linear anomalies.'
                  : 'Balances conservative verification with measured speculative inference.'}
              </p>
            </div>

            {/* Slider 2: Creativity / Temperature */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-mono font-semibold text-white">Creativity / Temperature</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('creativity', params.creativity - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-300 w-10 text-center">
                    {params.creativity}%
                  </span>
                  <button
                    onClick={() => handleParamChange('creativity', params.creativity + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.creativity}
                onChange={(e) => handleParamChange('creativity', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Deterministic</span>
                <span>50% Adaptive</span>
                <span>100% Radical Divergence</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.creativity > 75
                  ? 'Cross-pollinates disparate domain vectors (e.g. game design + acoustics).'
                  : params.creativity < 30
                  ? 'Strict formulaic deduction; adheres rigidly to documented historical seeds.'
                  : 'Synthesizes targeted lateral analogies within bounded problem domains.'}
              </p>
            </div>

            {/* Slider 3: Logic-Bias / Formal Rigor */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-white">Logic-Bias / Formal Rigor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('logicBias', params.logicBias - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-cyan-300 w-10 text-center">
                    {params.logicBias}%
                  </span>
                  <button
                    onClick={() => handleParamChange('logicBias', params.logicBias + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.logicBias}
                onChange={(e) => handleParamChange('logicBias', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Heuristic Gut</span>
                <span>50% Structured</span>
                <span>100% Axiomatic Proof</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.logicBias > 80
                  ? 'Enforces symbolic invariant proofs; suppresses subjective narrative bias.'
                  : params.logicBias < 40
                  ? 'Relies on pattern heuristics; vulnerable to adversarial hallucinations.'
                  : 'Applies probabilistic Boolean checks to quantitative statements.'}
              </p>
            </div>

            {/* Slider 4: Adversarial Paranoia / Skepticism */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-mono font-semibold text-white">Adversarial Paranoia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('adversarialParanoia', params.adversarialParanoia - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-rose-300 w-10 text-center">
                    {params.adversarialParanoia}%
                  </span>
                  <button
                    onClick={() => handleParamChange('adversarialParanoia', params.adversarialParanoia + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.adversarialParanoia}
                onChange={(e) => handleParamChange('adversarialParanoia', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Benign Trust</span>
                <span>50% Skeptical</span>
                <span>100% Zero-Trust Red-Team</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.adversarialParanoia > 80
                  ? 'Assumes counterparty disclosures contain deliberate deception or omissions.'
                  : params.adversarialParanoia < 40
                  ? 'Accepts stated corporate numbers without deep adversarial stress checks.'
                  : 'Flags suspicious disclosures for targeted footnote reconciliation.'}
              </p>
            </div>

            {/* Slider 5: Psychological Empathy / Theory-of-Mind */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-white">Psychological Empathy & ToM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('psychologicalEmpathy', params.psychologicalEmpathy - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-300 w-10 text-center">
                    {params.psychologicalEmpathy}%
                  </span>
                  <button
                    onClick={() => handleParamChange('psychologicalEmpathy', params.psychologicalEmpathy + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.psychologicalEmpathy}
                onChange={(e) => handleParamChange('psychologicalEmpathy', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Cold Mechanistic</span>
                <span>50% Context-Aware</span>
                <span>100% Micro-hedging Forensics</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.psychologicalEmpathy > 75
                  ? 'Quantifies executive linguistic evasion, pronoun shifts, and stress pitch.'
                  : params.psychologicalEmpathy < 30
                  ? 'Ignores human cognitive factors; evaluates numbers purely in abstract vacuum.'
                  : 'Correlates management conviction changes with balance sheet revisions.'}
              </p>
            </div>

            {/* Slider 6: Genomic Mutation Entropy */}
            <div className="space-y-2 p-3 bg-stone-950/70 border border-stone-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-mono font-semibold text-white">Mutation Entropy Rate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleParamChange('mutationEntropy', params.mutationEntropy - 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-orange-300 w-10 text-center">
                    {params.mutationEntropy}%
                  </span>
                  <button
                    onClick={() => handleParamChange('mutationEntropy', params.mutationEntropy + 5)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.mutationEntropy}
                onChange={(e) => handleParamChange('mutationEntropy', Number(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-none cursor-pointer accent-orange-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0% Prompt Locked</span>
                <span>50% Annealing</span>
                <span>100% Radical Drift</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {params.mutationEntropy > 70
                  ? 'High genomic plasticity. Re-synthesizes rules radically during stress passes.'
                  : params.mutationEntropy < 25
                  ? 'Ultra-stable prompt lock. Minimal drift; high reproducibility.'
                  : 'Balanced annealing; fine-tunes threshold weights without destabilizing rules.'}
              </p>
            </div>
          </div>

          {/* Dynamic Prompt Genome Live Preview Card */}
          <div className="bg-stone-900/50 border border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-stone-200">
                  Synthesized Prompt Genome Preview
                </span>
              </div>
              <button
                onClick={handleCopyPromptGenome}
                className="flex items-center gap-1 text-[10px] font-mono text-stone-400 hover:text-white transition-colors"
                title="Copy prompt directive to clipboard"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="bg-stone-950 p-2.5 border border-stone-800/80">
                <span className="text-stone-500 block text-[10px] uppercase font-bold mb-1">
                  // System Directive
                </span>
                <p className="text-stone-300 leading-relaxed">
                  {projection.promptGenomeSnippet.systemDirective}
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 border border-stone-800/80">
                <span className="text-stone-500 block text-[10px] uppercase font-bold mb-1">
                  // Reasoning Framework
                </span>
                <p className="text-stone-300 leading-relaxed">
                  {projection.promptGenomeSnippet.reasoningFramework}
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 border border-stone-800/80">
                <span className="text-stone-500 block text-[10px] uppercase font-bold mb-1">
                  // Adversarial Constraint
                </span>
                <p className="text-stone-300 leading-relaxed">
                  {projection.promptGenomeSnippet.adversarialConstraint}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Evolution Trajectory Projections & Visualizations (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1: Estimated Champion Epoch */}
            <div className="p-3.5 bg-stone-900/60 border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Champion Gate</span>
                <Trophy className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {projection.estimatedGenToChampion !== null ? (
                  <span className="text-emerald-400">
                    Gen {projection.estimatedGenToChampion}
                  </span>
                ) : (
                  <span className="text-amber-400 text-sm">Below 95% Gate</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-stone-500 mt-1">
                {projection.convergenceVelocity} Convergence
              </div>
            </div>

            {/* KPI 2: Peak Performance Ceiling */}
            <div className="p-3.5 bg-stone-900/60 border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Peak Ceiling</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-lg font-mono font-bold text-cyan-300">
                {projection.peakScore.toFixed(1)}%
              </div>
              <div className="text-[10px] font-mono text-stone-500 mt-1">
                Threshold: ≥ 95.0%
              </div>
            </div>

            {/* KPI 3: Catastrophic Drift Risk */}
            <div className="p-3.5 bg-stone-900/60 border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Extinction Risk</span>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  projection.catastrophicDriftRisk > 40
                    ? 'text-rose-400'
                    : projection.catastrophicDriftRisk > 20
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {projection.catastrophicDriftRisk}%
              </div>
              <div className="text-[10px] font-mono text-stone-500 mt-1">
                {projection.catastrophicDriftRisk > 40 ? 'High Volatility' : 'Safe Genetic Basin'}
              </div>
            </div>

            {/* KPI 4: Stability Index */}
            <div className="p-3.5 bg-stone-900/60 border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Stability Index</span>
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-lg font-mono font-bold text-purple-300">
                {projection.stabilityIndex}%
              </div>
              <div className="text-[10px] font-mono text-stone-500 mt-1">
                Hallucination: {projection.hallucinationRisk}%
              </div>
            </div>
          </div>

          {/* MAIN VISUALIZATION: Evolution Trajectory Chart (Recharts) */}
          <div className="bg-stone-900/50 border border-stone-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Projected Evolution Trajectory (Gen 0 – 10)
                  </h3>
                </div>
                <p className="text-[11px] text-stone-400 font-sans mt-0.5">
                  Immediate mathematical projection of benchmark score progression, confidence envelope, and champion threshold convergence.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Projected Score
                </span>
                <span className="flex items-center gap-1.5 text-stone-400">
                  <span className="w-2.5 h-0.5 bg-stone-500 inline-block border-t border-dashed" /> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Gate (≥95%)
                </span>
              </div>
            </div>

            {/* Recharts Trajectory Plot */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={projection.trajectory}
                  margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#78716c"
                    tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    domain={[60, 100]}
                    stroke="#78716c"
                    tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-stone-950 border border-stone-700 p-3 shadow-xl font-mono text-xs space-y-1">
                            <div className="text-white font-bold border-b border-stone-800 pb-1 flex justify-between gap-4">
                              <span>{data.label}</span>
                              <span className="text-purple-400">Drift: {data.mutationDrift}%</span>
                            </div>
                            <div className="text-emerald-400 flex justify-between gap-4">
                              <span>Projected Score:</span>
                              <span className="font-bold">{data.projectedScore}%</span>
                            </div>
                            <div className="text-stone-400 flex justify-between gap-4 text-[10px]">
                              <span>Confidence Interval:</span>
                              <span>[{data.lowerBound}% - {data.upperBound}%]</span>
                            </div>
                            <div className="text-stone-500 flex justify-between gap-4 text-[10px]">
                              <span>Generic Baseline:</span>
                              <span>{data.baselineScore}%</span>
                            </div>
                            <div className="text-amber-400 flex justify-between gap-4 text-[10px] pt-1 border-t border-stone-800">
                              <span>Status:</span>
                              <span className="font-bold">
                                {data.projectedScore >= 95.0 ? 'CHAMPION QUALIFIED' : 'TESTING / INCUBATION'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Shaded Confidence Envelope (Upper Bound) */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="#10b981"
                    fillOpacity={0.08}
                  />

                  {/* Champion Threshold Line */}
                  <ReferenceLine
                    y={95.0}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: '95.0% CHAMPION THRESHOLD',
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace'
                    }}
                  />

                  {/* Baseline generic agent line */}
                  <Line
                    type="monotone"
                    dataKey="baselineScore"
                    stroke="#78716c"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Main Projected Trajectory Line */}
                  <Line
                    type="monotone"
                    dataKey="projectedScore"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 1.5, stroke: '#022c22' }}
                    activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Trajectory Analysis Summary Footer */}
            <div className="p-3 bg-stone-950/80 border border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Class:</span>
                <span className="text-purple-300 font-bold font-mono">
                  {projection.archetypeClassification}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-400 flex-wrap">
                <span>Recommended Arenas:</span>
                {projection.recommendedVectors.map((vec) => (
                  <span
                    key={vec}
                    className="px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700 text-[10px]"
                  >
                    {vec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECONDARY ROW: Radar Chart & Personality Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personality Radar Chart */}
            <div className="bg-stone-900/50 border border-stone-800 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Hyper-Parameter Radar
                </span>
                <span className="text-[10px] font-mono text-purple-400">Normalized [0-100]</span>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#44403c" strokeDasharray="2 2" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#a8a29e', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#57534e"
                      tick={{ fill: '#78716c', fontSize: 9 }}
                    />
                    <Radar
                      name="Agent Persona"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cognitive Profile Insights */}
            <div className="bg-stone-900/50 border border-stone-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Evolutionary Dynamics Analysis
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-mono font-bold shrink-0">· Risk / Return:</span>
                  <span className="text-stone-300 text-[11px] leading-relaxed">
                    {params.riskAversion > 70
                      ? 'Defensive bias minimizes regression drops, ensuring high survival probability in regulated environments.'
                      : 'High exploratory appetite accelerates discovery of unexpected cross-vector anomalies.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold shrink-0">· Synthesis Rate:</span>
                  <span className="text-stone-300 text-[11px] leading-relaxed">
                    {params.creativity > 70
                      ? 'High lateral divergence leads to novel rule formulations and cross-domain prompt mutations.'
                      : 'Conservative deduction preserves baseline logic with minimal prompt bloat.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold shrink-0">· Invariant Rigor:</span>
                  <span className="text-stone-300 text-[11px] leading-relaxed">
                    {params.logicBias > 80
                      ? 'Boolean truth constraints prevent hallucination even when processing noisy disclosures.'
                      : 'Heuristic assumptions reduce computational friction during multi-document parsing.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono font-bold shrink-0">· Red-Team Resilience:</span>
                  <span className="text-stone-300 text-[11px] leading-relaxed">
                    {params.adversarialParanoia > 75
                      ? 'Proactively anticipates counterparty concealment, hostile footnote revisions, and spoofed metrics.'
                      : 'Relies on neutral good-faith assumptions unless obvious discrepancies emerge.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MONTE CARLO GENERATION PLAYBACK SECTION */}
      {simulationResult && (
        <div className="bg-stone-900/60 border border-stone-800 p-6 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-mono font-bold text-white">
                  Monte Carlo Generational Playback: {simulationResult.agentName}
                </h3>
              </div>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Run ID: <strong className="text-stone-300">{simulationResult.runId}</strong> · Tested at {simulationResult.timestamp} · 8 Adversarial Trials
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-mono font-bold border ${
                  simulationResult.reachedChampion
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/80 shadow-md'
                    : 'bg-stone-800 text-stone-300 border-stone-700'
                }`}
              >
                {simulationResult.reachedChampion
                  ? `CHAMPION ATTAINED (Gen ${simulationResult.championGen})`
                  : 'SUB-CHAMPION CANDIDATE'}
              </span>
              <span className="text-xs font-mono text-stone-400">
                Peak: <strong className="text-white">{simulationResult.peakScore}%</strong>
              </span>
            </div>
          </div>

          {/* Stepped Generation Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {simulationResult.steps.slice(0, simulationStepIndex || simulationResult.steps.length).map((step) => {
              const isChamp = step.score >= 95.0;
              return (
                <div
                  key={step.generation}
                  className={`p-3.5 border transition-all ${
                    isChamp
                      ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm'
                      : step.verdict === 'PASS'
                      ? 'bg-stone-950/70 border-stone-800'
                      : 'bg-stone-950/40 border-stone-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-stone-200">
                      Generation {step.generation}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                        step.verdict === 'PASS'
                          ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
                          : step.verdict === 'WARN'
                          ? 'text-amber-400 border-amber-800 bg-amber-950/40'
                          : 'text-rose-400 border-rose-800 bg-rose-950/40'
                      }`}
                    >
                      {step.verdict}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xl font-mono font-bold text-white">
                      {step.score}%
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold ${
                        step.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {step.delta >= 0 ? `+${step.delta}%` : `${step.delta}%`}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-purple-300 font-semibold mb-1 truncate">
                    {step.mutationType}
                  </div>

                  <p className="text-[10px] text-stone-400 leading-snug line-clamp-2 mb-2 font-sans">
                    {step.stressScenario}
                  </p>

                  <div className="pt-2 border-t border-stone-800/80 text-[9px] font-mono text-stone-500 truncate">
                    {step.ruleAddedOrModified}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
