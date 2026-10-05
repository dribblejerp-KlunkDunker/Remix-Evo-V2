/**
 * Fitness, promotion gates, and selection pressure.
 *
 * The central rule: a skill is promoted on held-out scenarios only. Scores from
 * scenarios it was refined against are used for training signal and displayed,
 * but they never count toward championship. Mixing the two is how you end up
 * with a population of 99% scorers that fall over on anything unfamiliar.
 */

import type { AgentSkill, VectorCategory } from '../../src/types/skills.ts';
import type { EvolutionConfig } from './config.ts';
import type { EvaluationRecord, SkillRuntime } from './store.ts';

export interface FitnessSummary {
  /** Mean across held-out evaluations only. The number that gates promotion. */
  holdoutMean: number;
  /** Mean across every evaluation. Shown in the UI as benchmarkScore. */
  overallMean: number;
  /** Exponentially weighted mean, so recent generations dominate. */
  ewma: number;
  holdoutStdDev: number;
  holdoutRuns: number;
  distinctHoldoutScenarios: number;
  hallucinationRate: number;
  ruleComplianceMean: number;
  /** Fraction of all evaluations at or above the skill's threshold. */
  winRate: number;
  /** 0-100; high means consistent. Derived from inverse variance. */
  stabilityIndex: number;
  totalEvaluations: number;
}

const EWMA_ALPHA = 0.3;

export function summariseFitness(runtime: SkillRuntime, threshold: number): FitnessSummary {
  const all = runtime.evaluations;
  if (all.length === 0) {
    return {
      holdoutMean: 0,
      overallMean: 0,
      ewma: 0,
      holdoutStdDev: 0,
      holdoutRuns: 0,
      distinctHoldoutScenarios: 0,
      hallucinationRate: 0,
      ruleComplianceMean: 100,
      winRate: 0,
      stabilityIndex: 0,
      totalEvaluations: 0,
    };
  }

  // A scenario the skill was refined against can never count as held-out
  // evidence, whatever the record says. Tagging happens at evaluation time; this
  // guards against a split change, a branched child inheriting its parent's
  // training, or any future path that tags wrongly.
  const trained = new Set(runtime.trainedScenarioIds);
  const holdout = all.filter((e) => e.holdout && !trained.has(e.scenarioId));
  const holdoutScores = holdout.map((e) => e.score);
  const allScores = all.map((e) => e.score);

  const overallMean = mean(allScores);
  const holdoutMean = holdoutScores.length ? mean(holdoutScores) : 0;
  const holdoutStdDev = stdDev(holdoutScores);

  let ewma = allScores[0];
  for (let i = 1; i < allScores.length; i++) {
    ewma = EWMA_ALPHA * allScores[i] + (1 - EWMA_ALPHA) * ewma;
  }

  const totalFlags = all.reduce((sum, e) => sum + e.hallucinationFlags, 0);
  // Flags per evaluation, expressed as a percentage rate.
  const hallucinationRate = (totalFlags / all.length) * 100;

  const wins = all.filter((e) => e.score >= threshold).length;
  const variance = stdDev(allScores) ** 2;
  // 12.0 chosen so a stddev of ~3.5 lands near 50. Purely a display scale.
  const stabilityIndex = Math.max(0, Math.min(100, 100 - (variance / 12) * 10));

  return {
    holdoutMean: round1(holdoutMean),
    overallMean: round1(overallMean),
    ewma: round1(ewma),
    holdoutStdDev: round1(holdoutStdDev),
    holdoutRuns: holdout.length,
    distinctHoldoutScenarios: new Set(holdout.map((e) => e.scenarioId)).size,
    hallucinationRate: round1(hallucinationRate),
    ruleComplianceMean: round1(mean(all.map((e) => e.ruleCompliance))),
    winRate: round1((wins / all.length) * 100),
    stabilityIndex: round1(stabilityIndex),
    totalEvaluations: all.length,
  };
}

export interface GateResult {
  passed: boolean;
  /** Every gate, so the UI can show exactly which one is blocking. */
  checks: { name: string; passed: boolean; actual: string; required: string }[];
  blockingReason?: string;
}

/**
 * Promotion gate. All conditions must hold simultaneously — this is deliberately
 * hard to pass. Under the defaults a skill needs six held-out evaluations across
 * at least four distinct scenarios, averaging 95+, with low variance and a clean
 * hallucination record. A lucky run cannot produce a champion.
 */
