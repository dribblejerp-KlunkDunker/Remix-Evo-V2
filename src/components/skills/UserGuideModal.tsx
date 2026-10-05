import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Play,
  CheckCircle2,
  Layers,
  Dna,
  FlaskConical,
  Cpu,
  Scale,
  Trophy,
  Brain,
  Network,
  GitFork,
  BarChart3,
  TrendingUp,
  Activity,
  Sliders,
  HelpCircle,
  X,
  Compass,
  Zap,
  ShieldCheck,
  ChevronRight,
  Target,
  Sparkles,
  FileText,
  CalendarClock
} from 'lucide-react';
import { AgentSkill } from '../../types/skills';

export interface WorkflowStageInfo {
  step: number;
  id: string;
  name: string;
  subViewId: string;
  category: 'Exploration' | 'Mutation' | 'Incubation' | 'Stress Test' | 'Arbitration' | 'Champion Gate';
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  whenToUse: string;
  keyOutputs: string[];
  visualizations: string[];
  recommendedTabs: { id: string; name: string; icon: React.ComponentType<{ className?: string }> }[];
}

export const WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    step: 1,
    id: 'stage-1-population',
    name: 'Population & Ecosystem Baseline',
    subViewId: 'matrix',
    category: 'Exploration',
    icon: Layers,
    tagline: 'Inspect the seed population, cluster distribution, and autonomous engine status.',
    description:
      'Begin by examining the global distribution of skills across the 4 lifecycle stages (Idea, In-Training, Testing, Champion). Check the overall population fitness, domain specializations, and the live status of the autonomous background mutation engine.',
    whenToUse: 'Always start here to establish a baseline before inducing mutations or filtering specialists.',
    keyOutputs: [
      'Total skill count by stage',
      'Average fitness across population',
      'Engine budget quota & active generation tick',
      'Skill vectors (Math, Game Theory, Forensics, Psychology)'
    ],
    visualizations: [
      'Interactive 4-Stage Evolution Cycle diagram',
      'Champion research agent cards with vector radar breakdown',
      'Autonomous live event stream ticker'
    ],
    recommendedTabs: [
      { id: 'matrix', name: 'Evolution Matrix (Primary View)', icon: Layers },
      { id: 'skill-visualization', name: 'Skill Visualization Studio', icon: Network },
      { id: 'evolution-feed', name: 'Active Evolution Feed', icon: Activity },
      { id: 'graph', name: 'Evolution Force Graph', icon: Network }
    ]
  },
  {
    step: 2,
    id: 'stage-2-mutation',
    name: 'Code Mutation & Synthetic Exploration',
    subViewId: 'genome-lab',
    category: 'Mutation',
    icon: Dna,
    tagline: 'Perturb agent code segments, inspect mutation probabilities, and generate variants.',
    description:
      'Select promising candidate skills and introduce stochastic perturbations into their decision code. The Genome Mutation Lab allows granular tweaking of code segment mutation rates, semantic crossover points, and synthetic dataset stress inputs.',
    whenToUse: 'When you need to boost capability in underperforming domains or discover non-linear prompt heuristics.',
    keyOutputs: [
      'Segment-level mutation probability map',
      'Parent crossover diff and syntax verification',
      'Synthetic test case pass rate prior to deployment'
    ],
    visualizations: [
      'Genome Code Segment Probabilities matrix',
      'Agent Mutation Simulator trajectory curves',
      'Sandboxed Skill Simulator synthetic test runs'
    ],
    recommendedTabs: [
      { id: 'skill-breeding', name: 'Skill Breeding Lab', icon: Dna },
      { id: 'genome-lab', name: 'Genome Mutation Lab', icon: Dna },
      { id: 'files', name: 'Knowledge Files & Dropzone (.txt, .md, .pdf)', icon: FileText },
      { id: 'sandbox-simulator', name: 'Sandboxed Simulator', icon: FlaskConical },
      { id: 'simulator', name: 'Mutation Simulator', icon: Sliders }
    ]
  },
  {
    step: 3,
    id: 'stage-3-training',
    name: 'Incubation & Cognitive Load Gating',
    subViewId: 'lab',
    category: 'Incubation',
    icon: FlaskConical,
    tagline: 'Train mutating skills through epochs while monitoring token and cognitive efficiency.',
    description:
      'Incubate mutating candidates through iterative learning epochs. As skills absorb new domain heuristics, monitor their runtime complexity and cognitive load. Skills with excessive token overhead or erratic cognitive spikes are pruned early.',
    whenToUse: 'After generating mutated variants to harden them through training before subjecting them to live arenas.',
    keyOutputs: [
      'Epoch convergence rate and loss curve',
      'Cognitive load index (Attention distribution, Reasoning depth)',
      'Token consumption velocity and latency benchmarks'
    ],
    visualizations: [
      'Real-Time Incubator epoch progression tracker',
      'Cognitive Load Monitor (D3 multi-attribute radar & bar)',
      'Training loss vs accuracy curves'
    ],
    recommendedTabs: [
      { id: 'lab', name: 'Training Lab', icon: FlaskConical },
      { id: 'cognitive-load', name: 'Cognitive Load Monitor', icon: Brain }
    ]
  },
  {
    step: 4,
    id: 'stage-4-validation',
    name: 'Arena Stress Testing & Edge Cases',
    subViewId: 'swarm-controller',
    category: 'Stress Test',
    icon: Cpu,
    tagline: 'Pit agents head-to-head in complex logic puzzles and scenario heatmaps.',
    description:
      'Subject candidate skills to adversarial testing in multi-agent swarm environments. The Swarm Controller simulates game-theoretic dilemmas, logic puzzles, and deceptive inputs to ensure agents do not collapse under non-stationary conditions.',
    whenToUse: 'When candidates reach high training accuracy and must be tested against edge cases and competitor agents.',
    keyOutputs: [
      'Head-to-head win/loss ratio in logic puzzle arenas',
      'Domain success rate vs catastrophic failure rate',
      'Scenario coverage across extreme market volatility'
    ],
    visualizations: [
      'Agent Swarm Controller logic puzzle arena leaderboard',
      'Scenario Success Heatmap (Matrix of tests × specialists)',
      'Success vs Failure distribution bar charts'
    ],
    recommendedTabs: [
      { id: 'swarm-controller', name: 'Agent Swarm Controller', icon: Cpu },
      { id: 'performance', name: 'Success vs Failure Chart', icon: BarChart3 },
      { id: 'heatmap', name: 'Scenario Success Heatmap', icon: Layers }
    ]
  },
  {
    step: 5,
    id: 'stage-5-arbitration',
    name: 'Conflict Arbitration & Lineage Audit',
    subViewId: 'conflicts',
    category: 'Arbitration',
    icon: Scale,
    tagline: 'Resolve semantic tool overlap and verify generational evolutionary provenance.',
    description:
      'When multiple specialist agents attempt conflicting actions or overlapping tool selections, the Conflict Arbitration system calculates semantic distance and applies priority weights. Review the genealogical audit log to track generational lineage and ancestral deltas.',
    whenToUse: 'Before promoting any skill to Champion status to verify no regressions or toxic tool collisions exist.',
    keyOutputs: [
      'Semantic collision index between skill pairs',
      'Arbitration resolution strategy (Merge, Priority Rule, Isolation)',
      'Generational lineage tree with mutation delta hashes'
    ],
    visualizations: [
      'Skill Conflict Arbitration & Resolution view',
      'Evolutionary Audit Log (Tree lineage & git-style diffs)',
      'Neural Synapses Co-Firing connectivity graph'
    ],
    recommendedTabs: [
      { id: 'conflicts', name: 'Skill Conflicts Arbiter', icon: Scale },
      { id: 'lineage', name: 'Evolutionary Audit Log', icon: GitFork },
      { id: 'synapse-view', name: 'Neural Synapses View', icon: Network }
    ]
  },
  {
    step: 6,
    id: 'stage-6-champion',
    name: 'Champion Promotion & Leaderboard Benchmarking',
    subViewId: 'leaderboard',
    category: 'Champion Gate',
    icon: Trophy,
    tagline: 'Validate ≥ 95.0% threshold requirement and track Top 5 champion progression.',
    description:
      'Skills that clear all previous gates face the final Champion Stress Benchmark against historical market crises. Once certified with ≥ 95.0% fitness, they enter the Champion Leaderboard where their progress over time is tracked across generations.',
    whenToUse: 'To deploy certified champions into production swarms and inspect the pinnacle performers of the evolution.',
    keyOutputs: [
      'Top 5 Champion Leaderboard rankings',
      'Stress benchmark survival rate under crisis regimes',
      'Historical fitness gain per generation trajectory'
    ],
    visualizations: [
      'Champion Leaderboard Recharts bar charts (Rank, Score, Deltas)',
      'Champion Fitness Over Time area/line chart',
      'Champion Stress Benchmark radar & stress metrics'
    ],
    recommendedTabs: [
      { id: 'leaderboard', name: 'Champion Leaderboard (Top 5 Progress)', icon: Trophy },
      { id: 'scheduler', name: 'Skills Scheduler (Off-Peak Champion Testing)', icon: CalendarClock },
      { id: 'champion-benchmark', name: 'Champion Stress Benchmark', icon: Trophy },
      { id: 'champion-fitness', name: 'Champion Fitness Over Time', icon: TrendingUp }
    ]
  }
];

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onStartAutoWorkflow: () => void;
  skills: AgentSkill[];
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onStartAutoWorkflow,
  skills
}) => {
  const [activeStageStep, setActiveStageStep] = useState<number>(1);
  const [guideView, setGuideView] = useState<'pipeline' | 'tab-directory' | 'faq'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentStage = WORKFLOW_STAGES.find((s) => s.step === activeStageStep) || WORKFLOW_STAGES[0];

  const allTabsDirectory = [
    {
      id: 'matrix',
      name: 'Evolution Matrix (Overview)',
      phase: 1,
      desc: 'The central dashboard view showcasing 4-stage lifecycle counts, active champion cards, and vector distribution.',
      statType: 'Global population counts, lifecycle stages, and fitness scores'
    },
    {
      id: 'metrics',
      name: 'Skill Evolution Metrics (Recharts)',
      phase: 1,
      desc: 'Recharts-powered time-series visualizer tracking Ideas, Training, Testing, and Champion skill counts and conversion rates across generations and epochs.',
      statType: 'Historical cohort volume, graduation yields, and stage trajectories'
    },
    {
      id: 'skill-visualization',
      name: 'Skill Visualization Studio',
      phase: 1,
      desc: 'Interactive visual cockpit combining D3 force-directed clustering, phylogenetic lineage DAG trees, neural synaptic topologies, and 8-axis vector radar spaces.',
      statType: 'Topological clustering, generational lineage DAG, synaptic transmission, and vector footprints'
    },
    {
      id: 'skill-breeding',
      name: 'Skill Breeding & Recombination Lab',
      phase: 2,
      desc: 'Cross-breed two parent agent skills, extract their prompt directives and domain heuristics, and execute fitness-weighted genetic crossover to produce novel hybrid offspring.',
      statType: 'Parent synergy %, crossover allele weights, mutation rate, and child fitness'
    },
    {
      id: 'evolution-feed',
      name: 'Active Evolution Feed',
      phase: 1,
      desc: 'Live mutation event stream, engine tick governor, hourly budget monitoring, and instant tick triggers.',
      statType: 'Call budget remaining, tick rate, and latest autonomous mutations'
    },
    {
      id: 'graph',
      name: 'Evolution Force Graph',
      phase: 1,
      desc: 'D3 force-directed network displaying semantic relationships and topological clustering among all agent skills.',
      statType: 'Node connectivity, cluster centrality, and domain vector affinities'
    },
    {
      id: 'genome-lab',
      name: 'Genome Mutation Lab',
      phase: 2,
      desc: 'Visual code segment mutation rates, base-pair substitutions, and recombinant deployment directly to matrix.',
      statType: 'Segment mutation risk, crossover efficiency, and synthetic pass rate'
    },
    {
      id: 'sandbox-simulator',
      name: 'Sandboxed Skill Simulator',
      phase: 2,
      desc: 'Inject synthetic dataset variables, run isolated trials, and observe score variance before live deployment.',
      statType: 'Mean execution time, variance range, and domain test score'
    },
    {
      id: 'simulator',
      name: 'Mutation Simulator',
      phase: 2,
      desc: 'Adjust mutation rate, selection pressure, and temperature sliders to forecast multi-generation evolutionary trajectory.',
      statType: 'Predicted fitness curves, diversity index, and convergence ETA'
    },
    {
      id: 'files',
      name: 'Knowledge Files & Dropzone (.txt, .md, .pdf)',
      phase: 2,
      desc: 'Drag and drop .txt, .md, and .pdf documents for any skill; parses rules, directives, and code invariants with interactive preview.',
      statType: 'Extracted rule invariants, document char count, PDF pages, and attachment vault'
    },
    {
      id: 'lab',
      name: 'Training Lab (Incubator)',
      phase: 3,
      desc: 'Step-by-step training epoch controller with learning rate modulation, loss charting, and candidate deployment.',
      statType: 'Epoch training loss, validation accuracy, and convergence plateau'
    },
    {
      id: 'cognitive-load',
      name: 'Cognitive Load Monitor',
      phase: 3,
      desc: 'Neural telemetry monitoring context window usage, reasoning depth, attention entropy, and token velocity.',
      statType: 'Context utilization %, attention entropy, and token complexity'
    },
    {
      id: 'swarm-controller',
      name: 'Agent Swarm Controller',
      phase: 4,
      desc: 'Arena for running multi-agent head-to-head competitions on complex logic puzzles and financial scenarios.',
      statType: 'Head-to-head win rates, puzzle solve latency, and reasoning accuracy'
    },
    {
      id: 'performance',
      name: 'Success vs Failure Chart',
      phase: 4,
      desc: 'Recharts stacked bar comparison of test case successes versus failures grouped by domain vector.',
      statType: 'Pass/fail distributions across 9 research vectors'
    },
    {
      id: 'heatmap',
      name: 'Scenario Success Heatmap',
      phase: 4,
      desc: 'Matrix grid correlating specialist agent personas against diverse stress scenarios and black-swan events.',
      statType: 'Cell-by-cell resilience score (0-100%) across test scenarios'
    },
    {
      id: 'conflicts',
      name: 'Skill Conflicts Arbiter',
      phase: 5,
      desc: 'Detects semantic overlap and tool collisions between skills; provides automated arbitration and override rules.',
      statType: 'Collision severity, overlap confidence %, and resolved count'
    },
    {
      id: 'lineage',
      name: 'Evolutionary Audit Log',
      phase: 5,
      desc: 'Complete genealogical ancestry tree with generational hashes, parentage links, and code delta diffs.',
      statType: 'Generational depth, ancestor nodes, and cumulative delta score'
    },
    {
      id: 'synapse-view',
      name: 'Neural Synapses View',
      phase: 5,
      desc: 'Network graph highlighting synapse co-firing paths and shared activation patterns between active agents.',
      statType: 'Synapse connection weights, co-firing frequency, and pathway density'
    },
    {
      id: 'leaderboard',
      name: 'Champion Leaderboard (Top 5)',
      phase: 6,
      desc: 'Recharts bar chart ranking the top 5 highest-scoring agent skills over time, showing generational gains and stats.',
      statType: 'Top 5 scores, generational deltas, stage durations, and fitness bars'
    },
    {
      id: 'champion-benchmark',
      name: 'Champion Stress Benchmark',
      phase: 6,
      desc: 'Subject top champions to extreme historical crises (Flash Crash, Liquidity Squeeze) to verify robustness.',
      statType: 'Crisis survival index, worst-case drawdown, and stress recovery latency'
    },
    {
      id: 'champion-fitness',
      name: 'Champion Fitness Over Time',
      phase: 6,
      desc: 'Chronological timeline tracking aggregate champion fitness and threshold requirements across generations.',
      statType: 'Average vs champion fitness trajectory and generation velocity'
    },
    {
      id: 'scheduler',
      name: 'Skills Execution Scheduler',
      phase: 6,
      desc: 'Define execution windows for agent skill testing, prioritizing high-scoring champion cycles during off-peak hours with 24-hour Gantt horizon.',
      statType: 'Off-peak compute arbitrage, champion priority queue, worker concurrency, and execution logs'
    }
  ];

  const filteredTabs = allTabsDirectory.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.statType.toLowerCase().includes(q)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agent Evolution User Guide"
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-stone-900 border border-stone-800 shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden text-stone-200">
        {/* Header */}
        <div className="border-b border-stone-800 p-5 sm:p-6 bg-stone-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400">
                <span className="text-amber-400 font-bold uppercase tracking-wider">User Guide & Architecture</span>
                <span>·</span>
                <span>Optimal Workflow Order</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight">
                Agent Evolution Workflow & Tab Guide
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onStartAutoWorkflow();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-bold text-xs transition-colors shadow-md cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Auto-Run Workflow in Proper Order</span>
              <span className="sm:hidden">Auto-Run</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="border-b border-stone-800 bg-stone-950/40 px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setGuideView('pipeline')}
              className={`px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
                guideView === 'pipeline'
                  ? 'bg-amber-600 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              1. Recommended 6-Step Workflow
            </button>
            <button
              onClick={() => setGuideView('tab-directory')}
              className={`px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
                guideView === 'tab-directory'
                  ? 'bg-amber-600 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              2. Complete Tab Encyclopedia
            </button>
            <button
              onClick={() => setGuideView('faq')}
              className={`px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
                guideView === 'faq'
                  ? 'bg-amber-600 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              3. Quick Start & FAQ
            </button>
          </div>

          <span className="text-[11px] font-mono text-stone-500 hidden md:inline">
            Active Population: <strong className="text-stone-300">{skills.length}</strong> Agents
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {guideView === 'pipeline' && (
            <div className="space-y-6">
              {/* Pipeline Roadmap Navigation Strip */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                    Workflow Pipeline: Chronological Order of Operations
                  </span>
                  <span className="text-xs font-mono text-amber-400">
                    Step {currentStage.step} of 6: {currentStage.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {WORKFLOW_STAGES.map((stage) => {
                    const isSelected = stage.step === activeStageStep;
                    const StageIcon = stage.icon;
                    return (
                      <button
                        key={stage.id}
                        onClick={() => setActiveStageStep(stage.step)}
                        className={`text-left p-2.5 border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                          isSelected
                            ? 'bg-stone-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              isSelected ? 'text-amber-400' : 'text-stone-500'
                            }`}
                          >
                            STEP {stage.step}
                          </span>
                          <StageIcon
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-amber-400' : 'text-stone-400'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-serif font-bold text-white truncate">
                          {stage.name}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 truncate">
                          {stage.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Detail Card */}
              <div className="bg-stone-950/70 border border-stone-800 p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <currentStage.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                        <span className="text-amber-400 font-bold uppercase tracking-wider">
                          Phase {currentStage.step} of 6
                        </span>
                        <span>·</span>
                        <span>{currentStage.category}</span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-white">
                        {currentStage.name}
                      </h3>
                      <p className="text-xs font-mono text-stone-300 mt-0.5">
                        {currentStage.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectTab(currentStage.subViewId);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-mono font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Jump to {currentStage.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-mono font-bold uppercase text-[11px] text-stone-400 mb-1">
                        Purpose & Operational Mechanism
                      </h4>
                      <p className="text-stone-300 font-sans text-sm">
                        {currentStage.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono font-bold uppercase text-[11px] text-amber-400 mb-1">
                        When & Why to Use This Step
                      </h4>
                      <p className="text-stone-300 font-sans text-sm bg-stone-900/60 p-3 border border-stone-800">
                        {currentStage.whenToUse}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-mono font-bold uppercase text-[11px] text-emerald-400 mb-2">
                        Key Telemetry & Data Produced
                      </h4>
                      <ul className="space-y-1.5 font-mono text-stone-300">
                        {currentStage.keyOutputs.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">›</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-mono font-bold uppercase text-[11px] text-purple-400 mb-2">
                        Visualizations & Graphs Active in this Phase
                      </h4>
                      <ul className="space-y-1.5 font-mono text-stone-300">
                        {currentStage.visualizations.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 font-bold">›</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs for this step */}
                <div className="pt-4 border-t border-stone-800">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2.5">
                    Recommended Tabs for Step {currentStage.step}:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentStage.recommendedTabs.map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            onClose();
                            onSelectTab(tab.id);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-mono text-stone-200 transition-colors cursor-pointer"
                        >
                          <TabIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tab.name}</span>
                          <ChevronRight className="w-3 h-3 text-stone-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step Navigation Footer */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  disabled={activeStageStep === 1}
                  onClick={() => setActiveStageStep((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 border border-stone-700 bg-stone-900 hover:bg-stone-800 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous Step ({Math.max(1, activeStageStep - 1)})
                </button>

                <div className="flex items-center gap-1.5">
                  {WORKFLOW_STAGES.map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setActiveStageStep(s.step)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        s.step === activeStageStep
                          ? 'bg-amber-400 scale-125'
                          : 'bg-stone-700 hover:bg-stone-500'
                      }`}
                      aria-label={`Go to step ${s.step}`}
                    />
                  ))}
                </div>

                <button
                  disabled={activeStageStep === WORKFLOW_STAGES.length}
                  onClick={() => setActiveStageStep((prev) => Math.min(WORKFLOW_STAGES.length, prev + 1))}
                  className="px-3.5 py-2 border border-stone-700 bg-stone-900 hover:bg-stone-800 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next Step ({Math.min(WORKFLOW_STAGES.length, activeStageStep + 1)}) →
                </button>
              </div>
            </div>
          )}

          {guideView === 'tab-directory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    All Dashboard Panels & Visualization Tools ({filteredTabs.length})
                  </h3>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">
                    Click any tab to launch it directly. Tabs are categorized by recommended workflow phase.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Filter tabs or metric types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="bg-stone-950/60 border border-stone-800/90 p-4 hover:border-stone-700 transition-colors flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-serif font-bold text-white">
                          {tab.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-900 border border-stone-800 text-amber-400 font-bold">
                          Phase {tab.phase}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 font-sans leading-relaxed">
                        {tab.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-900 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-stone-400 truncate">
                        Produces: <span className="text-stone-300">{tab.statType}</span>
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectTab(tab.id);
                        }}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 font-mono text-[11px] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {guideView === 'faq' && (
            <div className="space-y-4">
              <div className="border border-stone-800 bg-stone-950/60 p-4">
                <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Evolution Engine Quick Start: How to Evolve a Champion
                </h3>
                <div className="space-y-3 text-xs text-stone-300 font-sans leading-relaxed">
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-white font-mono">Monitor the Baseline:</strong> Open the Evolution Matrix and Active Evolution Feed. Verify the engine is actively ticking and note the average population fitness.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-white font-mono">Synthesize Candidate Mutations:</strong> Use the Genome Mutation Lab or Sandboxed Simulator to perturb code segments with synthetic datasets until achieving &gt;85% pass rate.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-white font-mono">Train in the Incubator:</strong> Import candidate parameters into the Training Lab incubator and run epochs while checking the Cognitive Load Monitor for attention efficiency.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <strong className="text-white font-mono">Pass Swarm Stress & Conflict Gates:</strong> Run adversarial head-to-head arena tests in the Swarm Controller and resolve any semantic tool collisions in Skill Conflicts.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">5</span>
                    <div>
                      <strong className="text-white font-mono">Champion Promotion:</strong> Pass the Champion Stress Benchmark with ≥ 95.0% fitness to earn a permanent spot on the Top 5 Champion Leaderboard.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-stone-800 bg-stone-950/60 p-4 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>What does the 95.0% Threshold Gate mean?</span>
                  </h4>
                  <p className="text-xs text-stone-300 font-sans leading-relaxed">
                    Skills cannot be promoted to Champion status unless their cumulative verified fitness score meets or exceeds 95.0%. Below this line, skills remain in &quot;In-Training&quot; or &quot;Testing&quot; states to prevent unverified heuristics from polluting champion swarms.
                  </p>
                </div>

                <div className="border border-stone-800 bg-stone-950/60 p-4 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>How does the Auto-Run Workflow button work?</span>
                  </h4>
                  <p className="text-xs text-stone-300 font-sans leading-relaxed">
                    The Auto-Run button activates an automated walkthrough controller that navigates through all 6 phases in chronological order. Each step automatically switches the active view, highlights relevant metrics, and renders real-time stats and visual trend graphs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 px-6 py-4 bg-stone-950/80 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready to see the workflow in action?</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Close Guide
            </button>
            <button
              onClick={() => {
                onClose();
                onStartAutoWorkflow();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Launch Automated Workflow Walkthrough</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
