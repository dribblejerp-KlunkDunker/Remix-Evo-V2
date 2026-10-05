# Remix Evo V2 — change specification

Oct 2, 2026 · @sleeves

> **In this repository, the commit that added this file is the ground truth.** References below to `remix-evo-source.zip` and `modified-files.patch` describe how the change was delivered before it was committed.

Every change made to `Remix-Evo-V2` since it was shared, written so another agent can reproduce the result. Where this document and the shipped source differ, **the source wins**: `remix-evo-source.zip` contains the exact new files and `modified-files.patch`.

## Baseline and how to apply

All changes sit on top of commit `445ed35f13432f2c2943cf54b3cb3882c4ae947e` ("feat: initialize document analysis agent and project") of `https://github.com/dribblejerp-KlunkDunker/Remix-Evo-V2`. Nothing has been committed or pushed; the work exists as 34 new files plus edits to 17 tracked files.

**Ground truth.** `remix-evo-source.zip` holds every new file at its repo path and `modified-files.patch` for the tracked files. The Chromebook build is `remix-evo_0.2.0_amd64.deb`, SHA-256 `8d4b0e50ea18b652f465488790aec7986581f169ba7d95b1689168d736347083`.

**Apply to a clean checkout:**

```
git clone https://github.com/dribblejerp-KlunkDunker/Remix-Evo-V2.git
cd Remix-Evo-V2 && git checkout 445ed35f
cp -r <unzipped bundle>/. .
git apply modified-files.patch && rm modified-files.patch
npm install
npm run lint            # tsc --noEmit, must be clean
npm run test:evolution  # must report 54 passed, 0 failed
npm run build
```

This exact sequence was run against a fresh clone and passed every step.

**Toolchain.** Node 22.22.2, `@google/genai` 2.11.0, TypeScript in ESM mode. Server-side imports use explicit `.ts` extensions (`import { x } from './config.ts'`), matching the repo's existing convention; frontend imports omit extensions. Server modules run under `tsx` in development and are bundled by esbuild for production.

**Do not reconstruct the patch with `git diff` alone.** It omits untracked files. An earlier bundle risked shipping a dashboard that imported a component the bundle did not contain. Build bundles from `git ls-files --others --exclude-standard` plus the diff.

## File inventory

34 files were added and 17 tracked files changed. Line counts are as shipped.

### New files

| Path | Lines | Purpose |
| --- | --- | --- |
| `server/evolution/config.ts` | 204 | Every tunable with defaults and environment overrides |
| `server/evolution/store.ts` | 288 | Atomic JSON snapshot plus JSONL event log, behind an `EvolutionStore` interface |
| `server/evolution/llm.ts` | 313 | Gemini wrapper: hourly budget governor, retries, timeouts, auth handling, JSON mode, telemetry |
| `server/evolution/scenarios.ts` | 795 | 24 executable scenarios, stratified train/held-out split, relevance filter |
| `server/evolution/genome.ts` | 464 | Propose, mutate and cross over skill genomes; measured mutation distance |
| `server/evolution/evaluator.ts` | 325 | Execute a skill, judge it against a rubric, compute the score in code |
| `server/evolution/fitness.ts` | 273 | Rolling statistics, promotion and demotion gates, selection, niche pressure |
| `server/evolution/cognition.ts` | 140 | Cognitive metrics from measured telemetry; unmeasurable ones stay null |
| `server/evolution/conflicts.ts` | 255 | Contradiction detection between two skills on a shared scenario |
| `server/evolution/runs.ts` | 241 | On-demand benchmark and swarm runs |
| `server/evolution/lineageGraph.ts` | 205 | Ancestry graph with edge-derived depth |
| `server/evolution/projections.ts` | 303 | Read models: heatmap, audits, cognitive profiles, mutation outcomes |
| `server/evolution/engine.ts` | 1516 | The tick loop, phases, persistence, read API, on-demand runs |
| `server/evolution/routes.ts` | 286 | REST, server-sent events, job registry |
| `server/evolution/preflight.ts` | 192 | Live smoke test against the real API |
| `server/evolution/engine.test.ts` | 1234 | 54 offline tests with a stubbed model |
| `server/lib/security.ts` | 185 | Path containment, ticker validation, operator guard, rate limiter |
| `src/hooks/useEvolution.ts` | 434 | Client: SSE, seed fallback, projections, jobs, operator token |
| `src/components/EngineBadge.tsx` | 45 | Header badge reporting real engine state |
| `src/components/skills/LineageGraphView.tsx` | 256 | Deterministic layered ancestry graph |
| `src/components/skills/LiveSwarmRunner.tsx` | 228 | Real head-to-head runs |
| `src/components/skills/MutationEffectivenessView.tsx` | 183 | Measured mutation and crossover outcomes |
| `src/components/skills/PanelBoundary.tsx` | 57 | Error boundary that confines a crash to one panel |
| `packaging/chromebook/remix-evo` | 193 | Launcher shell script |
| `packaging/chromebook/build-deb.sh` | 109 | Reproducible `.deb` build |
| `packaging/chromebook/*.desktop` | 3 files | Launcher entries: open, set API key, stop |
| `packaging/chromebook/icon-*.png` | 3 files | App icon at 48, 128 and 256 px |
| `packaging/chromebook/README.md` | 93 | Chromebook install guide |
| `EVOLUTION.md` | 619 | Engine documentation |
| `.env.example` | 54 | Every environment variable with comments |

### Modified files

| Path | Change |
| --- | --- |
| `server.ts` | Evolution engine boot and routes; graceful shutdown; four security fixes; dynamic `vite` import; 256 KB body limit |
| `server/lib/agentClient.ts` | Optional `model` on `InteractionOptions`, default `gemini-3.5-flash` |
| `server/lib/agentClientPerseus.ts` | 360-line duplicate replaced by a 24-line shim pinning `gemini-3.6-flash` |
| `src/App.tsx` | `z-10` removed from the skills `<main>`; static badge replaced by `<EngineBadge />` |
| `src/components/skills/AgentSkillsDashboard.tsx` | Live data wiring, seed banner, hero layout, live labels, `PanelBoundary` |
| `src/components/skills/AgentScenarioHeatmap.tsx` | Optional live `data`, `scenarios`, `specialists` props |
| `src/components/skills/EvolutionaryAuditLog.tsx` | Optional live `audits` and `auditStats` props |
| `src/components/skills/CognitiveLoadMonitor.tsx` | Optional `profiles`; measured-only rendering when present |
| `src/components/skills/ChampionBenchmarkModule.tsx` | Optional `onRunLiveBenchmark`; live scenario list and button text |
| `src/components/skills/EvolutionHistorySidePanel.tsx` | Optional `onFetchLineage` |
| `src/components/skills/NeuralSynapseView.tsx` | Optional `lineageGraph`; renders `LineageGraphView` when present |
| `src/components/skills/MutationProbabilityMap.tsx` | Optional `measured`; renders `MutationEffectivenessView` when present |
| `src/components/skills/AgentSwarmController.tsx` | Optional `live`; renders `LiveSwarmRunner` when present |
| `src/components/skills/EvolutionaryFitnessLeaderboard.tsx` | Raw LaTeX in JSX replaced by string literals (it broke `tsc`) |
| `package.json` | Version `0.0.0` to `0.2.0`; build script; three new scripts; two dependencies removed |
| `package-lock.json` | Regenerated by `npm uninstall` |
| `.gitignore` | Adds `workspace/evolution/` |

