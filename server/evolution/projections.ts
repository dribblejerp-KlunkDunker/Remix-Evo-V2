/**
 * Read models for the dashboard views that need data shaped differently from
 * the population itself.
 *
 * These are pure projections over what the engine already stores — no new
 * measurement, no model calls. Kept out of engine.ts so the tick loop stays
 * about evolving skills rather than formatting them.
 */

import type {
  AgentSkill,
  ChampionEvolutionLineageAudit,
  ScenarioDefinition,
  ScenarioHeatmapPoint,
} from '../../src/types/skills.ts';
import type { SkillRuntime } from './store.ts';
import type { ExecutableScenario } from './scenarios.ts';
import { toDefinition } from './scenarios.ts';

export interface HeatmapProjection {
  points: ScenarioHeatmapPoint[];
  scenarios: ScenarioDefinition[];
  specialists: { id: string; name: string; vector: string; stage: string }[];
}

/**
 * One point per (skill, scenario) pair that has actually been evaluated.
 *
 * Unevaluated pairs are omitted rather than zero-filled: a blank cell means "not
 * yet tested", which is genuinely different from "tested and scored zero", and
 * conflating them would make an untested skill look like a failing one.
 */
export function projectHeatmap(
  skills: AgentSkill[],
  runtime: Map<string, SkillRuntime>,
  bank: ExecutableScenario[],
): HeatmapProjection {
  const byId = new Map(bank.map((s) => [s.id, s]));
  const points: ScenarioHeatmapPoint[] = [];

  for (const skill of skills) {
    const rt = runtime.get(skill.id);
    if (!rt || rt.retiredAt) continue;

    // Group this skill's evaluations by scenario.
    const grouped = new Map<string, typeof rt.evaluations>();
    for (const e of rt.evaluations) {
      const list = grouped.get(e.scenarioId) ?? [];
      list.push(e);
      grouped.set(e.scenarioId, list);
    }

    for (const [scenarioId, evals] of grouped) {
      const scenario = byId.get(scenarioId);
      if (!scenario || evals.length === 0) continue;

      const meanScore = evals.reduce((a, e) => a + e.score, 0) / evals.length;
      const meanCompliance = evals.reduce((a, e) => a + e.ruleCompliance, 0) / evals.length;

      // The verdict from the most recent run on this scenario, if we kept one.
      const testCase = skill.testCases.find((tc) => tc.id === `tc-${scenarioId}`);
      const keyInsight =
        testCase?.executionLog?.verdictSummary ??
        `${evals.length} evaluation${evals.length === 1 ? '' : 's'} recorded; no verdict retained.`;

      points.push({
        specialistId: skill.id,
        specialistName: skill.name,
        specialistVector: skill.vectors[0] ?? 'Systems Engineering',
        scenarioId,
        scenarioName: scenario.name,
        scenarioShort: scenario.shortName,
        scenarioCategory: scenario.category,
        successRate: Number(meanScore.toFixed(1)),
        testRuns: evals.length,
        ruleCompliance: Number(meanCompliance.toFixed(1)),
        status: skill.stage === 'champion' ? 'champion' : skill.stage === 'testing' ? 'testing' : 'baseline',
        keyInsight,
      });
    }
  }

  return {
    points,
    scenarios: bank.map(toDefinition),
    specialists: skills
      .filter((s) => !runtime.get(s.id)?.retiredAt)
      .map((s) => ({
        id: s.id,
        name: s.name,
        vector: s.vectors[0] ?? 'Systems Engineering',
        stage: s.stage,
      })),
  };
}

/**
 * Lineage audit for every champion, assembled from the EvolutionIteration
 * records the engine writes during mutation and crossover.
 */
export function projectChampionAudits(
  skills: AgentSkill[],
  runtime: Map<string, SkillRuntime>,
): ChampionEvolutionLineageAudit[] {
  return skills
    .filter((s) => s.stage === 'champion' && !runtime.get(s.id)?.retiredAt)
    .map((skill) => projectSkillAudit(skill, runtime));
}

