/**
 * Persistence for the evolution engine.
 *
 * The population is small (tens of skills) and writes are bursty, so this uses
 * an atomic JSON snapshot rather than a database. Everything sits behind the
 * EvolutionStore interface so swapping in SQLite or Firestore later means
 * writing one new class, not touching the engine.
 *
 * Two files are written under workspace/evolution/:
 *   state.json   — current population + counters (rewritten atomically)
 *   events.jsonl — append-only activity log (never rewritten)
 */

import fs from 'fs';
import path from 'path';
import type { AgentSkill } from '../../src/types/skills.ts';
import type { SkillConflictPair } from '../../src/types/skillConflicts.ts';
import type { MeasuredCognitiveMetrics } from './cognition.ts';

/**
 * A retained execution, kept so two skills' conclusions on the same scenario can
 * be compared later. Truncated and capped — this is a comparison buffer, not an
 * archive.
 */
export interface StoredOutput {
  scenarioId: string;
  output: string;
  score: number;
  timestamp: string;
}

export interface SkillRuntime {
  /** Rolling evaluation history, newest last. Capped at 200 entries. */
  evaluations: EvaluationRecord[];
  /** Scenario ids this skill has been trained on (excluded from promotion maths). */
  trainedScenarioIds: string[];
  /** Consecutive regression failures, used for champion demotion. */
  consecutiveRegressionFailures: number;
  /** Training refinements applied since entering the training stage. */
  trainingRefinements: number;
  /** Most recent executions, for cross-skill conflict comparison. */
  recentOutputs?: StoredOutput[];
  /**
   * The skill's very first evaluation, retained independently of the rolling
   * window. The audit baseline reads this; taking it from evaluations[0] means
   * the baseline silently rises once trimming drops the oldest record, and every
   * improvement delta shrinks toward zero without anything looking wrong.
   */
  baseline?: { score: number; timestamp: string };
  /** Set when the skill is culled; retired skills stay on disk for lineage. */
  retiredAt?: string;
  retiredReason?: string;
}

export interface EvaluationRecord {
  scenarioId: string;
  scenarioName: string;
  /** True when the scenario came from the held-out split. */
  holdout: boolean;
  score: number;
  ruleCompliance: number;
  hallucinationFlags: number;
  criticalViolations: number;
  timestamp: string;
  /** Model call cost, for the budget report. */
  callsUsed: number;
  /** Measured execution telemetry. Absent on records written before it existed. */
  cognitive?: MeasuredCognitiveMetrics;
}

export interface EvolutionEvent {
  id: string;
  timestamp: string;
  type:
    | 'idea_generated'
    | 'training_refined'
    | 'evaluation'
    | 'champion_promoted'
    | 'champion_demoted'
    | 'skill_retired'
    | 'crossover'
    | 'mutation'
    | 'benchmark_run'
    | 'tick_start'
    | 'tick_complete'
    | 'budget_throttled'
    | 'error';
  skillId?: string;
  skillCode: string;
  message: string;
  status: 'success' | 'progress' | 'warning' | 'error';
  detail?: Record<string, unknown>;
}

export interface EngineCounters {
  tickCount: number;
  dailyMutations: number;
  championsTestedToday: number;
  totalEvaluations: number;
  totalModelCalls: number;
  /** ISO date string; counters above reset when the day rolls over. */
  countersDay: string;
  generationEpoch: number;
}

export interface EvolutionSnapshot {
  version: 1;
  skills: AgentSkill[];
  runtime: Record<string, SkillRuntime>;
  counters: EngineCounters;
  holdoutScenarioIds: string[];
  /** Detected contradictions between live skills. */
  conflicts?: SkillConflictPair[];
  /** Comparisons already judged, so a clean pair is not re-checked until an output changes. */
  checkedComparisons?: string[];
  updatedAt: string;
}

export interface EvolutionStore {
  load(): Promise<EvolutionSnapshot | null>;
  save(snapshot: EvolutionSnapshot): Promise<void>;
  appendEvent(event: EvolutionEvent): Promise<void>;
  readEvents(limit: number): Promise<EvolutionEvent[]>;
}

/**
 * Rolling window per skill. Nothing reads further back than this: fitness uses
 * an EWMA and a variance over recent runs, the heatmap groups by scenario, and
 * the audit baseline is stored separately. 200 was simply generous, and at 48
 * live skills it put megabytes into a snapshot rewritten every 1.5 seconds.
 */
const MAX_EVALUATIONS_PER_SKILL = 80;
const MAX_RETAINED_OUTPUTS = 4;
/** What a retired skill keeps. It is only read for lineage context. */
const RETIRED_EVALUATIONS_KEPT = 5;

