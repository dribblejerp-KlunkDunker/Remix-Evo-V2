import React, { useState, useMemo } from 'react';
import type { AgentSkill, VectorCategory } from '../../types/skills';
import {
  Dna,
  GitFork,
  Sparkles,
  Trophy,
  Activity,
  Zap,
  Sliders,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  FlaskConical,
  Eye,
  Info,
  Layers,
  ChevronRight,
  Network
} from 'lucide-react';

interface SkillBreedingLabProps {
  skills: AgentSkill[];
  onInspectSkill: (skill: AgentSkill) => void;
  onSkillCreated?: (newSkill: AgentSkill) => void;
  onSwitchToVisualization?: () => void;
  onSwitchToSandbox?: (skillId?: string) => void;
  onSwitchToLineage?: (skillId?: string) => void;
}

export type CrossoverStrategy =
  | 'fitness-weighted'
  | 'uniform-crossover'
  | 'adversarial-shield'
  | 'polymath-hybrid';

interface BreedingLogEntry {
  id: string;
  timestamp: string;
  parentAId: string;
  parentAName: string;
  parentACode: string;
  parentBId: string;
  parentBName: string;
  parentBCode: string;
  childSkill: AgentSkill;
  strategy: CrossoverStrategy;
  mutationRate: number;
}