/**
 * Lineage audit for a single skill at any stage.
 *
 * The seed helper synthesised a plausible lineage for skills it had no record
 * of. This does not: a skill with no recorded iterations reports none, and a
 * skill that has never been evaluated reports its real, empty history. An
 * invented lineage in a provenance view is worse than a short one.
 */
export function projectSkillAudit(
  skill: AgentSkill,
  runtime: Map<string, SkillRuntime>,
): ChampionEvolutionLineageAudit {
  return ((): ChampionEvolutionLineageAudit => {
      const iterations = skill.evolutionLineage.iterations ?? [];
      // The first stage-history entry records a score of 0 because the skill had
      // not been evaluated yet. Using it as the baseline turns every champion
      // into a "+100% improvement", which is meaningless. The first actual
      // evaluation is the real starting point.
      // The stored baseline survives trimming; evaluations[0] does not, and
      // reading it would make the delta shrink as history rolls over.
      const rt = runtime.get(skill.id);
      const initialScore =
        rt?.baseline?.score ?? (rt?.evaluations.length ? rt.evaluations[0].score : skill.benchmarkScore);
      const mutationRates = iterations.map((i) => i.mutationPercentage).filter((n) => Number.isFinite(n));
      const promoted = [...skill.stageHistory].reverse().find((h) => h.stage === 'champion');

      return {
        championId: skill.id,
        championCode: skill.code,
        championName: skill.name,
        tagline: skill.tagline,
        specialistRole: skill.specialistRole,
        currentScore: skill.benchmarkScore,
        initialScore,
        totalPerformanceDelta: Number((skill.benchmarkScore - initialScore).toFixed(1)),
        averageMutationRate: mutationRates.length
          ? Number((mutationRates.reduce((a, b) => a + b, 0) / mutationRates.length).toFixed(1))
          : 0,
        parentSeeds: skill.evolutionLineage.parentDetails ?? [],
        remixVectorCombo: skill.evolutionLineage.remixVectorCombo,
        iterations,
        championMilestoneAchievedAt: promoted?.timestamp ?? skill.lastEvaluatedAt,
        lineageSummary:
          promoted?.notes ??
          `${skill.stage} stage; ${iterations.length} recorded iteration${iterations.length === 1 ? '' : 's'}.`,
      };
  })();
}

export interface AuditStatsProjection {
  totalAuditedChampions: number;
  totalIterations: number;
  averageMutationRate: number;
  averagePerformanceDelta: number;
}

export function projectAuditStats(audits: ChampionEvolutionLineageAudit[]): AuditStatsProjection {
  if (audits.length === 0) {
    return { totalAuditedChampions: 0, totalIterations: 0, averageMutationRate: 0, averagePerformanceDelta: 0 };
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    totalAuditedChampions: audits.length,
    totalIterations: audits.reduce((a, c) => a + c.iterations.length, 0),
    averageMutationRate: Number(mean(audits.map((a) => a.averageMutationRate)).toFixed(1)),
    averagePerformanceDelta: Number(mean(audits.map((a) => a.totalPerformanceDelta)).toFixed(1)),
  };
}

// ---------------------------------------------------------------------------
// Cognitive profiles
// ---------------------------------------------------------------------------

export interface CognitiveProfileProjection {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: string;
  vector: string;
  generation: number;
  benchmarkScore: number;
  averageLatencyMs: number | null;
  averageMemoryUsage: number | null;
  averageTokenCertainty: number | null;
  averageBacktracks: number | null;
  averageContextPressure: number | null;
  averageStrainIndex: number | null;
  samples: number;
  /** Metrics the API cannot supply, named so the UI can say so rather than guess. */
  unavailable: string[];
}