### `package.json` in detail

- `build` became `vite build && esbuild server.ts --bundle --platform=node --format=cjs --target=node22 --external:vite --sourcemap --outfile=dist/server.cjs`. It previously used `--packages=external`, which made the server need `node_modules` at runtime.
- Added `test:evolution` (`tsx server/evolution/engine.test.ts`), `preflight:evolution` (`tsx server/evolution/preflight.ts`) and `build:chromebook` (`bash packaging/chromebook/build-deb.sh`).
- Removed `firebase` and `firebase-admin`: nothing imported them. `firebase-applet-config.json` was left in place because deploy tooling may read it.

## Evolution engine

The dashboard originally ran on hardcoded arrays in `src/data/`. The engine replaces that with a server-side loop that writes skills, runs them against scenarios, grades them, and promotes only what survives held-out testing. Every type reuses `src/types/skills.ts` and `src/types/skillConflicts.ts` unchanged, so existing components accept engine data as-is.

### The tick

One tick runs these steps in this order. Priority matters: under a tight budget, the engine protects champions before it explores.

1. **Budget gate.** If the governor cannot afford 2 calls, emit `budget_throttled` and return.
2. **Champion regression.** The least-recently-evaluated champion gets one held-out evaluation. A score below 91 increments `consecutiveRegressionFailures`; at 3 it is demoted to `testing`.
3. **Advance testing.** Up to `evaluationsPerTick` held-out evaluations on testing skills, least-recently-evaluated first. Passing the promotion gate makes a champion.
4. **Refine training.** Up to `evaluationsPerTick` training evaluations. Each scenario used is added to `trainedScenarioIds`. While refinements are below `trainingRunsToGraduate`, the skill is mutated. It graduates to `testing` at 4 refinements and an EWMA of at least 72.
5. **Smoke-test ideas.** The first idea gets one training evaluation: 55 or above enters training, below is retired.
6. **Variation.** Skipped when the population is at `maxPopulation` or non-champions are at `maxDevelopmentWip`. Otherwise crossover with probability 0.35, when at least two skills have 2+ evaluations and the population is at least `minPopulation`; else a new genome aimed at the least-represented vectors that are not over-subscribed.
7. **Conflict detection.** Up to `conflictChecksPerTick` candidate pairs among champion and testing skills.
8. **Cull.** Retire per the extinction rule, then if over `maxPopulation`, retire the weakest non-champions, preferring over-subscribed niches.
9. **Prune retired, recompute display fields, persist.**

A tick that hits an auth failure sets `haltedThisTick`; every remaining phase returns immediately, the tick reports "halted early" with status `error`, and `lastError` is kept rather than cleared.

### Configuration

| Setting | Default | Environment override |
| --- | --- | --- |
| `tickIntervalMs` | 90000 | `EVOLUTION_TICK_MS` |
| `autoStart` | false | `EVOLUTION_AUTOSTART=true` |
| `maxPopulation` | 48 | `EVOLUTION_MAX_POPULATION` |
| `minPopulation` | 12 | — |
| `eliteReserve` | 8 | — |
| `maxPerVectorNiche` | 6 | — |
| `retiredRetention` | 60 | `EVOLUTION_RETIRED_RETENTION` |
| `maxDevelopmentWip` | 12 | `EVOLUTION_MAX_WIP` |
| `evaluationsPerTick` | 2 | `EVOLUTION_EVALS_PER_TICK` |
| `conflictChecksPerTick` | 2 | — |
| `championThreshold` | 95 | `EVOLUTION_CHAMPION_THRESHOLD` |
| `promotionMinHoldoutRuns` | 6 | — |
| `promotionMinDistinctScenarios` | 2 (floor) | — |
| `promotionDistinctFraction` | 0.75 | — |
| `promotionMaxStdDev` | 4 | — |
| `promotionMaxHallucinationRate` | 1.5 | — |
| `demotionThreshold` | 91 | — |
| `demotionPatience` | 3 | — |
| `trainingRunsToGraduate` | 4 | — |
| `ideaSmokeTestFloor` | 55 | — |
| `extinctionGracePeriod` | 8 | — |
| `extinctionFloor` | 62 | — |
| `crossoverRate` | 0.35 | — |
| `tournamentSize` | 3 | — |
| `mutationStrategy` | `branching` | `EVOLUTION_MUTATION_STRATEGY` (`branching` or `in-place`) |
| `holdoutFraction` | 0.35 | — |
| `maxCallsPerHour` | 240 | `EVOLUTION_MAX_CALLS_PER_HOUR` |
| `maxConcurrency` | 3 | `EVOLUTION_MAX_CONCURRENCY` |
| `budgetReservePct` | 0.1 | — |
| `executorModel` | `gemini-3.6-flash` | `EVOLUTION_EXECUTOR_MODEL` |
| `judgeModel` | `gemini-3.8-flash` | `EVOLUTION_JUDGE_MODEL` |
| `architectModel` | `gemini-3.8-flash` | `EVOLUTION_ARCHITECT_MODEL` |
| `requestTimeoutMs` | 90000 | `EVOLUTION_REQUEST_TIMEOUT_MS` |
| `authFailureLimit` | 3 | — |

Do not default to `gemini-2.5-*`: from 18 Sept 2026 those are restricted to projects with prior usage and retire in October 2026. Executor and judge are deliberately different generations so the grader does not share the executor's blind spots.

### Model client — `llm.ts`

- **Budget governor.** A rolling one-hour window of call timestamps. `acquire()` throws `BudgetExhaustedError` when the window is full and polls every 150 ms for a concurrency slot. `canAfford(n)` is true when `remaining − n > maxCallsPerHour × budgetReservePct`.
- **Call shape.** `ai.models.generateContent({ model, contents, config })` with `temperature`, `maxOutputTokens`, `abortSignal` (timeout `requestTimeoutMs`), `systemInstruction`, optional `responseMimeType`, and `responseLogprobs: true` unless the model is known not to support it. Header `x-goog-api-client: remix-evo-engine/1.0.0`.
- **Errors, in this order.** A message matching `/logprob/i` from a model not yet flagged: flag that model, release the slot, retry the same attempt without logprobs. An auth match (`API_KEY_INVALID`, `API key not valid`, `PERMISSION_DENIED`, `UNAUTHENTICATED`, `401`, `403`): throw `AuthFailureError` with no retry. A retryable match (`429`, `5xx`, `deadline`, `timeout`, `unavailable`, `aborted`): back off `800 × 2^attempt` ms plus up to 400 ms jitter, 3 attempts total. Google reports a bad key as HTTP **400** `INVALID_ARGUMENT` with reason `API_KEY_INVALID`, not 401.
- **Telemetry** per call: `latencyMs`, `promptTokens`, `outputTokens` (`candidatesTokenCount`), `thoughtTokens`, `totalTokens`, `avgLogprob` (`candidates[0].avgLogprobs`), `model`. Missing fields are `null`, never estimated.
- **JSON.** `generateJson` appends an instruction to return a single raw object, sets `responseMimeType: application/json`, defaults temperature to 0.4, and parses with `coerceJson`: `JSON.parse`, then fenced-block extraction, then the outermost brace pair.