export const SkillBreedingLab: React.FC<SkillBreedingLabProps> = ({
  skills,
  onInspectSkill,
  onSkillCreated,
  onSwitchToVisualization,
  onSwitchToSandbox,
  onSwitchToLineage
}) => {
  // Select initial parents
  const champions = useMemo(() => skills.filter((s) => s.stage === 'champion'), [skills]);
  const defaultParentA = champions[0] || skills[0] || null;
  const defaultParentB = champions[1] || skills[1] || null;

  const [parentA, setParentA] = useState<AgentSkill | null>(defaultParentA);
  const [parentB, setParentB] = useState<AgentSkill | null>(defaultParentB);
  const [strategy, setStrategy] = useState<CrossoverStrategy>('fitness-weighted');
  const [parentABias, setParentABias] = useState<number>(50); // 10% to 90%
  const [mutationRate, setMutationRate] = useState<number>(12); // 0% to 30%
  const [customName, setCustomName] = useState<string>('');
  const [customHypothesis, setCustomHypothesis] = useState<string>('');

  // Selector modals
  const [selectingFor, setSelectingFor] = useState<'A' | 'B' | null>(null);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [filterModalStage, setFilterModalStage] = useState<string>('all');

  // Breeding state
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedingStage, setBreedingStage] = useState<number>(0);
  const [newlyBredSkill, setNewlyBredSkill] = useState<AgentSkill | null>(null);
  const [breedingLogs, setBreedingLogs] = useState<BreedingLogEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate child codename and hypothesis when parents or strategy change
  const generatedName = useMemo(() => {
    if (!parentA || !parentB) return 'Adaptive Hybrid Skill V1';
    const prefixA = parentA.name.split(' ')[0] || 'Alpha';
    const prefixB = parentB.name.split(' ')[parentB.name.split(' ').length - 1] || 'Omega';
    return `${prefixA}-${prefixB} Recombined Synthesis`;
  }, [parentA, parentB]);

  const activeName = customName.trim() || generatedName;

  // Compatibility & Synergy score between parents
  const synergyScore = useMemo(() => {
    if (!parentA || !parentB) return 85;
    const vectorsA = new Set(parentA.vectors);
    const sharedVectors = parentB.vectors.filter((v) => vectorsA.has(v));
    const orthogonalCount = parentA.vectors.length + parentB.vectors.length - sharedVectors.length * 2;
    // High orthogonal vectors give higher cross-domain synergy
    const baseSynergy = 82 + Math.min(14, orthogonalCount * 3.5) + (parentA.benchmarkScore + parentB.benchmarkScore) / 40;
    return Number(Math.min(99.4, baseSynergy).toFixed(1));
  }, [parentA, parentB]);

  // Handle swapping parents
  const handleSwapParents = () => {
    const temp = parentA;
    setParentA(parentB);
    setParentB(temp);
  };

  // Quick preset pairs
  const handleQuickPair = (type: 'top-champions' | 'forensic-stochastic' | 'psych-adversarial') => {
    if (type === 'top-champions') {
      const top2 = [...skills].sort((a, b) => b.benchmarkScore - a.benchmarkScore);
      setParentA(top2[0] || null);
      setParentB(top2[1] || null);
      setStrategy('fitness-weighted');
    } else if (type === 'forensic-stochastic') {
      const forensic = skills.find((s) => s.vectors.includes('Forensic Accounting')) || skills[0];
      const stochastic = skills.find((s) => s.vectors.includes('Statistics & Stochastic')) || skills[1];
      setParentA(forensic);
      setParentB(stochastic);
      setStrategy('adversarial-shield');
    } else {
      const psych = skills.find((s) => s.vectors.includes('Behavioral Psychology')) || skills[0];
      const game = skills.find((s) => s.vectors.includes('Game Design & Incentives') || s.vectors.includes('Manipulation & Deception')) || skills[1];
      setParentA(psych);
      setParentB(game);
      setStrategy('polymath-hybrid');
    }
  };

  // Execute Breeding with multi-stage DNA sequencing animation
  const handleExecuteBreeding = async () => {
    if (!parentA || !parentB) {
      setErrorMsg('Please select both Parent A and Parent B before breeding.');
      return;
    }
    if (parentA.id === parentB.id) {
      setErrorMsg('Please select two distinct parent skills to cross-breed.');
      return;
    }

    setErrorMsg(null);
    setIsBreeding(true);
    setBreedingStage(1);

    // Sequence stages
    await new Promise((r) => setTimeout(r, 650));
    setBreedingStage(2);
    await new Promise((r) => setTimeout(r, 700));
    setBreedingStage(3);
    await new Promise((r) => setTimeout(r, 650));
    setBreedingStage(4);
    await new Promise((r) => setTimeout(r, 600));

    try {
      let createdChild: AgentSkill | null = null;

      // Attempt live engine remix if available
      try {
        const res = await fetch('/api/evolution/remix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentAId: parentA.id, parentBId: parentB.id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.skill) {
            createdChild = data.skill;
          }
        }
      } catch {
        // Fallback to local genetic synthesis
      }

      if (!createdChild) {
        // Deterministic high-fidelity genetic recombination
        const randId = Math.floor(Math.random() * 900) + 100;
        const newGen = Math.max(parentA.generation, parentB.generation) + 1;

        // Recombine vectors
        const combinedVectors = Array.from(new Set([...parentA.vectors, ...parentB.vectors])).slice(0, 4) as VectorCategory[];
        
        // Recombine rules
        const rulesA = parentA.strictRules.slice(0, 2);
        const rulesB = parentB.strictRules.slice(0, 2);
        const mutatedRule = mutationRate > 10
          ? `RULE ${rulesA.length + rulesB.length + 1} (Mutated): Enforce Pareto non-domination on cross-vector anomalies.`
          : 'RULE 5: Isolate adversarial perturbations with 99% bootstrap confidence.';
        const strictRules = [...rulesA, ...rulesB, mutatedRule];

        // Fitness score calculation
        const weightA = parentABias / 100;
        const weightB = 1 - weightA;
        const blendedScore = parentA.benchmarkScore * weightA + parentB.benchmarkScore * weightB;
        // Minor novelty boost / noise
        const mutationDelta = (Math.random() * 2 - 1) * (mutationRate / 10);
        const initialBenchmark = Number(Math.min(96.8, Math.max(76.0, blendedScore * 0.95 + mutationDelta)).toFixed(1));

        createdChild = {
          id: `skill-bred-${randId}`,
          code: `SKILL-BRED-${randId}`,
          name: activeName,
          stage: 'training',
          tagline: customHypothesis.trim() || `Genetically recombined offspring of ${parentA.code} × ${parentB.code}`,
          description: `Bred via ${strategy} genetic recombination. Integrates analytical heuristics from ${parentA.name} with behavioral & stochastic constraints from ${parentB.name}. Mutation rate: ${mutationRate}%.`,
          vectors: combinedVectors,
          generation: newGen,
          benchmarkScore: initialBenchmark,
          threshold: 95.0,
          winRate: Number((initialBenchmark - 2.5).toFixed(1)),
          stabilityIndex: Number(((parentA.stabilityIndex + parentB.stabilityIndex) / 2 + (Math.random() * 2 - 1)).toFixed(1)),
          hallucinationRate: Number(Math.max(0.1, (parentA.hallucinationRate + parentB.hallucinationRate) / 2 - 0.2).toFixed(1)),
          strictRules,
          specialistRole: `Autonomous ${combinedVectors[0]} & ${combinedVectors[1] || 'Cross-Domain'} Geneticist`,
          promptMatrix: {
            systemDirective: `Act as a hybrid specialist synthesizing ${combinedVectors.join(', ')}. Inherited directives: [${parentA.code}: "${parentA.promptMatrix.systemDirective.slice(0, 70)}..."] + [${parentB.code}: "${parentB.promptMatrix.systemDirective.slice(0, 70)}..."].`,
            reasoningFramework: `Bilateral genetic crossover (${parentABias}% ${parentA.name} / ${100 - parentABias}% ${parentB.name}) with strict boundary enforcement.`,
            adversarialConstraint: `Maintain zero extrapolation beyond empirical test scenario boundaries.`
          },
          autonomousThought: `Incubating Generation ${newGen} genome in active training lab. Calibrating cross-vector synaptic weights between ${parentA.code} and ${parentB.code}...`,
          activeTestBench: {
            name: `${combinedVectors[0]} Cross-Domain Lab`,
            currentVector: 'Genetic Offspring Verification',
            totalRunsToday: 1,
            consecutivePasses: 1,
            stressVector: 'Bilateral adversarial crossover stress'
          },
          testCases: [
            {
              id: `tc-bred-${randId}`,
              title: `Initial Verification Test for ${activeName}`,
              realWorldUseCase: `Evaluating cross-domain inheritance of ${parentA.code} and ${parentB.code}.`,
              inputScenario: `Validate disclosure integrity and mathematical consistency under dual-vector stress.`,
              expectedConstraints: ['Cross-domain consistency', 'Rule boundary enforcement'],
              targetThreshold: 95.0,
              lastScore: initialBenchmark,
              status: initialBenchmark >= 95 ? 'passed' : 'testing',
              testedAt: 'Just now'
            }
          ],
          evolutionLineage: {
            parents: [parentA.code, parentB.code],
            remixVectorCombo: `${parentA.vectors[0]} × ${parentB.vectors[0]}`,
            generationEpoch: `Epoch Gen-${newGen}`,
            survivalIterations: 1,
            mutationType: `${strategy} Crossover`,
            totalMutationPercentage: mutationRate,
            overallImprovementDelta: Number((initialBenchmark - Math.min(parentA.benchmarkScore, parentB.benchmarkScore)).toFixed(1))
          },
          stageHistory: [
            {
              stage: 'training',
              timestamp: 'Just now',
              score: initialBenchmark,
              notes: `Synthesized via ${strategy} genetic recombination from ${parentA.code} and ${parentB.code}.`
            }
          ],
          createdAt: new Date().toISOString(),
          lastEvaluatedAt: new Date().toISOString()
        };
      }

      setNewlyBredSkill(createdChild);

      // Record breeding log
      const logEntry: BreedingLogEntry = {
        id: `blog-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        parentAId: parentA.id,
        parentAName: parentA.name,
        parentACode: parentA.code,
        parentBId: parentB.id,
        parentBName: parentB.name,
        parentBCode: parentB.code,
        childSkill: createdChild,
        strategy,
        mutationRate
      };
      setBreedingLogs((prev) => [logEntry, ...prev]);

      // Inform parent dashboard
      if (onSkillCreated) {
        onSkillCreated(createdChild);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Breeding failed. Check console or parameters.');
    } finally {
      setIsBreeding(false);
      setBreedingStage(0);
    }
  };

  // Filter skills for parent selection modal
  const modalSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
        s.vectors.some((v) => v.toLowerCase().includes(searchModalQuery.toLowerCase()));
      const matchStage = filterModalStage === 'all' || s.stage === filterModalStage;
      return matchSearch && matchStage;
    });
  }, [skills, searchModalQuery, filterModalStage]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Explanation Section */}
      <div className="bg-stone-950/80 border border-stone-800 p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
              <Dna className="w-4 h-4 animate-pulse" />
              <span className="font-bold uppercase tracking-wider">Genetic Recombination & Skill Breeding Lab</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400">Inspired by DeepMind PromptBreeder & NVIDIA Voyager</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Cross-Breed Autonomous Agent Skills
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed font-sans">
              <strong>Skill Breeding</strong> is the evolutionary process of taking two distinct high-performing parent skills,
              extracting their reasoning prompts, domain heuristics, and constraint boundaries, and combining them into an elite offspring.
              Unlike solo mutation (which only perturbs a single directive), breeding enables <span className="text-purple-300 font-semibold">cross-domain polymath synthesis</span>—such
              as fusing forensic accounting footnote auditing with stochastic tail-risk modeling.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => handleQuickPair('top-champions')}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              title="Quick-select Rank #1 and #2 Champions for breeding"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Pair Top 2 Champions</span>
            </button>
            <button
              onClick={() => handleQuickPair('forensic-stochastic')}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              title="Pair Forensic Accounting with Stochastic Defense"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Forensic × Stochastic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Breeding Workshop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Parent A Card (Left) */}
        <div className="lg:col-span-4 bg-stone-900/60 border border-stone-800 p-5 space-y-4 relative">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold flex items-center justify-center">
                A
              </span>
              <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">Parent Genome 1</span>
            </div>
            <button
              onClick={() => {
                setSelectingFor('A');
                setSearchModalQuery('');
              }}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Change Parent A
            </button>
          </div>

          {parentA ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-blue-400 font-bold">{parentA.code}</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-stone-800 text-stone-300 border border-stone-700 uppercase font-semibold">
                    {parentA.stage}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{parentA.name}</h3>
                <p className="text-xs text-stone-400 font-sans mt-1 line-clamp-2">{parentA.tagline}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-stone-950/70 border border-stone-800/80 p-2.5 text-center text-xs font-mono">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Benchmark</div>
                  <div className="text-sm font-bold text-emerald-400">{parentA.benchmarkScore.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Gen</div>
                  <div className="text-sm font-bold text-stone-200">G{parentA.generation}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Stability</div>
                  <div className="text-sm font-bold text-blue-400">{parentA.stabilityIndex.toFixed(1)}%</div>
                </div>
              </div>

              {/* Vectors */}
              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase mb-1.5">Dominant Vectors:</div>
                <div className="flex flex-wrap gap-1.5">
                  {parentA.vectors.map((vec) => (
                    <span
                      key={vec}
                      className="px-2 py-0.5 text-[10px] font-mono bg-blue-950/50 text-blue-300 border border-blue-500/30"
                    >
                      {vec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Directive Excerpt */}
              <div className="bg-stone-950/50 border border-stone-800/60 p-2.5 text-[11px] font-mono text-stone-400">
                <span className="text-stone-500 block text-[10px] uppercase mb-0.5">Directive Allele:</span>
                <span className="line-clamp-2 italic">"{parentA.promptMatrix.systemDirective}"</span>
              </div>

              <button
                onClick={() => onInspectSkill(parentA)}
                className="w-full py-1.5 bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Inspect Full Dossier</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-stone-500">
              No parent selected. Click "Change Parent A" above.
            </div>
          )}
        </div>

        {/* Center Crossover & Recombination Engine (Center) */}
        <div className="lg:col-span-4 bg-stone-900/80 border border-purple-500/30 p-5 space-y-5 relative shadow-md">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                Genetic Recombination Engine
              </span>
            </div>
            <button
              onClick={handleSwapParents}
              className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              title="Swap Parent A and Parent B"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Genetic Synergy Score */}
          <div className="bg-stone-950/90 border border-purple-500/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-purple-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Cross-Domain Compatibility Synergy</span>
            </div>
            <div className="text-2xl font-bold font-mono text-purple-200 mt-1">{synergyScore}%</div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              High orthogonal vector coverage produces superior multi-specialist resilience.
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-stone-300 flex items-center justify-between">
              <span>Crossover Strategy:</span>
              <span className="text-[10px] text-purple-400 font-bold uppercase">{strategy.replace('-', ' ')}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setStrategy('fitness-weighted')}
                className={`p-2 text-left border transition-all cursor-pointer ${
                  strategy === 'fitness-weighted'
                    ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-xs'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="font-bold text-[11px]">Fitness-Weighted</div>
                <div className="text-[9px] text-stone-500">Weights by win rates</div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('adversarial-shield')}
                className={`p-2 text-left border transition-all cursor-pointer ${
                  strategy === 'adversarial-shield'
                    ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-xs'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="font-bold text-[11px]">Adversarial Shield</div>
                <div className="text-[9px] text-stone-500">Offense + strict defense</div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('polymath-hybrid')}
                className={`p-2 text-left border transition-all cursor-pointer ${
                  strategy === 'polymath-hybrid'
                    ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-xs'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="font-bold text-[11px]">Polymath Hybrid</div>
                <div className="text-[9px] text-stone-500">Unifies all unique vectors</div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('uniform-crossover')}
                className={`p-2 text-left border transition-all cursor-pointer ${
                  strategy === 'uniform-crossover'
                    ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-xs'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="font-bold text-[11px]">Uniform Crossover</div>
                <div className="text-[9px] text-stone-500">50/50 directive split</div>
              </button>
            </div>
          </div>

          {/* Genetic Bias Slider */}
          <div className="space-y-1.5 bg-stone-950/60 border border-stone-800 p-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-blue-400">Parent A ({parentABias}%)</span>
              <span className="text-stone-400">Allele Inheritance</span>
              <span className="text-emerald-400">Parent B ({100 - parentABias}%)</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={parentABias}
              onChange={(e) => setParentABias(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Mutation Rate Slider */}
          <div className="space-y-1.5 bg-stone-950/60 border border-stone-800 p-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-300">Spontaneous Mutation Rate:</span>
              <span className="text-purple-400 font-bold">{mutationRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={mutationRate}
              onChange={(e) => setMutationRate(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="text-[10px] text-stone-500 font-mono">
              Injects stochastic perturbations into prompt boundary constraints to prevent local stagnation.
            </div>
          </div>

          {/* Offspring Name & Hypothesis Input */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Offspring Codename:</label>
              <input
                type="text"
                placeholder={generatedName}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Research Hypothesis:</label>
              <textarea
                rows={2}
                placeholder={`Recombine heuristics from ${parentA?.code || 'Parent A'} and ${parentB?.code || 'Parent B'} into a robust multi-vector specialist.`}
                value={customHypothesis}
                onChange={(e) => setCustomHypothesis(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs font-sans text-stone-200 placeholder-stone-600 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Breed Action Button */}
          <button
            onClick={handleExecuteBreeding}
            disabled={isBreeding || !parentA || !parentB}
            className={`w-full py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg ${
              isBreeding
                ? 'bg-purple-900 text-purple-200 border border-purple-500 cursor-wait'
                : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 hover:shadow-purple-500/25 ring-2 ring-purple-500/30'
            }`}
          >
            <Dna className={`w-4 h-4 ${isBreeding ? 'animate-spin' : ''}`} />
            <span>{isBreeding ? 'Sequencing Genetic Crossover...' : 'Synthesize & Breed Offspring'}</span>
          </button>

          {/* DNA Sequencing Progress Indicator */}
          {isBreeding && (
            <div className="p-3 bg-stone-950 border border-purple-500/50 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 font-bold">
                <span>DNA Genetic Sequencing:</span>
                <span>Stage {breedingStage} of 4</span>
              </div>
              <div className="w-full h-1.5 bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${(breedingStage / 4) * 100}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-stone-400 italic">
                {breedingStage === 1 && 'Extracting parent chromosomes and directive heuristics...'}
                {breedingStage === 2 && 'Executing fitness-weighted allele crossover...'}
                {breedingStage === 3 && 'Splicing strict boundary constraints & resolving conflicts...'}
                {breedingStage === 4 && 'Injecting stochastic novelty & calibrating benchmark gate...'}
              </div>
            </div>
          )}
        </div>

        {/* Parent B Card (Right) */}
        <div className="lg:col-span-4 bg-stone-900/60 border border-stone-800 p-5 space-y-4 relative">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center">
                B
              </span>
              <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">Parent Genome 2</span>
            </div>
            <button
              onClick={() => {
                setSelectingFor('B');
                setSearchModalQuery('');
              }}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Change Parent B
            </button>
          </div>

          {parentB ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-400 font-bold">{parentB.code}</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-stone-800 text-stone-300 border border-stone-700 uppercase font-semibold">
                    {parentB.stage}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{parentB.name}</h3>
                <p className="text-xs text-stone-400 font-sans mt-1 line-clamp-2">{parentB.tagline}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-stone-950/70 border border-stone-800/80 p-2.5 text-center text-xs font-mono">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Benchmark</div>
                  <div className="text-sm font-bold text-emerald-400">{parentB.benchmarkScore.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Gen</div>
                  <div className="text-sm font-bold text-stone-200">G{parentB.generation}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 uppercase">Stability</div>
                  <div className="text-sm font-bold text-emerald-400">{parentB.stabilityIndex.toFixed(1)}%</div>
                </div>
              </div>

              {/* Vectors */}
              <div>
                <div className="text-[10px] font-mono text-stone-500 uppercase mb-1.5">Dominant Vectors:</div>
                <div className="flex flex-wrap gap-1.5">
                  {parentB.vectors.map((vec) => (
                    <span
                      key={vec}
                      className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                    >
                      {vec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Directive Excerpt */}
              <div className="bg-stone-950/50 border border-stone-800/60 p-2.5 text-[11px] font-mono text-stone-400">
                <span className="text-stone-500 block text-[10px] uppercase mb-0.5">Directive Allele:</span>
                <span className="line-clamp-2 italic">"{parentB.promptMatrix.systemDirective}"</span>
              </div>

              <button
                onClick={() => onInspectSkill(parentB)}
                className="w-full py-1.5 bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspect Full Dossier</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-stone-500">
              No parent selected. Click "Change Parent B" above.
            </div>
          )}
        </div>
      </div>

      {/* Newly Bred Offspring Showcase */}
      {newlyBredSkill && (
        <div className="bg-gradient-to-r from-purple-950/70 via-stone-900 to-stone-950 border-2 border-purple-500/80 p-6 shadow-2xl relative animate-slideDown">
          <div className="flex items-center justify-between border-b border-purple-500/40 pb-4 mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-purple-300 font-bold uppercase tracking-wider">Genetic Breeding Successful!</span>
                  <span className="px-2 py-0.5 bg-purple-900/80 border border-purple-400 text-purple-200 text-[10px] font-bold">
                    Generation {newlyBredSkill.generation} Offspring
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-0.5">{newlyBredSkill.name}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onInspectSkill(newlyBredSkill)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Dossier</span>
              </button>
              {onSwitchToSandbox && (
                <button
                  onClick={() => onSwitchToSandbox(newlyBredSkill.id)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Test in Sandbox</span>
                </button>
              )}
              {onSwitchToVisualization && (
                <button
                  onClick={onSwitchToVisualization}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-stone-600 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View in Force Graph</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-4">
            <div className="bg-stone-950/80 border border-stone-800 p-3 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Calibrated Fitness:</div>
              <div className="text-lg font-bold text-emerald-400">{newlyBredSkill.benchmarkScore.toFixed(1)}%</div>
              <div className="text-[10px] text-stone-400">Target threshold: ≥ 95.0% for Champion</div>
            </div>
            <div className="bg-stone-950/80 border border-stone-800 p-3 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Inherited Vectors ({newlyBredSkill.vectors.length}):</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {newlyBredSkill.vectors.map((v) => (
                  <span key={v} className="px-1.5 py-0.5 bg-stone-900 border border-stone-700 text-purple-200 text-[10px]">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-stone-950/80 border border-stone-800 p-3 space-y-1">
              <div className="text-stone-500 text-[10px] uppercase">Strict Boundary Rules:</div>
              <div className="text-stone-200 text-[11px] line-clamp-2">{newlyBredSkill.strictRules[0]}</div>
              <div className="text-[10px] text-purple-400 font-semibold">{newlyBredSkill.strictRules.length} rules synthesized</div>
            </div>
          </div>

          <p className="text-xs text-stone-300 font-sans leading-relaxed bg-stone-950/50 p-3 border border-stone-800/80">
            {newlyBredSkill.description}
          </p>
        </div>
      )}

      {/* Breeding Pedigree History Log */}
      <div className="bg-stone-900/60 border border-stone-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Breeding Pedigree & Genetic Audit Log
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-500">{breedingLogs.length} Cycles Completed</span>
        </div>

        {breedingLogs.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-stone-500 border border-dashed border-stone-800">
            No breeding cycles recorded yet this session. Click "Synthesize & Breed Offspring" above to cross-breed your first pair!
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Parent A</th>
                  <th className="py-2.5 px-3">Parent B</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3">Offspring Code</th>
                  <th className="py-2.5 px-3">Initial Score</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {breedingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500">{log.timestamp}</td>
                    <td className="py-2.5 px-3 text-blue-300 font-semibold">{log.parentACode}</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-semibold">{log.parentBCode}</td>
                    <td className="py-2.5 px-3 text-purple-300 capitalize">{log.strategy.replace('-', ' ')}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{log.childSkill.name}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.childSkill.benchmarkScore.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onInspectSkill(log.childSkill)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[10px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parent Selector Modal */}
      {selectingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-700 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Select {selectingFor === 'A' ? 'Parent A' : 'Parent B'} Genome
                </h3>
              </div>
              <button
                onClick={() => setSelectingFor(null)}
                className="text-stone-400 hover:text-stone-200 text-sm font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 border-b border-stone-800 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search skills by name, code, or vector..."
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-stone-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filterModalStage}
                onChange={(e) => setFilterModalStage(e.target.value)}
                className="bg-stone-950 border border-stone-800 px-3 py-2 text-xs font-mono text-stone-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="champion">Champions</option>
                <option value="training">In-Training</option>
                <option value="testing">Testing</option>
                <option value="idea">Ideas</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
              {modalSkills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => {
                    if (selectingFor === 'A') setParentA(skill);
                    else setParentB(skill);
                    setSelectingFor(null);
                  }}
                  className="p-3 bg-stone-950/70 hover:bg-stone-800 border border-stone-800/80 hover:border-purple-500/70 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-purple-400 font-bold">{skill.code}</span>
                      <span className="text-stone-600">·</span>
                      <span className="text-stone-300 font-semibold">{skill.name}</span>
                      <span className="px-1.5 py-0.2 text-[9px] bg-stone-800 text-stone-400 uppercase font-bold">
                        {skill.stage}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 line-clamp-1">{skill.tagline}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {skill.vectors.map((v) => (
                        <span key={v} className="px-1.5 py-0.2 text-[9px] font-mono bg-stone-900 text-stone-400">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono text-emerald-400">{skill.benchmarkScore.toFixed(1)}%</div>
                    <div className="text-[10px] font-mono text-stone-500">Gen {skill.generation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
