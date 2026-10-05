/**
 * Offline test harness. Run with: npx tsx server/evolution/engine.test.ts
 *
 * Drives the engine against a stub model so the orchestration, gates, and
 * scoring can be verified without spending a single API call. The stub returns
 * plausibly-shaped genomes and rubrics whose quality is controlled by a dial,
 * which lets us assert that good skills get promoted and bad ones get retired.
 */

import assert from 'assert';
import os from 'os';
import path from 'path';
import fs from 'fs';

import { DEFAULT_CONFIG, type EvolutionConfig } from './config.ts';
import { trimRuntime, compressRetiredRuntime } from './store.ts';
import { validateSplit, scenariosForVectors, MIN_PER_VECTOR_PER_SIDE } from './scenarios.ts';
import { ALL_VECTORS } from './genome.ts';
import { comparisonKey, genomeFingerprint } from './conflicts.ts';
import { safeJoin, parseTicker, isTrueLoopback, requireOperator, UnsafePathError } from '../lib/security.ts';
import { LlmClient, AuthFailureError } from './llm.ts';
import { EvolutionEngine } from './engine.ts';
import { FileEvolutionStore } from './store.ts';
import { SCENARIO_BANK, splitScenarios } from './scenarios.ts';
import { scoreFromRubric, type JudgeRubric } from './evaluator.ts';
import { summariseFitness, evaluatePromotionGate } from './fitness.ts';
import { estimateMutationPercentage, selectMutationType } from './genome.ts';
import type { AgentSkill } from '../../src/types/skills.ts';
import type { SkillRuntime } from './store.ts';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`  ✗ ${name}\n    ${err instanceof Error ? err.message : err}`);
    });
}

// ---- stub model ---------------------------------------------------------

/** `quality` in [0,1] controls how many constraints the stub "satisfies". */
function makeStubLlm(cfg: EvolutionConfig, quality: () => number): LlmClient {
  const llm = new LlmClient(cfg, 'stub-key-for-tests');
  let counter = 0;

  // Stubs must still go through the governor, otherwise budget behaviour is
  // never exercised and the ceiling looks like it works when it does not.
  const metered = async <T>(fn: () => T): Promise<T> => {
    await llm.budget.acquire();
    try {
      return fn();
    } finally {
      llm.budget.release();
    }
  };

  const STUB_TEXT =
    '1. Stub reasoning step one.\n2. Stub reasoning step two.\nHowever, revising step one.\n\nVERDICT: stub.';

  (llm as any).generate = async () => metered(() => STUB_TEXT);

  // executeSkill uses the telemetry variant, so the stub must cover it or every
  // execution falls through to the real API.
  (llm as any).generateWithTelemetry = async ({ model }: { model: string }) =>
    metered(() => ({
      text: STUB_TEXT,
      telemetry: {
        latencyMs: 1200,
        promptTokens: 900,
        outputTokens: 300,
        thoughtTokens: 150,
        totalTokens: 1350,
        avgLogprob: -0.12,
        model,
      },
    }));

  (llm as any).generateJson = async ({ prompt }: { prompt: string }) =>
    metered(() => {
      counter++;
      // Grading prompt: return a rubric.
      if (prompt.includes('CONSTRAINTS A CORRECT RESPONSE MUST SATISFY')) {
        const constraints = [...prompt.matchAll(/^\d+\.\s(.+)$/gm)].map((m) => m[1]).slice(0, 5);
        const q = quality();
        const satisfiedCount = Math.round(constraints.length * q);
        return {
          constraintResults: constraints.map((c, i) => ({
            constraint: c,
            satisfied: i < satisfiedCount,
            evidence: 'stub',
          })),
          failureModesTriggered: q < 0.5 ? ['stub failure mode'] : [],
          unsupportedClaims: q < 0.4 ? ['stub unsupported claim'] : [],
          ruleViolations: [],
          reasoningQuality: Math.max(1, Math.round(q * 5)),
          epistemicCalibration: Math.max(1, Math.round(q * 5)),
          verdictSummary: 'Stub verdict summary.',
          convictionVerdict: q > 0.9 ? 'SOUND' : 'PARTIAL',
        };
      }
      // Genome prompt: return a genome.
      return {
        name: `Stub Skill ${counter}`,
        tagline: 'A stub skill produced by the test harness',
        description: 'Stub description for offline testing of the evolution engine.',
        specialistRole: 'Stub Specialist',
        vectors: ['Forensic Accounting', 'Statistics & Stochastic'],
        strictRules: [
          `RULE 1: Stub rule ${counter} requiring an explicit citation.`,
          'RULE 2: Stub rule requiring uncertainty to be stated.',
        ],
        promptMatrix: {
          systemDirective: `Stub directive revision ${counter}.`,
          reasoningFramework: 'Stub framework: step one, step two.',
          adversarialConstraint: 'Stub constraint: refuse unsupported inference.',
        },
        autonomousThought: 'Stub thought.',
        keyInsight: 'Stub insight.',
        mutationDetails: 'Stub mutation details.',
        ruleDiff: { added: ['RULE 3: added'], modified: [], pruned: [] },
      };
    });

  return llm;
}