### Scoring — `evaluator.ts`

Two calls per evaluation. The executor (temperature 0.5, 2048 tokens) runs the skill with a system instruction built from `specialistRole`, the three `promptMatrix` fields and `strictRules`, asked for numbered reasoning steps and a `VERDICT`. The judge (temperature 0.1, 3072 tokens) **never returns a score**; it returns a rubric:

`constraintResults[]` (one per expected constraint, with `satisfied` and `evidence`), `failureModesTriggered[]`, `unsupportedClaims[]`, `ruleViolations[]`, `reasoningQuality` and `epistemicCalibration` (integers 1–5), `verdictSummary`, `convictionVerdict`.

The rubric is normalised against the scenario's canonical constraint list: a constraint the judge omitted counts as **unsatisfied**; ratings clamp to 1–5, defaulting to 3. The score is then computed in code:

```latex
\text{score} = 55\frac{\text{met}}{\text{total}} + 15\frac{\text{compliance}}{100} + 15\frac{q-1}{4} + 15\frac{c-1}{4} - 6u - 8f - 15v
```

where compliance is `100 − 25 × violations` (minimum 0), *q* and *c* are the two ratings, and *u*, *f*, *v* count unsupported claims, failure modes and rule violations. Clamp to 0–100, one decimal. Reasoning steps are lines matching `^\s*(?:\d+[.)]|[-*])\s+(.{10,})$`, at most 12, falling back to the first five sentences over 40 characters.

### Promotion and selection — `fitness.ts`

**Held-out evidence** is any evaluation tagged `holdout` whose scenario is **not** in the skill's `trainedScenarioIds`. This is enforced in `summariseFitness` regardless of tags. EWMA uses alpha 0.3; standard deviation is the sample form; hallucination rate is flags per evaluation × 100; stability index is `clamp(100 − (variance / 12) × 10)`.

The promotion gate passes only when all five hold:

| Check | Rule |
| --- | --- |
| Held-out mean | at least `championThreshold` (95) |
| Held-out runs | at least 6 |
| Distinct held-out scenarios | *R* relevant scenarios must exist with *R* ≥ 2, and distinct ≥ min(*R*, max(2, ceil(0.75 × *R*))) |
| Standard deviation | at most 4.0 |
| Hallucination rate | at most 1.5% |

*R* is the count of held-out scenarios sharing a vector with the skill and not trained on. Demotion: 3 consecutive regression runs below 91. Extinction: a non-champion with at least 8 evaluations and EWMA below 62. Parents are chosen by tournament (size 3, by EWMA). A vector niche is over-subscribed above 6 live skills by primary vector.

### Scenarios — `scenarios.ts`

Each `ExecutableScenario` extends `ScenarioDefinition` with `inputScenario`, `realWorldUseCase`, `expectedConstraints` (5 each), `knownFailureModes` (2–3 each) and `vectors`. The bank grew from 10 to 24. Every vector now has at least 5 scenarios.

| ID | Short name | Difficulty | Vectors | Split |
| --- | --- | --- | --- | --- |
| scen-01 | Reverse Factoring | Extreme | Forensic Accounting, Manipulation & Deception, Statistics & Stochastic | held-out |
| scen-02 | Q&A Deflection | High | Behavioral Psychology, Manipulation & Deception | training |
| scen-03 | Margin Sweeps | Extreme | Game Design & Incentives, Advanced Math, Systems Engineering | held-out |
| scen-04 | Supply Chokepoints | High | Systems Engineering, Engineering, Statistics & Stochastic | held-out |
| scen-05 | FX Jump-Diffusion | Extreme | Advanced Math, Statistics & Stochastic | training |
| scen-06 | Visual Chart Scaling | Moderate | Manipulation & Deception, Behavioral Psychology, Statistics & Stochastic | training |
| scen-07 | P-Hacking Audit | High | Empirical Science, Statistics & Stochastic, Advanced Math | held-out |
| scen-08 | 10b5-1 Timing | High | Forensic Accounting, Statistics & Stochastic, Manipulation & Deception | held-out |
| scen-09 | Vesting Cliff Gaming | Moderate | Game Design & Incentives, Behavioral Psychology, Advanced Math | held-out |
| scen-10 | Sensor Fusion | High | Systems Engineering, Engineering, Statistics & Stochastic | training |
| scen-11 | Survivorship Bias | High | Empirical Science, Statistics & Stochastic | training |
| scen-12 | Regression to Mean | Moderate | Empirical Science, Behavioral Psychology | held-out |
| scen-13 | Fatigue vs Static | High | Engineering, Systems Engineering | training |
| scen-14 | Tolerance Stack-Up | Moderate | Engineering, Statistics & Stochastic | training |
| scen-15 | Winner's Curse | High | Game Design & Incentives, Behavioral Psychology | training |
| scen-16 | Metric Gaming | Moderate | Game Design & Incentives, Manipulation & Deception | training |
| scen-17 | Channel Stuffing | High | Forensic Accounting, Manipulation & Deception | training |
| scen-18 | Benford Misuse | High | Forensic Accounting, Statistics & Stochastic | training |
| scen-19 | Simpson's Paradox | Moderate | Advanced Math, Empirical Science | training |
| scen-20 | Alarm Fatigue | Moderate | Behavioral Psychology, Systems Engineering | training |
| scen-21 | Kelly Overbetting | Extreme | Advanced Math, Game Design & Incentives | training |
| scen-22 | Review Manipulation | Moderate | Manipulation & Deception, Behavioral Psychology, Empirical Science | training |
| scen-23 | Warranty Reserve | High | Forensic Accounting, Engineering, Statistics & Stochastic | training |
| scen-24 | Underpowered Pilot | Moderate | Engineering, Empirical Science, Statistics & Stochastic | held-out |

scen-01 to scen-10 existed as names in `src/data/heatmapData.ts` without executable content; their inputs, constraints and failure modes were written here. scen-11 to scen-24 are new.

**Split algorithm.** Sort by id. Process vectors scarcest first; for each, while it has fewer than 2 held-out scenarios, move the scenario that carries it and can move without leaving any of its vectors below 2 training scenarios, preferring scenarios that also serve other under-covered vectors, then by id. Then top up to `round(n × 0.35)` by stride, under the same constraint. The result is deterministic regardless of input order: 16 training, 8 held-out. `scenariosForVectors` **excludes** scenarios with zero vector overlap and ranks the rest by overlap, then id.

### Genomes — `genome.ts`

A genome is `strictRules` plus `promptMatrix`; everything else on a skill is metadata or measurement.

