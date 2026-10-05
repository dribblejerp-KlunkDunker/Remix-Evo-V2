/**
 * Evolution engine configuration.
 *
 * Every number here is a lever on how the population behaves. Defaults are
 * deliberately conservative on cost — a single tick with these settings costs
 * roughly 6-12 model calls.
 */

export interface EvolutionConfig {
  /** Milliseconds between autonomous ticks. */
  tickIntervalMs: number;
  /** Whether the loop starts automatically when the server boots. */
  autoStart: boolean;

  // ---- Population shape -------------------------------------------------
  /** Hard cap on live (non-retired) skills. */
  maxPopulation: number;
  /** Below this, the engine prioritises generating new ideas. */
  minPopulation: number;
  /** Champions are never culled by population pressure up to this count. */
  eliteReserve: number;
  /** Max live skills sharing a primary vector, to stop lineage collapse. */
  maxPerVectorNiche: number;
  /**
   * Retired skills kept beyond those still needed as lineage ancestors.
   *
   * Retired skills are never deleted on retirement because the lineage graph
   * needs them. But an engine running for days retires far more than it keeps
   * alive, and without a ceiling the snapshot grows forever and every scan over
   * the population gets slower.
   */
  retiredRetention: number;
  /**
   * Max non-champion skills in flight at once.
   *
   * This is the throughput governor. Variation produces roughly one genome per
   * tick while each phase evaluates a bounded number, so without a work-in-
   * progress cap the pipeline fills faster than it drains: every skill ends up
   * starved of the repeated evaluations that promotion requires, and nothing is
   * ever promoted. Keep this low relative to evaluationsPerTick.
   */
  maxDevelopmentWip: number;
  /** Evaluations each of the testing and training phases may run per tick. */
  evaluationsPerTick: number;
  /** Conflict comparisons per tick. Each is one judge call. */
  conflictChecksPerTick: number;

  // ---- Promotion / demotion gates --------------------------------------
  /** Score a skill must reach to be eligible for champion status. */
  championThreshold: number;
  /** Evaluations on held-out scenarios required before promotion. */
  promotionMinHoldoutRuns: number;
  /** Floor on distinct held-out scenarios required before promotion. */
  promotionMinDistinctScenarios: number;
  /**
   * Share of the held-out scenarios RELEVANT TO THE SKILL that it must have been
   * evaluated on. An absolute count meant different things for different
   * skills: with four held-out scenarios and a gate of four, every skill had to
   * clear all of them, including ones outside its field.
   */
  promotionDistinctFraction: number;
  /** Max standard deviation across those runs. High variance = not stable. */
  promotionMaxStdDev: number;
  /** Max tolerated hallucination rate (percent) for promotion. */
  promotionMaxHallucinationRate: number;
  /** A champion falling below this on regression testing is demoted. */
  demotionThreshold: number;
  /** Consecutive sub-threshold regression runs before a champion is demoted. */
  demotionPatience: number;

  // ---- Stage transitions ------------------------------------------------
  /** Successful training refinements before a skill enters testing. */
  trainingRunsToGraduate: number;
  /** Score floor an idea must clear on its smoke test to enter training. */
  ideaSmokeTestFloor: number;
  /** Evaluations a skill gets before extinction is considered. */
  extinctionGracePeriod: number;
  /** Mean score below which a skill is retired after the grace period. */
  extinctionFloor: number;

  // ---- Variation --------------------------------------------------------
  /** Probability a variation step is crossover rather than mutation. */
  crossoverRate: number;
  /** Tournament size for parent selection. */
  tournamentSize: number;
  /**
   * How mutation treats the parent.
   *
   * 'in-place'  — the genome is overwritten. Hill-climbing: one lineage, one
   *               node, no ancestry edge. Cheapest, but a lineage that walks
   *               into a local optimum cannot walk back out.
   * 'branching' — the child is added as a new skill and the parent survives.
   *               Both compete; selection decides. Explores more and produces
   *               real mutation edges in the lineage graph, at the cost of
   *               filling the evaluation pipeline faster.
   */
  mutationStrategy: 'in-place' | 'branching';
  /** Fraction of scenarios reserved as held-out (never used in training). */
  holdoutFraction: number;

  // ---- Budget governor --------------------------------------------------
  /** Max model calls per rolling hour across the whole engine. */
  maxCallsPerHour: number;
  /** Max concurrent model calls. */
  maxConcurrency: number;
  /** Stop spending when the hourly budget is this close to exhausted. */
  budgetReservePct: number;