function makeSkill(overrides: Partial<AgentSkill> = {}): AgentSkill {
  return {
    id: 'skill-test',
    code: 'SKILL-TEST-G1',
    name: 'Test Skill',
    stage: 'testing',
    tagline: 't',
    description: 'd',
    vectors: ['Forensic Accounting'],
    generation: 1,
    benchmarkScore: 0,
    threshold: 95,
    winRate: 0,
    stabilityIndex: 0,
    hallucinationRate: 0,
    strictRules: ['RULE 1: cite everything.'],
    specialistRole: 'Tester',
    promptMatrix: { systemDirective: 'a', reasoningFramework: 'b', adversarialConstraint: 'c' },
    autonomousThought: '',
    activeTestBench: { name: '', currentVector: '', totalRunsToday: 0, consecutivePasses: 0, stressVector: '' },
    testCases: [],
    evolutionLineage: { parents: [], remixVectorCombo: '', generationEpoch: '', survivalIterations: 0, mutationType: '' },
    stageHistory: [],
    createdAt: new Date().toISOString(),
    lastEvaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function runtimeWith(scores: number[], holdout: boolean, scenarioIds?: string[]): SkillRuntime {
  return {
    evaluations: scores.map((score, i) => ({
      scenarioId: scenarioIds?.[i] ?? `scen-${i % 5}`,
      scenarioName: `Scenario ${i}`,
      holdout,
      score,
      ruleCompliance: 100,
      hallucinationFlags: 0,
      criticalViolations: 0,
      timestamp: new Date().toISOString(),
      callsUsed: 2,
    })),
    trainedScenarioIds: [],
    consecutiveRegressionFailures: 0,
    trainingRefinements: 0,
  };
}

async function main() {
  console.log('\nEvolution engine — offline tests\n');

  // ---- scoring ----------------------------------------------------------
  console.log('scoreFromRubric');

  await test('perfect rubric scores 100', () => {
    const rubric: JudgeRubric = {
      constraintResults: Array.from({ length: 5 }, (_, i) => ({ constraint: `c${i}`, satisfied: true, evidence: '' })),
      failureModesTriggered: [],
      unsupportedClaims: [],
      ruleViolations: [],
      reasoningQuality: 5,
      epistemicCalibration: 5,
      verdictSummary: '',
      convictionVerdict: '',
    };
    assert.strictEqual(scoreFromRubric(rubric).score, 100);
  });

  await test('is deterministic across repeated calls', () => {
    const rubric: JudgeRubric = {
      constraintResults: [
        { constraint: 'a', satisfied: true, evidence: '' },
        { constraint: 'b', satisfied: false, evidence: '' },
        { constraint: 'c', satisfied: true, evidence: '' },
      ],
      failureModesTriggered: ['f'],
      unsupportedClaims: ['u'],
      ruleViolations: [],
      reasoningQuality: 3,
      epistemicCalibration: 4,
      verdictSummary: '',
      convictionVerdict: '',
    };
    const runs = Array.from({ length: 20 }, () => scoreFromRubric(rubric).score);
    assert.strictEqual(new Set(runs).size, 1, 'scores varied across identical rubrics');
  });

  await test('rule violations are penalised harder than missed constraints', () => {
    const base = (over: Partial<JudgeRubric>): JudgeRubric => ({
      constraintResults: Array.from({ length: 4 }, (_, i) => ({ constraint: `c${i}`, satisfied: true, evidence: '' })),
      failureModesTriggered: [],
      unsupportedClaims: [],
      ruleViolations: [],
      reasoningQuality: 4,
      epistemicCalibration: 4,
      verdictSummary: '',
      convictionVerdict: '',
      ...over,
    });
    const withViolation = scoreFromRubric(base({ ruleViolations: ['r'] })).score;
    const withMiss = scoreFromRubric(
      base({ constraintResults: [
        { constraint: 'c0', satisfied: false, evidence: '' },
        { constraint: 'c1', satisfied: true, evidence: '' },
        { constraint: 'c2', satisfied: true, evidence: '' },
        { constraint: 'c3', satisfied: true, evidence: '' },
      ] }),
    ).score;
    assert.ok(withViolation < withMiss, `violation ${withViolation} should score below miss ${withMiss}`);
  });

  await test('score is clamped to 0 under heavy penalties', () => {
    const rubric: JudgeRubric = {
      constraintResults: [{ constraint: 'a', satisfied: false, evidence: '' }],
      failureModesTriggered: ['f1', 'f2', 'f3'],
      unsupportedClaims: ['u1', 'u2', 'u3', 'u4'],
      ruleViolations: ['r1', 'r2'],
      reasoningQuality: 1,
      epistemicCalibration: 1,
      verdictSummary: '',
      convictionVerdict: '',
    };
    assert.strictEqual(scoreFromRubric(rubric).score, 0);
  });

  // ---- scenario split ---------------------------------------------------
  console.log('\nscenario split');

  await test('holdout and training sets are disjoint and cover the bank', () => {
    const { training, holdout } = splitScenarios(SCENARIO_BANK, 0.35);
    const ids = new Set([...training, ...holdout].map((s) => s.id));
    assert.strictEqual(ids.size, SCENARIO_BANK.length);
    assert.ok(holdout.length >= 2, 'holdout too small');
    assert.ok(training.length > 0, 'training empty');
    for (const h of holdout) {
      assert.ok(!training.some((t) => t.id === h.id), `${h.id} leaked into training`);
    }
  });

  await test('split is stable across calls', () => {
    const a = splitScenarios(SCENARIO_BANK, 0.35).holdout.map((s) => s.id).join(',');
    const b = splitScenarios(SCENARIO_BANK, 0.35).holdout.map((s) => s.id).join(',');
    assert.strictEqual(a, b);
  });

  await test('every scenario carries executable content', () => {
    for (const s of SCENARIO_BANK) {
      assert.ok(s.inputScenario.length > 100, `${s.id} input too short`);
      assert.ok(s.expectedConstraints.length >= 3, `${s.id} needs at least 3 constraints`);
      assert.ok(s.knownFailureModes.length >= 2, `${s.id} needs failure modes`);
    }
  });

  // ---- promotion gate ---------------------------------------------------
  console.log('\npromotion gate');

  await test('high scores on training data alone do not promote', () => {
    const rt = runtimeWith([99, 99, 99, 99, 99, 99, 99, 99], false);
    const gate = evaluatePromotionGate(summariseFitness(rt, 95), DEFAULT_CONFIG, 95);
    assert.ok(!gate.passed, 'promoted without any held-out evidence');
    assert.match(gate.blockingReason ?? '', /Held-out/);
  });

  await test('one lucky held-out run does not promote', () => {
    const rt = runtimeWith([99], true);
    const gate = evaluatePromotionGate(summariseFitness(rt, 95), DEFAULT_CONFIG, 95);
    assert.ok(!gate.passed);
  });

  await test('high mean with high variance does not promote', () => {
    const rt = runtimeWith([100, 88, 100, 89, 100, 100], true, ['a', 'b', 'c', 'd', 'e', 'f']);
    const gate = evaluatePromotionGate(summariseFitness(rt, 95), DEFAULT_CONFIG, 95);
    assert.ok(!gate.passed, 'promoted despite unstable scores');
    assert.match(gate.blockingReason ?? '', /variance/i);
  });

  await test('consistent held-out performance across scenarios promotes', () => {
    const rt = runtimeWith([96, 97, 95.5, 96.5, 97, 96], true, ['a', 'b', 'c', 'd', 'e', 'f']);
    const gate = evaluatePromotionGate(summariseFitness(rt, 95), DEFAULT_CONFIG, 95);
    assert.ok(gate.passed, `blocked unexpectedly: ${gate.blockingReason}`);
  });

  await test('hallucination flags block promotion', () => {
    const rt = runtimeWith([97, 97, 97, 97, 97, 97], true, ['a', 'b', 'c', 'd', 'e', 'f']);
    rt.evaluations[0].hallucinationFlags = 2;
    const gate = evaluatePromotionGate(summariseFitness(rt, 95), DEFAULT_CONFIG, 95);
    assert.ok(!gate.passed);
    assert.match(gate.blockingReason ?? '', /Hallucination/);
  });

  // ---- genome -----------------------------------------------------------
  console.log('\ngenome');

  await test('mutation percentage reflects real textual change', () => {
    const a = makeSkill();
    const identical = estimateMutationPercentage(a, makeSkill());
    const changed = estimateMutationPercentage(
      a,
      makeSkill({
        strictRules: ['RULE 1: entirely different obligation regarding provenance.'],
        promptMatrix: { systemDirective: 'x', reasoningFramework: 'y', adversarialConstraint: 'z' },
      }),
    );
    assert.strictEqual(identical, 0);
    assert.ok(changed > 50, `expected large distance, got ${changed}`);
  });

  await test('mutation type is chosen from observed symptoms', () => {
    const violations = runtimeWith([70, 70], false).evaluations.map((e) => ({ ...e, criticalViolations: 2 }));
    assert.strictEqual(selectMutationType(violations), 'Adversarial Constraint Hardening');

    const hallucinating = runtimeWith([70, 70], false).evaluations.map((e) => ({ ...e, hallucinationFlags: 3 }));
    assert.strictEqual(selectMutationType(hallucinating), 'Epistemic Calibration Tightening');

    const unstable = runtimeWith([95, 60], false).evaluations;
    assert.strictEqual(selectMutationType(unstable), 'Reasoning Framework Restructure');
  });

  // ---- full loop --------------------------------------------------------
  console.log('\nfull tick loop (stubbed model)');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-test-'));

  await test('a strong population produces a champion and persists it', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      tickIntervalMs: 10,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      trainingRunsToGraduate: 1,
      minPopulation: 2,
      maxDevelopmentWip: 4,
      evaluationsPerTick: 3,
      crossoverRate: 0,
    };
    const store = new FileEvolutionStore(path.join(tmpDir, 'strong'));
    const engine = new EvolutionEngine(cfg, store, makeStubLlm(cfg, () => 1.0));
    await engine.init();

    for (let i = 0; i < 30; i++) await engine.tick();

    const stats = engine.getStats();
    assert.ok(stats.totalSkills > 0, 'population never grew');
    assert.ok(stats.championCount > 0, `no champion after 30 ticks (${JSON.stringify(stats)})`);

    await engine.shutdown();
    const reloaded = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'strong')), makeStubLlm(cfg, () => 1.0));
    await reloaded.init();
    assert.strictEqual(
      reloaded.getStats().championCount,
      stats.championCount,
      'champions did not survive a restart',
    );
  });

  await test('a weak population produces no champions and retires skills', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      tickIntervalMs: 10,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      minPopulation: 2,
      crossoverRate: 0,
    };
    const store = new FileEvolutionStore(path.join(tmpDir, 'weak'));
    const engine = new EvolutionEngine(cfg, store, makeStubLlm(cfg, () => 0.2));
    await engine.init();

    for (let i = 0; i < 25; i++) await engine.tick();

    assert.strictEqual(engine.getStats().championCount, 0, 'weak skills were promoted');
    const retired = engine.getEvents(200).filter((e) => e.type === 'skill_retired');
    assert.ok(retired.length > 0, 'nothing was ever retired despite poor scores');
    await engine.shutdown();
  });

  await test('budget exhaustion stops spending rather than throwing', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 4,
      maxConcurrency: 1,
      minPopulation: 2,
    };
    const store = new FileEvolutionStore(path.join(tmpDir, 'budget'));
    const engine = new EvolutionEngine(cfg, store, makeStubLlm(cfg, () => 1.0));
    await engine.init();

    for (let i = 0; i < 6; i++) await engine.tick();

    const throttled = engine.getEvents(200).filter((e) => e.type === 'budget_throttled');
    assert.ok(throttled.length > 0, 'budget ceiling never engaged');
    assert.strictEqual(engine.status().lastError, null, 'budget exhaustion surfaced as an error');
    await engine.shutdown();
  });

  await test('population stays under the configured cap', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      maxPopulation: 6,
      minPopulation: 2,
      trainingRunsToGraduate: 1,
    };
    const store = new FileEvolutionStore(path.join(tmpDir, 'cap'));
    const engine = new EvolutionEngine(cfg, store, makeStubLlm(cfg, () => 0.95));
    await engine.init();

    for (let i = 0; i < 40; i++) await engine.tick();
    assert.ok(engine.getSkills().length <= 6, `population ${engine.getSkills().length} exceeded cap of 6`);
    await engine.shutdown();
  });

  // ---- projections ------------------------------------------------------
  console.log('\nprojections');

  await test('heatmap reports only evaluated pairs, with real run counts', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      maxDevelopmentWip: 3,
      evaluationsPerTick: 3,
      trainingRunsToGraduate: 1,
      minPopulation: 2,
      crossoverRate: 0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'proj')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    for (let i = 0; i < 25; i++) await engine.tick();

    const { points, scenarios, specialists } = engine.getHeatmap();
    assert.ok(points.length > 0, 'no heatmap points produced');
    assert.strictEqual(scenarios.length, SCENARIO_BANK.length, 'scenario list incomplete');
    assert.ok(specialists.length > 0, 'no specialists listed');

    const liveIds = new Set(engine.getSkills().map((s) => s.id));
    for (const p of points) {
      assert.ok(p.testRuns >= 1, 'a point was emitted with zero runs');
      assert.ok(p.successRate >= 0 && p.successRate <= 100, `score out of range: ${p.successRate}`);
      assert.ok(liveIds.has(p.specialistId), 'retired skill leaked into the heatmap');
      assert.ok(p.scenarioName.length > 0, 'point missing scenario metadata');
    }

    // Every pair must be unique — duplicates would double-count in the grid.
    const keys = points.map((p) => `${p.specialistId}|${p.scenarioId}`);
    assert.strictEqual(new Set(keys).size, keys.length, 'duplicate (skill, scenario) pairs');
    await engine.shutdown();
  });

  await test('champion audits carry real iterations and consistent deltas', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      maxDevelopmentWip: 4,
      evaluationsPerTick: 3,
      trainingRunsToGraduate: 1,
      minPopulation: 2,
      crossoverRate: 0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'audit')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    for (let i = 0; i < 30; i++) await engine.tick();

    const { audits, stats } = engine.getAudits();
    const championIds = engine.getSkills().filter((s) => s.stage === 'champion').map((s) => s.id);
    assert.strictEqual(audits.length, championIds.length, 'audit count does not match champion count');
    assert.strictEqual(stats.totalAuditedChampions, audits.length);

    for (const a of audits) {
      assert.ok(championIds.includes(a.championId), 'audit for a non-champion');
      assert.strictEqual(
        a.totalPerformanceDelta,
        Number((a.currentScore - a.initialScore).toFixed(1)),
        'delta does not reconcile with its own scores',
      );
      assert.ok(a.championMilestoneAchievedAt.length > 0, 'missing promotion timestamp');
      // A stub that always scores identically must show no improvement. An
      // unevaluated baseline of 0 would fake a +100% gain for every champion.
      assert.strictEqual(a.totalPerformanceDelta, 0, 'invented an improvement delta from an unevaluated baseline');
      assert.ok(a.initialScore > 0, 'baseline came from the pre-evaluation stage history');
    }
    await engine.shutdown();
  });

  await test('cognitive profiles report measured values and flag the unmeasurable', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      maxDevelopmentWip: 3,
      evaluationsPerTick: 3,
      trainingRunsToGraduate: 1,
      minPopulation: 2,
      crossoverRate: 0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'cog')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    for (let i = 0; i < 12; i++) await engine.tick();

    const profiles = engine.getCognitiveProfiles();
    assert.ok(profiles.length > 0, 'no cognitive profiles produced');
    for (const p of profiles) {
      assert.ok(p.samples > 0, 'profile emitted with no measured samples');
      assert.strictEqual(p.averageLatencyMs, 1200, 'latency not taken from telemetry');
      // thoughts 150 of 450 generated = 33.3%
      assert.strictEqual(p.averageMemoryUsage, 33.3, 'reasoning share miscomputed');
      // exp(-0.12) = 0.8869
      assert.strictEqual(p.averageTokenCertainty, 88.7, 'token certainty not derived from logprobs');
      assert.strictEqual(p.averageBacktracks, 1, 'revision marker not counted');
      assert.deepStrictEqual(
        p.unavailable,
        ['attentionEntropy', 'heuristicPruningRate'],
        'unmeasurable metrics must be declared, not silently filled',
      );
    }
    await engine.shutdown();
  });

  await test('mutation outcomes withhold a success rate below a usable sample', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG,
      autoStart: false,
      maxCallsPerHour: 10_000,
      maxConcurrency: 8,
      maxDevelopmentWip: 3,
      evaluationsPerTick: 3,
      trainingRunsToGraduate: 2,
      minPopulation: 2,
      crossoverRate: 0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'mut')), makeStubLlm(cfg, () => 0.85));
    await engine.init();
    for (let i = 0; i < 15; i++) await engine.tick();

    for (const o of engine.getMutationOutcomes()) {
      assert.ok(o.attempts > 0);
      if (o.attempts < 3) {
        assert.strictEqual(o.successRate, null, `reported a success rate from ${o.attempts} attempt(s)`);
      } else {
        assert.ok(o.successRate !== null && o.successRate >= 0 && o.successRate <= 100);
      }
    }
    await engine.shutdown();
  });

  await test('benchmark runs only relevant held-out scenarios and feeds the evidence pool', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 3, evaluationsPerTick: 2, trainingRunsToGraduate: 1, minPopulation: 2, crossoverRate: 0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'bench')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    for (let i = 0; i < 6; i++) await engine.tick();

    const target = engine.getSkills()[0];
    const before = engine.getFitness(target.id)!.holdoutRuns;
    const report = await engine.benchmark(target.id);

    // Only held-out scenarios sharing a vector with the skill — never the whole set.
    const relevant = engine
      .getScenarios()
      .holdout.filter((sc) => sc.vectors.some((v) => target.vectors.includes(v as any)));
    const holdoutCount = report.results.length;
    assert.ok(holdoutCount > 0, 'benchmark ran nothing');
    assert.ok(holdoutCount <= relevant.length, 'benchmark ran scenarios outside the skill\'s field');
    for (const r of report.results) {
      const sc = engine.getScenarios().holdout.find((x) => x.id === r.scenarioId)!;
      assert.ok(sc.vectors.some((v) => target.vectors.includes(v as any)), `ran unrelated scenario ${r.scenarioId}`);
    }
    assert.strictEqual(report.skipped.length, 0, 'scenarios were skipped with budget available');
    assert.strictEqual(report.totalCalls, holdoutCount * 2, 'call count does not match execute+judge per scenario');
    assert.ok(report.meanScore > 0 && report.meanScore <= 100);

    // Manual benchmarks must land in the same pool the promotion gate reads,
    // or an operator could re-run until a skill got lucky.
    const after = engine.getFitness(target.id)!.holdoutRuns;
    assert.strictEqual(after, before + holdoutCount, 'benchmark results bypassed the evidence pool');
    await engine.shutdown();
  });

  await test('benchmark refuses to start when the budget cannot cover it', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 6, maxConcurrency: 1, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'benchbudget')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    await engine.tick();

    const target = engine.getSkills()[0];
    if (target) {
      await assert.rejects(
        () => engine.benchmark(target.id),
        /needs \d+ model calls and only \d+ remain/,
        'started a run it could not finish',
      );
    }
    await engine.shutdown();
  });

  await test('swarm ranks entrants and flags an indecisive result', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 4, evaluationsPerTick: 2, trainingRunsToGraduate: 1, minPopulation: 2, crossoverRate: 0,
    };
    // Constant quality means every entrant scores identically, which must be
    // reported as indecisive rather than crowned with an arbitrary winner.
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'swarm')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    for (let i = 0; i < 10; i++) await engine.tick();

    const ids = engine.getSkills().slice(0, 3).map((s) => s.id);
    if (ids.length < 2) { await engine.shutdown(); return; }

    const scenarioId = engine.getScenarios().holdout[0].id;
    const result = await engine.swarm(scenarioId, ids);

    assert.strictEqual(result.entrants.length, ids.length, 'an entrant was dropped');
    assert.deepStrictEqual(
      result.entrants.map((e) => e.rank),
      result.entrants.map((_, i) => i + 1),
      'ranks are not sequential',
    );
    for (let i = 1; i < result.entrants.length; i++) {
      assert.ok(result.entrants[i - 1].score >= result.entrants[i].score, 'entrants not sorted by score');
    }
    assert.strictEqual(result.indecisive, true, 'identical scores were not flagged as indecisive');
    assert.strictEqual(result.scoreSpread, 0);
    await engine.shutdown();
  });

  await test('swarm rejects fewer than two entrants', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 4, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'swarm1')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    await engine.tick();
    const ids = engine.getSkills().slice(0, 1).map((s) => s.id);
    const scenarioId = engine.getScenarios().holdout[0].id;
    await assert.rejects(() => engine.swarm(scenarioId, ids), /at least two live skills/);
    await engine.shutdown();
  });

  await test('lineage is available for non-champion skills and invents nothing', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8, maxDevelopmentWip: 3, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'lineage')), makeStubLlm(cfg, () => 0.7));
    await engine.init();
    for (let i = 0; i < 8; i++) await engine.tick();

    const nonChampions = engine.getSkills().filter((s) => s.stage !== 'champion');
    assert.ok(nonChampions.length > 0, 'no non-champion skills to check');
    for (const s of nonChampions.slice(0, 4)) {
      const lineage = engine.getSkillLineage(s.id)!;
      assert.ok(lineage, 'no lineage returned for a live skill');
      assert.strictEqual(lineage.championId, s.id);
      // A skill with no recorded mutations must report none, not a plausible one.
      assert.strictEqual(
        lineage.iterations.length,
        (s.evolutionLineage.iterations ?? []).length,
        'lineage iteration count diverged from what the engine recorded',
      );
    }
    assert.strictEqual(engine.getSkillLineage('does-not-exist'), null);
    await engine.shutdown();
  });

  await test('lineage graph edges match recorded ancestry and nothing else', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 5, evaluationsPerTick: 2, trainingRunsToGraduate: 1,
      minPopulation: 2, crossoverRate: 1.0,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'graph')), makeStubLlm(cfg, () => 0.9));
    await engine.init();
    for (let i = 0; i < 25; i++) await engine.tick();

    const graph = engine.getLineageGraph();
    const all = engine.getSkills(true);
    assert.strictEqual(graph.nodes.length, all.length, 'graph dropped skills');

    const byId = new Map(all.map((s) => [s.id, s]));
    const codeToId = new Map(all.map((s) => [s.code, s.id]));

    for (const e of graph.edges) {
      const child = byId.get(e.targetSkillId)!;
      assert.ok(child, 'edge points at a skill that does not exist');
      assert.ok(
        (child.evolutionLineage.parents ?? []).includes(e.sourceCode),
        'edge exists without recorded parentage',
      );
      assert.strictEqual(codeToId.get(e.sourceCode), e.sourceSkillId, 'source id/code mismatch');
      // Ancestry is acyclic: a child is always strictly deeper than its parent.
      const parent = graph.nodes.find((n) => n.skillId === e.sourceSkillId)!;
      const childNode = graph.nodes.find((n) => n.skillId === e.targetSkillId)!;
      assert.ok(childNode.depth > parent.depth, `edge ${e.id} is flat or backwards`);
    }

    // Every recorded parent that still exists must produce an edge.
    let expected = 0;
    for (const s of all) {
      for (const code of s.evolutionLineage.parents ?? []) {
        if (codeToId.has(code) && codeToId.get(code) !== s.id) expected++;
      }
    }
    assert.strictEqual(graph.edges.length, expected, 'edge count diverged from recorded parentage');
    await engine.shutdown();
  });

  await test('lineage graph retains retired ancestors so descendants are not orphaned', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 4, evaluationsPerTick: 2, trainingRunsToGraduate: 1,
      minPopulation: 2, crossoverRate: 0.5, maxPopulation: 6,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'graphret')), makeStubLlm(cfg, () => 0.5));
    await engine.init();
    for (let i = 0; i < 30; i++) await engine.tick();

    const graph = engine.getLineageGraph();
    const retiredNodes = graph.nodes.filter((n) => n.retired);
    const liveIds = new Set(engine.getSkills().map((s) => s.id));

    // Retired skills must still appear, otherwise an edge from them dangles.
    for (const n of graph.nodes) {
      if (!liveIds.has(n.skillId)) assert.strictEqual(n.retired, true, 'a culled skill was not marked retired');
    }
    for (const e of graph.edges) {
      assert.ok(graph.nodes.some((n) => n.skillId === e.sourceSkillId), 'edge from a missing node');
      assert.ok(graph.nodes.some((n) => n.skillId === e.targetSkillId), 'edge to a missing node');
    }
    if (retiredNodes.length > 0) {
      assert.ok(retiredNodes.every((n) => typeof n.retiredReason === 'string'), 'retired node lacks a reason');
    }
    await engine.shutdown();
  });

  await test('an empty population yields an empty graph, not a fabricated one', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 4 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'graphempty')), makeStubLlm(cfg, () => 1.0));
    await engine.init();
    const graph = engine.getLineageGraph();
    assert.deepStrictEqual(graph.nodes, []);
    assert.deepStrictEqual(graph.edges, []);
    assert.strictEqual(graph.rootCount, 0);
    assert.strictEqual(graph.maxDepth, 0);
    await engine.shutdown();
  });

  await test('branching mutation produces real mutation edges in the lineage graph', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 8, evaluationsPerTick: 2, trainingRunsToGraduate: 3,
      minPopulation: 2, crossoverRate: 0, mutationStrategy: 'branching', maxPopulation: 20,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'branch')), makeStubLlm(cfg, () => 0.75));
    await engine.init();
    for (let i = 0; i < 30; i++) await engine.tick();

    const graph = engine.getLineageGraph();
    const mutationEdges = graph.edges.filter((e) => e.kind === 'mutation');
    assert.ok(mutationEdges.length > 0, 'branching produced no single-parent edges');
    for (const e of mutationEdges) {
      assert.strictEqual(e.contributionWeight, null, 'a mutation edge carried a crossover weight');
      const parent = graph.nodes.find((n) => n.skillId === e.sourceSkillId)!;
      const child = graph.nodes.find((n) => n.skillId === e.targetSkillId)!;
      assert.ok(child.depth > parent.depth, 'mutation edge is flat or backwards');
      assert.ok(child.generation > parent.generation, 'child generation did not advance');
    }
    await engine.shutdown();
  });

  await test('a branched child inherits no evidence from its parent', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 8, evaluationsPerTick: 2, trainingRunsToGraduate: 3,
      minPopulation: 2, crossoverRate: 0, mutationStrategy: 'branching', maxPopulation: 20,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'branchev')), makeStubLlm(cfg, () => 0.9));
    await engine.init();
    for (let i = 0; i < 14; i++) await engine.tick();

    const graph = engine.getLineageGraph();
    const edge = graph.edges.find((e) => e.kind === 'mutation');
    if (!edge) { await engine.shutdown(); return; }

    const parentFitness = engine.getFitness(edge.sourceSkillId)!;
    const childFitness = engine.getFitness(edge.targetSkillId)!;
    // The child is a different genome, so none of the parent's runs transfer.
    assert.ok(
      childFitness.totalEvaluations < parentFitness.totalEvaluations + 1 ||
        childFitness.totalEvaluations <= 4,
      'child appears to have inherited the parent evaluation history',
    );
    await engine.shutdown();
  });

  await test('in-place strategy keeps one node per lineage', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 6, evaluationsPerTick: 2, trainingRunsToGraduate: 3,
      minPopulation: 2, crossoverRate: 0, mutationStrategy: 'in-place', maxPopulation: 20,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'inplace')), makeStubLlm(cfg, () => 0.75));
    await engine.init();
    for (let i = 0; i < 25; i++) await engine.tick();

    const mutationEdges = engine.getLineageGraph().edges.filter((e) => e.kind === 'mutation');
    assert.strictEqual(mutationEdges.length, 0, 'in-place mutation created a lineage node');
    await engine.shutdown();
  });

  await test('branching still respects the population cap', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 20_000, maxConcurrency: 8,
      maxDevelopmentWip: 5, evaluationsPerTick: 3, trainingRunsToGraduate: 4,
      minPopulation: 2, crossoverRate: 0.3, mutationStrategy: 'branching', maxPopulation: 8,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'branchcap')), makeStubLlm(cfg, () => 0.85));
    await engine.init();
    for (let i = 0; i < 45; i++) await engine.tick();
    assert.ok(engine.getSkills().length <= 8, `population ${engine.getSkills().length} exceeded cap of 8`);
    await engine.shutdown();
  });

  // ---- audit regressions -------------------------------------------------
  console.log('\naudit regressions');

  await test('audit baseline survives evaluation trimming', () => {
    let rt: SkillRuntime = { evaluations: [], trainedScenarioIds: [], consecutiveRegressionFailures: 0, trainingRefinements: 0 };
    for (let i = 0; i < 300; i++) {
      rt.evaluations.push({
        scenarioId: 's', scenarioName: 'S', holdout: true, score: 40 + i * 0.2,
        ruleCompliance: 100, hallucinationFlags: 0, criticalViolations: 0,
        timestamp: new Date(1e12 + i * 1000).toISOString(), callsUsed: 2,
      });
      rt = trimRuntime(rt);
    }
    assert.ok(rt.evaluations.length <= 80, `window not enforced (${rt.evaluations.length})`);
    // evaluations[0] has rolled over; the stored baseline must still be the first run.
    assert.strictEqual(rt.baseline?.score, 40, 'baseline drifted as history rolled over');
    assert.notStrictEqual(rt.evaluations[0].score, 40, 'test did not actually exercise trimming');

    const compressed = compressRetiredRuntime(rt);
    assert.strictEqual(compressed.baseline?.score, 40, 'baseline lost on retirement');
    assert.ok(compressed.evaluations.length <= 5, 'retired runtime not compressed');
    assert.deepStrictEqual(compressed.recentOutputs, [], 'retired outputs not dropped');
  });

  await test('retired skills are pruned but lineage ancestors are kept', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 40_000, maxConcurrency: 8,
      maxPopulation: 4, maxDevelopmentWip: 3, evaluationsPerTick: 3,
      extinctionGracePeriod: 1, extinctionFloor: 99, retiredRetention: 5,
      minPopulation: 2, crossoverRate: 0.4,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'prune')), makeStubLlm(cfg, () => 0.35));
    await engine.init();
    for (let i = 0; i < 40; i++) await engine.tick();

    const all = engine.getSkills(true);
    const retired = all.length - engine.getSkills().length;
    assert.ok(retired > 0, 'nothing was retired, so pruning was never exercised');
    assert.ok(
      all.length <= cfg.retiredRetention + cfg.maxPopulation + 5,
      `population record grew unbounded (${all.length} with retention ${cfg.retiredRetention})`,
    );

    // Pruning must never orphan a living skill's recorded ancestry.
    const codes = new Set(all.map((s) => s.code));
    for (const s of engine.getSkills()) {
      for (const parent of s.evolutionLineage.parents ?? []) {
        assert.ok(codes.has(parent), `pruning left ${s.code} with a dangling parent ${parent}`);
      }
    }
    const graph = engine.getLineageGraph();
    for (const e of graph.edges) {
      assert.ok(graph.nodes.some((n) => n.skillId === e.sourceSkillId), 'edge from a pruned node');
      assert.ok(graph.nodes.some((n) => n.skillId === e.targetSkillId), 'edge to a pruned node');
    }
    await engine.shutdown();
  });

  await test('scenario text is stripped from the snapshot and restored on load', async () => {
    const dir = path.join(tmpDir, 'rehydrate');
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxDevelopmentWip: 3, evaluationsPerTick: 2, minPopulation: 2,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(dir), makeStubLlm(cfg, () => 0.9));
    await engine.init();
    for (let i = 0; i < 8; i++) await engine.tick();
    const before = engine.getSkills().flatMap((s) => s.testCases).filter((t) => t.inputScenario.length > 0).length;
    await engine.shutdown();

    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf-8'));
    const onDisk = raw.skills.flatMap((s: any) => s.testCases).filter((t: any) => t.inputScenario);
    assert.strictEqual(onDisk.length, 0, 'static scenario text was persisted per skill');

    const reloaded = new EvolutionEngine(cfg, new FileEvolutionStore(dir), makeStubLlm(cfg, () => 0.9));
    await reloaded.init();
    const after = reloaded.getSkills().flatMap((s) => s.testCases).filter((t) => t.inputScenario.length > 0).length;
    assert.strictEqual(after, before, 'rehydration lost scenario text');
    await reloaded.shutdown();
  });

  await test('the live-population cache invalidates on retirement and creation', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8,
      maxPopulation: 5, maxDevelopmentWip: 4, evaluationsPerTick: 3,
      extinctionGracePeriod: 1, extinctionFloor: 99, minPopulation: 2,
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'cache')), makeStubLlm(cfg, () => 0.3));
    await engine.init();

    for (let i = 0; i < 20; i++) {
      await engine.tick();
      // A stale cache would show retired skills as live, or miss new ones.
      const live = engine.getSkills();
      const all = engine.getSkills(true);
      assert.ok(live.length <= all.length, 'live exceeded total');
      assert.ok(live.length <= cfg.maxPopulation, `cache served a stale over-cap population (${live.length})`);
    }
    await engine.shutdown();
  });

  // ---- round-two fixes -------------------------------------------------
  console.log('\nscenario substrate');

  await test('every vector has held-out AND training coverage', () => {
    const { training, holdout } = splitScenarios(SCENARIO_BANK, DEFAULT_CONFIG.holdoutFraction);
    for (const row of validateSplit(training, holdout, ALL_VECTORS)) {
      assert.ok(row.holdout >= MIN_PER_VECTOR_PER_SIDE, `${row.vector}: only ${row.holdout} held-out`);
      assert.ok(row.training >= MIN_PER_VECTOR_PER_SIDE, `${row.vector}: only ${row.training} training`);
    }
  });

  await test('split is independent of input order', () => {
    const a = splitScenarios(SCENARIO_BANK, 0.35).holdout.map((s) => s.id).join();
    const b = splitScenarios([...SCENARIO_BANK].reverse(), 0.35).holdout.map((s) => s.id).join();
    assert.strictEqual(a, b);
  });

  await test('scenarios sharing no vector are never offered', () => {
    for (const v of ALL_VECTORS) {
      for (const s of scenariosForVectors(SCENARIO_BANK, [v])) {
        assert.ok(s.vectors.includes(v), `${s.id} offered for ${v} with no overlap`);
      }
    }
  });

  await test("the Simpson's paradox scenario actually contains one", () => {
    const s = SCENARIO_BANK.find((x) => x.id === 'scen-19')!;
    const nums = [...s.inputScenario.matchAll(/(\d+) treated, (\d+) survived/g)].map((m) => [+m[1], +m[2]]);
    const [aMild, aSev, bMild, bSev] = nums;
    const rate = ([t, v]: number[]) => v / t;
    const overall = (x: number[], y: number[]) => (x[1] + y[1]) / (x[0] + y[0]);
    assert.ok(rate(aMild) > rate(bMild) && rate(aSev) > rate(bSev), 'A must win both subgroups');
    assert.ok(overall(aMild, aSev) < overall(bMild, bSev), 'A must lose in aggregate, or it is not a paradox');
  });

  await test('an evaluation on a trained scenario never counts as held-out', () => {
    const rt = runtimeWith([97, 97, 97, 97, 97, 97], true, ['a', 'b', 'c', 'd', 'e', 'f']);
    rt.trainedScenarioIds = ['a', 'b', 'c'];
    const f = summariseFitness(rt, 95);
    assert.strictEqual(f.holdoutRuns, 3, 'trained-scenario runs leaked into held-out evidence');
    assert.strictEqual(f.distinctHoldoutScenarios, 3);
  });

  await test('distinct-scenario gate scales with the skill\'s relevant scenarios', () => {
    const rt = runtimeWith([97, 97, 97, 97, 97, 97], true, ['a', 'b', 'a', 'b', 'a', 'b']);
    const f = summariseFitness(rt, 95);
    // 2 relevant → requires both. 8 relevant → requires 6 (75%), so 2 distinct fails.
    assert.ok(evaluatePromotionGate(f, DEFAULT_CONFIG, 95, 2).passed, 'blocked a skill that covered all its relevant scenarios');
    assert.ok(!evaluatePromotionGate(f, DEFAULT_CONFIG, 95, 8).passed, 'promoted with 2 of 8 relevant scenarios');
    const thin = evaluatePromotionGate(f, DEFAULT_CONFIG, 95, 1);
    assert.ok(!thin.passed, 'promoted a skill with fewer relevant scenarios than the floor');
    assert.match(thin.blockingReason ?? '', /relevant scenarios to exist/);
  });

  await test('a skill with no relevant scenario is not scored, and the gap is reported', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 4, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'gap')), makeStubLlm(cfg, () => 0.9));
    await engine.init();
    await engine.tick();
    const skill = engine.getSkills()[0];
    if (!skill) { await engine.shutdown(); return; }
    // Force a vector set no scenario covers, then evaluate.
    (skill as any).vectors = ['Not A Real Vector'];
    const before = engine.getFitness(skill.id)!.totalEvaluations;
    for (let i = 0; i < 3; i++) await engine.tick();
    assert.strictEqual(engine.getFitness(skill.id)!.totalEvaluations, before, 'skill was scored on unrelated scenarios');
    const gaps = engine.getEvents(200).filter((e) => e.skillId === skill.id && /No (held-out|training) scenario/.test(e.message));
    assert.ok(gaps.length >= 1, 'coverage gap was not reported');
    assert.ok(gaps.length <= 2, `coverage gap reported ${gaps.length} times instead of once per pool`);
    await engine.shutdown();
  });

  console.log('\nconflict convergence');

  await test('a clean pair is checked once per genome version, not every tick', async () => {
    const cfg: EvolutionConfig = {
      ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 40_000, maxConcurrency: 8,
      maxDevelopmentWip: 4, evaluationsPerTick: 3, trainingRunsToGraduate: 1, minPopulation: 2, crossoverRate: 0,
      mutationStrategy: 'in-place',
    };
    const llm = makeStubLlm(cfg, () => 1.0);
    const pairs: string[] = [];
    const base = (llm as any).generateJson;
    (llm as any).generateJson = async (opts: { prompt: string }) => {
      if (opts.prompt.includes('Decide whether their conclusions')) {
        const a = opts.prompt.match(/## AGENT A — ([^(]+)/)![1].trim();
        const b = opts.prompt.match(/## AGENT B — ([^(]+)/)![1].trim();
        pairs.push([a, b].sort().join('|'));
        return { inConflict: false, severity: 'NONE' };
      }
      return base(opts);
    };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'conv')), llm);
    await engine.init();
    for (let i = 0; i < 40; i++) await engine.tick();
    const counts = new Map<string, number>();
    for (const p of pairs) counts.set(p, (counts.get(p) ?? 0) + 1);
    const worst = Math.max(0, ...counts.values());
    // In-place mutation can legitimately change a genome a few times.
    assert.ok(worst <= cfg.trainingRunsToGraduate + 2, `one pair re-checked ${worst} times`);
    await engine.shutdown();
  });

  await test('comparison key changes when a genome changes, not when an output does', () => {
    const a = makeSkill({ id: 'a' });
    const b = makeSkill({ id: 'b' });
    const k1 = comparisonKey(a, b);
    assert.strictEqual(comparisonKey(b, a), k1, 'key depends on argument order');
    const mutated = makeSkill({ id: 'a', strictRules: ['RULE 1: something new entirely.'] });
    assert.notStrictEqual(comparisonKey(mutated, b), k1, 'key ignored a genome change');
    assert.notStrictEqual(genomeFingerprint(a), genomeFingerprint(mutated));
  });

  console.log('\nprojection cache');

  await test('cached projections refresh after the engine changes state', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8, maxDevelopmentWip: 3, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'pcache')), makeStubLlm(cfg, () => 0.9));
    await engine.init();
    await engine.tick();
    const first = engine.getHeatmap();
    assert.strictEqual(engine.getHeatmap(), first, 'cache missed with no state change');
    for (let i = 0; i < 3; i++) await engine.tick();
    const later = engine.getHeatmap();
    assert.notStrictEqual(later, first, 'cache served stale data after ticks');
    const runs = (h: typeof first) => h.points.reduce((n, p) => n + p.testRuns, 0);
    assert.ok(runs(later) >= runs(first), 'later heatmap has fewer runs than earlier');
    await engine.shutdown();
  });

  console.log('\nrequest-boundary security');

  await test('safeJoin refuses every traversal form', () => {
    const base = path.join(tmpDir, 'artifacts');
    for (const bad of ['../x.wav', '..\\x.wav', 'a/b.wav', '/etc/passwd', '..', '.env', '', 'x\0.wav', '....//x.wav']) {
      assert.throws(() => safeJoin(base, bad, ['.wav']), UnsafePathError, `accepted ${JSON.stringify(bad)}`);
    }
    assert.throws(() => safeJoin(base, 'run.sh', ['.wav']), UnsafePathError, 'accepted a disallowed extension');
    assert.throws(() => safeJoin(base, 42 as any), UnsafePathError, 'accepted a non-string');
    assert.strictEqual(safeJoin(base, 'brief.wav', ['.wav']), path.join(path.resolve(base), 'brief.wav'));
  });

  await test('parseTicker accepts real symbols and rejects paths', () => {
    for (const ok of ['AAPL', 'brk.b', 'RDS-A', '7203']) assert.ok(parseTicker(ok), `rejected ${ok}`);
    for (const bad of ['../x', 'a/b', '', 'TOOLONGTICKER1', '.hidden', 'A B', null, 42]) {
      assert.strictEqual(parseTicker(bad as any), null, `accepted ${JSON.stringify(bad)}`);
    }
  });

  await test('operator guard: loopback, forwarded, and token cases', () => {
    const run = (remote: string, headers: Record<string, string>, env: Record<string, string | undefined>) => {
      const saved = { t: process.env.EVOLUTION_API_TOKEN, r: process.env.EVOLUTION_ALLOW_REMOTE };
      process.env.EVOLUTION_API_TOKEN = env.token;
      if (env.token === undefined) delete process.env.EVOLUTION_API_TOKEN;
      if (env.remote) process.env.EVOLUTION_ALLOW_REMOTE = env.remote; else delete process.env.EVOLUTION_ALLOW_REMOTE;
      let status = 200;
      const res: any = { status: (s: number) => { status = s; return res; }, json: () => res };
      requireOperator({ socket: { remoteAddress: remote }, headers } as any, res, () => {});
      if (saved.t === undefined) delete process.env.EVOLUTION_API_TOKEN; else process.env.EVOLUTION_API_TOKEN = saved.t;
      if (saved.r === undefined) delete process.env.EVOLUTION_ALLOW_REMOTE; else process.env.EVOLUTION_ALLOW_REMOTE = saved.r;
      return status;
    };
    const tok = 'a-long-enough-operator-token';
    assert.strictEqual(run('127.0.0.1', {}, {}), 200, 'blocked plain loopback');
    assert.strictEqual(run('127.0.0.1', { 'x-forwarded-for': '1.2.3.4' }, {}), 401, 'same-host proxy treated as loopback');
    assert.strictEqual(run('10.0.0.5', {}, {}), 401, 'allowed remote with no token configured');
    assert.strictEqual(run('10.0.0.5', { authorization: 'Bearer wrong' }, { token: tok }), 401, 'accepted a wrong token');
    assert.strictEqual(run('10.0.0.5', { authorization: `Bearer ${tok}` }, { token: tok }), 200, 'rejected the right token');
    assert.strictEqual(run('10.0.0.5', { authorization: 'Bearer short' }, { token: 'short' }), 401, 'accepted a token under 16 chars');
    assert.strictEqual(run('10.0.0.5', {}, { remote: 'true' }), 200, 'ignored EVOLUTION_ALLOW_REMOTE');
    assert.ok(!isTrueLoopback({ socket: { remoteAddress: '::1' }, headers: { forwarded: 'for=1.2.3.4' } } as any));
  });

  await test('a snapshot from an older split is migrated without contaminating held-out evidence', async () => {
    const dir = path.join(tmpDir, 'migrate');
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 4, minPopulation: 2 };

    // Build a real snapshot, then rewrite it as if an older split had produced it.
    const seed = new EvolutionEngine(cfg, new FileEvolutionStore(dir), makeStubLlm(cfg, () => 0.9));
    await seed.init();
    await seed.tick();
    await seed.shutdown();

    const { training, holdout } = splitScenarios(SCENARIO_BANK, cfg.holdoutFraction);
    const nowTraining = training[0].id; // was held-out in the old split
    const nowHoldout = holdout[0].id;   // was training in the old split
    const snapPath = path.join(dir, 'state.json');
    const snap = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
    const oldHoldout = [nowTraining, ...holdout.slice(1).map((h) => h.id)];
    snap.holdoutScenarioIds = oldHoldout;

    const skillId = snap.skills[0].id;
    const mk = (scenarioId: string, isHoldout: boolean) => ({
      scenarioId, scenarioName: scenarioId, holdout: isHoldout, score: 97, ruleCompliance: 100,
      hallucinationFlags: 0, criticalViolations: 0, timestamp: new Date().toISOString(), callsUsed: 2,
    });
    snap.runtime[skillId].evaluations = [
      mk(nowTraining, true),  // tagged held-out under the old split
      mk(nowTraining, true),
      mk(nowHoldout, false),  // run as training under the old split
    ];
    snap.runtime[skillId].trainedScenarioIds = [];
    fs.writeFileSync(snapPath, JSON.stringify(snap));

    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(dir), makeStubLlm(cfg, () => 0.9));
    await engine.init();

    const f = engine.getFitness(skillId)!;
    // Neither old-held-out runs (scenario is training now) nor the old training
    // run (skill may have been tuned on it) may count as held-out evidence.
    assert.strictEqual(f.holdoutRuns, 0, `${f.holdoutRuns} contaminated runs counted as held-out after migration`);

    const migration = engine.getEvents(50).find((e) => /Scenario split changed/.test(e.message));
    assert.ok(migration, 'migration ran silently');
    assert.match(migration!.message, /2 evaluations downgraded/);

    // The scenario that moved into held-out must be barred for this skill.
    const gate = engine.getPromotionGate(skillId)!;
    assert.ok(!gate.passed);
    await engine.shutdown();

    // A second load with the split unchanged must not migrate again.
    const again = new EvolutionEngine(cfg, new FileEvolutionStore(dir), makeStubLlm(cfg, () => 0.9));
    await again.init();
    assert.ok(
      !again.getEvents(50).some((e) => /Scenario split changed/.test(e.message) && Date.parse(e.timestamp) > Date.parse(migration!.timestamp)),
      'migration ran again on an unchanged split',
    );
    await again.shutdown();
  });

  await test('a model rejecting logprobs degrades to null certainty instead of failing', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, maxCallsPerHour: 100, maxConcurrency: 2 };
    const llm = new LlmClient(cfg, 'k');
    const flags: boolean[] = [];
    (llm as any).ai.models.generateContent = async ({ model, config }: any) => {
      flags.push(!!config.responseLogprobs);
      if (config.responseLogprobs && model === 'm-no-lp') throw new Error('400 INVALID_ARGUMENT: responseLogprobs is not supported');
      return { text: 'ok', usageMetadata: {}, candidates: [{ avgLogprobs: config.responseLogprobs ? -0.2 : undefined }] };
    };
    const r = await llm.generateWithTelemetry({ model: 'm-no-lp', prompt: 'p' });
    await llm.generateWithTelemetry({ model: 'm-no-lp', prompt: 'p' });
    assert.strictEqual(r.text, 'ok');
    assert.strictEqual(r.telemetry.avgLogprob, null);
    assert.deepStrictEqual(flags, [true, false, false], 'did not stop requesting logprobs from that model');
    assert.strictEqual(llm.budget.status().inFlight, 0, 'leaked a concurrency slot');
    (llm as any).ai.models.generateContent = async () => { throw new Error('API key not valid. API_KEY_INVALID'); };
    await assert.rejects(() => llm.generate({ model: 'm2', prompt: 'p' }), AuthFailureError);
  });

  await test('an engine with no champions reports empty audits, not seed data', async () => {
    const cfg: EvolutionConfig = { ...DEFAULT_CONFIG, autoStart: false, maxCallsPerHour: 10_000, maxConcurrency: 8, minPopulation: 2 };
    const engine = new EvolutionEngine(cfg, new FileEvolutionStore(path.join(tmpDir, 'empty')), makeStubLlm(cfg, () => 0.2));
    await engine.init();
    for (let i = 0; i < 10; i++) await engine.tick();

    const { audits, stats } = engine.getAudits();
    assert.strictEqual(audits.length, 0);
    assert.strictEqual(stats.totalAuditedChampions, 0);
    assert.strictEqual(stats.averageMutationRate, 0);
    await engine.shutdown();
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

void main();