- **Propose** (architect, temperature 0.95, 2048 tokens): targets under-represented vectors and lists up to 40 existing names to avoid. Rules must be checkable by a grader.
- **Mutate** (temperature 0.8, 2560 tokens): aimed at the skill's two worst training evaluations, with one of six types: Adversarial Constraint Hardening, Reasoning Framework Restructure, Rule Specificity Injection, Epistemic Calibration Tightening, Failure Mode Immunisation, Scope Narrowing.
- **Choosing the type** from the last six evaluations: average violations above 0.5 gives Constraint Hardening; average unsupported claims above 1 gives Calibration Tightening; a score spread above 20 gives Framework Restructure; any score below 60 gives Failure Mode Immunisation; otherwise Rule Specificity Injection or Scope Narrowing at random.
- **Crossover** (temperature 0.85, 2816 tokens): parent contribution weights are proportional to EWMA.
- **Mutation distance** is measured, not reported by the model: Jaccard distance over lowercase word tokens longer than 3 characters from the rules and prompt matrix.
- Vectors are validated against the nine allowed values, at most 3. Codes are `SKILL-<first three words>-G<generation>`.

**Mutation strategy.** With `branching`, the mutated genome is added as a new skill in `training` and the parent survives; the child starts with no evaluations and inherits the parent's `trainedScenarioIds`. Branching falls back to in-place when the population or WIP cap leaves no room. With `in-place`, the parent's rules, prompt matrix, role, description, tagline and generation are overwritten, and its held-out evaluations are deleted. Crossover children inherit the union of both parents' `trainedScenarioIds`.

### Persistence — `store.ts`

`workspace/evolution/state.json` is written atomically (temp file then rename), debounced 1.5 s, and flushed on shutdown. A snapshot that fails to parse is renamed `state.json.corrupt-<timestamp>` and the engine cold-starts. `events.jsonl` is append-only.

