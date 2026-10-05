/**
 * The evolution engine.
 *
 * One tick performs a bounded amount of work, in priority order:
 *
 *   1. Regression-test a champion       (protects what already works)
 *   2. Evaluate a testing-stage skill   (drives promotion)
 *   3. Refine a training-stage skill    (drives improvement)
 *   4. Smoke-test an idea               (admits or rejects new genomes)
 *   5. Produce variation                (crossover or a fresh proposal)
 *   6. Cull                             (retire the unfit, relieve niche pressure)
 *
 * Priority order matters: under a constrained budget the engine protects
 * existing champions before it explores. Each phase checks the budget before
 * spending, so a tick degrades gracefully rather than failing partway through.
 */

import { EventEmitter } from 'events';
import type { AgentSkill, EvolutionStats, VectorCategory } from '../../src/types/skills.ts';
import { loadConfig, type EvolutionConfig } from './config.ts';
import { LlmClient, BudgetExhaustedError, AuthFailureError } from './llm.ts';
import {
  FileEvolutionStore,
  trimRuntime,
  compressRetiredRuntime,
  type EngineCounters,
  type EvolutionEvent,
  type EvolutionSnapshot,
  type SkillRuntime,
} from './store.ts';
import {
  SCENARIO_BANK,
  splitScenarios,
  scenariosForVectors,
  validateSplit,
  type ExecutableScenario,
} from './scenarios.ts';
import { evaluate, toTestCase } from './evaluator.ts';
import { findCandidatePairs, detectConflict } from './conflicts.ts';
import { runBenchmark, runSwarm, InsufficientBudgetError } from './runs.ts';
import { buildLineageGraph } from './lineageGraph.ts';
import type { SkillConflictPair } from '../../src/types/skillConflicts.ts';
import {
  projectHeatmap,
  projectChampionAudits,
  projectAuditStats,
  projectSkillAudit,
  projectCognitiveProfiles,
  projectMutationOutcomes,
  type HeatmapProjection,
} from './projections.ts';
import {
  summariseFitness,
  evaluatePromotionGate,
  shouldDemote,
  shouldRetire,
  tournamentSelect,
  underrepresentedVectors,
  oversubscribedNiches,
  type FitnessSummary,
} from './fitness.ts';
import {
  proposeSkill,
  mutateSkill,
  crossoverSkills,
  selectMutationType,
  ALL_VECTORS,
} from './genome.ts';

export interface EngineStatus {
  running: boolean;
  tickCount: number;
  lastTickAt: string | null;
  lastTickDurationMs: number | null;
  nextTickAt: string | null;
  budget: ReturnType<LlmClient['budget']['status']>;
  lastError: string | null;
}

export class EvolutionEngine extends EventEmitter {
  private cfg: EvolutionConfig;
  private llm: LlmClient;
  private store: FileEvolutionStore;

  private skills: AgentSkill[] = [];
  private runtime = new Map<string, SkillRuntime>();
  private counters: EngineCounters;
  private trainingScenarios: ExecutableScenario[] = [];
  private holdoutScenarios: ExecutableScenario[] = [];
  private conflicts: SkillConflictPair[] = [];
  private checkedComparisons = new Set<string>();
  /** Set when a load migrated evaluations; the result is persisted immediately. */
  private splitMigrated = false;
  /**
   * Cached live population. live() is called on the order of twenty times per
   * tick and filters the full skill list, retired included — which grows without
   * bound. The cache is invalidated whenever the population changes.
   */
  private liveCache: AgentSkill[] | null = null;

  /**
   * Bumped on every emitted event. Every state change the dashboard can observe
   * emits one, which makes it a free and complete invalidation signal for the
   * projection cache below.
   */
  private stateVersion = 0;
  private projectionCache = new Map<string, { version: number; value: unknown }>();

  /**
   * Projections were rebuilt on every request — O(skills × evaluations) for the
   * heatmap — even though they only change when the engine does something. With
   * several dashboard tabs open that was the same work repeated per tab per poll.
   */
  private cached<T>(key: string, build: () => T): T {
    const hit = this.projectionCache.get(key);
    if (hit && hit.version === this.stateVersion) return hit.value as T;
    const value = build();
    this.projectionCache.set(key, { version: this.stateVersion, value });
    return value;
  }

  private timer: NodeJS.Timeout | null = null;
  private ticking = false;
  private running = false;
  private lastTickAt: string | null = null;
  private lastTickDurationMs: number | null = null;
  private lastError: string | null = null;
  /** Set when a phase hits a terminal auth failure; stops the rest of the tick. */
  private haltedThisTick = false;
  private recentEvents: EvolutionEvent[] = [];

  constructor(
    cfg: EvolutionConfig = loadConfig(),
    store = new FileEvolutionStore(),
    llm?: LlmClient,
  ) {
    super();
    this.cfg = cfg;
    this.store = store;
    // Injectable so tests can drive a full tick against a stub instead of the API.
    this.llm = llm ?? new LlmClient(cfg);
    this.counters = {
      tickCount: 0,
      dailyMutations: 0,
      championsTestedToday: 0,
      totalEvaluations: 0,
      totalModelCalls: 0,
      countersDay: today(),
      generationEpoch: 1,
    };

    const split = splitScenarios(SCENARIO_BANK, cfg.holdoutFraction);
    this.trainingScenarios = split.training;
    this.holdoutScenarios = split.holdout;
  }

  // ---- lifecycle --------------------------------------------------------

  async init(): Promise<void> {
    // Event history first: anything emitted below during load (a split
    // migration) must land on top of it, not be overwritten by a later read.
    this.recentEvents = await this.store.readEvents(60);

    const snapshot = await this.store.load();
    if (snapshot) {
      this.skills = snapshot.skills.map((s) => this.rehydrateSkill(s));
      this.runtime = new Map(Object.entries(snapshot.runtime));
      this.counters = snapshot.counters;
      this.conflicts = snapshot.conflicts ?? [];
      this.checkedComparisons = new Set(snapshot.checkedComparisons ?? []);
      // Must run after runtime is loaded. It previously ran before, iterated an
      // empty map, and silently did nothing — so evaluations tagged held-out
      // under an old split kept counting toward promotion.
      this.migrateSplitIfChanged(snapshot.holdoutScenarioIds ?? []);
      this.invalidateLive();
      this.rolloverCountersIfNeeded();
      console.log(`[evolution] resumed with ${this.skills.length} skills, tick ${this.counters.tickCount}`);
    } else {
      console.log('[evolution] cold start — no snapshot found');
    }
    // Persist a migration now. Otherwise the snapshot keeps the old split ids,
    // and every restart before the next tick re-runs the migration.
    if (this.splitMigrated) {
      await this.persist();
      await this.store.flush();
      this.splitMigrated = false;
    }
    if (this.cfg.autoStart) this.start();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNext(1000);
    this.emitEvent({
      type: 'tick_start',
      skillCode: 'ENGINE',
      message: 'Evolution loop started.',
      status: 'success',
    });
  }

  pause(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.emitEvent({
      type: 'tick_complete',
      skillCode: 'ENGINE',
      message: 'Evolution loop paused.',
      status: 'warning',
    });
  }