export function trimRuntime(runtime: SkillRuntime): SkillRuntime {
  // Capture the baseline before any trimming can discard it.
  const baseline =
    runtime.baseline ??
    (runtime.evaluations.length > 0
      ? { score: runtime.evaluations[0].score, timestamp: runtime.evaluations[0].timestamp }
      : undefined);

  const outputs = runtime.recentOutputs ?? [];
  if (
    baseline === runtime.baseline &&
    runtime.evaluations.length <= MAX_EVALUATIONS_PER_SKILL &&
    outputs.length <= MAX_RETAINED_OUTPUTS
  ) {
    return runtime;
  }
  return {
    ...runtime,
    baseline,
    evaluations: runtime.evaluations.slice(-MAX_EVALUATIONS_PER_SKILL),
    recentOutputs: outputs.slice(-MAX_RETAINED_OUTPUTS),
  };
}

/**
 * Shrink a skill's runtime on retirement.
 *
 * A retired skill is kept only as a lineage ancestor. Its per-evaluation detail
 * is read by nothing — every projection filters retired skills out — so holding
 * eighty records and four full execution transcripts for each one is pure
 * snapshot weight.
 */
export function compressRetiredRuntime(runtime: SkillRuntime): SkillRuntime {
  return {
    ...runtime,
    baseline:
      runtime.baseline ??
      (runtime.evaluations.length > 0
        ? { score: runtime.evaluations[0].score, timestamp: runtime.evaluations[0].timestamp }
        : undefined),
    evaluations: runtime.evaluations.slice(-RETIRED_EVALUATIONS_KEPT),
    recentOutputs: [],
  };
}

export class FileEvolutionStore implements EvolutionStore {
  private readonly dir: string;
  private readonly statePath: string;
  private readonly eventsPath: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private pending: EvolutionSnapshot | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(baseDir = path.join(process.cwd(), 'workspace', 'evolution')) {
    this.dir = baseDir;
    this.statePath = path.join(baseDir, 'state.json');
    this.eventsPath = path.join(baseDir, 'events.jsonl');
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async load(): Promise<EvolutionSnapshot | null> {
    if (!fs.existsSync(this.statePath)) return null;
    try {
      const raw = await fs.promises.readFile(this.statePath, 'utf-8');
      const parsed = JSON.parse(raw) as EvolutionSnapshot;
      if (parsed.version !== 1) {
        console.warn(`[evolution/store] unknown snapshot version ${parsed.version}, ignoring`);
        return null;
      }
      return parsed;
    } catch (err) {
      // A corrupt snapshot should not take the server down. Quarantine it so
      // the engine can cold-start while the bad file stays recoverable.
      const quarantine = `${this.statePath}.corrupt-${Date.now()}`;
      try {
        await fs.promises.rename(this.statePath, quarantine);
        console.error(`[evolution/store] corrupt snapshot moved to ${quarantine}`, err);
      } catch {
        console.error('[evolution/store] corrupt snapshot could not be quarantined', err);
      }
      return null;
    }
  }

  /**
   * Debounced atomic save. Multiple calls inside the window collapse into one
   * write; the write itself goes to a temp file and is renamed, so a crash
   * mid-write can never leave a half-serialised snapshot on disk.
   */
  async save(snapshot: EvolutionSnapshot): Promise<void> {
    this.pending = snapshot;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      const toWrite = this.pending;
      this.pending = null;
      if (!toWrite) return;
      this.writeQueue = this.writeQueue.then(() => this.writeSnapshot(toWrite)).catch((err) => {
        console.error('[evolution/store] snapshot write failed', err);
      });
    }, 1500);
  }

  /** Force an immediate write, bypassing the debounce. Used on shutdown. */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const toWrite = this.pending;
    this.pending = null;
    if (toWrite) {
      this.writeQueue = this.writeQueue.then(() => this.writeSnapshot(toWrite));
    }
    await this.writeQueue;
  }

  private async writeSnapshot(snapshot: EvolutionSnapshot): Promise<void> {
    const tmp = `${this.statePath}.tmp-${process.pid}`;
    await fs.promises.writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf-8');
    await fs.promises.rename(tmp, this.statePath);
  }

  async appendEvent(event: EvolutionEvent): Promise<void> {
    try {
      await fs.promises.appendFile(this.eventsPath, `${JSON.stringify(event)}\n`, 'utf-8');
    } catch (err) {
      console.error('[evolution/store] event append failed', err);
    }
  }

  async readEvents(limit: number): Promise<EvolutionEvent[]> {
    if (!fs.existsSync(this.eventsPath)) return [];
    try {
      const raw = await fs.promises.readFile(this.eventsPath, 'utf-8');
      const lines = raw.split('\n').filter(Boolean);
      const tail = lines.slice(-limit);
      const events: EvolutionEvent[] = [];
      for (const line of tail) {
        try {
          events.push(JSON.parse(line) as EvolutionEvent);
        } catch {
          // Skip a torn line rather than failing the whole read.
        }
      }
      return events.reverse();
    } catch (err) {
      console.error('[evolution/store] event read failed', err);
      return [];
    }
  }
}