Per skill, `SkillRuntime` holds `evaluations` (cap **80**), `recentOutputs` (cap **4**, each truncated to 4 kB), `trainedScenarioIds`, `consecutiveRegressionFailures`, `trainingRefinements`, `baseline` (the first evaluation's score and time, kept through trimming), and retirement fields. On retirement the runtime is compressed to the last **5** evaluations, no outputs, baseline kept.

Before writing, each test case's `title`, `realWorldUseCase`, `inputScenario` and `expectedConstraints` are blanked; on load they are restored from the scenario bank. The snapshot also stores `holdoutScenarioIds`, `conflicts` (cap 40) and `checkedComparisons` (last 2000).

**Load order matters.** `init()` reads the event log first, then the snapshot, then runtime, then runs split migration, then persists and flushes if anything migrated. Migration downgrades held-out evaluations on scenarios that are no longer held-out, and adds to `trainedScenarioIds` any scenario that moved from training to held-out and that the skill has seen.

### Retention, caches and coverage gaps

- **Pruning retired skills.** When retired skills exceed `retiredRetention`, every retired ancestor of a living skill is kept (walked transitively through parent codes); the oldest of the rest are dropped with their runtime.
- **Live cache.** `live()` is cached and invalidated on add, retire, prune and load.
- **Projection cache.** Every emitted event increments `stateVersion`; projections are cached per key and rebuilt when the version changes.
- **Coverage gaps.** `pickScenario` returns `null` when no scenario shares a vector with the skill (or, for held-out, none it has not trained on). It emits one warning per skill per pool and never scores the skill on unrelated work.

### Conflicts — `conflicts.ts`

Two skills conflict when acting on one requires rejecting the other, not when they merely differ in focus. Each pair is checked **once per genome version**: the key combines both skill ids with an FNV-1a fingerprint of `[strictRules, promptMatrix, specialistRole]`. For each unchecked, unflagged pair, the candidate is the shared scenario with the largest score gap. Candidates sort by stakes (champion 2, testing 1), then score gap, then key. The judge runs at temperature 0.1 with 2048 tokens and a conservative prompt. Every checked comparison is recorded whatever the verdict.

### Cognitive metrics — `cognition.ts`

| Metric | Derivation |
| --- | --- |
| `inferenceLatencyMs` | Wall clock around the call |
| `workingMemoryUsage` | thought tokens ÷ (thought + output tokens) × 100 |
| `tokenCertainty` | exp(`avgLogprob`) × 100 |
| `contextWindowPressure` | prompt tokens ÷ 1,048,576 × 100 |
| `backtrackingCount` | Sentences containing a revision marker (counted per sentence, not per marker) |
| `cognitiveStrainIndex` | Mean of the available terms: latency ÷ 30 s, working memory, 100 − certainty, revisions ÷ 8, context pressure (each capped at 100) |
| `attentionEntropy` | Always `null`: the API returns a mean log probability, not a distribution |
| `heuristicPruningRate` | Always `null`: no model exposes a search space |

### Lineage graph — `lineageGraph.ts`

Nodes are every skill, retired included. Edges come only from `evolutionLineage.parents`: one parent gives a `mutation` edge, two give `crossover` edges carrying each parent's `contributionWeight`. A parent code with no record draws nothing. Depth is the longest path from a root, computed from the edges with Kahn's algorithm and a visit cap, never from generation numbers. The graph also reports root and unconnected counts.

### Projections — `projections.ts`

Heatmap points exist only for evaluated (skill, scenario) pairs among live skills. Audits work for any skill and take `initialScore` from `runtime.baseline`. Cognitive profiles count only evaluations carrying telemetry and list the two unavailable metrics. Mutation outcomes withhold `successRate` below 3 attempts.

### On-demand runs — `runs.ts`

Both refuse to start unless the whole run fits the remaining hourly budget (`InsufficientBudgetError`). **Benchmark** runs a skill on every held-out scenario that shares its vectors and that it has not trained on, and appends the results to its held-out evidence so they count toward promotion. **Swarm** runs up to 8 skills on one scenario, admits only entrants sharing a vector with it, ranks by score, and sets `indecisive` when the spread is under 2 points. Swarm results are not recorded as evidence.

## HTTP API and security

The engine adds 17 routes under `/api/evolution`. All reads are open; every POST requires an operator and is rate-limited. Four vulnerabilities in the inherited `server.ts` were closed, the worst being an arbitrary file write.

### Evolution routes — `routes.ts`

| Method | Path | Guard | Returns |
| --- | --- | --- | --- |
| GET | `/api/evolution/state` | — | Live skills, stats, last 60 events, engine status, public config |
| GET | `/api/evolution/stream` | — | Server-sent events: `state`, `activity`, `job`; 20 s keepalive comment |
| GET | `/api/evolution/scenarios` | — | Training and held-out lists with vectors and difficulty, plus per-vector coverage |
| GET | `/api/evolution/skills/:id` | — | One skill, its fitness summary, its promotion-gate breakdown |
| GET | `/api/evolution/skills/:id/lineage` | — | Lineage audit for any skill; 404 if unknown |
| GET | `/api/evolution/heatmap` | — | `{ points, scenarios, specialists }` |
| GET | `/api/evolution/audit` | — | `{ audits, stats }` for champions |
| GET | `/api/evolution/cognition` | — | `{ profiles }` |
| GET | `/api/evolution/mutations` | — | `{ outcomes }` |
| GET | `/api/evolution/conflicts` | — | `{ conflicts }` |
| GET | `/api/evolution/lineage-graph` | — | `{ nodes, edges, generations, maxDepth, rootCount, orphanCount }` |
| GET | `/api/evolution/jobs/:id` | — | Job status and result; 404 once expired |
| POST | `/api/evolution/control` | operator, 30/min | `{ action: start \| pause \| tick }`; `tick` returns immediately |
| POST | `/api/evolution/seed` | operator, 30/min | `{ vectors: [...] }` proposes one genome |
| POST | `/api/evolution/remix` | operator, 30/min | `{ parentAId, parentBId }` forced crossover |
| POST | `/api/evolution/benchmark` | operator, 6/min | `{ skillId }` → **202** `{ jobId }` |
| POST | `/api/evolution/swarm` | operator, 6/min | `{ scenarioId, skillIds }`, 2 to 8 ids → **202** `{ jobId }` |

**Jobs.** Benchmark and swarm take minutes, so they run as jobs held in memory. A job is `running`, `done` or `failed`; a budget refusal maps to `errorStatus` 429, anything else to 500. Finished jobs are pruned after 30 minutes. Completion is also pushed as an SSE `job` event. The SSE handler pushes a fresh `state` whenever a promotion, demotion, retirement, new genome, crossover or tick completion happens.

**Boot.** `server.ts` constructs the engine, registers routes **before** the SPA catch-all, then calls `init()`. If construction throws (no `GEMINI_API_KEY`), every `/api/evolution` request gets 503 and the rest of the server runs. SIGINT and SIGTERM call `engine.shutdown()`, which pauses, persists and flushes.

### Operator guard — `security.ts`

A POST passes when any of these holds:

1. **True loopback.** The socket address is `127.0.0.1`, `::1` or `::ffff:127.0.0.1` **and** no `X-Forwarded-For`, `Forwarded` or `X-Real-IP` header is present. A same-host reverse proxy makes every request look like loopback, so any forwarding header disqualifies it.
2. **Bearer token.** `Authorization: Bearer <EVOLUTION_API_TOKEN>`, where the configured token is at least 16 characters. Compared with `crypto.timingSafeEqual`; a length mismatch still performs a dummy comparison.
3. **`EVOLUTION_ALLOW_REMOTE=true`**, meaning the operator has put their own authentication in front.

Otherwise it returns 401 with `tokenConfigured` so the client knows whether to ask.

**Rate limiter.** Fixed one-minute windows in memory, keyed by socket address, or by the first `X-Forwarded-For` hop when `TRUST_PROXY=true`. Expired windows are swept on an unreferenced timer. Responses carry `RateLimit-Limit` and `RateLimit-Remaining`; a 429 adds `Retry-After`.

### Inherited vulnerabilities closed in `server.ts`

| Issue | Before | After |
| --- | --- | --- |
| Arbitrary file write | `/api/upload_artifact` wrote the body to `path.join(artifactsDir, req.query.name)`; `?name=../../server.ts` overwrote source. **Proven** by writing outside the directory. | `safeJoin` rejects separators, `..`, leading dots, NUL and names over 200 characters; checks the resolved path stays in the directory; allows only `.wav .mp3 .ogg .json .txt .md .png .jpg .pdf`; rejects empty bodies. 20 uploads/min. |
| Ticker path traversal | `ticker` from `/api/analyze` went unchecked into three log filenames | `parseTicker` accepts `^[A-Z0-9][A-Z0-9.\-]{0,11}$` after trimming and upper-casing; otherwise 400. Also applied to `/api/download_jsonl`, which was already safe. |
| Working directory served | `app.use('/latest_log', express.static(process.cwd()))` served all source, the evolution state and `.git` contents | Replaced by `GET /latest_log/:ticker`, serving only `sub_agents_debug_<TICKER>.txt` |
| Oversized bodies | `express.json({ limit: '50mb' })` on every route | 256 KB; the upload route keeps its own 50 MB raw limit |

`.env` was **not** exposed: `serve-static` ignores a dotfile in the final path segment. Its check does not cover a dotfile directory earlier in the path, which is why `.git/config` was served.

The bind address stays `0.0.0.0`, and `/api/analyze` and `/api/tts` stay unauthenticated, because the AI Studio origin suggests a Cloud Run deploy that needs both. Those two get 20 requests per minute instead. Set `TRUST_PROXY=true` behind a proxy so limits key on the real client.

## Frontend

Every wired component takes its live data through a new **optional** prop and falls back to its original seed data when the prop is absent, so the app still renders with no engine. One hook, `useEvolution`, is the only thing that talks to the engine.

### `src/hooks/useEvolution.ts`

- **State.** `skills` and `stats` start as `INITIAL_SKILLS` and `INITIAL_EVOLUTION_STATS`. `isFallback` stays `true` until a real `state` payload arrives. `connection` is `connecting`, `live` or `offline`. Projections: `heatmap`, `audit`, `cognition`, `mutations`, `conflicts`, `lineageGraph`.
- **Stream.** An `EventSource` on `/api/evolution/stream`. A `state` event applies the payload, sets `live` and refreshes projections. An `activity` event prepends to `events` (cap 120). On error it closes, goes `offline` and reconnects after `min(30 s, 1.5 s × 2^min(attempts, 5))`.
- **Projections.** Six parallel GETs (heatmap, audit, cognition, mutations, conflicts, lineage-graph). Never overlapping, and at most once every 4 s unless forced by an explicit refresh.
- **Operator token.** At module load, a `#operator=<token>` fragment is moved into `sessionStorage` key `evolution.operatorToken` and stripped from the address bar with `history.replaceState`. `operatorPost` sends `Authorization: Bearer <token>`; on a 401 it prompts once with `window.prompt`, retries, and clears the token if the retry also fails.
- **Jobs.** `benchmark` and `swarm` POST, then poll `/jobs/:id` starting at 1.5 s, growing ×1.4 to 6 s, with a 20-minute deadline; 404 means the job expired. Result types come from `import type` of `server/evolution/runs`; type-only imports are erased, and the browser bundle was checked to contain no server code.
- **Status broadcast.** Whenever `connection`, `isFallback` or `status.running` changes, it sets `window.__evolutionStatus` and dispatches a `CustomEvent('evolution:status')`, so components outside the dashboard can follow it.
- `control`, `remix` and `seed` throw on a non-OK response rather than failing silently.

### New components

- **`EngineBadge`** replaces the header's hardcoded "MATRIX ACTIVE". It reads `window.__evolutionStatus` on mount and listens for updates: Connecting (grey), Seed Data (amber, no engine), Matrix Active (green, loop running), Engine Paused (grey, connected but paused).
- **`LineageGraphView`** draws the ancestry graph as an SVG with a deterministic layout: one row per depth 130 px apart, columns 150 px apart, margins 90 and 56 px, sorted by generation then code. Node radius is 9 plus the number of children, up to 5. Retired nodes are dashed outlines; crossover edges are dashed purple with the parent's weight; hovering dims everything not adjacent. A toggle hides retired ancestors. The subtitle counts mutation and crossover edges from the data instead of asserting a fixed sentence.
- **`LiveSwarmRunner`** loads scenarios, lists only skills sharing a vector with the chosen one, caps selection at 8, shows the call cost on the button, and hides ranks when the result is indecisive.
- **`MutationEffectivenessView`** shows recorded outcomes per mutation type, with "too few attempts" in place of a rate below 3, and every crossover that happened scored against its stronger parent. The delta reads "pending" when the child or a parent is unscored.
- **`PanelBoundary`** is an error boundary around the dashboard's sub-view switch, keyed by the active view and labelled from a `PANEL_NAMES` map. It was added after the Cognitive Load Monitor crashed the entire page in a browser.

### Edits to existing components

| Component | New prop | Live behaviour |
| --- | --- | --- |
| `AgentScenarioHeatmap` | `data`, `scenarios`, `specialists` | Live whenever `data` is an array, even empty. Selections re-anchor when data arrives. |
| `EvolutionaryAuditLog` | `audits`, `auditStats` | Live when `audits` is non-empty; the simulated mutation step is disabled. |
| `CognitiveLoadMonitor` | `profiles` | With any profile, the synthetic interval stops and **only** the measured table renders: latency, reasoning %, certainty, revisions, context %, strain, sample count; null shows as "—"; top 12 by strain. |
| `ChampionBenchmarkModule` | `onRunLiveBenchmark` | No simulated report is pre-filled. The intro text, scenario list and button describe the real run: "Run on N held-out scenarios (2N model calls)". The historical picker and Select All are hidden. A live report panel shows mean, pass rate, threshold, weakest scenario and per-scenario rows. |
| `EvolutionHistorySidePanel` | `onFetchLineage` | Fetches the real lineage, cancelling stale requests. The local helper, which invented history for unknown skills, runs only without the prop. |
| `NeuralSynapseView` | `lineageGraph` | Renders `LineageGraphView` instead of the simulated network, also as an overlay titled "Skill Ancestry". |
| `MutationProbabilityMap` | `measured` | Renders `MutationEffectivenessView`. The original became `HeuristicMutationMap`, the fallback. |
| `AgentSwarmController` | `live` | Renders `LiveSwarmRunner`. The original became `SimulatedSwarmController`, the fallback. |
| `EvolutionaryFitnessLeaderboard` | — | Two lines of raw LaTeX inside JSX were replaced with string literals; the braces had been parsed as expressions and broke `tsc`. |

The three wrapper components (`NeuralSynapseView`'s live branch, `MutationProbabilityMap`, `AgentSwarmController`) contain **no hooks** of their own; the originals moved intact into the fallback components, so the rules of hooks are not violated by the early return.

### `AgentSkillsDashboard.tsx`

- Calls `useEvolution()` and defines `live = !evolution.isFallback`.
- Syncs `skills` from the engine when live, and `conflicts` from the engine whenever it reports, including an empty list.
- Uses engine `stats` when live, else the original derived numbers.
- The pulse button calls `evolution.tick()` when live, else the original simulation.
- The activity ticker shows `live`, `live · paused` or `seed data`, and the newest engine event.
- The seed-data banner sits **first** on the page, above the hero.
- Hero layout: `flex flex-col gap-6` replaces `md:flex-row md:items-end`; the panel-button row loses `shrink-0` and gains `min-w-0`; the eyebrow line wraps.
- Labels change when live:

| Original label | Live label |
| --- | --- |
| Neural Synapse View | Skill Lineage |
| Neural Synapses (Co-Firing) | Skill Lineage (Ancestry) |
| Mutation Probability Map | Mutation Effectiveness |
| Mutation Probability Map (Heatmap) | Mutation Effectiveness (Measured) |
| Mutation Map | Mutation Outcomes |
| Swarm Controller Arena | Swarm Runner |
| Agent Swarm Controller (Logic Puzzles Arena) | Swarm Runner (Head-to-Head) |
| Cognitive Load Monitor (D3 Real-Time) | Cognitive Load (Measured) |

Tooltips change in step with their labels.

### `App.tsx`

- `relative z-10` became `relative` on the skills `<main>`. The `z-10` created a stacking context that trapped all twelve overlays in the skills components beneath the `z-20` header, where no z-index on an overlay could raise them. The background is `z-0`, so `<main>` still paints above it.
- The header's static badge became `<EngineBadge />`.

## Build, cleanup and Chromebook packaging

The server now builds to one 3.0 MB file that runs without `node_modules`, and that file ships in a 29 MB `.deb` for the ChromeOS Linux environment with its own Node runtime.

### Build and cleanup

- **`vite` is dev-only.** `server.ts` imported `vite` at the top, so the production server loaded the whole build toolchain to start. The import was removed; the dev branch now does `const { createServer: createViteServer } = await import("vite")`. With `--external:vite`, esbuild bundles every other dependency into `dist/server.cjs`.
- **One Perseus client.** `server/lib/agentClientPerseus.ts` was a 360-line copy of `agentClient.ts` that differed only in its model string. `InteractionOptions` gained an optional `model` (default `gemini-3.5-flash`), and the Perseus file became a shim: `createInteraction` spreads the options **first** and then sets `model: opts.model ?? 'gemini-3.6-flash'`, and `streamInteraction` is re-exported. Spreading last would let an explicit `model: undefined` erase the pin.
- Unused `firebase` and `firebase-admin` removed (see File inventory).

### Package layout — `remix-evo_0.2.0_amd64.deb`

| Installed path | Contents |
| --- | --- |
| `/opt/remix-evo/node/bin/node` | Node v22.22.2 linux-x64 binary only, plus its `LICENSE`; needs glibc 2.28, and Debian 12 has 2.36 |
| `/opt/remix-evo/app/` | `dist/` (UI), `agent/` (agent instructions), `server.cjs`, `preflight.cjs` |
| `/opt/remix-evo/bin/remix-evo` | Launcher, also linked to `/usr/bin/remix-evo` by `postinst` |
| `/usr/share/applications/` | `remix-evo.desktop`, `remix-evo-setkey.desktop` (`Terminal=true`), `remix-evo-stop.desktop` |
| `/usr/share/icons/hicolor/{48x48,128x128,256x256}/apps/remix-evo.png` | Icon, generated with Pillow: chip outline with a branching lineage glyph in green on near-black |

**Control fields:** `Package: remix-evo`, `Version: 0.2.0`, `Section: devel`, `Architecture: amd64`, `Depends: libc6 (>= 2.28), libstdc++6, ca-certificates`.

**Maintainer scripts.** `postinst` creates the symlink and refreshes the desktop and icon caches, ignoring failures. `prerm` runs `pkill -f '^/opt/remix-evo/node/bin/node /opt/remix-evo/app/server\.cjs$'`, anchored to the exact command line. `postrm` removes the symlink on remove or purge. User settings and data are never deleted.

### `build-deb.sh`

1. `npx vite build`.
2. Bundle `server.ts` (`--external:vite`) and `server/evolution/preflight.ts` with esbuild for Node 22, CommonJS.
3. Download `node-v22.22.2-linux-x64.tar.xz` and `SHASUMS256.txt` from nodejs.org, and stop unless `sha256sum -c` passes.
4. Assemble the tree above with `install` and explicit modes; remove `dist/server.cjs` and its map from the packaged `dist/`.
5. Compute `Installed-Size`, write control and maintainer scripts, and run `dpkg-deb --build --root-owner-group -Zxz`.

### The launcher — `remix-evo`

A POSIX `sh` script with `set -eu`. Paths: settings `${XDG_CONFIG_HOME:-~/.config}/remix-evo/env`; data, log and pid file under `${XDG_DATA_HOME:-~/.local/share}/remix-evo`.

- **First run** writes the settings file with `umask 077` and mode 600: `GEMINI_API_KEY=` (empty), `PORT=7317`, `EVOLUTION_API_TOKEN` (48 hex characters from `od -An -N24 -tx1 /dev/urandom`), `EVOLUTION_AUTOSTART=false`, `EVOLUTION_MAX_CALLS_PER_HOUR=240`.
- **Loading settings** sources the file with `set -a`. If `NODE_EXTRA_CA_CERTS` is unset and `/etc/ssl/certs/ca-certificates.crt` is readable, it exports that path. Node otherwise ignores the system store, and every call fails behind TLS inspection.
- **Starting** symlinks `dist` and `agent` from `/opt/remix-evo/app` into the data directory, changes into it (the server resolves both relative to its working directory and writes its state there), runs `NODE_ENV=production nohup node server.cjs` appending to `server.log`, records the pid, and polls `http://127.0.0.1:$PORT/` with Node's `fetch` for up to 25 s. On timeout it prints the last 20 log lines.
- **Is it running** checks that the recorded pid is alive **and** that `/proc/<pid>/cmdline` contains `remix-evo/app/server.cjs`, so a recycled pid is not mistaken for the server.
- **Opening** builds `http://localhost:$PORT/#operator=<token>` and tries `$BROWSER`, then `garcon-url-handler` (the ChromeOS bridge), then `xdg-open`, then prints the address.

| Command | Behaviour |
| --- | --- |
| `remix-evo` or `remix-evo open` | Start if needed, open Chrome, warn if no key is set |
| `remix-evo start` | Start without opening a browser |
| `remix-evo setkey` | Read the key with echo off, strip whitespace, rewrite the file atomically, **re-read settings**, restart the server if running |
| `remix-evo preflight` | Run the bundled live check from the data directory |
| `remix-evo stop` / `status` / `logs` / `config` | Stop; report state and whether a key is set; follow the log; print settings with secrets hidden |

## Defect ledger

41 defects were found and fixed along the way: 31 in my own work and 10 in the code as shared (rows 20–23, 27, 28, 34–37). A replicating agent that builds the obvious version will hit most of these, so each row says what to avoid.

| # | Area | Defect and cause | Fix |
| --- | --- | --- | --- |
| 1 | Engine | **Pipeline starvation.** Variation added about one genome per tick while each phase evaluated one skill, so nothing was ever promoted: 28 skills stuck in testing after 30 ticks. | `maxDevelopmentWip` cap on variation, plus `evaluationsPerTick` batching |
| 2 | Tests | The stub bypassed the budget governor, so the cost ceiling looked tested when it was not. | Stubs call `budget.acquire()` and `release()` |
| 3 | Engine | Default models were `gemini-2.5-flash`, restricted for new projects and retiring. | `gemini-3.6-flash` executor, `gemini-3.8-flash` judge and architect |
| 4 | Engine | A bad key returns HTTP 400 `API_KEY_INVALID`, not 401, so it fell through as an unknown error and the loop spun forever. | `AuthFailureError`, no retry; the engine pauses after 3 |
| 5 | Engine | A halted tick still reported "complete" and cleared the error. | `haltedThisTick` flag checked by every phase |
| 6 | Projections | Audits used the first stage-history score, always 0, so every champion showed "+100%". | Baseline from the first real evaluation |
| 7 | Store | That baseline read `evaluations[0]`, which drifts once trimming drops old records: 84 reported against a true 40. | `runtime.baseline`, captured before any trim |
| 8 | Engine | Retired skills were kept forever: 49 retired for 1 alive. | `pruneRetired`, keeping every ancestor of a living skill |
| 9 | Engine | `live()` filtered the unbounded array about 20 times per tick. | Cached and invalidated on change |
| 10 | Engine | Display fields were recomputed for retired skills every tick. | Live skills only |
| 11 | Store | Static scenario text was persisted in every skill's test cases; the window was 200. | Stripped on write, rehydrated on read; window 80 |
| 12 | Cognition | "However, revising" counted as two revisions. | Count sentences containing a marker |
| 13 | Tests | The stub did not cover `generateWithTelemetry`, so tests silently hit the real API and the population froze at one skill. | Stub every model method the engine calls |
| 14 | Conflicts | A pair judged clean was never recorded, so it was re-checked every tick: 36 of 38 checks on one pair. Keying on output timestamps only half-fixed it (18 checks on one pair). | Record every check, keyed on both genome fingerprints: 66 checks, 66 pairs |
| 15 | Scenarios | 10 scenarios split 6/4 against a gate needing 4 distinct; Engineering had 0 held-out; specialists were scored on unrelated work. | 24 scenarios, stratified split, zero-overlap exclusion, gate relative to relevant scenarios |
| 16 | Scenarios | My Simpson's paradox scenario was not a paradox: Hospital A won in aggregate too. | Numbers changed; a test checks the arithmetic |
| 17 | Engine | After the relevance fix, benchmark still ran every held-out scenario and fed the results to the gate. | Relevant, untrained held-out scenarios only |
| 18 | Store | Split migration ran before runtime was loaded and did nothing; the later event-log read could also erase its event. | Load events, then snapshot, then runtime, then migrate, then flush |
| 19 | Model client | `responseLogprobs: true` on every call would fail every call on a model that rejects it. | Per-model fallback without logprobs |
| 20 | Security | **Arbitrary file write** through `/api/upload_artifact?name=../..`. | `safeJoin` plus extension allowlist |
| 21 | Security | `ticker` reached three filenames unchecked. | `parseTicker` |
| 22 | Security | `/latest_log` served the working directory, including source and `.git`. | One route serving only the debug log |
| 23 | Security | 50 MB JSON body limit on every route. | 256 KB |
| 24 | Security | Money-spending engine endpoints had no authentication. | Operator guard and rate limits |
| 25 | API | Benchmark and swarm held an HTTP request open for minutes. | 202 plus a job id |
| 26 | Frontend | Six parallel projection fetches on every `state` event. | Never overlapping, at most every 4 s |
| 27 | Frontend | Every overlay rendered under the header: `<main>`'s `z-10` formed a stacking context. | Remove the `z-10` |
| 28 | Frontend | The panel-button row was `shrink-0`, so it could not wrap and crushed the hero at 1440 px. | Stack the hero; allow wrapping |
| 29 | Frontend | The lineage subtitle said edges were "almost always crossover" after the default changed to branching. | Computed from the edges |
| 30 | Frontend | Labels promised co-firing synapses, a probability heatmap and a puzzle arena that were no longer shown. | Live labels |
| 31 | Frontend | The cognitive monitor showed an invented "attention entropy" beneath a table declaring it unmeasurable. | Measured panel only when telemetry exists |
| 32 | Frontend | The live benchmark's picker, button and intro promised 2008 Lehman and SVB scenarios it never ran. | Show the real held-out scenarios and cost |
| 33 | Frontend | The seed banner sat below the fold under a badge reading MATRIX ACTIVE. | Banner first; `EngineBadge` |
| 34 | Frontend | The cognitive monitor crashed the whole page with no training-stage skills. | Optional chaining with "None in training", plus `PanelBoundary` |
| 35 | Frontend | Raw LaTeX inside JSX broke `tsc` (inherited). | String literals |
| 36 | Frontend | The mutation "probability" was a hand-written formula clamped to 18–99.4% with a score floor of 82. | Measured outcomes |
| 37 | Build | The production server imported `vite` at startup. | Dynamic import in the dev branch |
| 38 | Packaging | `setkey` restarted the server from settings read before the key was written, so it ran with an empty key. | Re-read settings before restarting |
| 39 | Packaging | `prerm` ran `pkill -f <path>`, killing any process mentioning the path, including the shell running `dpkg`, which left a half-removed package. | Anchor the pattern to the exact command line |
| 40 | Packaging | Node ignores the system certificate store, so every call failed behind TLS inspection with "fetch failed". | Export `NODE_EXTRA_CA_CERTS`; the preflight names the cause |
| 41 | Delivery | `git diff` omits untracked files, so a bundle could reference a component it did not ship. | Bundle from `git ls-files --others` plus the diff |

### False alarms — do not chase these

- **"The seed banner does not render."** The test had a leftover `.env` with a fake key, so the engine started and the banner correctly stayed hidden. It renders.
- **"`prerm` contains a doubled backslash."** The tool output was JSON-escaped; the file has one backslash, and the pattern matches only the server.
- **"Three unused packages were removed."** `uuid` was never a direct dependency; only `firebase` and `firebase-admin` were removed.
- **"The server survived uninstall."** It had exited; this sandbox's init does not reap orphans, so `kill -0` still saw a zombie.

When testing process handling, never put the pattern you are killing in your own command line: `pkill -f` matched and killed the test shell twice.

## Verification

A replication is done when all 54 offline tests pass, the 12 browser checks pass with zero page errors, and the package survives the install lifecycle below. None of these needs an API key.

### Offline test suite — `npm run test:evolution`

A hand-rolled runner in `engine.test.ts` drives the real engine against a stubbed model whose answer quality is a dial. The stub must implement `generate`, `generateWithTelemetry` and `generateJson`, and route every call through the budget governor.

| Group | Tests |
| --- | --- |
| Scoring | Perfect rubric scores 100 · deterministic across repeated calls · rule violations cost more than missed constraints · clamped to 0 under heavy penalties |
| Scenario split | Held-out and training disjoint and complete · stable across calls · every scenario carries executable content |
| Promotion gate | Training-only scores do not promote · one lucky run does not · high mean with high variance does not · consistent held-out performance does · hallucination flags block it |
| Genome | Mutation percentage reflects real textual change · mutation type follows observed symptoms |
| Full tick loop | Strong population produces a champion that survives restart · weak population promotes nothing and retires skills · budget exhaustion stops spending without an error · population stays under its cap |
| Projections and runs | Heatmap has only evaluated pairs · audit deltas reconcile · cognitive profiles are measured and flag the unmeasurable · mutation rates withheld below 3 attempts · benchmark runs only relevant held-out scenarios and feeds the gate · benchmark refuses without budget · swarm ranks and flags indecision · swarm rejects one entrant · lineage exists for non-champions and invents nothing · graph edges match recorded ancestry · retired ancestors kept · empty population gives empty graph · branching produces mutation edges · branched child inherits no evidence · in-place keeps one node per lineage · branching respects the cap |
| Audit regressions | Baseline survives trimming · pruning keeps ancestors · scenario text stripped and restored · live cache invalidates |
| Scenario substrate | Every vector covered on both sides · split independent of input order · zero-overlap scenarios never offered · the Simpson's scenario is really a paradox · trained scenarios never count as held-out · distinct gate scales with relevant scenarios · a skill with no relevant scenario is not scored and the gap is reported once |
| Conflict convergence | A clean pair is checked once per genome version · the key changes with the genome, not with an output |
| Projection cache | Refreshes after state changes |
| Request-boundary security | `safeJoin` refuses every traversal form · `parseTicker` accepts real symbols and rejects paths · operator guard handles loopback, forwarded and token cases |
| Loading and resilience | Older-split snapshot migrates without contaminating evidence, and only once · a model rejecting logprobs degrades to null certainty · no champions means empty audits, not seed data |

### Browser checks

Run headless Chromium (Playwright) against a production build at 1440 × 900 and 390 × 844, once with a stubbed engine and once with `GEMINI_API_KEY` empty. Wait for `load`, not `networkidle`: the event stream keeps a connection open forever.

1. The header badge reads "Engine Paused" with a paused engine and "Seed Data" with none.
2. The panel-button row fits the viewport and wraps at both widths.
3. The hero title is more than 500 px wide at 1440.
4. No "Co-Firing" or "Logic Puzzles Arena" text appears when live.
5. Every overlay's Close button is the topmost element at its own centre (`document.elementFromPoint`).
6. The lineage subtitle is computed from edges.
7. The cognitive monitor shows the measured table and no "attention entropy" (compare case-insensitively: `innerText` applies CSS `text-transform`).
8. The live benchmark lists real held-out scenarios, never mentions 2008 Lehman or SVB, and states its model-call cost.
9. No panel hits the error boundary.
10. The seed banner's top edge is within 300 px with no engine.
11. With zero training-stage skills and no telemetry, the cognitive monitor renders "None in training" without crashing.
12. With a forwarding header forcing the remote path: a `#operator=` link stores the token, clears the address bar, and a POST returns 200 with no prompt; without it, the POST returns 401 and prompts. The token never appears in the server log.

The page must report zero `pageerror` events throughout.

### Package lifecycle

Tested as a non-root user named `penguin`, the default user in ChromeOS's Linux container, on x86-64.

1. `dpkg -i` succeeds; `remix-evo` is on the path; three launcher entries and the icon are installed.
2. `remix-evo start` creates the settings file with mode 600 and serves `/` with no `node_modules` anywhere.
3. `remix-evo setkey` with a piped key restarts the server, and `/proc/<pid>/environ` shows the key set.
4. `remix-evo preflight` from a clean login environment reaches Google and reports a fake key as rejected, not as "fetch failed".
5. With the server running and a decoy process whose command line mentions the server path, `dpkg -r` stops the server, spares the decoy and the calling shell, removes program files, symlink and launcher entries, and keeps the settings file.
6. Reinstalling reuses the existing settings and data.

Verify every PID before trusting a reading: one earlier run reported results for a decoy that never started, because an empty PID made `/proc//cmdline` read the kernel's command line.

### Still unverified

No success-path call has ever run against a real key, and the ChromeOS-specific steps (double-click install, launcher entries, the terminal shortcut, localhost forwarding) were not run on a Chromebook. Both are tracked in the separate unverified-items document.