  // ---- Models -----------------------------------------------------------
  /** Model used to execute a skill against a scenario. */
  executorModel: string;
  /** Model used to grade an execution. Kept separate from the executor. */
  judgeModel: string;
  /** Model used for genome operations (proposal, mutation, crossover). */
  architectModel: string;

  /** Per-request timeout. A hung call would otherwise hold a concurrency slot. */
  requestTimeoutMs: number;
  /**
   * Consecutive auth failures before the engine pauses itself.
   *
   * A bad or revoked key makes every call fail identically. Without this the
   * loop spins forever, filling the event log with the same error.
   */
  authFailureLimit: number;
}

export const DEFAULT_CONFIG: EvolutionConfig = {
  tickIntervalMs: 90_000,
  autoStart: process.env.EVOLUTION_AUTOSTART === 'true',

  maxPopulation: 48,
  minPopulation: 12,
  eliteReserve: 8,
  maxPerVectorNiche: 6,
  retiredRetention: 60,
  maxDevelopmentWip: 12,
  evaluationsPerTick: 2,
  conflictChecksPerTick: 2,

  championThreshold: 95.0,
  promotionMinHoldoutRuns: 6,
  promotionMinDistinctScenarios: 2,
  promotionDistinctFraction: 0.75,
  promotionMaxStdDev: 4.0,
  promotionMaxHallucinationRate: 1.5,
  demotionThreshold: 91.0,
  demotionPatience: 3,

  trainingRunsToGraduate: 4,
  ideaSmokeTestFloor: 55.0,
  extinctionGracePeriod: 8,
  extinctionFloor: 62.0,

  crossoverRate: 0.35,
  tournamentSize: 3,
  mutationStrategy: 'branching',
  holdoutFraction: 0.35,

  maxCallsPerHour: 1000,
  maxConcurrency: 6,
  budgetReservePct: 0.05,

  // Verified against the live model list (Sept 2026). The 2.5 series is on a
  // shutdown path — access is restricted to projects with prior usage and the
  // models retire in October 2026 — so they are not usable defaults.
  // Executor and judge are deliberately different generations: same-model
  // grading shares blind spots with the thing it is grading.
  executorModel: 'gemini-3.6-flash',
  judgeModel: 'gemini-3.8-flash',
  architectModel: 'gemini-3.8-flash',

  requestTimeoutMs: 90_000,
  authFailureLimit: 3,
};

/** Overlay environment variables onto the defaults. */
export function loadConfig(): EvolutionConfig {
  const cfg = { ...DEFAULT_CONFIG };
  const num = (key: string, current: number) => {
    const raw = process.env[key];
    if (!raw) return current;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : current;
  };

  if (process.env.EVOLUTION_AUTOSTART !== undefined) {
    cfg.autoStart = process.env.EVOLUTION_AUTOSTART === 'true';
  }

  cfg.tickIntervalMs = num('EVOLUTION_TICK_MS', cfg.tickIntervalMs);
  cfg.maxPopulation = num('EVOLUTION_MAX_POPULATION', cfg.maxPopulation);
  cfg.maxDevelopmentWip = num('EVOLUTION_MAX_WIP', cfg.maxDevelopmentWip);
  cfg.retiredRetention = num('EVOLUTION_RETIRED_RETENTION', cfg.retiredRetention);
  cfg.evaluationsPerTick = num('EVOLUTION_EVALS_PER_TICK', cfg.evaluationsPerTick);
  if (process.env.EVOLUTION_MUTATION_STRATEGY === 'in-place') cfg.mutationStrategy = 'in-place';
  if (process.env.EVOLUTION_MUTATION_STRATEGY === 'branching') cfg.mutationStrategy = 'branching';
  cfg.championThreshold = num('EVOLUTION_CHAMPION_THRESHOLD', cfg.championThreshold);
  cfg.maxCallsPerHour = num('EVOLUTION_MAX_CALLS_PER_HOUR', cfg.maxCallsPerHour);
  cfg.maxConcurrency = num('EVOLUTION_MAX_CONCURRENCY', cfg.maxConcurrency);
  cfg.requestTimeoutMs = num('EVOLUTION_REQUEST_TIMEOUT_MS', cfg.requestTimeoutMs);

  if (process.env.EVOLUTION_EXECUTOR_MODEL) cfg.executorModel = process.env.EVOLUTION_EXECUTOR_MODEL;
  if (process.env.EVOLUTION_JUDGE_MODEL) cfg.judgeModel = process.env.EVOLUTION_JUDGE_MODEL;
  if (process.env.EVOLUTION_ARCHITECT_MODEL) cfg.architectModel = process.env.EVOLUTION_ARCHITECT_MODEL;

  return cfg;
}
