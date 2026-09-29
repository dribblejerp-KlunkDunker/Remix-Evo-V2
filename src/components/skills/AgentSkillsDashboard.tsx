import React, { useState, useMemo } from 'react';
import { AgentSkill, SkillEvolutionStage, EvolutionStats, VectorCategory, ScenarioHeatmapPoint } from '../../types/skills';
import { INITIAL_SKILLS, INITIAL_EVOLUTION_STATS, RECENT_AUTONOMOUS_ACTIVITY } from '../../data/skillsData';
import { SkillEvolutionCycle } from './SkillEvolutionCycle';
import { ChampionSkillsGrid } from './ChampionSkillsGrid';
import { AllSkillsList } from './AllSkillsList';
import { SkillDetailsModal } from './SkillDetailsModal';
import { RemixSkillModal } from './RemixSkillModal';
import { EcosystemScraperModal } from './EcosystemScraperModal';
import { TrainingLab } from './TrainingLab';
import { AgentScenarioHeatmap } from './AgentScenarioHeatmap';
import { EvolutionaryAuditLog } from './EvolutionaryAuditLog';
import { AgentMutationSimulator } from './AgentMutationSimulator';
import { AgentSkillForceGraph } from './AgentSkillForceGraph';
import { EvolutionHistorySidePanel } from './EvolutionHistorySidePanel';
import { SuccessRateChart } from './SuccessRateChart';
import { SwarmAuditModal } from './SwarmAuditModal';
import { AgentSwarmController } from './AgentSwarmController';
import { MutationProbabilityMap } from './MutationProbabilityMap';
import { ChampionBenchmarkModule } from './ChampionBenchmarkModule';
import { SkillConflictAlerts } from './SkillConflictAlerts';
import { CognitiveLoadMonitor } from './CognitiveLoadMonitor';
import { NeuralSynapseView } from './NeuralSynapseView';
import { INITIAL_SKILL_CONFLICTS } from '../../data/skillConflictData';
import { SkillConflictPair } from '../../types/skillConflicts';
import { Search, Sparkles, Filter, Activity, Trophy, ShieldAlert, ShieldCheck, Cpu, ArrowUpRight, Flame, Globe, FlaskConical, Layers, BarChart3, GitFork, Sliders, Network, PieChart, Dna, Scale, AlertTriangle, Brain } from 'lucide-react';

