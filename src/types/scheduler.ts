import { SkillEvolutionStage, VectorCategory } from './skills';

export type WindowIntensity = 'Light' | 'Standard' | 'Deep Stress' | 'Adversarial Rigor';

export interface ExecutionWindow {
  id: string;
  name: string;
  description: string;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  timezone: string;  // e.g. "UTC", "EST", "PST", "CET"
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  enabled: boolean;
  isOffPeak: boolean;
  prioritizeChampions: boolean;
  minScoreThreshold: number; // e.g. 92
  concurrencyWorkers: number; // e.g. 8
  intensity: WindowIntensity;
  targetStages: SkillEvolutionStage[];
  targetVectors?: VectorCategory[];
  syntheticIterations: number;
  autoPromoteOnPass: boolean;
  notes?: string;
}

export type QueuePriorityTier = 
  | 'P1 - Champion Apex' 
  | 'P2 - Champion Elite' 
  | 'P3 - High Contender (90-94%)' 
  | 'P4 - Standard Evaluation';

export interface ScheduledSkillQueueItem {
  id: string;
  windowId: string;
  windowName: string;
  skillId: string;
  skillName: string;
  skillCode: string;
  stage: SkillEvolutionStage;
  benchmarkScore: number;
  priorityScore: number;
  priorityTier: QueuePriorityTier;
  allocatedSlot: string; // e.g. "01:15 UTC"
  status: 'queued' | 'running' | 'completed' | 'skipped';
  testCasesCount: number;
  stressScenario: string;
  executionResult?: {
    scoreDelta: number;
    scoreAfter: number;
    passRate: number;
    durationMs: number;
    verdict: 'CONFIRMED_CHAMPION' | 'STABLE' | 'MUTATION_DRIFT' | 'ELEVATION_FLAGGED';
    summary: string;
    completedAt: string;
  };
}

export interface SchedulerRunLog {
  id: string;
  windowId: string;
  windowName: string;
  executedAt: string;
  durationFormatted: string;
  isOffPeak: boolean;
  skillsProcessed: number;
  championsTested: number;
  avgScoreBefore: number;
  avgScoreAfter: number;
  passRate: number;
  computeSavingsPercent: number;
  status: 'completed' | 'running' | 'interrupted';
  summaryLog: string;
}

export interface SchedulerMetrics {
  totalWindows: number;
  activeWindows: number;
  offPeakWindows: number;
  totalQueuedJobs: number;
  championPrioritizationRate: number; // e.g. 78%
  offPeakComputeSavings: number; // e.g. 62%
  lastRunTimestamp: string;
}
