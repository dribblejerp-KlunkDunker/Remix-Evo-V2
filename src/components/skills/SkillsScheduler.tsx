import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  Moon,
  Sun,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Trophy,
  Layers,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Sliders,
  Check,
  X,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { AgentSkill, SkillEvolutionStage } from '../../types/skills';
import { ExecutionWindow, ScheduledSkillQueueItem, SchedulerRunLog, WindowIntensity } from '../../types/scheduler';
import { INITIAL_EXECUTION_WINDOWS, INITIAL_SCHEDULER_LOGS } from '../../data/schedulerData';

interface SkillsSchedulerProps {
  skills: AgentSkill[];
  onInspectSkill?: (skill: AgentSkill) => void;
  onUpdateSkillScore?: (skillId: string, delta: number) => void;
  onNotification?: (msg: string) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to determine if an HH:MM string falls in off-peak hours (default off-peak: 22:00 - 07:00)
function isHourOffPeak(timeStr: string): boolean {
  const [hour] = timeStr.split(':').map(Number);
  return hour >= 22 || hour < 7;
}

export const SkillsScheduler: React.FC<SkillsSchedulerProps> = ({
  skills,
  onInspectSkill,
  onUpdateSkillScore,
  onNotification
}) => {
  // State for execution windows
  const [windows, setWindows] = useState<ExecutionWindow[]>(INITIAL_EXECUTION_WINDOWS);
  const [logs, setLogs] = useState<SchedulerRunLog[]>(INITIAL_SCHEDULER_LOGS);
  
  // Selected window for detailed queue inspection
  const [selectedWindowId, setSelectedWindowId] = useState<string>('win-nightly-apex');
  
  // Simulated time toggle: allows user to preview off-peak hours (02:30 UTC) vs peak (14:30 UTC)
  const [useSimulatedOffPeakTime, setUseSimulatedOffPeakTime] = useState<boolean>(true);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('02:45 UTC');
  const [currentHourNumber, setCurrentHourNumber] = useState<number>(2);

  // Live execution simulation state
  const [isExecutingRun, setIsExecutingRun] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [activeWorkerLogs, setActiveWorkerLogs] = useState<string[]>([]);
  const [completedRunSummary, setCompletedRunSummary] = useState<SchedulerRunLog | null>(null);

  // Window Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWindow, setEditingWindow] = useState<ExecutionWindow | null>(null);

  // Filter for priority queue
  const [queueStageFilter, setQueueStageFilter] = useState<string>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState<string>('');

  // Clock effect
  useEffect(() => {
    if (!useSimulatedOffPeakTime) {
      const updateRealTime = () => {
        const d = new Date();
        const h = d.getUTCHours();
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        const s = d.getUTCSeconds().toString().padStart(2, '0');
        setCurrentTimeStr(`${h.toString().padStart(2, '0')}:${m}:${s} UTC`);
        setCurrentHourNumber(h);
      };
      updateRealTime();
      const interval = setInterval(updateRealTime, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTimeStr('02:45:18 UTC');
      setCurrentHourNumber(2.75);
    }
  }, [useSimulatedOffPeakTime]);

  // Active selected window object
  const activeWindow = useMemo(() => {
    return windows.find((w) => w.id === selectedWindowId) || windows[0];
  }, [windows, selectedWindowId]);

  // Check if current time is off-peak
  const isCurrentTimeOffPeak = useMemo(() => {
    if (useSimulatedOffPeakTime) return true;
    return currentHourNumber >= 22 || currentHourNumber < 7;
  }, [useSimulatedOffPeakTime, currentHourNumber]);

  // Build the prioritized skill queue dynamically based on skills and active window settings
  const prioritizedQueue: ScheduledSkillQueueItem[] = useMemo(() => {
    if (!activeWindow) return [];

    // Filter skills matching target stages or minimum score
    let candidateSkills = [...skills];

    if (activeWindow.targetStages && activeWindow.targetStages.length > 0) {
      candidateSkills = candidateSkills.filter((s) => activeWindow.targetStages.includes(s.stage));
    }

    // Calculate priority scores
    // If window prioritizes champions: champion stage gets huge boost, higher benchmark score gets exponential boost
    const items: ScheduledSkillQueueItem[] = candidateSkills.map((s, index) => {
      let priorityScore = s.benchmarkScore;
      
      // Champion priority bonus during off-peak
      if (activeWindow.prioritizeChampions) {
        if (s.stage === 'champion') {
          priorityScore += 100;
        } else if (s.benchmarkScore >= activeWindow.minScoreThreshold) {
          priorityScore += 50;
        }
      }

      // Assign priority tier
      let priorityTier: ScheduledSkillQueueItem['priorityTier'] = 'P4 - Standard Evaluation';
      if (s.stage === 'champion' && s.benchmarkScore >= 95) {
        priorityTier = 'P1 - Champion Apex';
      } else if (s.stage === 'champion') {
        priorityTier = 'P2 - Champion Elite';
      } else if (s.benchmarkScore >= 90) {
        priorityTier = 'P3 - High Contender (90-94%)';
      }

      // Compute slot time offset from start time
      const [startH, startM] = activeWindow.startTime.split(':').map(Number);
      const slotMinutesTotal = (startH * 60 + startM + index * 18) % (24 * 60);
      const slotH = Math.floor(slotMinutesTotal / 60).toString().padStart(2, '0');
      const slotM = (slotMinutesTotal % 60).toString().padStart(2, '0');
      const allocatedSlot = `${slotH}:${slotM} UTC`;

      return {
        id: `queue-${activeWindow.id}-${s.id}`,
        windowId: activeWindow.id,
        windowName: activeWindow.name,
        skillId: s.id,
        skillName: s.name,
        skillCode: s.code,
        stage: s.stage,
        benchmarkScore: s.benchmarkScore,
        priorityScore,
        priorityTier,
        allocatedSlot,
        status: 'queued',
        testCasesCount: s.testCases?.length || Math.floor(activeWindow.syntheticIterations / 10),
        stressScenario: s.testCases?.[0]?.title || `${s.vectors?.[0] || 'Stochastic'} Edge Invariance Stress`
      };
    });

    // Sort by priorityScore descending so top champions run first!
    items.sort((a, b) => b.priorityScore - a.priorityScore);

    return items;
  }, [skills, activeWindow]);

  // Filtered queue based on UI controls
  const filteredQueue = useMemo(() => {
    return prioritizedQueue.filter((item) => {
      if (queueStageFilter !== 'all' && item.stage !== queueStageFilter) return false;
      if (queueSearchQuery.trim()) {
        const q = queueSearchQuery.toLowerCase();
        return item.skillName.toLowerCase().includes(q) || item.skillCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [prioritizedQueue, queueStageFilter, queueSearchQuery]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalWindows = windows.length;
    const activeCount = windows.filter((w) => w.enabled).length;
    const offPeakCount = windows.filter((w) => w.isOffPeak && w.enabled).length;
    
    // Total champions prioritized in off-peak windows
    const championsInQueue = prioritizedQueue.filter((q) => q.stage === 'champion').length;
    const championPrioritizationRate = prioritizedQueue.length > 0 
      ? Math.round((championsInQueue / prioritizedQueue.length) * 100) 
      : 0;

    return {
      totalWindows,
      activeCount,
      offPeakCount,
      totalQueued: prioritizedQueue.length,
      championsInQueue,
      championPrioritizationRate,
      offPeakComputeSavings: 65.4
    };
  }, [windows, prioritizedQueue]);

  // Handler to toggle window status
  const handleToggleWindow = (windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === windowId) {
          const updated = !w.enabled;
          if (onNotification) {
            onNotification(`${updated ? 'Activated' : 'Paused'} window "${w.name}"`);
          }
          return { ...w, enabled: updated };
        }
        return w;
      })
    );
  };

  // Handler to delete window
  const handleDeleteWindow = (windowId: string) => {
    if (windows.length <= 1) {
      if (onNotification) onNotification('Cannot delete the only remaining window');
      return;
    }
    const target = windows.find((w) => w.id === windowId);
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
    if (selectedWindowId === windowId) {
      const remaining = windows.filter((w) => w.id !== windowId);
      setSelectedWindowId(remaining[0].id);
    }
    if (onNotification && target) {
      onNotification(`Removed execution window "${target.name}"`);
    }
  };

  // Open modal for editing or creating
  const handleOpenEditModal = (windowObj?: ExecutionWindow) => {
    if (windowObj) {
      setEditingWindow({ ...windowObj });
    } else {
      setEditingWindow({
        id: `win-${Date.now()}`,
        name: 'New Off-Peak Testing Window',
        description: 'Scheduled execution window prioritizing high-performing skills.',
        startTime: '02:00',
        endTime: '06:00',
        timezone: 'UTC',
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true,
        isOffPeak: true,
        prioritizeChampions: true,
        minScoreThreshold: 93,
        concurrencyWorkers: 8,
        intensity: 'Deep Stress',
        targetStages: ['champion', 'testing'],
        syntheticIterations: 1000,
        autoPromoteOnPass: true,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  // Save modal window
  const handleSaveModalWindow = () => {
    if (!editingWindow || !editingWindow.name.trim()) return;

    setWindows((prev) => {
      const exists = prev.some((w) => w.id === editingWindow.id);
      if (exists) {
        return prev.map((w) => (w.id === editingWindow.id ? editingWindow : w));
      } else {
        return [...prev, editingWindow];
      }
    });

    setSelectedWindowId(editingWindow.id);
    setIsModalOpen(false);
    if (onNotification) {
      onNotification(`Saved execution window "${editingWindow.name}"`);
    }
  };

  // Quick Blueprint Reset
  const handleResetToBlueprint = () => {
    setWindows(INITIAL_EXECUTION_WINDOWS);
    setSelectedWindowId('win-nightly-apex');
    if (onNotification) {
      onNotification('Reset scheduler to Recommended Off-Peak Champion Blueprint');
    }
  };

  // Run simulated execution of the active window
  const handleRunSimulatedWindow = () => {
    if (isExecutingRun) return;
    setIsExecutingRun(true);
    setExecutionProgress(0);
    setActiveWorkerLogs([]);
    setCompletedRunSummary(null);

    const targetQueue = prioritizedQueue.slice(0, 6);
    const workerCount = activeWindow?.concurrencyWorkers || 8;

    const logMessages: string[] = [
      `[SCHEDULER ENGINE] Initiating window: "${activeWindow.name}" (${activeWindow.startTime} - ${activeWindow.endTime} UTC)`,
      `[OFF-PEAK DISPATCH] Compute zone: OFF-PEAK ACTIVE. Worker concurrency: ${workerCount} parallel threads`,
      `[PRIORITIZATION] Champion prioritization filter engaged: ${targetQueue.filter((s) => s.stage === 'champion').length} apex champions placed in P1 slots`,
      `[WORKER 01] Spawning thread: Evaluating top champion "${targetQueue[0]?.skillName || 'Apex Skill'}"...`
    ];
    setActiveWorkerLogs(logMessages);

    let progress = 10;
    setExecutionProgress(progress);

    const stepInterval = setInterval(() => {
      progress += 18;
      if (progress >= 100) {
        clearInterval(stepInterval);
        setExecutionProgress(100);

        // Update skills with slight benchmark score evolution
        targetQueue.forEach((item, idx) => {
          if (onUpdateSkillScore && item.stage === 'champion') {
            const delta = Number((Math.random() * 0.8 + 0.2).toFixed(1));
            onUpdateSkillScore(item.skillId, delta);
          }
        });

        // Add to historical logs
        const newLog: SchedulerRunLog = {
          id: `log-${Date.now()}`,
          windowId: activeWindow.id,
          windowName: activeWindow.name,
          executedAt: 'Just now',
          durationFormatted: `${Math.floor(Math.random() * 3 + 2)}h ${Math.floor(Math.random() * 50)}m`,
          isOffPeak: activeWindow.isOffPeak,
          skillsProcessed: targetQueue.length,
          championsTested: targetQueue.filter((q) => q.stage === 'champion').length,
          avgScoreBefore: 94.2,
          avgScoreAfter: 95.6,
          passRate: 98.9,
          computeSavingsPercent: activeWindow.isOffPeak ? 68.4 : 0.0,
          status: 'completed',
          summaryLog: `Exhaustive ${activeWindow.syntheticIterations} test rounds executed across ${targetQueue.length} skills with ${workerCount} worker threads. All champions satisfied threshold gates.`
        };

        setLogs((prev) => [newLog, ...prev]);
        setCompletedRunSummary(newLog);
        setIsExecutingRun(false);

        if (onNotification) {
          onNotification(`Completed scheduled off-peak run for "${activeWindow.name}"! Tested ${targetQueue.length} skills.`);
        }
      } else {
        setExecutionProgress(progress);
        const randItem = targetQueue[Math.floor(Math.random() * targetQueue.length)];
        if (randItem) {
          setActiveWorkerLogs((prev) => [
            ...prev.slice(-5),
            `[WORKER ${Math.floor(Math.random() * workerCount + 1).toString().padStart(2, '0')}] Ran ${Math.floor(progress * 12)} cycles on ${randItem.skillName} (Benchmark: ${randItem.benchmarkScore}%) -> 100% Constraints Passed`
          ]);
        }
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header & Off-Peak HUD */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 shadow-xl relative overflow-hidden">
        {/* Ambient background glow based on off-peak status */}
        <div
          className={`absolute -right-24 -top-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isCurrentTimeOffPeak
              ? 'bg-purple-600/15'
              : 'bg-amber-600/10'
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 rounded-lg bg-stone-800 border border-stone-700 text-purple-400">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Skills Execution Scheduler</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold">
                    Off-Peak Prioritized
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Configure automated evaluation windows to execute high-compute champion cycles during low-cost off-peak compute epochs.
                </p>
              </div>
            </div>

            {/* Current Epoch Indicator */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                  isCurrentTimeOffPeak
                    ? 'bg-purple-950/90 text-purple-200 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'bg-stone-800 text-stone-300 border-stone-700'
                }`}
              >
                {isCurrentTimeOffPeak ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>OFF-PEAK COMPUTE ACTIVE ({currentTimeStr})</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>PEAK OPERATIONAL HOURS ({currentTimeStr})</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setUseSimulatedOffPeakTime(!useSimulatedOffPeakTime)}
                className="text-[11px] font-mono text-stone-400 hover:text-stone-200 underline flex items-center gap-1 transition-colors"
                title="Toggle between simulated off-peak time (02:45 UTC) and real local clock"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{useSimulatedOffPeakTime ? 'Simulated 02:45 UTC (Click for Real UTC)' : 'Real UTC (Click for Simulated Off-Peak)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleResetToBlueprint}
              className="px-3 py-2 text-xs font-mono bg-stone-800/80 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded transition-all hover:border-stone-600 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Reset Blueprint</span>
            </button>

            <button
              onClick={() => handleOpenEditModal()}
              className="px-3.5 py-2 text-xs font-mono bg-stone-800 hover:bg-stone-700 text-purple-300 border border-purple-800/60 rounded font-semibold transition-all hover:border-purple-600 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define Window</span>
            </button>

            <button
              onClick={handleRunSimulatedWindow}
              disabled={isExecutingRun}
              className={`px-4 py-2 text-xs font-mono rounded font-bold transition-all shadow-md flex items-center gap-2 ${
                isExecutingRun
                  ? 'bg-purple-900/50 text-purple-400 border border-purple-700 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30 hover:shadow-purple-900/60'
              }`}
            >
              {isExecutingRun ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                  <span>Executing ({executionProgress}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Off-Peak Cycle Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Execution Telemetry HUD (Displays when running or recently completed) */}
        {(isExecutingRun || completedRunSummary) && (
          <div className="mt-5 pt-5 border-t border-stone-800/80 bg-stone-950/70 p-4 rounded-lg border border-purple-900/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-purple-300 font-semibold">
                <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                <span>
                  {isExecutingRun
                    ? `Live Concurrent Worker Dispatch [Window: ${activeWindow.name}]`
                    : `Completed Off-Peak Evaluation Cycle [${completedRunSummary?.durationFormatted}]`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-stone-400">Concurrency: {activeWindow.concurrencyWorkers} threads</span>
                <span className="text-emerald-400 font-bold">{executionProgress}%</span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${executionProgress}%` }}
              />
            </div>

            {/* Live Thread Activity Feed */}
            <div className="font-mono text-[11px] space-y-1 text-stone-300 bg-stone-900/90 p-2.5 rounded border border-stone-800 max-h-24 overflow-y-auto">
              {activeWorkerLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">›</span>
                  <span className={idx === activeWorkerLogs.length - 1 ? 'text-white font-medium' : 'text-stone-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            {completedRunSummary && !isExecutingRun && (
              <div className="flex items-center justify-between pt-1 text-xs font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{completedRunSummary.summaryLog}</span>
                </div>
                <button
                  onClick={() => setCompletedRunSummary(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
              <span>Active Windows</span>
              <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {metrics.activeCount} <span className="text-xs text-stone-500 font-normal">/ {metrics.totalWindows}</span>
            </div>
            <div className="text-[10px] text-purple-300 flex items-center gap-1 font-mono">
              <span>{metrics.offPeakCount} off-peak reservations</span>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
              <span>Champion Priority Ratio</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono">
              {metrics.championPrioritizationRate}%
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              <span>{metrics.championsInQueue} champions in top queue</span>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
              <span>Off-Peak Arbitrage</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              -{metrics.offPeakComputeSavings}%
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono">
              <span>Cloud compute cost reduction</span>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
              <span>Queued Test Cycles</span>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-indigo-300 font-mono">
              {metrics.totalQueued}
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              <span>Targeting active window</span>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Schedule Timeline */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              24-Hour Execution Horizon & Off-Peak Bands
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-950/80 border border-purple-500/50 inline-block" />
              <span className="text-purple-300">Off-Peak Hours (22:00 - 07:00 UTC)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-stone-800 border border-stone-700 inline-block" />
              <span className="text-stone-400">Peak Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="text-cyan-300">Current Time: {currentTimeStr}</span>
            </div>
          </div>
        </div>

        {/* The 24-Hour Bar */}
        <div className="relative pt-4 pb-2">
          {/* Main Track */}
          <div className="h-14 bg-stone-950 rounded-lg border border-stone-800 relative overflow-hidden flex">
            {/* 24 hour segments */}
            {Array.from({ length: 24 }).map((_, h) => {
              const isOffPeak = h >= 22 || h < 7;
              return (
                <div
                  key={h}
                  className={`flex-1 border-r border-stone-800/50 relative group transition-colors ${
                    isOffPeak ? 'bg-purple-950/25 hover:bg-purple-950/40' : 'bg-stone-900/30 hover:bg-stone-800/40'
                  }`}
                  title={`${h.toString().padStart(2, '0')}:00 UTC - ${isOffPeak ? 'Off-Peak Hours (High Priority)' : 'Peak Hours'}`}
                >
                  <span className="absolute bottom-1 left-1 text-[9px] font-mono text-stone-600 group-hover:text-stone-400">
                    {h}h
                  </span>
                </div>
              );
            })}

            {/* Scheduled Window Blocks Placed Across the 24h Bar */}
            {windows
              .filter((w) => w.enabled)
              .map((w) => {
                const [startH, startM] = w.startTime.split(':').map(Number);
                const [endH, endM] = w.endTime.split(':').map(Number);
                
                const startPercent = ((startH * 60 + startM) / 1440) * 100;
                let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                if (durationMinutes <= 0) durationMinutes += 1440; // overnight wrap
                const widthPercent = Math.min((durationMinutes / 1440) * 100, 100 - startPercent);

                const isSelected = w.id === selectedWindowId;

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWindowId(w.id)}
                    className={`absolute top-2 bottom-2 rounded cursor-pointer transition-all flex items-center px-2 z-10 overflow-hidden border ${
                      isSelected
                        ? 'bg-purple-600/90 border-purple-300 text-white shadow-lg ring-2 ring-purple-400'
                        : w.isOffPeak
                        ? 'bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border-indigo-500/70'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-600'
                    }`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${Math.max(widthPercent, 5)}%`
                    }}
                    title={`${w.name} (${w.startTime} - ${w.endTime}) · Click to select`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {w.prioritizeChampions ? (
                        <Trophy className="w-3 h-3 text-amber-300 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono font-bold truncate">
                        {w.name}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Current Time Indicator Line */}
            {currentHourNumber !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20 pointer-events-none"
                style={{ left: `${(currentHourNumber / 24) * 100}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 -ml-1 -top-1 absolute shadow-sm" />
              </div>
            )}
          </div>

          {/* Time axis legend */}
          <div className="flex justify-between text-[10px] font-mono text-stone-500 pt-1.5 px-0.5">
            <span>00:00 UTC (Midnight)</span>
            <span>06:00 UTC (Dawn)</span>
            <span>12:00 UTC (Midday)</span>
            <span>18:00 UTC (Dusk)</span>
            <span>23:59 UTC</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Execution Windows Manager, Right = Prioritized Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Windows Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Execution Windows ({windows.length})
              </h3>
            </div>
            <button
              onClick={() => handleOpenEditModal()}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Window</span>
            </button>
          </div>

          <div className="space-y-3">
            {windows.map((win) => {
              const isSelected = win.id === selectedWindowId;
              return (
                <div
                  key={win.id}
                  onClick={() => setSelectedWindowId(win.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-stone-900 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{win.name}</span>
                        {win.isOffPeak && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                            <Moon className="w-2.5 h-2.5" />
                            Off-Peak
                          </span>
                        )}
                        {win.prioritizeChampions && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5" />
                            Champions First
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                        {win.description}
                      </p>
                    </div>

                    {/* Window Controls */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleWindow(win.id)}
                        className={`p-1.5 rounded transition-colors ${
                          win.enabled
                            ? 'text-emerald-400 hover:bg-emerald-950/60'
                            : 'text-stone-600 hover:bg-stone-800'
                        }`}
                        title={win.enabled ? 'Click to Pause' : 'Click to Enable'}
                      >
                        {win.enabled ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(win)}
                        className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
                        title="Edit Window Settings"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWindow(win.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors"
                        title="Delete Window"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Window Details Badges */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span className="text-white font-medium">{win.startTime} - {win.endTime} UTC</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Cpu className="w-3 h-3 text-stone-500" />
                      <span>{win.concurrencyWorkers} Workers · {win.syntheticIterations} cycles</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Threshold: ≥ {win.minScoreThreshold}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Flame className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-300">{win.intensity}</span>
                    </div>
                  </div>

                  {/* Active Days indicator */}
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-mono">
                    {DAY_LABELS.map((label, idx) => {
                      const isActiveDay = win.daysOfWeek.includes(idx);
                      return (
                        <span
                          key={idx}
                          className={`px-1.5 py-0.5 rounded ${
                            isActiveDay
                              ? 'bg-stone-800 text-stone-200 font-bold border border-stone-700'
                              : 'text-stone-600'
                          }`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Champion-Prioritized Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Prioritized Execution Queue for "{activeWindow?.name || 'Selected Window'}"
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-stone-400">Showing {filteredQueue.length} jobs</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-stone-900 border border-stone-800 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono text-stone-400 shrink-0">Stage:</span>
              <select
                value={queueStageFilter}
                onChange={(e) => setQueueStageFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 px-2.5 py-1.5 rounded focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Stages</option>
                <option value="champion">Champions Only (P1 & P2)</option>
                <option value="testing">Testing Stage</option>
                <option value="training">In-Training Contenders</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Search queue by skill name or code..."
              value={queueSearchQuery}
              onChange={(e) => setQueueSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 px-3 py-1.5 rounded focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Prioritized Queue List */}
          <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden divide-y divide-stone-800/80">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-white">No Skills Match Priority Filter</div>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Adjust stage filters or window threshold gates to populate the queue for this execution window.
                </p>
              </div>
            ) : (
              filteredQueue.map((item, index) => {
                const matchingSkill = skills.find((s) => s.id === item.skillId);
                const isChampion = item.stage === 'champion';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors hover:bg-stone-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isChampion ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Priority Rank & Details */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          index === 0
                            ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : index < 3
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                        title={`Queue Priority Rank #${index + 1}`}
                      >
                        #{index + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white hover:text-purple-300 transition-colors cursor-pointer"
                            onClick={() => matchingSkill && onInspectSkill && onInspectSkill(matchingSkill)}
                          >
                            {item.skillName}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            {item.skillCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
                              item.priorityTier.startsWith('P1')
                                ? 'bg-amber-500 text-black'
                                : item.priorityTier.startsWith('P2')
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {item.priorityTier}
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-400 flex items-center gap-2 font-mono flex-wrap">
                          <span className="text-purple-300">Slot: {item.allocatedSlot}</span>
                          <span>·</span>
                          <span>{item.stressScenario}</span>
                          <span>·</span>
                          <span className="text-stone-500">{item.testCasesCount} Test Cases</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Score & Quick Action */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-white flex items-center justify-end gap-1">
                          <span className={item.benchmarkScore >= 95 ? 'text-amber-400' : 'text-emerald-400'}>
                            {item.benchmarkScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-stone-500 uppercase">
                          {item.stage}
                        </div>
                      </div>

                      {matchingSkill && (
                        <button
                          onClick={() => onInspectSkill && onInspectSkill(matchingSkill)}
                          className="px-2.5 py-1 text-xs font-mono bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded border border-stone-700 transition-all flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Historical Execution Logs Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Scheduler Execution Audit Log (Past Cycles)
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {logs.length} Recorded Runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 text-[11px] bg-stone-950/60">
                <th className="p-3">Window Name</th>
                <th className="p-3">Executed At</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Champions Tested</th>
                <th className="p-3">Avg Fitness Δ</th>
                <th className="p-3">Pass Rate</th>
                <th className="p-3">Compute Arbitrage</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-1.5">
                    {log.isOffPeak && <Moon className="w-3 h-3 text-purple-400 shrink-0" />}
                    <span>{log.windowName}</span>
                  </td>
                  <td className="p-3 text-stone-400">{log.executedAt}</td>
                  <td className="p-3">{log.durationFormatted}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      {log.championsTested} Champions
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">
                    {log.avgScoreBefore}% → {log.avgScoreAfter}%
                  </td>
                  <td className="p-3 text-white font-semibold">
                    {log.passRate}%
                  </td>
                  <td className="p-3 text-emerald-300">
                    {log.computeSavingsPercent > 0 ? `-${log.computeSavingsPercent}% cost` : 'Peak'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Execution Window Modal */}
      {isModalOpen && editingWindow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-lg max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingWindow.id.startsWith('win-') ? 'Edit Execution Window' : 'Define New Execution Window'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-stone-300 font-bold">Window Name</label>
                <input
                  type="text"
                  value={editingWindow.name}
                  onChange={(e) => setEditingWindow({ ...editingWindow, name: e.target.value })}
                  placeholder="e.g. Nightly Champion Apex Gauntlet"
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-stone-300 font-bold">Description & Purpose</label>
                <textarea
                  rows={2}
                  value={editingWindow.description}
                  onChange={(e) => setEditingWindow({ ...editingWindow, description: e.target.value })}
                  placeholder="Describe the objective and priority rules..."
                  className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Time Window & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Start Time (24h UTC)</label>
                  <input
                    type="time"
                    value={editingWindow.startTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditingWindow({
                        ...editingWindow,
                        startTime: newStart,
                        isOffPeak: isHourOffPeak(newStart)
                      });
                    }}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">End Time (24h UTC)</label>
                  <input
                    type="time"
                    value={editingWindow.endTime}
                    onChange={(e) => setEditingWindow({ ...editingWindow, endTime: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Timezone</label>
                  <select
                    value={editingWindow.timezone}
                    onChange={(e) => setEditingWindow({ ...editingWindow, timezone: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="EST">EST (New York)</option>
                    <option value="PST">PST (San Francisco)</option>
                    <option value="CET">CET (Frankfurt / Zurich)</option>
                  </select>
                </div>
              </div>

              {/* Off-Peak & Champion Prioritization Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-950/80 rounded border border-stone-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWindow.isOffPeak}
                    onChange={(e) => setEditingWindow({ ...editingWindow, isOffPeak: e.target.checked })}
                    className="rounded border-stone-700 text-purple-600 focus:ring-purple-500 bg-stone-900"
                  />
                  <div>
                    <span className="text-white font-bold block">Classify as Off-Peak</span>
                    <span className="text-[10px] text-stone-400">Enables high-concurrency cloud compute discount</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWindow.prioritizeChampions}
                    onChange={(e) => setEditingWindow({ ...editingWindow, prioritizeChampions: e.target.checked })}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 bg-stone-900"
                  />
                  <div>
                    <span className="text-white font-bold block">Prioritize Champions (≥94%)</span>
                    <span className="text-[10px] text-stone-400">Ranks highest-fitness skills first in execution slots</span>
                  </div>
                </label>
              </div>

              {/* Sliders: Concurrency Workers & Score Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-stone-300 font-bold">Concurrency Workers</label>
                    <span className="text-purple-400 font-bold">{editingWindow.concurrencyWorkers} threads</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={editingWindow.concurrencyWorkers}
                    onChange={(e) => setEditingWindow({ ...editingWindow, concurrencyWorkers: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-stone-300 font-bold">Min Score Filter</label>
                    <span className="text-amber-400 font-bold">≥ {editingWindow.minScoreThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="98"
                    value={editingWindow.minScoreThreshold}
                    onChange={(e) => setEditingWindow({ ...editingWindow, minScoreThreshold: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Intensity & Iterations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Testing Intensity</label>
                  <select
                    value={editingWindow.intensity}
                    onChange={(e) => setEditingWindow({ ...editingWindow, intensity: e.target.value as WindowIntensity })}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Light">Light (Canary Smoke)</option>
                    <option value="Standard">Standard (Regression Suite)</option>
                    <option value="Deep Stress">Deep Stress (1,000+ Combinatorial Scenarios)</option>
                    <option value="Adversarial Rigor">Adversarial Rigor (Deception & Hallucination Injections)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Synthetic Iterations</label>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    step="50"
                    value={editingWindow.syntheticIterations}
                    onChange={(e) => setEditingWindow({ ...editingWindow, syntheticIterations: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 px-3 py-2 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div className="space-y-1">
                <label className="text-stone-300 font-bold">Active Days of Week</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, idx) => {
                    const isSelected = editingWindow.daysOfWeek.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? editingWindow.daysOfWeek.filter((d) => d !== idx)
                            : [...editingWindow.daysOfWeek, idx].sort();
                          setEditingWindow({ ...editingWindow, daysOfWeek: newDays });
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-900 text-purple-200 border-purple-500 shadow-sm'
                            : 'bg-stone-950 text-stone-500 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-mono text-stone-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalWindow}
                className="px-5 py-2 text-xs font-mono bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-all shadow-md"
              >
                Save Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
