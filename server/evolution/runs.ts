/**
 * On-demand runs.
 *
 * Unlike the projections, these are not reads — they execute skills against
 * scenarios right now and cost real model calls. Both are operator-triggered
 * from the dashboard rather than part of the tick loop, and both refuse to
 * start unless the whole run fits inside the remaining hourly budget. A run
 * that dies halfway leaves a partial comparison, which is worse than not
 * starting: partial results still look like results.
 */

import type { AgentSkill } from '../../src/types/skills.ts';
import type { EvolutionConfig } from './config.ts';
import type { LlmClient } from './llm.ts';
import type { ExecutableScenario } from './scenarios.ts';
import { evaluate } from './evaluator.ts';

export class InsufficientBudgetError extends Error {
  constructor(needed: number, remaining: number) {
    super(
      `This run needs ${needed} model calls and only ${remaining} remain in the hourly budget. ` +
        `Wait for the window to roll over or raise EVOLUTION_MAX_CALLS_PER_HOUR.`,
    );
    this.name = 'InsufficientBudgetError';
  }
}

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioName: string;
  scenarioShort: string;
  category: string;
  difficulty: string;
  score: number;
  ruleCompliance: number;
  constraintsMet: number;
  constraintsTotal: number;
  unsupportedClaims: number;
  ruleViolations: number;
  failureModesTriggered: string[];
  verdict: string;
  verdictSummary: string;
  passed: boolean;
  latencyMs: number;
}

export interface BenchmarkReport {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: string;
  ranAt: string;
  threshold: number;
  results: ScenarioRunResult[];
  meanScore: number;
  passRate: number;
  worstScenario: string | null;
  totalCalls: number;
  /** Scenarios skipped because the budget ran out mid-run. Should be empty. */
  skipped: string[];
}

/**
 * Run one skill against a set of scenarios and report every result.
 *
 * This is the real version of what the seed `executeChampionBenchmark()`
 * pretended to do. It is the same execute-and-judge path the tick loop uses, so
 * a benchmark score here is directly comparable to a score earned during
 * evolution — which is the whole point of not having a separate fake scorer.
 */
export async function runBenchmark(
  llm: LlmClient,
  cfg: EvolutionConfig,
  skill: AgentSkill,
  scenarios: ExecutableScenario[],
): Promise<BenchmarkReport> {
  const needed = scenarios.length * 2;
  const remaining = llm.budget.status().remaining;
  if (remaining < needed) throw new InsufficientBudgetError(needed, remaining);

  const results: ScenarioRunResult[] = [];
  const skipped: string[] = [];
  let totalCalls = 0;

  for (const scenario of scenarios) {
    if (!llm.budget.canAfford(2)) {
      skipped.push(scenario.shortName);
      continue;
    }
    const startedAt = Date.now();
    const r = await evaluate(llm, cfg, skill, scenario);
    totalCalls += r.callsUsed;

    results.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      scenarioShort: scenario.shortName,
      category: scenario.category,
      difficulty: scenario.adversarialDifficulty,
      score: r.score,
      ruleCompliance: r.ruleCompliance,
      constraintsMet: r.rubric.constraintResults.filter((c) => c.satisfied).length,
      constraintsTotal: r.rubric.constraintResults.length,
      unsupportedClaims: r.rubric.unsupportedClaims.length,
      ruleViolations: r.rubric.ruleViolations.length,
      failureModesTriggered: r.rubric.failureModesTriggered,
      verdict: r.rubric.convictionVerdict,
      verdictSummary: r.rubric.verdictSummary,
      passed: r.score >= skill.threshold,
      latencyMs: Date.now() - startedAt,
    });
  }

  const scores = results.map((r) => r.score);
  const worst = results.length
    ? results.reduce((a, b) => (a.score <= b.score ? a : b)).scenarioShort
    : null;

  return {
    skillId: skill.id,
    skillCode: skill.code,
    skillName: skill.name,
    stage: skill.stage,
    ranAt: new Date().toISOString(),
    threshold: skill.threshold,
    results,
    meanScore: scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : 0,
    passRate: results.length
      ? Number(((results.filter((r) => r.passed).length / results.length) * 100).toFixed(1))
      : 0,
    worstScenario: worst,
    totalCalls,
    skipped,
  };
}

export interface SwarmEntrant {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: string;
  vector: string;
  score: number;
  ruleCompliance: number;
  constraintsMet: number;
  constraintsTotal: number;
  unsupportedClaims: number;
  verdict: string;
  verdictSummary: string;
  reasoningSteps: string[];
  latencyMs: number;
  rank: number;
}

export interface SwarmRunResult {
  scenarioId: string;
  scenarioName: string;
  scenarioShort: string;
  category: string;
  difficulty: string;
  ranAt: string;
  entrants: SwarmEntrant[];
  /** Spread between best and worst. Wide spread means the scenario discriminates. */
  scoreSpread: number;
  /** True when every entrant scored within 2 points — the scenario did not separate them. */
  indecisive: boolean;
  totalCalls: number;
}

/**
 * Run several skills against the same scenario and rank them.
 *
 * This is a real competitive comparison, which is what the swarm view claims to
 * show. The `indecisive` flag matters: if every entrant lands within two points
 * the ranking is noise, and presenting a winner would be reading a result out of
 * nothing.
 */
export async function runSwarm(
  llm: LlmClient,
  cfg: EvolutionConfig,
  skills: AgentSkill[],
  scenario: ExecutableScenario,
): Promise<SwarmRunResult> {
  const needed = skills.length * 2;
  const remaining = llm.budget.status().remaining;
  if (remaining < needed) throw new InsufficientBudgetError(needed, remaining);

  // The governor caps real concurrency, so firing these together is safe and
  // keeps the wall-clock time of a swarm run proportional to one evaluation.
  const settled = await Promise.all(
    skills.map(async (skill) => {
      const startedAt = Date.now();
      try {
        const r = await evaluate(llm, cfg, skill, scenario);
        return { skill, r, latencyMs: Date.now() - startedAt };
      } catch {
        return null;
      }
    }),
  );

  const entrants: SwarmEntrant[] = settled
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map(({ skill, r, latencyMs }) => ({
      skillId: skill.id,
      skillCode: skill.code,
      skillName: skill.name,
      stage: skill.stage,
      vector: skill.vectors[0] ?? 'Systems Engineering',
      score: r.score,
      ruleCompliance: r.ruleCompliance,
      constraintsMet: r.rubric.constraintResults.filter((c) => c.satisfied).length,
      constraintsTotal: r.rubric.constraintResults.length,
      unsupportedClaims: r.rubric.unsupportedClaims.length,
      verdict: r.rubric.convictionVerdict,
      verdictSummary: r.rubric.verdictSummary,
      reasoningSteps: r.reasoningSteps,
      latencyMs,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const scores = entrants.map((e) => e.score);
  const spread = scores.length ? Math.max(...scores) - Math.min(...scores) : 0;

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    scenarioShort: scenario.shortName,
    category: scenario.category,
    difficulty: scenario.adversarialDifficulty,
    ranAt: new Date().toISOString(),
    entrants,
    scoreSpread: Number(spread.toFixed(1)),
    indecisive: entrants.length > 1 && spread < 2,
    totalCalls: entrants.length * 2,
  };
}