/**
 * Per-skill cognitive profile from measured execution telemetry.
 *
 * Only evaluations recorded after telemetry capture existed carry a `cognitive`
 * block, so `samples` is the count of those — not the skill's total evaluations.
 * Reporting the larger number would overstate how much measurement is behind
 * these averages.
 */
export function projectCognitiveProfiles(
  skills: AgentSkill[],
  runtime: Map<string, SkillRuntime>,
): CognitiveProfileProjection[] {
  const avg = (xs: (number | null | undefined)[]): number | null => {
    const present = xs.filter((x): x is number => typeof x === 'number');
    if (present.length === 0) return null;
    return Number((present.reduce((a, b) => a + b, 0) / present.length).toFixed(1));
  };

  return skills
    .filter((s) => !runtime.get(s.id)?.retiredAt)
    .map((skill) => {
      const measured = (runtime.get(skill.id)?.evaluations ?? [])
        .map((e) => e.cognitive)
        .filter((c): c is NonNullable<typeof c> => !!c);

      return {
        skillId: skill.id,
        skillCode: skill.code,
        skillName: skill.name,
        stage: skill.stage,
        vector: skill.vectors[0] ?? 'Systems Engineering',
        generation: skill.generation,
        benchmarkScore: skill.benchmarkScore,
        averageLatencyMs: avg(measured.map((m) => m.inferenceLatencyMs)),
        averageMemoryUsage: avg(measured.map((m) => m.workingMemoryUsage)),
        averageTokenCertainty: avg(measured.map((m) => m.tokenCertainty)),
        averageBacktracks: avg(measured.map((m) => m.backtrackingCount)),
        averageContextPressure: avg(measured.map((m) => m.contextWindowPressure)),
        averageStrainIndex: avg(measured.map((m) => m.cognitiveStrainIndex)),
        samples: measured.length,
        unavailable: ['attentionEntropy', 'heuristicPruningRate'],
      };
    })
    .filter((p) => p.samples > 0);
}

// ---------------------------------------------------------------------------
// Mutation effectiveness
// ---------------------------------------------------------------------------

export interface MutationOutcomeProjection {
  mutationType: string;
  attempts: number;
  /** Share of attempts that improved the score. Null below a usable sample. */
  successRate: number | null;
  averageDelta: number | null;
  averageMutationPercentage: number | null;
  bestDelta: number | null;
  worstDelta: number | null;
}

/**
 * Which mutation types actually work, measured over recorded iterations.
 *
 * `successRate` is null below three attempts. A 100% success rate from a single
 * sample is not a finding, and rendering it next to a type with fifty samples
 * would invite exactly the wrong conclusion.
 */
export function projectMutationOutcomes(skills: AgentSkill[]): MutationOutcomeProjection[] {
  const byType = new Map<string, { delta: number; pct: number }[]>();

  for (const skill of skills) {
    for (const it of skill.evolutionLineage.iterations ?? []) {
      const list = byType.get(it.mutationType) ?? [];
      list.push({ delta: it.performanceDelta, pct: it.mutationPercentage });
      byType.set(it.mutationType, list);
    }
  }

  const MIN_SAMPLE = 3;
  return [...byType.entries()]
    .map(([mutationType, records]) => {
      const deltas = records.map((r) => r.delta).filter((d) => Number.isFinite(d));
      const pcts = records.map((r) => r.pct).filter((p) => Number.isFinite(p));
      const mean = (xs: number[]) =>
        xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)) : null;

      return {
        mutationType,
        attempts: records.length,
        successRate:
          records.length >= MIN_SAMPLE
            ? Number(((deltas.filter((d) => d > 0).length / deltas.length) * 100).toFixed(1))
            : null,
        averageDelta: mean(deltas),
        averageMutationPercentage: mean(pcts),
        bestDelta: deltas.length ? Math.max(...deltas) : null,
        worstDelta: deltas.length ? Math.min(...deltas) : null,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}