export const AgentSkillsDashboard: React.FC = () => {
  const [skills, setSkills] = useState<AgentSkill[]>(INITIAL_SKILLS);
  const [conflicts, setConflicts] = useState<SkillConflictPair[]>(INITIAL_SKILL_CONFLICTS);
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'performance' | 'heatmap' | 'lab' | 'lineage' | 'simulator' | 'graph' | 'swarm-controller' | 'mutation-map' | 'champion-benchmark' | 'conflicts' | 'cognitive-load' | 'synapse-view'>('matrix');
  const [matrixChartMode, setMatrixChartMode] = useState<'success-rates' | 'scenario-heatmap' | 'mutation-map'>('mutation-map');
  const [isSwarmAuditModalOpen, setIsSwarmAuditModalOpen] = useState(false);
  const [isMutationMapOverlayOpen, setIsMutationMapOverlayOpen] = useState(false);
  const [isBenchmarkOverlayOpen, setIsBenchmarkOverlayOpen] = useState(false);
  const [benchmarkSelectedSkillId, setBenchmarkSelectedSkillId] = useState<string | undefined>(undefined);
  const [isConflictOverlayOpen, setIsConflictOverlayOpen] = useState(false);
  const [focusedConflictId, setFocusedConflictId] = useState<string | undefined>(undefined);
  const [isCognitiveMonitorOpen, setIsCognitiveMonitorOpen] = useState(false);
  const [isSynapseViewOpen, setIsSynapseViewOpen] = useState(false);
  const [selectedLineageSkillId, setSelectedLineageSkillId] = useState<string | undefined>(undefined);
  const [isEvolutionHistoryOpen, setIsEvolutionHistoryOpen] = useState(false);
  const [evolutionHistorySkillId, setEvolutionHistorySkillId] = useState<string | undefined>(undefined);
  const [selectedStage, setSelectedStage] = useState<SkillEvolutionStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVector, setSelectedVector] = useState<string>('all');
  const [inspectedSkill, setInspectedSkill] = useState<AgentSkill | null>(null);
  const [modalInitialScenario, setModalInitialScenario] = useState<string | undefined>(undefined);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'testrunner' | 'rules' | 'lineage' | undefined>(undefined);
  const [remixParentSkill, setRemixParentSkill] = useState<AgentSkill | null>(null);
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [isEcosystemModalOpen, setIsEcosystemModalOpen] = useState(false);
  const [isSimulatingTick, setIsSimulatingTick] = useState(false);
  const [activityFeed, setActivityFeed] = useState(RECENT_AUTONOMOUS_ACTIVITY);
  const [notification, setNotification] = useState<string | null>(null);

  // Compute live stats
  const stats: EvolutionStats = useMemo(() => {
    const ideaCount = skills.filter((s) => s.stage === 'idea').length;
    const trainingCount = skills.filter((s) => s.stage === 'training').length;
    const testingCount = skills.filter((s) => s.stage === 'testing').length;
    const championCount = skills.filter((s) => s.stage === 'champion').length;

    return {
      totalSkills: skills.length,
      ideaCount,
      trainingCount,
      testingCount,
      championCount,
      thresholdRequirement: 95.0,
      dailyMutations: 148 + (skills.length - INITIAL_SKILLS.length) * 12,
      championsTestedToday: 849 + (skills.length - INITIAL_SKILLS.length) * 5,
      averageCompliance: 99.4
    };
  }, [skills]);

  // Extract all unique vectors
  const allVectors = useMemo(() => {
    const vSet = new Set<string>();
    skills.forEach((s) => s.vectors.forEach((v) => vSet.add(v)));
    return Array.from(vSet);
  }, [skills]);

  // Filter skills by stage, vector, and search
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesStage = selectedStage === 'all' || skill.stage === selectedStage;
      const matchesVector = selectedVector === 'all' || skill.vectors.includes(selectedVector as VectorCategory);
      const matchesSearch =
        searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.vectors.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStage && matchesVector && matchesSearch;
    });
  }, [skills, selectedStage, selectedVector, searchQuery]);

  // Champion skills specifically
  const championSkills = useMemo(() => {
    return skills.filter((s) => s.stage === 'champion');
  }, [skills]);

  // Active skill conflicts
  const activeConflicts = useMemo(() => {
    return conflicts.filter((c) => c.status === 'ACTIVE_FLAGGED');
  }, [conflicts]);

  // Autonomous Pulse Tick Simulation
  const handleSimulateTick = async () => {
    setIsSimulatingTick(true);

    await new Promise((r) => setTimeout(r, 800));

    // Randomly advance one testing skill or mutate thought loop
    const testingSkills = skills.filter((s) => s.stage === 'testing');
    let promotedSkillName = '';

    setSkills((prev) =>
      prev.map((sk) => {
        if (sk.stage === 'testing') {
          const delta = Number((Math.random() * 0.8 - 0.2).toFixed(1));
          const newScore = Math.min(99.6, Number((sk.benchmarkScore + delta).toFixed(1)));
          // Check if crosses champion threshold
          if (newScore >= sk.threshold) {
            promotedSkillName = sk.name;
            return {
              ...sk,
              stage: 'champion',
              benchmarkScore: newScore,
              stageHistory: [
                ...sk.stageHistory,
                {
                  stage: 'champion',
                  timestamp: 'Just now',
                  score: newScore,
                  notes: 'Exceeded 95.0% qualification threshold in adversarial stressbench.'
                }
              ]
            };
          }
          return { ...sk, benchmarkScore: newScore };
        }
        return sk;
      })
    );

    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      type: promotedSkillName ? 'champion_promoted' : 'benchmark_run',
      skillCode: promotedSkillName ? 'CHAMPION PROMOTION' : 'MATRIX PULSE',
      message: promotedSkillName
        ? `🔥 Skill "${promotedSkillName}" broke the 95.0% threshold and moved to CHAMPION state!`
        : `Autonomous matrix completed 18 adversarial simulations across Idea, Training, and Testing pipelines.`,
      status: promotedSkillName ? 'success' : 'progress'
    };

    setActivityFeed((prev) => [newActivity, ...prev.slice(0, 5)]);

    if (promotedSkillName) {
      setNotification(`🎉 "${promotedSkillName}" has qualified as an elite Champion Skill!`);
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification(`⚡ Evolution pulse completed. Agent thought loops and benchmarks updated.`);
      setTimeout(() => setNotification(null), 3000);
    }

    setIsSimulatingTick(false);
  };

  const handlePromoteSkill = (skill: AgentSkill) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skill.id
          ? {
              ...s,
              stage: 'champion',
              benchmarkScore: Math.max(95.0, s.benchmarkScore),
              stageHistory: [
                ...s.stageHistory,
                {
                  stage: 'champion',
                  timestamp: 'Just now',
                  score: Math.max(95.0, s.benchmarkScore),
                  notes: 'Promoted to active Champion tier by matrix supervisor.'
                }
              ]
            }
          : s
      )
    );
    setNotification(`Champion status granted to "${skill.name}".`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSkillCreated = (newSkill: AgentSkill) => {
    setSkills((prev) => [newSkill, ...prev]);
    setIsRemixModalOpen(false);
    setNotification(`✨ New skill "${newSkill.name}" seeded into Idea state.`);
    setTimeout(() => setNotification(null), 4000);
    setSelectedStage('idea');
  };

  const handleDeployFromLab = (newSkill: AgentSkill) => {
    setSkills((prev) => [newSkill, ...prev]);
    setNotification(`🚀 Deployed "${newSkill.name}" into active ${newSkill.stage.toUpperCase()} tier!`);
    setTimeout(() => setNotification(null), 4000);
    setActiveSubView('matrix');
    if (newSkill.stage === 'champion') {
      setSelectedStage('champion');
    }
  };

  const handleSelectSpecialistFromHeatmap = (specialistName: string) => {
    const matched = skills.find(
      (s) =>
        s.name.toLowerCase().includes(specialistName.toLowerCase()) ||
        specialistName.toLowerCase().includes(s.name.toLowerCase()) ||
        s.specialistRole.toLowerCase().includes(specialistName.toLowerCase())
    );
    if (matched) {
      setInspectedSkill(matched);
      setModalInitialTab('overview');
      setModalInitialScenario(undefined);
    } else {
      setSearchQuery(specialistName.split(' ')[0]);
      setActiveSubView('matrix');
    }
  };

  const handleRunScenarioTestFromHeatmap = (point: ScenarioHeatmapPoint) => {
    const matched =
      skills.find(
        (s) =>
          s.name.toLowerCase().includes(point.specialistName.toLowerCase()) ||
          point.specialistName.toLowerCase().includes(s.name.toLowerCase()) ||
          s.vectors.includes(point.specialistVector)
      ) || skills[0];

    setInspectedSkill(matched);
    setModalInitialTab('testrunner');
    setModalInitialScenario(
      `[Real-World Stress Challenge: ${point.scenarioName}]\n\nScenario Directive: ${point.keyInsight}`
    );
  };

  const handleOpenEvolutionHistory = (skillOrId?: AgentSkill | string) => {
    if (typeof skillOrId === 'string') {
      setEvolutionHistorySkillId(skillOrId);
    } else if (skillOrId?.id) {
      setEvolutionHistorySkillId(skillOrId.id);
    }
    setIsEvolutionHistoryOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-24">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 border border-emerald-500/80 text-white px-4 py-3 shadow-2xl text-xs font-mono flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Hero Section */}
      <section className="border-b border-stone-800 bg-stone-900/60 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-2">
              <span className="text-emerald-400 font-bold uppercase tracking-wider">
                Autonomous Research Agent Matrix
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>Evolutionary Benchmark Lab</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="text-stone-400">Zero True Downtime</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Agent Skills & Evolution Matrix
            </h1>
            <p className="text-sm text-stone-400 mt-2 max-w-3xl leading-relaxed font-sans">
              Autonomous bots generate, cross-breed, train, and test specialist skills using statistics, behavioral psychology, advanced math, forensics, and game design. Skills battle real-world use cases until meeting the <strong className="text-stone-200">≥ 95.0% threshold</strong> to become active Champion Skills.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setFocusedConflictId(activeConflicts[0]?.id);
                setIsConflictOverlayOpen(true);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                activeConflicts.length > 0
                  ? 'bg-rose-950/80 hover:bg-rose-900/95 text-rose-200 border border-rose-500/80 hover:border-rose-400 shadow-md ring-1 ring-rose-500/40'
                  : 'bg-teal-950/70 hover:bg-teal-900/90 text-teal-300 border border-teal-600/70 hover:border-teal-400 shadow-md'
              }`}
              title="Champion Skill Conflict visual alert system"
            >
              <ShieldAlert className={`w-4 h-4 ${activeConflicts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`} />
              <span>{activeConflicts.length > 0 ? `${activeConflicts.length} Skill Conflicts` : 'Conflicts Clean'}</span>
              {activeConflicts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
            </button>

            <button
              onClick={() => setIsCognitiveMonitorOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 border border-blue-500/70 hover:border-blue-400 shadow-md transition-all cursor-pointer"
              title="Open D3 Cognitive Load Monitor (Champion vs In-Training Neural Telemetry)"
            >
              <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Cognitive Load Monitor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsSynapseViewOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/70 hover:border-cyan-400 shadow-md transition-all cursor-pointer"
              title="Open Neural Synapse View (Connection Weights & Co-Firing Paths)"
            >
              <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Neural Synapse View</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </button>

            <button
              onClick={() => {
                setBenchmarkSelectedSkillId(championSkills[0]?.id);
                setIsBenchmarkOverlayOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-500/70 hover:border-amber-400 shadow-md transition-all cursor-pointer"
              title="Launch Champion Stress Benchmark against historical market crises"
            >
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Champion Benchmark</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsMutationMapOverlayOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/70 hover:border-emerald-400 shadow-md transition-all cursor-pointer"
              title="Open Mutation Probability Map (Predictive Heatmap Overlay)"
            >
              <Dna className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Mutation Probability Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsSwarmAuditModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/70 hover:border-emerald-400 shadow-md transition-all cursor-pointer"
              title="Launch Strenuous Swarm Audit (8 Red-Team Nodes, 5,100 Tests)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Strenuous Swarm Audit</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'swarm-controller' ? 'matrix' : 'swarm-controller')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                activeSubView === 'swarm-controller'
                  ? 'bg-purple-600 text-white border border-purple-400 shadow-md ring-2 ring-purple-500/40'
                  : 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-600/70 hover:border-purple-400 shadow-md'
              }`}
              title="Open Agent Swarm Controller (Financial Logic Puzzles & Arena)"
            >
              <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>{activeSubView === 'swarm-controller' ? 'Back to Matrix' : 'Swarm Controller Arena'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsEvolutionHistoryOpen(!isEvolutionHistoryOpen)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                isEvolutionHistoryOpen
                  ? 'bg-purple-600 text-white border border-purple-400 shadow-md ring-2 ring-purple-500/40'
                  : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-700/60 hover:border-purple-500'
              }`}
              title="Toggle Evolution History side panel (Mutations & Parent Merges)"
            >
              <GitFork className="w-4 h-4 text-purple-400" />
              <span>Evolution History Side Panel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'simulator' ? 'matrix' : 'simulator')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                activeSubView === 'simulator'
                  ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-purple-300 border border-stone-700 hover:border-stone-600'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>{activeSubView === 'simulator' ? 'Back to Matrix' : 'Mutation Simulator'}</span>
              {activeSubView !== 'simulator' && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'lineage' ? 'matrix' : 'lineage')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                activeSubView === 'lineage'
                  ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-purple-300 border border-stone-700 hover:border-stone-600'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>{activeSubView === 'lineage' ? 'Back to Matrix' : 'Evolutionary Audit Log'}</span>
              {activeSubView !== 'lineage' && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'heatmap' ? 'matrix' : 'heatmap')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                activeSubView === 'heatmap'
                  ? 'bg-emerald-400 text-stone-950 border border-emerald-300 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-stone-700 hover:border-stone-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{activeSubView === 'heatmap' ? 'Back to Matrix' : 'Scenario Heatmap'}</span>
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'graph' ? 'matrix' : 'graph')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                activeSubView === 'graph'
                  ? 'bg-cyan-400 text-stone-950 border border-cyan-300 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-stone-700 hover:border-stone-600'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>{activeSubView === 'graph' ? 'Back to Matrix' : 'Evolution Force Graph (D3)'}</span>
              {activeSubView !== 'graph' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveSubView(activeSubView === 'lab' ? 'matrix' : 'lab')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold transition-all ${
                activeSubView === 'lab'
                  ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-stone-600'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>{activeSubView === 'lab' ? 'Back to Matrix' : 'Training Lab'}</span>
              {activeSubView !== 'lab' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setIsEcosystemModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-stone-600 text-xs font-mono font-medium transition-colors"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Scraped Ecosystem & Audit</span>
            </button>

            <button
              onClick={() => {
                setRemixParentSkill(null);
                setIsRemixModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-stone-950 hover:bg-stone-200 text-xs font-mono font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Remix & Evolve Skill</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sub-view Navigation Switcher */}
      <div className="max-w-7xl mx-auto px-6 pt-6 -mb-2 w-full flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubView('graph')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'graph'
                ? 'bg-stone-800 text-cyan-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evolution Force Graph (D3.js Migration)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('matrix')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border ${
              activeSubView === 'matrix'
                ? 'bg-stone-800 text-white font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evolution Matrix Overview</span>
            <span className="text-[10px] text-stone-500 font-normal">({stats.totalSkills} Skills)</span>
          </button>

          <button
            onClick={() => setActiveSubView('lineage')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'lineage'
                ? 'bg-stone-800 text-purple-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Evolutionary Audit Log (Lineage & Deltas)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('performance')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'performance'
                ? 'bg-stone-800 text-emerald-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Success vs Failure Chart (Recharts)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border ${
              activeSubView === 'heatmap'
                ? 'bg-stone-800 text-emerald-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scenario Success Heatmap (Recharts)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('lab')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'lab'
                ? 'bg-stone-800 text-amber-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Training Lab (Real-Time Incubator)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('swarm-controller')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'swarm-controller'
                ? 'bg-stone-800 text-purple-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Agent Swarm Controller (Logic Puzzles Arena)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('conflicts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'conflicts'
                ? 'bg-stone-800 text-rose-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-rose-400" />
            <span>Skill Conflicts</span>
            {activeConflicts.length > 0 ? (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-rose-950 border border-rose-600 text-rose-300 font-bold animate-pulse">
                {activeConflicts.length}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-teal-950 border border-teal-600 text-teal-300 font-bold">
                ✓
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubView('champion-benchmark')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'champion-benchmark'
                ? 'bg-stone-800 text-amber-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Champion Stress Benchmark</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('cognitive-load')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'cognitive-load'
                ? 'bg-stone-800 text-blue-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            <span>Cognitive Load Monitor (D3 Real-Time)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('synapse-view')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'synapse-view'
                ? 'bg-stone-800 text-cyan-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neural Synapses (Co-Firing)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('mutation-map')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'mutation-map'
                ? 'bg-stone-800 text-emerald-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mutation Probability Map (Heatmap)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubView('simulator')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all border relative ${
              activeSubView === 'simulator'
                ? 'bg-stone-800 text-purple-300 font-bold border-stone-600 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 border-transparent hover:border-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Agent Mutation Simulator (Trajectory & Sliders)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
          <button
            onClick={() => setIsMutationMapOverlayOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/70 transition-colors shadow-xs"
            title="Open Mutation Probability Map Overlay"
          >
            <Dna className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mutation Map</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          <span className="hidden md:inline">·</span>
          <button
            onClick={() => setIsSwarmAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/70 transition-colors shadow-xs"
            title="Launch Strenuous Swarm Audit"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swarm Audit</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          <span className="hidden md:inline">·</span>
          <button
            onClick={() => setIsEvolutionHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-600/70 transition-colors shadow-xs"
            title="Open Evolution History Side Panel"
          >
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Evolution History Panel</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </button>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">Active Champions: <strong className="text-emerald-400">{stats.championCount}</strong></span>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">Threshold Gate: <strong className="text-stone-300">≥ 95.0%</strong></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8 w-full flex-1">
        {activeSubView === 'lab' ? (
          <TrainingLab onDeployToMatrix={handleDeployFromLab} existingSkills={skills} />
        ) : activeSubView === 'conflicts' ? (
          <SkillConflictAlerts
            skills={skills}
            conflicts={conflicts}
            onUpdateConflicts={setConflicts}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
            focusedConflictId={focusedConflictId}
          />
        ) : activeSubView === 'cognitive-load' ? (
          <CognitiveLoadMonitor
            skills={skills}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
          />
        ) : activeSubView === 'synapse-view' ? (
          <NeuralSynapseView
            skills={skills}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
          />
        ) : activeSubView === 'champion-benchmark' ? (
          <ChampionBenchmarkModule
            skills={skills}
            initialSelectedSkillId={benchmarkSelectedSkillId}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
            onRemixSkill={(skill) => {
              setRemixParentSkill(skill);
              setIsRemixModalOpen(true);
            }}
          />
        ) : activeSubView === 'mutation-map' ? (
          <MutationProbabilityMap
            skills={skills}
            onInitiateMutation={(parentA, parentB) => {
              setRemixParentSkill(parentA);
              setIsRemixModalOpen(true);
            }}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
          />
        ) : activeSubView === 'swarm-controller' ? (
          <AgentSwarmController
            onInspectGlobalSkill={(skillId) => {
              const s = skills.find((sk) => sk.id === skillId);
              if (s) setInspectedSkill(s);
            }}
          />
        ) : activeSubView === 'performance' ? (
          <SuccessRateChart
            skills={skills}
            onSelectCategory={(category) => {
              setSelectedVector(category);
              setActiveSubView('matrix');
              setNotification(`Filtered Matrix view by domain: ${category}`);
            }}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
          />
        ) : activeSubView === 'heatmap' ? (
          <AgentScenarioHeatmap
            onSelectSpecialist={handleSelectSpecialistFromHeatmap}
            onRunScenarioTest={handleRunScenarioTestFromHeatmap}
          />
        ) : activeSubView === 'lineage' ? (
          <EvolutionaryAuditLog
            skills={skills}
            selectedSkillId={selectedLineageSkillId}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
            onOpenRemixWithParents={(parentNames) => {
              setIsRemixModalOpen(true);
            }}
          />
        ) : activeSubView === 'simulator' ? (
          <AgentMutationSimulator
            onDeploySkillToMatrix={(newSkill) => {
              setSkills((prev) => [newSkill, ...prev]);
              setActiveSubView('matrix');
              setNotification(`Successfully deployed ${newSkill.name} to Evolution Matrix!`);
            }}
            onSendToTrainingLab={(skillParams) => {
              setActiveSubView('lab');
              setNotification(`Imported parameters for ${skillParams.name} into Training Lab incubator`);
            }}
            existingSkills={skills}
          />
        ) : activeSubView === 'graph' ? (
          <AgentSkillForceGraph
            skills={skills}
            onInspectSkill={(skill) => setInspectedSkill(skill)}
            onRemixSkill={(skill) => {
              setRemixParentSkill(skill);
              setIsRemixModalOpen(true);
            }}
            onSimulateMutation={(skill) => {
              setActiveSubView('simulator');
            }}
            onUpdateSkill={(updatedSkill) => {
              setSkills((prev) => prev.map((s) => (s.id === updatedSkill.id ? updatedSkill : s)));
            }}
            onPromoteSkill={handlePromoteSkill}
            onSwitchToLab={() => setActiveSubView('lab')}
            onOpenEvolutionHistory={(skill) => handleOpenEvolutionHistory(skill)}
          />
        ) : (
          <>
            {/* 1. SKILL EVOLUTION CYCLE VISUALIZATION (Idea -> Training -> Testing -> Champion) */}
            <section aria-label="Skill Evolution Lifecycle">
              <SkillEvolutionCycle
                stats={stats}
                selectedStage={selectedStage}
                onSelectStage={setSelectedStage}
                onSimulateTick={handleSimulateTick}
                isSimulating={isSimulatingTick}
                onOpenForceGraph={() => setActiveSubView('graph')}
                onOpenEvolutionHistory={() => handleOpenEvolutionHistory()}
              />
            </section>

            {/* Live Autonomous Activity Ticker */}
            <section className="bg-stone-900/40 border border-stone-800/80 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-stone-400 shrink-0">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-white font-semibold">Autonomous Stream:</span>
              </div>
              <div className="flex-1 text-stone-300 truncate">
                {activityFeed[0]?.message}
              </div>
              <div className="text-stone-500 text-[11px] shrink-0">
                {activityFeed[0]?.timestamp}
              </div>
            </section>

            {/* VISUAL LAYER: SUCCESS VS FAILURE CHART & SCENARIO HEATMAP */}
            <section aria-label="Performance Telemetry Layer" className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-stone-400 font-bold">Telemetry Layer:</span>
                  <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setMatrixChartMode('mutation-map')}
                      className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                        matrixChartMode === 'mutation-map'
                          ? 'bg-stone-800 text-emerald-300 font-bold shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Dna className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mutation Probability Map</span>
                    </button>
                    <button
                      onClick={() => setMatrixChartMode('success-rates')}
                      className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                        matrixChartMode === 'success-rates'
                          ? 'bg-stone-800 text-emerald-300 font-bold shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Domain Success vs Failure</span>
                    </button>
                    <button
                      onClick={() => setMatrixChartMode('scenario-heatmap')}
                      className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                        matrixChartMode === 'scenario-heatmap'
                          ? 'bg-stone-800 text-emerald-300 font-bold shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scenario Heatmap</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubView(matrixChartMode === 'mutation-map' ? 'mutation-map' : 'performance')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open Full-Screen View</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {matrixChartMode === 'mutation-map' ? (
                <MutationProbabilityMap
                  skills={skills}
                  onInitiateMutation={(parentA, parentB) => {
                    setRemixParentSkill(parentA);
                    setIsRemixModalOpen(true);
                  }}
                  onInspectSkill={(skill) => setInspectedSkill(skill)}
                />
              ) : matrixChartMode === 'success-rates' ? (
                <SuccessRateChart
                  skills={skills}
                  onSelectCategory={(category) => {
                    setSelectedVector(category);
                    setNotification(`Filtered Matrix skills by "${category}" domain.`);
                  }}
                  onInspectSkill={(skill) => setInspectedSkill(skill)}
                />
              ) : (
                <AgentScenarioHeatmap
                  onSelectSpecialist={handleSelectSpecialistFromHeatmap}
                  onRunScenarioTest={handleRunScenarioTestFromHeatmap}
                />
              )}
            </section>

            {/* 2. ACTIVE CHAMPION SKILLS (When on 'all' or 'champion' stage) */}
            {(selectedStage === 'all' || selectedStage === 'champion') && (
              <section aria-label="Active Champion Skills" className="space-y-4">
                {/* Visual Conflict Alert Strip */}
                {activeConflicts.length > 0 && (
                  <div className="bg-rose-950/40 border border-rose-600/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                    <div className="flex items-start sm:items-center gap-3 text-rose-200">
                      <div className="p-1.5 bg-rose-950 border border-rose-500/50 text-rose-400 shrink-0">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white uppercase font-bold tracking-wider">
                            Champion Directive Conflict Alert
                          </strong>
                          <span className="px-1.5 py-0.2 bg-rose-900 border border-rose-500 text-[10px] text-rose-200 font-bold">
                            {activeConflicts.length} Active Collision{activeConflicts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-stone-300 text-xs font-sans mt-0.5">
                          Detected clashing axioms across {activeConflicts.map((c) => `${c.skillACode} ⚡ ${c.skillBCode}`).join(', ')}. Without arbitration, concurrent evaluations may yield conflicting financial ratings.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setFocusedConflictId(activeConflicts[0]?.id);
                          setIsConflictOverlayOpen(true);
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Arbitrate Conflicts</span>
                      </button>
                    </div>
                  </div>
                )}

                <ChampionSkillsGrid
                  championSkills={championSkills}
                  conflicts={conflicts}
                  onViewConflict={(conflictId) => {
                    setFocusedConflictId(conflictId);
                    setIsConflictOverlayOpen(true);
                  }}
                  onInspectSkill={(skill) => setInspectedSkill(skill)}
                  onRunTest={(skill) => {
                    setInspectedSkill(skill);
                  }}
                  onBenchmarkSkill={(skill) => {
                    setBenchmarkSelectedSkillId(skill.id);
                    setIsBenchmarkOverlayOpen(true);
                  }}
                  onViewLineageAudit={(skill) => {
                    setSelectedLineageSkillId(skill.id);
                    setActiveSubView('lineage');
                  }}
                  onSimulateMutation={(skill) => {
                    setActiveSubView('simulator');
                  }}
                  onRemixSkill={(skill) => {
                    setRemixParentSkill(skill);
                    setIsRemixModalOpen(true);
                  }}
                  onOpenEvolutionHistory={(skill) => handleOpenEvolutionHistory(skill)}
                />
              </section>
            )}

            {/* 3. FILTER & SEARCH BAR */}
            <section className="pt-4 border-t border-stone-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md bg-stone-900 border border-stone-800 px-3 py-2 text-xs font-mono">
                  <Search className="w-4 h-4 text-stone-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills, vectors, rules, or test scenarios..."
                    className="bg-transparent border-none outline-none w-full text-white placeholder-stone-600 font-mono"
                  />
                </div>

                {/* Vector Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <span className="text-xs font-mono text-stone-500 shrink-0">Vector:</span>
                  <button
                    onClick={() => setSelectedVector('all')}
                    className={`px-2.5 py-1 text-xs font-mono transition-colors shrink-0 ${
                      selectedVector === 'all'
                        ? 'bg-stone-800 text-white border border-stone-600'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    All Vectors
                  </button>
                  {allVectors.map((vec) => (
                    <button
                      key={vec}
                      onClick={() => setSelectedVector(vec)}
                      className={`px-2.5 py-1 text-xs font-mono transition-colors shrink-0 ${
                        selectedVector === vec
                          ? 'bg-stone-800 text-white border border-stone-600'
                          : 'text-stone-400 hover:text-stone-200 border border-transparent'
                      }`}
                    >
                      {vec}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Skills List / Filtered View */}
              <AllSkillsList
                skills={filteredSkills}
                activeStageFilter={selectedStage}
                onInspectSkill={(skill) => setInspectedSkill(skill)}
                onRunTest={(skill) => setInspectedSkill(skill)}
                onPromoteSkill={handlePromoteSkill}
                onOpenEvolutionHistory={(skill) => handleOpenEvolutionHistory(skill)}
              />
            </section>
          </>
        )}
      </div>

      {/* Skill Details & Test Runner Modal */}
      {inspectedSkill && (
        <SkillDetailsModal
          skill={inspectedSkill}
          initialScenario={modalInitialScenario}
          initialTab={modalInitialTab}
          onClose={() => {
            setInspectedSkill(null);
            setModalInitialScenario(undefined);
            setModalInitialTab(undefined);
          }}
          onRunTest={async (skill) => {
            // Handled inside modal
          }}
          onAddRule={(skillId, newRule) => {
            setNotification(`Added strict rule to ${inspectedSkill.name}`);
            setTimeout(() => setNotification(null), 3000);
          }}
          onOpenFullAuditLog={(skillId) => {
            setSelectedLineageSkillId(skillId);
            setActiveSubView('lineage');
          }}
          onOpenMutationSimulator={(skill) => {
            setInspectedSkill(null);
            setActiveSubView('simulator');
          }}
          onOpenForceGraph={(skill) => {
            setInspectedSkill(null);
            setActiveSubView('graph');
          }}
          onOpenEvolutionHistory={(skill) => {
            setInspectedSkill(null);
            handleOpenEvolutionHistory(skill);
          }}
        />
      )}

      {/* Remix & Evolve Modal */}
      {isRemixModalOpen && (
        <RemixSkillModal
          initialParentSkill={remixParentSkill}
          onClose={() => {
            setIsRemixModalOpen(false);
            setRemixParentSkill(null);
          }}
          onSkillCreated={handleSkillCreated}
        />
      )}

      {/* Scraped Ecosystem & Audit Modal */}
      {isEcosystemModalOpen && (
        <EcosystemScraperModal
          onClose={() => setIsEcosystemModalOpen(false)}
          onImportSkill={(importedSkill) => {
            setSkills((prev) => [importedSkill, ...prev]);
            setNotification(`📥 Ingested "${importedSkill.name}" into ${importedSkill.stage.toUpperCase()} stage.`);
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}

      {/* Evolution History Side Panel */}
      <EvolutionHistorySidePanel
        isOpen={isEvolutionHistoryOpen}
        onClose={() => setIsEvolutionHistoryOpen(false)}
        skills={skills}
        selectedSkillId={evolutionHistorySkillId}
        onSelectSkill={(skillId) => setEvolutionHistorySkillId(skillId)}
        onUpdateSkill={(updatedSkill) => {
          setSkills((prev) => prev.map((s) => (s.id === updatedSkill.id ? updatedSkill : s)));
          setNotification(`⚡ Mutated ${updatedSkill.name} to Gen-${updatedSkill.generation} (${updatedSkill.benchmarkScore.toFixed(1)}%)`);
          setTimeout(() => setNotification(null), 4000);
        }}
        onRemixSkill={(skill) => {
          setRemixParentSkill(skill);
          setIsRemixModalOpen(true);
        }}
        onRunTest={(skill) => {
          setInspectedSkill(skill);
          setModalInitialTab('testrunner');
        }}
        onOpenForceGraph={(skill) => {
          setActiveSubView('graph');
        }}
        onPromoteSkill={handlePromoteSkill}
      />

      {/* Strenuous Swarm Audit Modal */}
      <SwarmAuditModal
        isOpen={isSwarmAuditModalOpen}
        onClose={() => setIsSwarmAuditModalOpen(false)}
        skills={skills}
        onInspectSkill={(skill) => setInspectedSkill(skill)}
      />

      {/* Mutation Probability Map Overlay */}
      {isMutationMapOverlayOpen && (
        <MutationProbabilityMap
          skills={skills}
          isOpenAsOverlay={true}
          onCloseOverlay={() => setIsMutationMapOverlayOpen(false)}
          onInitiateMutation={(parentA, parentB) => {
            setIsMutationMapOverlayOpen(false);
            setRemixParentSkill(parentA);
            setIsRemixModalOpen(true);
          }}
          onInspectSkill={(skill) => {
            setIsMutationMapOverlayOpen(false);
            setInspectedSkill(skill);
          }}
        />
      )}

      {/* Champion Benchmark Module Overlay */}
      {isBenchmarkOverlayOpen && (
        <ChampionBenchmarkModule
          skills={skills}
          initialSelectedSkillId={benchmarkSelectedSkillId}
          isOpenAsOverlay={true}
          onCloseOverlay={() => setIsBenchmarkOverlayOpen(false)}
          onInspectSkill={(skill) => {
            setIsBenchmarkOverlayOpen(false);
            setInspectedSkill(skill);
          }}
          onRemixSkill={(skill) => {
            setIsBenchmarkOverlayOpen(false);
            setRemixParentSkill(skill);
            setIsRemixModalOpen(true);
          }}
        />
      )}

      {/* Skill Conflict Visual Alert System Overlay */}
      {isConflictOverlayOpen && (
        <SkillConflictAlerts
          skills={skills}
          conflicts={conflicts}
          onUpdateConflicts={setConflicts}
          isOpenAsOverlay={true}
          onCloseOverlay={() => setIsConflictOverlayOpen(false)}
          focusedConflictId={focusedConflictId}
          onInspectSkill={(skill) => {
            setIsConflictOverlayOpen(false);
            setInspectedSkill(skill);
          }}
        />
      )}

      {/* Cognitive Load Monitor Overlay */}
      {isCognitiveMonitorOpen && (
        <CognitiveLoadMonitor
          skills={skills}
          isOpenAsOverlay={true}
          onCloseOverlay={() => setIsCognitiveMonitorOpen(false)}
          onInspectSkill={(skill) => {
            setIsCognitiveMonitorOpen(false);
            setInspectedSkill(skill);
          }}
        />
      )}

      {/* Neural Synapse View Overlay */}
      {isSynapseViewOpen && (
        <NeuralSynapseView
          skills={skills}
          isOpenAsOverlay={true}
          onCloseOverlay={() => setIsSynapseViewOpen(false)}
          onInspectSkill={(skill) => {
            setIsSynapseViewOpen(false);
            setInspectedSkill(skill);
          }}
        />
      )}
    </div>
  );
};