  async shutdown(): Promise<void> {
    this.pause();
    await this.persist();
    await this.store.flush();
  }

  resetBudget(): void {
    this.llm.budget.reset();
    this.lastError = null;
    this.emitEvent({
      type: 'tick_complete',
      skillCode: 'ENGINE',
      message: 'Model call budget and rate limits reset by operator.',
      status: 'success',
    });
  }

  private scheduleNext(delayMs = this.cfg.tickIntervalMs): void {
    if (!this.running) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.tick().finally(() => this.scheduleNext());
    }, delayMs);
  }

  status(): EngineStatus {
    return {
      running: this.running,
      tickCount: this.counters.tickCount,
      lastTickAt: this.lastTickAt,
      lastTickDurationMs: this.lastTickDurationMs,
      nextTickAt:
        this.running && this.lastTickAt
          ? new Date(Date.parse(this.lastTickAt) + this.cfg.tickIntervalMs).toISOString()
          : null,
      budget: this.llm.budget.status(),
      lastError: this.lastError,
    };
  }

  // ---- the tick ---------------------------------------------------------

  async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    const started = Date.now();
    this.haltedThisTick = false;
    this.rolloverCountersIfNeeded();

    try {
      this.counters.tickCount++;
      this.emitEvent({
        type: 'tick_start',
        skillCode: 'MATRIX PULSE',
        message: `Tick ${this.counters.tickCount} started. Population ${this.live().length}.`,
        status: 'progress',
      });

      // Two calls per evaluation; refuse to start a tick that cannot finish one.
      if (!this.llm.budget.canAfford(2)) {
        this.emitEvent({
          type: 'budget_throttled',
          skillCode: 'ENGINE',
          message: `Model call budget exhausted (${this.llm.budget.status().callsInWindow}/${this.cfg.maxCallsPerHour} this hour). Idling until the window clears.`,
          status: 'warning',
        });
        return;
      }

      await this.phaseChampionRegression();
      await this.phaseAdvanceTesting();
      await this.phaseRefineTraining();
      await this.phaseSmokeTestIdeas();
      await this.phaseVariation();
      await this.phaseDetectConflicts();
      this.phaseCull();
      this.pruneRetired();

      this.recomputeDerivedFields();
      await this.persist();

      if (this.haltedThisTick) {
        // Don't report a halted tick as complete, and don't clear the error
        // that halted it.
        this.emitEvent({
          type: 'tick_complete',
          skillCode: 'MATRIX PULSE',
          message: `Tick ${this.counters.tickCount} halted early after a terminal failure.`,
          status: 'error',
        });
      } else {
        this.lastError = null;
        this.emitEvent({
          type: 'tick_complete',
          skillCode: 'MATRIX PULSE',
          message: `Tick ${this.counters.tickCount} complete in ${Math.round((Date.now() - started) / 1000)}s. ${this.llm.budget.status().remaining} model calls left this hour.`,
          status: 'success',
        });
      }
    } catch (err) {
      if (err instanceof AuthFailureError) {
        this.handleAuthFailure(err);
        return;
      }
      if (err instanceof BudgetExhaustedError) {
        this.emitEvent({
          type: 'budget_throttled',
          skillCode: 'ENGINE',
          message: `Model call budget exhausted (${this.llm.budget.status().callsInWindow}/${this.cfg.maxCallsPerHour} this hour). Pausing active ticks until quota resets.`,
          status: 'warning',
        });
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.lastError = message;
      // A failed tick must not kill the loop; the next one retries from the
      // persisted snapshot.
      this.emitEvent({
        type: 'error',
        skillCode: 'ENGINE',
        message: `Tick ${this.counters.tickCount} failed: ${message}`,
        status: 'error',
      });
      console.error('[evolution] tick failed', err);
    } finally {
      this.lastTickAt = new Date().toISOString();
      this.lastTickDurationMs = Date.now() - started;
      this.counters.totalModelCalls = this.llm.callCount;
      this.ticking = false;
    }
  }

  /** Champions are re-tested on held-out scenarios; sustained regression demotes. */
  private async phaseChampionRegression(): Promise<void> {
    if (this.haltedThisTick) return;
    const champions = this.live().filter((s) => s.stage === 'champion');
    if (champions.length === 0 || !this.llm.budget.canAfford(2)) return;

    // Test whichever champion has gone longest without a check.
    const target = [...champions].sort(
      (a, b) => Date.parse(a.lastEvaluatedAt) - Date.parse(b.lastEvaluatedAt),
    )[0];
    const scenario = this.pickScenario(target, this.holdoutScenarios);
    if (!scenario) return;

    const result = await this.runEvaluation(target, scenario, true);
    if (!result) return;

    this.counters.championsTestedToday++;
    const rt = this.rt(target.id);

    if (result.score < this.cfg.demotionThreshold) {
      rt.consecutiveRegressionFailures++;
      const { demote, reason } = shouldDemote(rt, this.cfg);
      if (demote) {
        target.stage = 'testing';
        rt.consecutiveRegressionFailures = 0;
        target.stageHistory.push({
          stage: 'testing',
          timestamp: new Date().toISOString(),
          score: result.score,
          notes: `Demoted: ${reason}`,
        });
        this.emitEvent({
          type: 'champion_demoted',
          skillId: target.id,
          skillCode: target.code,
          message: `${target.name} lost champion status. ${reason}`,
          status: 'warning',
          detail: { score: result.score, scenario: scenario.name },
        });
      } else {
        this.emitEvent({
          type: 'benchmark_run',
          skillId: target.id,
          skillCode: target.code,
          message: `${target.name} regressed to ${result.score}% on ${scenario.shortName} (${rt.consecutiveRegressionFailures}/${this.cfg.demotionPatience} before demotion).`,
          status: 'warning',
        });
      }
    } else {
      rt.consecutiveRegressionFailures = 0;
    }
  }

  /** Testing-stage skills accumulate held-out evidence toward the promotion gate. */
  private async phaseAdvanceTesting(): Promise<void> {
    if (this.haltedThisTick) return;
    for (let i = 0; i < this.cfg.evaluationsPerTick; i++) {
      if (!this.llm.budget.canAfford(2)) return;
      const testing = this.live().filter((s) => s.stage === 'testing');
      if (testing.length === 0) return;
      // Least-recently-evaluated first, so evidence accumulates evenly instead
      // of one skill monopolising the budget.
      const target = [...testing].sort(
        (a, b) => Date.parse(a.lastEvaluatedAt) - Date.parse(b.lastEvaluatedAt),
      )[0];
      const scenario = this.pickScenario(target, this.holdoutScenarios);
      if (!scenario) return;
      await this.evaluateTestingCandidate(target, scenario);
    }
  }

  private async evaluateTestingCandidate(
    target: AgentSkill,
    scenario: ExecutableScenario,
  ): Promise<void> {
    const result = await this.runEvaluation(target, scenario, true);
    if (!result) return;

    const fitness = summariseFitness(this.rt(target.id), target.threshold);
    const gate = evaluatePromotionGate(fitness, this.cfg, target.threshold, this.relevantHoldoutCount(target));

    if (gate.passed) {
      target.stage = 'champion';
      target.stageHistory.push({
        stage: 'champion',
        timestamp: new Date().toISOString(),
        score: fitness.holdoutMean,
        notes: `Promoted on ${fitness.holdoutRuns} held-out runs across ${fitness.distinctHoldoutScenarios} scenarios, σ ${fitness.holdoutStdDev}.`,
      });
      this.emitEvent({
        type: 'champion_promoted',
        skillId: target.id,
        skillCode: target.code,
        message: `${target.name} cleared every promotion gate at ${fitness.holdoutMean}% held-out mean and is now a champion.`,
        status: 'success',
        detail: { gate: gate.checks, fitness },
      });
    } else {
      this.emitEvent({
        type: 'evaluation',
        skillId: target.id,
        skillCode: target.code,
        message: `${target.name} scored ${result.score}% on ${scenario.shortName}. Blocked on — ${gate.blockingReason}`,
        status: 'progress',
        detail: { gate: gate.checks },
      });
    }
  }

  /**
   * Training-stage skills are evaluated on training scenarios and, once they
   * have enough signal, mutated against their own worst results. The mutation
   * replaces the parent in place: this is a hill-climb, not a branching search.
   */
  private async phaseRefineTraining(): Promise<void> {
    if (this.haltedThisTick) return;
    for (let i = 0; i < this.cfg.evaluationsPerTick; i++) {
      if (!this.llm.budget.canAfford(2)) return;
      const training = this.live().filter((s) => s.stage === 'training');
      if (training.length === 0) return;
      const target = [...training].sort(
        (a, b) => Date.parse(a.lastEvaluatedAt) - Date.parse(b.lastEvaluatedAt),
      )[0];
      await this.refineTrainingCandidate(target);
    }
  }

  private async refineTrainingCandidate(target: AgentSkill): Promise<void> {
    const rt = this.rt(target.id);
    const scenario = this.pickScenario(target, this.trainingScenarios);
    if (!scenario) return;

    const result = await this.runEvaluation(target, scenario, false);
    if (!result) return;

    rt.trainedScenarioIds = [...new Set([...rt.trainedScenarioIds, scenario.id])];
    const fitness = summariseFitness(rt, target.threshold);

    // Enough signal accumulated: mutate against the worst of it.
    if (rt.trainingRefinements < this.cfg.trainingRunsToGraduate && this.llm.budget.canAfford(1)) {
      const worst = [...rt.evaluations]
        .filter((e) => !e.holdout)
        .sort((a, b) => a.score - b.score)
        .slice(0, 2);

      const failures = worst.map((e) => ({
        scenarioName: e.scenarioName,
        missedConstraints:
          target.testCases
            .find((tc) => tc.id === `tc-${e.scenarioId}`)
            ?.expectedConstraints.slice(0, 3) ?? [],
        unsupportedClaims: e.hallucinationFlags > 0 ? [`${e.hallucinationFlags} unsupported claim(s) recorded`] : [],
      }));

      const mutationType = selectMutationType(rt.evaluations.slice(-6));
      try {
        const { child, iteration } = await mutateSkill(
          this.llm,
          this.cfg,
          target,
          mutationType,
          failures,
          fitness.ewma,
        );

        // Branching keeps the parent alive so the two compete, which is what
        // puts a mutation edge in the lineage graph. It also adds a skill to the
        // pipeline, so it falls back to in-place when there is no room — a
        // branch that immediately gets culled for population pressure is worse
        // than a refinement, because it costs the same and keeps neither.
        const roomToBranch =
          this.live().length < this.cfg.maxPopulation &&
          this.live().filter((s) => s.stage !== 'champion').length < this.cfg.maxDevelopmentWip;

        if (this.cfg.mutationStrategy === 'branching' && roomToBranch) {
          this.spawnMutatedChild(target, child, iteration, fitness.ewma);
        } else {
          this.applyMutationInPlace(target, child, iteration, fitness.ewma);
        }
        rt.trainingRefinements++;
        this.counters.dailyMutations++;

        const branched = this.cfg.mutationStrategy === 'branching' && roomToBranch;
        this.emitEvent({
          type: 'mutation',
          skillId: branched ? child.id : target.id,
          skillCode: branched ? child.code : target.code,
          message: branched
            ? `${target.name} branched via ${mutationType} into ${child.name}: ${iteration.mutationDetails}`
            : `${target.name} mutated in place via ${mutationType}: ${iteration.mutationDetails}`,
          status: 'progress',
          detail: {
            strategy: branched ? 'branching' : 'in-place',
            ruleDiff: iteration.ruleDiff,
            mutationPercentage: iteration.mutationPercentage,
          },
        });
      } catch (err) {
        if (err instanceof AuthFailureError) return this.handleAuthFailure(err);
        if (!(err instanceof BudgetExhaustedError)) throw err;
      }
    }

    // Graduate once refined enough and clearing a reasonable bar on training data.
    if (rt.trainingRefinements >= this.cfg.trainingRunsToGraduate && fitness.ewma >= this.cfg.extinctionFloor + 10) {
      target.stage = 'testing';
      target.stageHistory.push({
        stage: 'testing',
        timestamp: new Date().toISOString(),
        score: fitness.ewma,
        notes: `Graduated after ${rt.trainingRefinements} refinements at EWMA ${fitness.ewma}%.`,
      });
      this.emitEvent({
        type: 'training_refined',
        skillId: target.id,
        skillCode: target.code,
        message: `${target.name} graduated to held-out testing at ${fitness.ewma}%.`,
        status: 'success',
      });
    }
  }

  /** One cheap evaluation decides whether a proposed genome is worth training. */
  private async phaseSmokeTestIdeas(): Promise<void> {
    if (this.haltedThisTick) return;
    const ideas = this.live().filter((s) => s.stage === 'idea');
    if (ideas.length === 0 || !this.llm.budget.canAfford(2)) return;

    const target = ideas[0];
    const scenario = this.pickScenario(target, this.trainingScenarios);
    if (!scenario) return;

    const result = await this.runEvaluation(target, scenario, false);
    if (!result) return;

    if (result.score >= this.cfg.ideaSmokeTestFloor) {
      target.stage = 'training';
      target.stageHistory.push({
        stage: 'training',
        timestamp: new Date().toISOString(),
        score: result.score,
        notes: `Cleared the smoke test at ${result.score}% (floor ${this.cfg.ideaSmokeTestFloor}%).`,
      });
      this.emitEvent({
        type: 'training_refined',
        skillId: target.id,
        skillCode: target.code,
        message: `${target.name} passed its smoke test at ${result.score}% and entered training.`,
        status: 'success',
      });
    } else {
      this.retire(target, `Failed smoke test at ${result.score}% (floor ${this.cfg.ideaSmokeTestFloor}%)`);
    }
  }

  /** Produce one new genome per tick — crossover if there are fit parents, else a fresh proposal. */
  private async phaseVariation(): Promise<void> {
    if (this.haltedThisTick) return;
    const live = this.live();
    if (live.length >= this.cfg.maxPopulation || !this.llm.budget.canAfford(1)) return;

    // Throughput guard. Adding genomes faster than they can be evaluated starves
    // every skill of the repeated held-out runs promotion needs, and the
    // population grows without anything ever graduating.
    const inDevelopment = live.filter((s) => s.stage !== 'champion').length;
    if (inDevelopment >= this.cfg.maxDevelopmentWip) return;

    const scored = live.map((skill) => ({
      skill,
      fitness: summariseFitness(this.rt(skill.id), skill.threshold),
    }));
    const viableParents = scored.filter((s) => s.fitness.totalEvaluations >= 2);

    const doCrossover =
      viableParents.length >= 2 &&
      live.length >= this.cfg.minPopulation &&
      Math.random() < this.cfg.crossoverRate;

    try {
      if (doCrossover) {
        const parentA = tournamentSelect(viableParents, this.cfg.tournamentSize);
        const parentB = parentA
          ? tournamentSelect(viableParents, this.cfg.tournamentSize, new Set([parentA.id]))
          : null;
        if (!parentA || !parentB) return;

        const fitA = scored.find((s) => s.skill.id === parentA.id)!.fitness.ewma;
        const fitB = scored.find((s) => s.skill.id === parentB.id)!.fitness.ewma;
        const { child, iteration } = await crossoverSkills(this.llm, this.cfg, parentA, parentB, fitA, fitB);
        child.evolutionLineage.iterations = [
          { ...iteration, scoreAfter: 0, performanceDelta: 0, testPassRate: 0, testCasesRun: 0, survived: true },
        ];

        this.addSkill(child);
        this.inheritTrainingExposure(child, [parentA, parentB]);
        this.counters.dailyMutations++;
        this.emitEvent({
          type: 'crossover',
          skillId: child.id,
          skillCode: child.code,
          message: `${child.name} recombined from ${parentA.name} and ${parentB.name}.`,
          status: 'success',
          detail: { parents: [parentA.code, parentB.code], strategy: iteration.recombinationStrategy },
        });
      } else {
        const gaps = underrepresentedVectors(live, ALL_VECTORS);
        const over = oversubscribedNiches(live, this.cfg);
        const targets = gaps.filter((v) => !over.has(v)).slice(0, 2);
        if (targets.length === 0) return;

        const child = await proposeSkill(
          this.llm,
          this.cfg,
          targets as VectorCategory[],
          live.map((s) => s.name),
          this.counters.generationEpoch,
        );
        this.addSkill(child);
        this.emitEvent({
          type: 'idea_generated',
          skillId: child.id,
          skillCode: child.code,
          message: `New genome proposed: ${child.name} — ${child.tagline}`,
          status: 'success',
          detail: { vectors: child.vectors, targetedGaps: targets },
        });
      }
    } catch (err) {
      if (err instanceof AuthFailureError) return this.handleAuthFailure(err);
      if (!(err instanceof BudgetExhaustedError)) throw err;
    }
  }

  /**
   * Check one candidate pair per tick for a genuine contradiction.
   *
   * Deliberately one pair: this costs a judge call, the pair space is quadratic
   * in population size, and most pairs never conflict. Checking exhaustively
   * would dominate the budget and crowd out the evaluations that actually drive
   * evolution.
   */
  private async phaseDetectConflicts(): Promise<void> {
    if (this.haltedThisTick) return;

    const live = this.live().filter((s) => s.stage === 'champion' || s.stage === 'testing');
    if (live.length < 2) return;

    const outputs = new Map(live.map((s) => [s.id, this.rt(s.id).recentOutputs ?? []] as const));
    const flagged = new Set(this.conflicts.map((c) => [c.skillAId, c.skillBId].sort().join('|')));
    const candidates = findCandidatePairs(live, outputs, flagged, this.checkedComparisons);
    const bank = [...this.trainingScenarios, ...this.holdoutScenarios];

    for (const candidate of candidates.slice(0, this.cfg.conflictChecksPerTick)) {
      if (this.haltedThisTick || !this.llm.budget.canAfford(1)) return;
      const { a, b, scenarioId, outA, outB, key } = candidate;
      const scenario = bank.find((s) => s.id === scenarioId);
      if (!scenario) continue;

      try {
        const conflict = await detectConflict(this.llm, this.cfg, a, b, scenario, outA, outB);
        // Record the comparison whatever the verdict. Recording only conflicts is
        // what left a clean pair at the head of the queue forever.
        this.checkedComparisons.add(key);
        if (!conflict) continue;

        this.conflicts = [conflict, ...this.conflicts].slice(0, 40);
        this.emitEvent({
          type: 'benchmark_run',
          skillId: a.id,
          skillCode: `${a.code} × ${b.code}`,
          message: `${conflict.severity} conflict detected between ${a.name} and ${b.name} on ${scenario.shortName}: ${conflict.analysisOutputClash.contradictionSummary}`,
          status: conflict.severity === 'CRITICAL' || conflict.severity === 'HIGH' ? 'warning' : 'progress',
          detail: { conflictId: conflict.id, domain: conflict.conflictDomain },
        });
      } catch (err) {
        if (err instanceof AuthFailureError) return this.handleAuthFailure(err);
        if (!(err instanceof BudgetExhaustedError)) throw err;
        return;
      }
    }
  }

  /** Retire the unfit, then relieve niche over-subscription if still over cap. */
  private phaseCull(): void {
    for (const skill of this.live()) {
      const fitness = summariseFitness(this.rt(skill.id), skill.threshold);
      const { retire, reason } = shouldRetire(skill, fitness, this.cfg);
      if (retire) this.retire(skill, reason!);
    }

    let live = this.live();
    if (live.length <= this.cfg.maxPopulation) return;

    const over = oversubscribedNiches(live, this.cfg);
    const scored = live
      .filter((s) => s.stage !== 'champion')
      .map((skill) => ({ skill, fitness: summariseFitness(this.rt(skill.id), skill.threshold) }))
      // Weakest first, but prefer culling from crowded niches at equal fitness.
      .sort((a, b) => {
        const nicheA = over.has(a.skill.vectors[0]) ? 1 : 0;
        const nicheB = over.has(b.skill.vectors[0]) ? 1 : 0;
        if (nicheA !== nicheB) return nicheB - nicheA;
        return a.fitness.ewma - b.fitness.ewma;
      });

    let excess = live.length - this.cfg.maxPopulation;
    for (const { skill, fitness } of scored) {
      if (excess <= 0) break;
      this.retire(skill, `Population cap reached; culled at EWMA ${fitness.ewma}%`);
      excess--;
    }
  }

  // ---- helpers ----------------------------------------------------------

  /**
   * A bad key fails every call identically, so keep spinning and the loop just
   * fills the event log with the same error and burns concurrency slots. Pause
   * instead and surface it — this is an operator problem, not a transient one.
   */
  private handleAuthFailure(err: AuthFailureError): void {
    this.lastError = err.message;
    this.haltedThisTick = true;
    if (this.llm.authFailures >= this.cfg.authFailureLimit) {
      this.pause();
      this.emitEvent({
        type: 'error',
        skillCode: 'ENGINE',
        message: `Paused after ${this.llm.authFailures} consecutive authentication failures. Check GEMINI_API_KEY and that the key has access to ${this.cfg.executorModel} / ${this.cfg.judgeModel}. ${err.message}`,
        status: 'error',
      });
    } else {
      this.emitEvent({
        type: 'error',
        skillCode: 'ENGINE',
        message: `Authentication failed (${this.llm.authFailures}/${this.cfg.authFailureLimit} before the engine pauses). ${err.message}`,
        status: 'error',
      });
    }
  }

  private async runEvaluation(
    skill: AgentSkill,
    scenario: ExecutableScenario,
    holdout: boolean,
  ): Promise<{ score: number } | null> {
    if (this.haltedThisTick) return null;
    try {
      const result = await evaluate(this.llm, this.cfg, skill, scenario);
      const rt = this.rt(skill.id);

      rt.evaluations.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        holdout,
        score: result.score,
        ruleCompliance: result.ruleCompliance,
        hallucinationFlags: result.hallucinationFlags,
        criticalViolations: result.criticalViolations,
        timestamp: new Date().toISOString(),
        callsUsed: result.callsUsed,
        cognitive: result.cognitive,
      });
      // Retain the execution so another skill's answer on the same scenario can
      // be compared against it later. Truncated — this is a comparison buffer.
      rt.recentOutputs = [
        ...(rt.recentOutputs ?? []).filter((o) => o.scenarioId !== scenario.id),
        {
          scenarioId: scenario.id,
          output: result.rawOutput.slice(0, 4000),
          score: result.score,
          timestamp: new Date().toISOString(),
        },
      ];
      this.runtime.set(skill.id, trimRuntime(rt));

      // Keep the most recent execution per scenario for the dashboard's test view.
      const testCase = toTestCase(scenario, result, skill.threshold);
      const existing = skill.testCases.findIndex((tc) => tc.id === testCase.id);
      if (existing >= 0) skill.testCases[existing] = testCase;
      else skill.testCases = [...skill.testCases, testCase].slice(-10);

      skill.lastEvaluatedAt = new Date().toISOString();
      skill.activeTestBench = {
        name: scenario.name,
        currentVector: scenario.vectors[0] ?? skill.vectors[0],
        totalRunsToday: skill.activeTestBench.totalRunsToday + 1,
        consecutivePasses:
          result.score >= skill.threshold ? skill.activeTestBench.consecutivePasses + 1 : 0,
        stressVector: scenario.knownFailureModes[0] ?? scenario.shortName,
      };
      skill.autonomousThought = result.rubric.verdictSummary;

      this.counters.totalEvaluations++;
      this.emitEvent({
        type: 'evaluation',
        skillId: skill.id,
        skillCode: skill.code,
        message: `${skill.name} scored ${result.score}% on ${scenario.shortName}${holdout ? ' (held-out)' : ''}.`,
        status: result.score >= skill.threshold ? 'success' : 'progress',
        detail: {
          constraintsMet: result.rubric.constraintResults.filter((c) => c.satisfied).length,
          constraintsTotal: result.rubric.constraintResults.length,
          unsupportedClaims: result.rubric.unsupportedClaims.length,
          verdict: result.rubric.convictionVerdict,
        },
      });

      return { score: result.score };
    } catch (err) {
      if (err instanceof BudgetExhaustedError) {
        this.emitEvent({
          type: 'budget_throttled',
          skillCode: 'ENGINE',
          message: err.message,
          status: 'warning',
        });
        return null;
      }
      if (err instanceof AuthFailureError) {
        this.handleAuthFailure(err);
        return null;
      }
      this.emitEvent({
        type: 'error',
        skillId: skill.id,
        skillCode: skill.code,
        message: `Evaluation of ${skill.name} failed: ${err instanceof Error ? err.message : String(err)}`,
        status: 'error',
      });
      return null;
    }
  }

  /**
   * Prefer a scenario matching the skill's vectors that it has seen least.
   * Round-robin rather than random: random selection leaves coverage gaps that
   * make the distinct-scenario promotion gate take far longer to satisfy.
   */
  private pickScenario(skill: AgentSkill, pool: ExecutableScenario[]): ExecutableScenario | null {
    if (pool.length === 0) return null;
    const rt = this.rt(skill.id);
    const trained = new Set(rt.trainedScenarioIds);
    const counts = new Map<string, number>();
    for (const s of pool) counts.set(s.id, 0);
    for (const e of rt.evaluations) {
      if (counts.has(e.scenarioId)) counts.set(e.scenarioId, counts.get(e.scenarioId)! + 1);
    }
    // Only scenarios that exercise the skill's own vectors. When drawing from
    // the held-out pool, also exclude anything the skill was refined against.
    const isHoldoutPool = pool === this.holdoutScenarios;
    const ranked = scenariosForVectors(pool, skill.vectors).filter((s) => !isHoldoutPool || !trained.has(s.id));

    if (ranked.length === 0) {
      this.reportCoverageGap(skill, isHoldoutPool ? 'held-out' : 'training');
      return null;
    }
    // Stable sort by visit count keeps the vector-relevance ordering as the tiebreak.
    return [...ranked].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
  }

  /**
   * A crossover child is built from its parents' genomes, which were tuned on
   * their training scenarios. Those scenarios are therefore not independent
   * evidence for the child.
   */
  private inheritTrainingExposure(child: AgentSkill, parents: AgentSkill[]): void {
    const union = new Set(parents.flatMap((p) => this.rt(p.id).trainedScenarioIds));
    this.rt(child.id).trainedScenarioIds = [...union];
  }

  /** Held-out scenarios that share a vector with the skill and were never trained on. */
  private relevantHoldoutCount(skill: AgentSkill): number {
    const trained = new Set(this.rt(skill.id).trainedScenarioIds);
    return scenariosForVectors(this.holdoutScenarios, skill.vectors).filter((s) => !trained.has(s.id)).length;
  }

  private reportedGaps = new Set<string>();

  /**
   * A skill with no relevant scenario is a hole in the bank, not a bad skill.
   * Reported once per skill per pool so the event log names the gap without
   * repeating it every tick.
   */
  private reportCoverageGap(skill: AgentSkill, pool: string): void {
    const key = `${skill.id}:${pool}`;
    if (this.reportedGaps.has(key)) return;
    this.reportedGaps.add(key);
    this.emitEvent({
      type: 'error',
      skillId: skill.id,
      skillCode: skill.code,
      message: `No ${pool} scenario exercises ${skill.name}'s vectors (${skill.vectors.join(', ')}). It is not being scored on unrelated work; add scenarios for these vectors to evaluate it.`,
      status: 'warning',
      detail: { vectors: skill.vectors, pool },
    });
  }

  /**
   * Add the mutated genome as a new skill, leaving the parent in the population.
   *
   * The child starts with no evaluation history at all — it is a different
   * genome, so none of the parent's evidence transfers. Both then compete on
   * their own merits and the cull decides; the parent is not privileged for
   * having existed first.
   */
  private spawnMutatedChild(
    parent: AgentSkill,
    child: AgentSkill,
    iteration: Parameters<typeof this.recordIteration>[1],
    scoreBefore: number,
  ): void {
    child.stage = 'training';
    // mutateSkill already set parents/parentDetails from the parent, which is
    // what the lineage graph reads to draw the edge.
    child.evolutionLineage.iterations = [
      {
        ...iteration,
        scoreAfter: 0,
        performanceDelta: 0,
        testPassRate: 0,
        testCasesRun: 0,
        survived: true,
      },
    ];
    this.addSkill(child);
    // The child was shaped by the parent's training failures, so it has
    // effectively been tuned on those scenarios too. Inherit that exposure so
    // none of them can later count as held-out evidence for it.
    this.rt(child.id).trainedScenarioIds = [...this.rt(parent.id).trainedScenarioIds];

    // The parent keeps its own history and stays where it is. It has not
    // changed, so nothing about its evidence is stale.
    parent.evolutionLineage.survivalIterations++;
    void scoreBefore;
  }

  private applyMutationInPlace(
    target: AgentSkill,
    child: AgentSkill,
    iteration: Parameters<typeof this.recordIteration>[1],
    scoreBefore: number,
  ): void {
    target.strictRules = child.strictRules;
    target.promptMatrix = child.promptMatrix;
    target.specialistRole = child.specialistRole;
    target.description = child.description;
    target.tagline = child.tagline;
    target.generation = child.generation;
    target.evolutionLineage.mutationType = iteration.mutationType;
    target.evolutionLineage.survivalIterations++;
    this.recordIteration(target, iteration, scoreBefore);

    // The genome changed, so past evaluations describe a different skill.
    // Held-out history is cleared to stop a mutated skill inheriting evidence
    // it did not earn — otherwise a single good genome could ride six stale
    // held-out scores straight into promotion.
    const rt = this.rt(target.id);
    rt.evaluations = rt.evaluations.filter((e) => !e.holdout);
    this.runtime.set(target.id, rt);
  }

  private recordIteration(
    target: AgentSkill,
    iteration: Omit<import('../../src/types/skills.ts').EvolutionIteration, 'scoreAfter' | 'performanceDelta' | 'testPassRate' | 'testCasesRun' | 'survived'>,
    scoreBefore: number,
  ): void {
    const rt = this.rt(target.id);
    const fitness = summariseFitness(rt, target.threshold);
    const full = {
      ...iteration,
      scoreAfter: fitness.ewma,
      performanceDelta: Number((fitness.ewma - scoreBefore).toFixed(1)),
      testPassRate: fitness.winRate,
      testCasesRun: fitness.totalEvaluations,
      survived: true,
    };
    target.evolutionLineage.iterations = [...(target.evolutionLineage.iterations ?? []), full].slice(-40);
    target.evolutionLineage.totalMutationPercentage =
      (target.evolutionLineage.totalMutationPercentage ?? 0) + iteration.mutationPercentage;
    target.evolutionLineage.overallImprovementDelta = Number(
      (fitness.ewma - (target.stageHistory[0]?.score ?? 0)).toFixed(1),
    );
  }

  private addSkill(skill: AgentSkill): void {
    this.skills.push(skill);
    this.invalidateLive();
    this.runtime.set(skill.id, {
      evaluations: [],
      trainedScenarioIds: [],
      consecutiveRegressionFailures: 0,
      trainingRefinements: 0,
    });
    this.counters.generationEpoch = Math.max(this.counters.generationEpoch, skill.generation);
  }

  /**
   * Drop retired skills that nothing depends on.
   *
   * A retired skill is kept while it is an ancestor of anything still alive —
   * dropping those would orphan living skills in the lineage graph. Beyond that
   * set, the most recent `retiredRetention` are kept for context and the rest go,
   * runtime and all. Without this the population array grows forever, the
   * snapshot bloats, and every scan gets slower.
   */
  private pruneRetired(): void {
    const retired = this.skills.filter((s) => this.runtime.get(s.id)?.retiredAt);
    if (retired.length <= this.cfg.retiredRetention) return;

    // Walk up from every living skill to mark the whole ancestry as required.
    const byCode = new Map(this.skills.map((s) => [s.code, s]));
    const required = new Set<string>();
    const queue = this.live().map((s) => s.code);
    const seen = new Set(queue);
    while (queue.length > 0) {
      const code = queue.shift()!;
      const skill = byCode.get(code);
      if (!skill) continue;
      required.add(skill.id);
      for (const parentCode of skill.evolutionLineage.parents ?? []) {
        if (!seen.has(parentCode)) {
          seen.add(parentCode);
          queue.push(parentCode);
        }
      }
    }

    const droppable = retired
      .filter((s) => !required.has(s.id))
      .sort((a, b) => Date.parse(this.runtime.get(a.id)!.retiredAt!) - Date.parse(this.runtime.get(b.id)!.retiredAt!));

    const keepCount = Math.max(0, this.cfg.retiredRetention - (retired.length - droppable.length));
    const toDrop = droppable.slice(0, Math.max(0, droppable.length - keepCount));
    if (toDrop.length === 0) return;

    const dropIds = new Set(toDrop.map((s) => s.id));
    this.skills = this.skills.filter((s) => !dropIds.has(s.id));
    for (const id of dropIds) this.runtime.delete(id);
    this.invalidateLive();

    this.emitEvent({
      type: 'skill_retired',
      skillCode: 'ENGINE',
      message: `Pruned ${toDrop.length} retired skill${toDrop.length === 1 ? '' : 's'} with no surviving descendants. ${this.skills.length} remain on record.`,
      status: 'progress',
    });
  }

  /** A conflict involving a retired skill is no longer actionable. */
  private pruneConflicts(): void {
    const liveIds = new Set(this.live().map((s) => s.id));
    this.conflicts = this.conflicts.filter((c) => liveIds.has(c.skillAId) && liveIds.has(c.skillBId));
  }

  private retire(skill: AgentSkill, reason: string): void {
    const rt = this.rt(skill.id);
    rt.retiredAt = new Date().toISOString();
    rt.retiredReason = reason;
    // Nothing reads a retired skill's evaluation detail; keeping it just weighs
    // down a snapshot that is rewritten continuously.
    this.runtime.set(skill.id, compressRetiredRuntime(rt));
    this.invalidateLive();
    this.emitEvent({
      type: 'skill_retired',
      skillId: skill.id,
      skillCode: skill.code,
      message: `${skill.name} retired. ${reason}`,
      status: 'warning',
    });
  }

  /** Push measured fitness back onto the display fields the dashboard reads. */
  private recomputeDerivedFields(): void {
    // Retired skills are frozen; recomputing their display fields every tick is
    // work over a set that only grows.
    for (const skill of this.live()) {
      const fitness = summariseFitness(this.rt(skill.id), skill.threshold);
      if (fitness.totalEvaluations === 0) continue;
      // Testing and champion skills are judged on held-out performance; earlier
      // stages have none yet, so they show their overall mean.
      skill.benchmarkScore =
        fitness.holdoutRuns > 0 && (skill.stage === 'testing' || skill.stage === 'champion')
          ? fitness.holdoutMean
          : fitness.overallMean;
      skill.winRate = fitness.winRate;
      skill.stabilityIndex = fitness.stabilityIndex;
      skill.hallucinationRate = fitness.hallucinationRate;
    }
  }

  private rt(id: string): SkillRuntime {
    let rt = this.runtime.get(id);
    if (!rt) {
      rt = { evaluations: [], trainedScenarioIds: [], consecutiveRegressionFailures: 0, trainingRefinements: 0 };
      this.runtime.set(id, rt);
    }
    return rt;
  }

  private live(): AgentSkill[] {
    if (!this.liveCache) {
      this.liveCache = this.skills.filter((s) => !this.runtime.get(s.id)?.retiredAt);
    }
    return this.liveCache;
  }

  private invalidateLive(): void {
    this.liveCache = null;
  }

  private rolloverCountersIfNeeded(): void {
    if (this.counters.countersDay === today()) return;
    this.counters.countersDay = today();
    this.counters.dailyMutations = 0;
    this.counters.championsTestedToday = 0;
    for (const skill of this.skills) skill.activeTestBench.totalRunsToday = 0;
  }

  private emitEvent(partial: Omit<EvolutionEvent, 'id' | 'timestamp'>): void {
    const event: EvolutionEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...partial,
    };
    this.recentEvents = [event, ...this.recentEvents].slice(0, 200);
    this.stateVersion++;
    void this.store.appendEvent(event);
    this.emit('event', event);
  }

  /**
   * Strip static scenario text out of test cases before writing.
   *
   * `inputScenario`, `expectedConstraints`, `realWorldUseCase` and `title` are
   * fixed properties of the scenario, not of the skill — but a copy was being
   * stored in every skill's test cases, so the same paragraphs were persisted
   * once per skill per scenario. They are rehydrated from the scenario bank on
   * load, which is the single source of truth for them anyway.
   */
  private stripSkillForPersist(skill: AgentSkill): AgentSkill {
    return {
      ...skill,
      testCases: skill.testCases.map((tc) => ({
        ...tc,
        title: '',
        realWorldUseCase: '',
        inputScenario: '',
        expectedConstraints: [],
      })),
    };
  }

  /**
   * Reconcile evaluations recorded under an older train/holdout split.
   *
   * Growing the bank changes the split. An evaluation tagged held-out on a
   * scenario that is now training is downgraded. The reverse is NOT upgraded: a
   * scenario that used to be training may have been tuned against, so a past run
   * on it is not independent evidence just because the split moved.
   */
  private migrateSplitIfChanged(previousHoldoutIds: string[]): void {
    const current = new Set(this.holdoutScenarios.map((s) => s.id));
    const previous = new Set(previousHoldoutIds);
    const unchanged = previous.size === current.size && [...previous].every((id) => current.has(id));
    if (unchanged || previous.size === 0) return;

    let downgraded = 0;
    for (const rt of this.runtime.values()) {
      for (const e of rt.evaluations) {
        if (e.holdout && !current.has(e.scenarioId)) {
          e.holdout = false;
          downgraded++;
        }
      }
      // Anything that was in the training pool before the change may have been
      // refined against; record it so it can never count as held-out.
      for (const e of rt.evaluations) {
        if (!previous.has(e.scenarioId) && current.has(e.scenarioId) && !rt.trainedScenarioIds.includes(e.scenarioId)) {
          rt.trainedScenarioIds.push(e.scenarioId);
        }
      }
    }
    this.splitMigrated = true;
    this.emitEvent({
      type: 'tick_start',
      skillCode: 'ENGINE',
      message: `Scenario split changed since last run. ${downgraded} evaluation${downgraded === 1 ? '' : 's'} downgraded from held-out; previously-training scenarios that moved to held-out are excluded from promotion evidence for skills that saw them.`,
      status: 'warning',
    });
  }

  /** Put the scenario text back after a load. */
  private rehydrateSkill(skill: AgentSkill): AgentSkill {
    const bank = [...this.trainingScenarios, ...this.holdoutScenarios];
    return {
      ...skill,
      testCases: skill.testCases.map((tc) => {
        const scenario = bank.find((sc) => `tc-${sc.id}` === tc.id);
        if (!scenario) return tc;
        return {
          ...tc,
          title: tc.title || scenario.name,
          realWorldUseCase: tc.realWorldUseCase || scenario.realWorldUseCase,
          inputScenario: tc.inputScenario || scenario.inputScenario,
          expectedConstraints:
            tc.expectedConstraints.length > 0 ? tc.expectedConstraints : scenario.expectedConstraints,
        };
      }),
    };
  }

  private async persist(): Promise<void> {
    this.pruneConflicts();
    const snapshot: EvolutionSnapshot = {
      version: 1,
      skills: this.skills.map((s) => this.stripSkillForPersist(s)),
      runtime: Object.fromEntries(this.runtime),
      counters: this.counters,
      holdoutScenarioIds: this.holdoutScenarios.map((s) => s.id),
      conflicts: this.conflicts,
      // Bounded: keys for outputs that have since been replaced are dead weight.
      checkedComparisons: [...this.checkedComparisons].slice(-2000),
      updatedAt: new Date().toISOString(),
    };
    await this.store.save(snapshot);
  }

  // ---- read API ---------------------------------------------------------

  getSkills(includeRetired = false): AgentSkill[] {
    return includeRetired ? this.skills : this.live();
  }

  getStats(): EvolutionStats {
    const live = this.live();
    const compliance = live
      .map((s) => summariseFitness(this.rt(s.id), s.threshold))
      .filter((f) => f.totalEvaluations > 0)
      .map((f) => f.ruleComplianceMean);

    return {
      totalSkills: live.length,
      ideaCount: live.filter((s) => s.stage === 'idea').length,
      trainingCount: live.filter((s) => s.stage === 'training').length,
      testingCount: live.filter((s) => s.stage === 'testing').length,
      championCount: live.filter((s) => s.stage === 'champion').length,
      thresholdRequirement: this.cfg.championThreshold,
      dailyMutations: this.counters.dailyMutations,
      championsTestedToday: this.counters.championsTestedToday,
      averageCompliance: compliance.length
        ? Number((compliance.reduce((a, b) => a + b, 0) / compliance.length).toFixed(1))
        : 0,
    };
  }

  getEvents(limit = 60): EvolutionEvent[] {
    return this.recentEvents.slice(0, limit);
  }

  getFitness(skillId: string): FitnessSummary | null {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return null;
    return summariseFitness(this.rt(skill.id), skill.threshold);
  }

  getPromotionGate(skillId: string) {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return null;
    return evaluatePromotionGate(
      summariseFitness(this.rt(skill.id), skill.threshold),
      this.cfg,
      skill.threshold,
      this.relevantHoldoutCount(skill),
    );
  }

  /** Per-(skill, scenario) performance grid, derived from evaluation history. */
  getHeatmap(): HeatmapProjection {
    return this.cached('heatmap', () =>
      projectHeatmap(this.skills, this.runtime, [...this.trainingScenarios, ...this.holdoutScenarios]),
    );
  }

  /** Lineage audits for every champion, built from real EvolutionIteration records. */
  getAudits() {
    return this.cached('audits', () => {
      const audits = projectChampionAudits(this.skills, this.runtime);
      return { audits, stats: projectAuditStats(audits) };
    });
  }

  /** Measured cognitive telemetry per skill. */
  getCognitiveProfiles() {
    return this.cached('cognition', () => projectCognitiveProfiles(this.skills, this.runtime));
  }

  /** Which mutation types have actually produced improvement. */
  getMutationOutcomes() {
    return this.cached('mutations', () => projectMutationOutcomes(this.live()));
  }

  /**
   * The ancestry graph across the whole population.
   *
   * Retired skills are included: they are the reason a lineage exists, and
   * omitting them would orphan living skills whose recorded parentage points at
   * them.
   */
  getLineageGraph() {
    return this.cached('lineage', () => buildLineageGraph(this.skills, this.runtime));
  }

  /** Real lineage for any skill, at any stage — not just champions. */
  getSkillLineage(skillId: string) {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return null;
    return projectSkillAudit(skill, this.runtime);
  }

  /**
   * Execute a skill against the held-out scenarios right now.
   *
   * Uses the same execute-and-judge path as the tick loop, so the score is
   * directly comparable to one earned during evolution. That comparability is
   * the reason not to have a separate benchmark scorer.
   */
  async benchmark(skillId: string) {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) throw new Error('Skill not found.');
    // Only scenarios in the skill's own field that it was never trained on.
    // Benchmark results feed the promotion evidence pool, so running a
    // specialist on unrelated work here would put exactly the misleading scores
    // the relevance filter exists to keep out.
    const trained = new Set(this.rt(skill.id).trainedScenarioIds);
    const relevant = scenariosForVectors(this.holdoutScenarios, skill.vectors).filter((s) => !trained.has(s.id));
    if (relevant.length === 0) {
      throw new Error(
        `No held-out scenario covers ${skill.name}'s vectors (${skill.vectors.join(', ')}). Add scenarios for them before benchmarking.`,
      );
    }
    const report = await runBenchmark(this.llm, this.cfg, skill, relevant);

    this.emitEvent({
      type: 'benchmark_run',
      skillId: skill.id,
      skillCode: skill.code,
      message: `Benchmark: ${skill.name} averaged ${report.meanScore}% across ${report.results.length} held-out scenarios (${report.passRate}% pass rate)${report.worstScenario ? `, weakest on ${report.worstScenario}` : ''}.`,
      status: report.meanScore >= skill.threshold ? 'success' : 'progress',
      detail: { meanScore: report.meanScore, passRate: report.passRate, calls: report.totalCalls },
    });

    // A manual benchmark is a real evaluation, so it counts toward the gate like
    // any other. Recording it as a free observation would let an operator
    // promote a skill by re-running it until it got lucky — except the gate's
    // variance check is exactly what stops that, and it only works if these
    // results are in the same pool.
    const rt = this.rt(skill.id);
    for (const r of report.results) {
      rt.evaluations.push({
        scenarioId: r.scenarioId,
        scenarioName: r.scenarioName,
        holdout: true,
        score: r.score,
        ruleCompliance: r.ruleCompliance,
        hallucinationFlags: r.unsupportedClaims,
        criticalViolations: r.ruleViolations,
        timestamp: report.ranAt,
        callsUsed: 2,
      });
    }
    this.runtime.set(skill.id, trimRuntime(rt));
    this.recomputeDerivedFields();
    await this.persist();

    return report;
  }

  /** Run several skills against one scenario and rank them. */
  async swarm(scenarioId: string, skillIds: string[]) {
    const scenario = [...this.trainingScenarios, ...this.holdoutScenarios].find((s) => s.id === scenarioId);
    if (!scenario) throw new Error('Scenario not found.');

    const live = skillIds
      .map((id) => this.skills.find((s) => s.id === id))
      .filter((s): s is AgentSkill => !!s && !this.rt(s.id).retiredAt);
    // A skill with no vector in common with the scenario would be ranked on work
    // outside its field — the same distortion the evolution loop now refuses.
    const entrants = live.filter((s) => s.vectors.some((v) => scenario.vectors.includes(v)));
    const excluded = live.filter((s) => !entrants.includes(s)).map((s) => s.name);
    if (entrants.length < 2) {
      throw new Error(
        excluded.length
          ? `Only ${entrants.length} of the chosen skills cover ${scenario.shortName}'s vectors; ${excluded.join(', ')} do not. A swarm needs at least two relevant entrants.`
          : 'A swarm run needs at least two live skills.',
      );
    }

    const result = await runSwarm(this.llm, this.cfg, entrants, scenario);

    this.emitEvent({
      type: 'benchmark_run',
      skillCode: 'SWARM',
      message: result.indecisive
        ? `Swarm on ${scenario.shortName}: all ${result.entrants.length} entrants within ${result.scoreSpread} points — the scenario did not separate them.`
        : `Swarm on ${scenario.shortName}: ${result.entrants[0]?.skillName} led at ${result.entrants[0]?.score}% across ${result.entrants.length} entrants (spread ${result.scoreSpread}).`,
      status: result.indecisive ? 'warning' : 'success',
      detail: { scenario: scenario.shortName, spread: result.scoreSpread, calls: result.totalCalls },
    });

    return result;
  }

  getConflicts(): SkillConflictPair[] {
    this.pruneConflicts();
    return this.conflicts;
  }

  getScenarios() {
    const view = (s: ExecutableScenario) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      category: s.category,
      difficulty: s.adversarialDifficulty,
      vectors: s.vectors,
    });
    return {
      training: this.trainingScenarios.map(view),
      holdout: this.holdoutScenarios.map(view),
      coverage: validateSplit(this.trainingScenarios, this.holdoutScenarios, ALL_VECTORS),
    };
  }

  getConfig(): EvolutionConfig {
    return this.cfg;
  }

  /** Seed the population manually — used by the API and by cold start. */
  async seedSkill(vectors: VectorCategory[]): Promise<AgentSkill> {
    const child = await proposeSkill(
      this.llm,
      this.cfg,
      vectors,
      this.live().map((s) => s.name),
      this.counters.generationEpoch,
    );
    this.addSkill(child);
    await this.persist();
    this.emitEvent({
      type: 'idea_generated',
      skillId: child.id,
      skillCode: child.code,
      message: `Manually seeded: ${child.name}`,
      status: 'success',
    });
    return child;
  }

  /** Force a crossover between two named skills. Powers the UI's Remix action. */
  async remix(parentAId: string, parentBId: string): Promise<AgentSkill> {
    const a = this.skills.find((s) => s.id === parentAId);
    const b = this.skills.find((s) => s.id === parentBId);
    if (!a || !b) throw new Error('Both parent skills must exist.');

    const fitA = summariseFitness(this.rt(a.id), a.threshold).ewma;
    const fitB = summariseFitness(this.rt(b.id), b.threshold).ewma;
    const { child, iteration } = await crossoverSkills(this.llm, this.cfg, a, b, fitA, fitB);
    child.evolutionLineage.iterations = [
      { ...iteration, scoreAfter: 0, performanceDelta: 0, testPassRate: 0, testCasesRun: 0, survived: true },
    ];
    this.addSkill(child);
    this.inheritTrainingExposure(child, [a, b]);
    await this.persist();
    this.emitEvent({
      type: 'crossover',
      skillId: child.id,
      skillCode: child.code,
      message: `${child.name} remixed on request from ${a.name} and ${b.name}.`,
      status: 'success',
    });
    return child;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