export function evaluatePromotionGate(
  fitness: FitnessSummary,
  cfg: EvolutionConfig,
  threshold: number,
  /** Held-out scenarios sharing a vector with this skill. */
  relevantHoldoutCount?: number,
): GateResult {
  // Without a relevant count, fall back to the floor — used by callers that only
  // need a coarse answer and by tests exercising the gate in isolation.
  const relevant = relevantHoldoutCount ?? cfg.promotionMinDistinctScenarios;
  const requiredDistinct = Math.min(
    relevant,
    Math.max(cfg.promotionMinDistinctScenarios, Math.ceil(relevant * cfg.promotionDistinctFraction)),
  );

  const checks = [
    {
      name: 'Held-out mean score',
      passed: fitness.holdoutMean >= threshold,
      actual: `${fitness.holdoutMean}%`,
      required: `>= ${threshold}%`,
    },
    {
      name: 'Held-out evaluation count',
      passed: fitness.holdoutRuns >= cfg.promotionMinHoldoutRuns,
      actual: `${fitness.holdoutRuns}`,
      required: `>= ${cfg.promotionMinHoldoutRuns}`,
    },
    {
      name: 'Distinct held-out scenarios',
      // A skill with fewer relevant held-out scenarios than the floor cannot be
      // promoted at all — reported as a coverage problem, not a skill problem.
      passed: relevant >= cfg.promotionMinDistinctScenarios && fitness.distinctHoldoutScenarios >= requiredDistinct,
      actual: `${fitness.distinctHoldoutScenarios} of ${relevant} relevant`,
      required:
        relevant < cfg.promotionMinDistinctScenarios
          ? `>= ${cfg.promotionMinDistinctScenarios} relevant scenarios to exist`
          : `>= ${requiredDistinct}`,
    },
    {
      name: 'Score variance',
      passed: fitness.holdoutStdDev <= cfg.promotionMaxStdDev,
      actual: `σ ${fitness.holdoutStdDev}`,
      required: `<= ${cfg.promotionMaxStdDev}`,
    },
    {
      name: 'Hallucination rate',
      passed: fitness.hallucinationRate <= cfg.promotionMaxHallucinationRate,
      actual: `${fitness.hallucinationRate}%`,
      required: `<= ${cfg.promotionMaxHallucinationRate}%`,
    },
  ];

  const failing = checks.find((c) => !c.passed);
  return {
    passed: !failing,
    checks,
    blockingReason: failing ? `${failing.name}: ${failing.actual} (needs ${failing.required})` : undefined,
  };
}

/** Champions are re-tested continuously; sustained regression demotes them. */
export function shouldDemote(
  runtime: SkillRuntime,
  cfg: EvolutionConfig,
): { demote: boolean; reason?: string } {
  if (runtime.consecutiveRegressionFailures >= cfg.demotionPatience) {
    return {
      demote: true,
      reason: `${runtime.consecutiveRegressionFailures} consecutive regression runs below ${cfg.demotionThreshold}%`,
    };
  }
  return { demote: false };
}

export function shouldRetire(
  skill: AgentSkill,
  fitness: FitnessSummary,
  cfg: EvolutionConfig,
): { retire: boolean; reason?: string } {
  if (skill.stage === 'champion') return { retire: false };
  if (fitness.totalEvaluations < cfg.extinctionGracePeriod) return { retire: false };
  if (fitness.ewma < cfg.extinctionFloor) {
    return {
      retire: true,
      reason: `EWMA ${fitness.ewma}% below extinction floor ${cfg.extinctionFloor}% after ${fitness.totalEvaluations} evaluations`,
    };
  }
  return { retire: false };
}

/**
 * Tournament selection. Sampling a small subset and taking its best keeps weak
 * skills occasionally in play, which preserves genetic diversity in a way that
 * always-pick-the-top-two does not.
 */
export function tournamentSelect(
  candidates: { skill: AgentSkill; fitness: FitnessSummary }[],
  size: number,
  exclude: Set<string> = new Set(),
): AgentSkill | null {
  const pool = candidates.filter((c) => !exclude.has(c.skill.id));
  if (pool.length === 0) return null;

  const contestants: typeof pool = [];
  for (let i = 0; i < Math.min(size, pool.length); i++) {
    contestants.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  contestants.sort((a, b) => b.fitness.ewma - a.fitness.ewma);
  return contestants[0].skill;
}

/**
 * Vector niches that are over-subscribed relative to the cap.
 *
 * Without this the population converges: whatever vector wins first gets
 * remixed repeatedly until every skill is a variation of one lineage, and the
 * system stops exploring. Returned niches get culled first under population
 * pressure and are excluded when generating new ideas.
 */
export function oversubscribedNiches(
  skills: AgentSkill[],
  cfg: EvolutionConfig,
): Map<VectorCategory, number> {
  const counts = new Map<VectorCategory, number>();
  for (const skill of skills) {
    const primary = skill.vectors[0];
    if (!primary) continue;
    counts.set(primary, (counts.get(primary) ?? 0) + 1);
  }
  const over = new Map<VectorCategory, number>();
  for (const [vector, count] of counts) {
    if (count > cfg.maxPerVectorNiche) over.set(vector, count);
  }
  return over;
}

/** Vectors with the least representation, to steer new idea generation. */
export function underrepresentedVectors(
  skills: AgentSkill[],
  allVectors: VectorCategory[],
): VectorCategory[] {
  const counts = new Map<VectorCategory, number>();
  for (const v of allVectors) counts.set(v, 0);
  for (const skill of skills) {
    for (const v of skill.vectors) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[1] - b[1]).map(([v]) => v);
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1));
}

function round1(n: number): number {
  return Number(n.toFixed(1));
}

export type { EvaluationRecord };
