# The Evolution Engine

The skills dashboard previously ran entirely on hardcoded arrays in `src/data/`.
This is the engine that makes it real: a server-side loop that writes agent
skills, runs them against adversarial scenarios, grades the results, mutates the
losers, recombines the winners, and promotes the ones that survive held-out
testing.

---

## Running it

```bash
cp .env.example .env               # set GEMINI_API_KEY
npm install
npm run preflight:evolution        # ~5 live calls: validates key, models, and one full evaluation
npm run dev
```

**Run the preflight first.** It is the only thing that can tell you whether your
key reaches the configured models, whether the architect returns a usable
genome, and whether the judge actually grades rather than rubber-stamps. It
prints the computed score for one real evaluation and warns you if an untrained
genome already clears the champion threshold — which would mean the scenario is
too easy or the judge too generous, and the gate is meaningless.

The engine boots with the server. It does **not** start ticking unless
`EVOLUTION_AUTOSTART=true` — open the dashboard and hit the pulse button, or:

```bash
curl -XPOST localhost:3000/api/evolution/control -H 'content-type: application/json' -d '{"action":"start"}'
```

Offline tests, no API calls, ~3 seconds:

```bash
npm run test:evolution
```

If `GEMINI_API_KEY` is missing the server still runs. `/api/evolution/*` returns
503 and the dashboard falls back to the bundled seed population, labelling
itself `seed data` in the activity ticker so you can tell at a glance whether
you are looking at real evolution or the old mock.

---

## How a skill evolves

```
          proposeSkill()                 mutateSkill()              promotion gate
  ∅ ──────────────────▶ idea ──smoke──▶ training ──graduate──▶ testing ──────────▶ champion
                          │ test          │                      │                    │
                          │               │                      │                    │
                        retire      (refine loop)           (held-out runs)      regression
                                                                                  testing
                                                                                      │
                                                                                 demote ┘
```

**idea** — A genome written by the architect model, aimed at whichever capability
vectors are currently under-represented in the population. One cheap evaluation
decides whether it is worth training; below `ideaSmokeTestFloor` it is retired
immediately.

**training** — Evaluated against *training* scenarios. After each evaluation the
skill is mutated against its own worst results: `selectMutationType()` reads the
evaluation history and picks the mutation that addresses the observed symptom
(rule violations → constraint hardening, unsupported claims → calibration
tightening, high score spread → framework restructure). Mutation replaces the
genome in place — this is hill-climbing, not a branching search.

**testing** — Evaluated only against *held-out* scenarios. Evidence accumulates
until the promotion gate is satisfied.

**champion** — Continuously re-tested on held-out scenarios. Sustained regression
demotes it back to testing.

---

## The two things that make this different from the mock

### 1. Held-out evaluation

Scenarios are split into a training set and a held-out set by
`splitScenarios()`, deterministically, so the split survives restarts and scores
stay comparable across time. Skills are refined against training scenarios and
**promoted only on held-out ones**.

When a skill mutates, its held-out evaluation history is deleted
(`applyMutationInPlace`). The genome changed, so that evidence describes a
different skill. Without this, a genome could inherit six stale held-out scores
it never earned and walk straight into promotion.

### 2. The judge never produces a score

Grading is two calls, deliberately separated. The executor runs the skill's
prompt matrix against the scenario. The judge then answers structured questions
about that output — which constraints were satisfied, which of the scenario's
known failure modes were committed, which claims were asserted without support,
which of the skill's own rules were broken — and `scoreFromRubric()` computes the
number in code:

```
constraints satisfied     55 pts
rule compliance           15 pts
reasoning quality         15 pts
epistemic calibration     15 pts
                         ────────
                         100 pts

penalties:  −6  per unsupported claim
            −8  per failure mode committed
            −15 per rule violation
```

A model asked for "a score out of 100" drifts, clusters around 85, and rewards
confident prose. A model asked "did the response do X, yes or no" is far more
stable. It also keeps the weighting inspectable and tunable in `evaluator.ts`
rather than buried in a prompt.

A judge that returns fewer constraint results than there are constraints has the
missing ones counted as **unsatisfied** — a lazy judge should not be able to
inflate scores by omission.

---

## The promotion gate

All five conditions must hold at once. Defaults in `config.ts`:

| Gate | Default | Why |
|---|---|---|
| Held-out mean | ≥ 95.0% | the headline bar |
| Held-out runs | ≥ 6 | one lucky run is not evidence |
| Distinct held-out scenarios | ≥ 4 | stops overfitting to one scenario |
| Standard deviation | ≤ 4.0 | high variance means unreliable, not good |
| Hallucination rate | ≤ 1.5% | a confident fabricator is worse than a hedger |

`GET /api/evolution/skills/:id` returns the full gate breakdown, so the UI can
show exactly which condition is blocking a given skill rather than just a score.

Champions are demoted after `demotionPatience` consecutive regression runs below
`demotionThreshold` (91%). A skill that stops working stops being a champion.

---

## Live operation

**Models.** Defaults are `gemini-3.6-flash` (executor) and `gemini-3.8-flash`
(judge and architect), checked against Google's current list. Executor and judge
are different generations deliberately — a model grading its own family shares
its blind spots. Do not use `gemini-2.5-*`: as of 18 Sept 2026 those are
restricted to projects with prior usage and they retire in October 2026.

Your `server.ts` analyzer already calls `gemini-3.6-flash`, so a key that works
there works for the executor.

**Auth failures are terminal, not transient.** Google returns HTTP 400 with
reason `API_KEY_INVALID` for a bad key — not 401 — so it would otherwise fall
through the retry logic as an unrecognised error and the loop would spin forever
on it. `AuthFailureError` short-circuits the retries, halts the remaining phases
of the tick, and pauses the engine after `authFailureLimit` (3) consecutive
failures. Verified live: a bad key costs 3 calls and then the engine stops.

**Requests time out** at `requestTimeoutMs` (90s) via `AbortSignal`, so a hung
call cannot hold a concurrency slot indefinitely.

**JSON mode is native.** `generateJson` sets `responseMimeType:
'application/json'`, which constrains decoding rather than relying on the model
following instructions. `coerceJson` still covers the rest.

## Cost control

This is the operational risk in an always-on system, so it is enforced rather
than documented. Every model call passes through `BudgetGovernor`:

- hard ceiling of `maxCallsPerHour` on a rolling one-hour window
- `maxConcurrency` cap on simultaneous calls
- each phase calls `canAfford()` before spending, so a tick degrades gracefully
  instead of failing halfway
- budget exhaustion emits a `budget_throttled` event and idles — it is not an
  error condition

At defaults (90s ticks, 2 evals/tick/phase) expect roughly **6–12 calls per
tick**, bounded at 240/hour.

**`maxDevelopmentWip` is the setting people get wrong.** Variation adds about one
genome per tick while the phases evaluate a bounded number. Without a
work-in-progress cap the pipeline fills faster than it drains, every skill is
starved of the repeated held-out runs promotion requires, and *nothing is ever
promoted* — the population just grows. Keep WIP low relative to
`evaluationsPerTick`. This was a real bug caught by `engine.test.ts`; the test
for it is still there.

---

## Security fixes (inherited TICKR code)

These were in the code the engine was built on, not in the engine, and they were
the most severe findings of the audit.

**Arbitrary file write.** `/api/upload_artifact` passed `?name=` straight into
`path.join`, so `?name=../../server.ts` overwrote source with the request body.
With the server bound to `0.0.0.0`, anyone on the network could replace
`server.ts` and get code execution on the next start. Proven with a harmless
write outside the artifacts directory, then closed with `safeJoin`: no
separators, no dot-segments, resolved path checked to sit inside the target,
and an extension allowlist.

**Ticker traversal.** `ticker` from `/api/analyze` reached three filenames
unchecked. `parseTicker` now accepts only letters, digits, dots and hyphens.

**Working directory served.** `/latest_log` was `express.static(process.cwd())`:
all source, the evolution state, and everything inside `.git` (serve-static's
dotfile check only examines the final path segment). Your `.env` was not
exposed. Replaced by a route that serves only `sub_agents_debug_<TICKER>.txt`.

**Body limit** dropped from 50 MB on every JSON route to 256 KB; the upload route
keeps its own raw limit.

The bind address stays `0.0.0.0` and `/api/analyze` and `/api/tts` stay public,
because the AI Studio origin suggests a Cloud Run deploy, which needs both. They
get rate limits instead.

## Operator access

Every POST under `/api/evolution` is allowed only when one of these holds:

- the request is true loopback — local development needs no setup
- it carries `Authorization: Bearer <EVOLUTION_API_TOKEN>` (16+ characters)
- `EVOLUTION_ALLOW_REMOTE=true`, meaning you have put your own auth in front

A same-host reverse proxy makes every request look like loopback, so any
forwarding header disqualifies the loopback path. Behind a proxy, set
`TRUST_PROXY=true` so rate limits key on the real client address. The dashboard
asks for the token once on a 401 and keeps it in session storage.

Benchmark and swarm runs take minutes, so they return `202 { jobId }` and the
result is fetched from `GET /api/evolution/jobs/:id`. Swarms are capped at eight
entrants.

## Scenario substrate

The bank grew from 10 to 24 scenarios. The split is now stratified so every
vector has at least two scenarios on each side; previously Engineering had none
held-out, so its specialists could only be promoted on unrelated work.

- **No unrelated scoring.** A skill is never evaluated on a scenario that shares
  none of its vectors. With nothing relevant left, it is skipped and a coverage
  gap is reported once.
- **Relative gate.** Distinct held-out scenarios required = 75% of those relevant
  to the skill, floor 2.
- **Training exposure is never held-out evidence.** Enforced in
  `summariseFitness` regardless of tags. Branched and crossover children inherit
  their parents' exposure.
- **Split migration.** When the bank changes, evaluations tagged held-out on
  scenarios that moved to training are downgraded, and scenarios that moved into
  held-out are barred for skills that saw them. Its test exposed that it had
  never worked: it ran before evaluations were loaded.

One of my own new scenarios was wrong: the Simpson's paradox case had Hospital A
winning in aggregate, so it was not a paradox. A test now checks its arithmetic.

## Audit findings (resolved)

A sweep over the whole codebase turned up five real problems. All are fixed and
each has a regression test.

**The audit baseline drifted.** `initialScore` read `evaluations[0]`, but the
evaluation window is trimmed, so once a skill passed the cap the oldest record
was discarded and the "first" score became whatever survived. Every improvement
delta shrank toward zero with nothing looking wrong. In a reproduction the
baseline reported 84 against a true first score of 40 — a 44-point error. The
first evaluation is now stored separately as `runtime.baseline` and survives
trimming and retirement.

**Retired skills grew without bound.** They are deliberately never deleted on
retirement because the lineage graph needs them as ancestors, but a run that
retired 49 skills to keep 1 alive kept all 50 forever. `pruneRetired` now drops
retired skills that are not in the ancestry of anything living, keeping the most
recent `retiredRetention` (60) for context. Ancestry is walked transitively, so
pruning can never orphan a living skill — there is a test asserting no dangling
parent references and an intact graph afterwards.

**`live()` was O(total skills) and called ~20 times per tick**, filtering over
that unbounded array. It is now cached and invalidated on creation, retirement
and prune. `recomputeDerivedFields` also iterated retired skills every tick;
it now iterates only the live set.

**The snapshot carried static scenario text per skill.** `inputScenario` and
`expectedConstraints` belong to the scenario, not the skill, but a copy sat in
every skill's test cases — the same paragraphs persisted once per skill per
scenario, in a file rewritten every 1.5 seconds. They are stripped on write and
rehydrated from the scenario bank on load. The round trip is lossless and
tested. The evaluation window also dropped from 200 to 80, which is more than
any consumer reads.

**The dashboard fired six parallel projection fetches per `state` event**, and
the engine pushes that event on tick completion *and* every stage transition.
Each fetch rebuilt projections over the whole population server-side, for panels
the user may not have open. Now coalesced: never overlapping, at most once every
four seconds, with an explicit refresh bypassing the throttle.

**`agentClientPerseus.ts` was a verbatim 360-line copy** of `agentClient.ts`
differing on one line — the model string. Every fix had to be made twice and one
was always going to be missed. The base client takes an optional `model` and
Perseus is now a 24-line binding that pins it.

## Running on a Chromebook

`npm run build:chromebook` produces `remix-evo_<version>_amd64.deb` for the ChromeOS
Linux environment (x86-64 only). It bundles its own Node runtime and a
self-contained server, adds three launcher entries (open, set API key, stop), and
keeps settings in `~/.config/remix-evo/env` and data in `~/.local/share/remix-evo`.
Install steps are in `packaging/chromebook/README.md`.

The launcher generates an operator token on first run and opens Chrome at
`http://localhost:7317/#operator=<token>`. The app moves the token into session
storage and strips it from the address bar; fragments never reach the server or
its logs. It also points Node at the container's certificate store, so networks
that inspect HTTPS do not break API calls.

`npm run build` now produces the same self-contained server: `dist/server.cjs`
runs without `node_modules`, and vite is loaded only in development.

## Browser-verified UI behaviour

Checked in headless Chromium against a live engine and with no engine:

- The header badge reports the real state: Matrix Active, Engine Paused, or Seed Data.
- The seed-data banner leads the page instead of sitting below the fold.
- Overlays render above the header. `<main>` no longer sets a z-index, which had
  made it a stacking context that trapped every overlay beneath the header.
- Panel buttons wrap at desktop and phone widths.
- With an engine connected, labels describe the measured views ("Skill Lineage",
  "Mutation Effectiveness", "Swarm Runner") rather than the simulations they replaced.
- The cognitive monitor shows only measured telemetry when it has any.
- The live benchmark lists the held-out scenarios it will actually run.
- A `PanelBoundary` contains a render error to the panel that threw it.

## Persistence

`workspace/evolution/state.json` — full population, written atomically via
tmp-file-and-rename, debounced to 1.5s. A corrupt snapshot is quarantined rather
than crashing the server, and the engine cold-starts.

`workspace/evolution/events.jsonl` — append-only activity log.

Everything sits behind the `EvolutionStore` interface. Moving to SQLite or the
Firestore you already have `firebase-admin` installed for means writing one class
and changing one constructor argument.

---

## API

| Method | Route | |
|---|---|---|
| GET | `/api/evolution/state` | population, stats, recent events, engine status |
| GET | `/api/evolution/stream` | SSE: `activity` per event, `state` on transitions |
| GET | `/api/evolution/skills/:id` | one skill + fitness + gate breakdown |
| GET | `/api/evolution/heatmap` | per-(skill, scenario) performance grid |
| GET | `/api/evolution/cognition` | measured per-skill execution telemetry |
| GET | `/api/evolution/mutations` | mutation-type effectiveness |
| GET | `/api/evolution/conflicts` | detected contradictions between skills |
| GET | `/api/evolution/audit` | champion lineage audits + aggregate stats |
| GET | `/api/evolution/scenarios` | the train/holdout split |
| GET | `/api/evolution/lineage-graph` | ancestry graph across the population |
| GET | `/api/evolution/skills/:id/lineage` | real lineage for any skill, any stage |
| POST | `/api/evolution/benchmark` | `{skillId}` — executes against held-out scenarios |
| POST | `/api/evolution/swarm` | `{scenarioId, skillIds}` — ranked head-to-head |
| POST | `/api/evolution/control` | `{action: "start" \| "pause" \| "tick"}` |
| POST | `/api/evolution/seed` | `{vectors: [...]}` — hand-seed a genome |
| POST | `/api/evolution/remix` | `{parentAId, parentBId}` — forced crossover |

`/api/evolution/control` with `tick` returns immediately; a tick can take a
minute and progress arrives over SSE.

---

## Files

```
server/evolution/
  config.ts        every tunable, plus env overrides
  store.ts         atomic snapshot + JSONL event log, behind an interface
  llm.ts           Gemini wrapper, JSON coercion, retry, budget governor
  scenarios.ts     10 executable adversarial scenarios + train/holdout split
  genome.ts        propose / mutate / crossover, mutation-type selection
  evaluator.ts     execute, judge, deterministic scoring
  fitness.ts       rolling stats, promotion/demotion gates, selection, diversity
  projections.ts   heatmap, lineage audit, cognitive, mutation read models
  cognition.ts     telemetry → cognitive metrics, with explicit nulls
  conflicts.ts     contradiction detection between two skills
  runs.ts          on-demand benchmark and swarm execution
  lineageGraph.ts  ancestry graph with depth assignment

server/lib/
  security.ts      safeJoin, parseTicker, operator guard, rate limiting
  engine.ts        the tick loop
  routes.ts        REST + SSE
  preflight.ts     live smoke test against the real API
  engine.test.ts   54 offline tests, no API calls

src/hooks/useEvolution.ts                    SSE client, seed-data fallback
src/components/skills/LineageGraphView.tsx   layered DAG renderer
```

---

## Projections

Two dashboard views need the same data shaped differently. `projections.ts`
derives them — pure reads over what the engine already stores, no extra model
calls:

**Scenario heatmap** (`GET /api/evolution/heatmap`) — one point per
(skill, scenario) pair that has actually been evaluated, with mean score, run
count, rule compliance, and the most recent verdict. Unevaluated pairs are
*omitted* rather than zero-filled: a blank cell means "not tested yet", which is
a different claim from "tested and scored zero".

**Champion lineage audits** (`GET /api/evolution/audit`) — built from the real
`EvolutionIteration` records the engine writes during mutation and crossover.
The baseline is a skill's first recorded evaluation, not its stage-history
entry — that one is 0 because the skill had not been evaluated yet, and using it
turns every champion into a meaningless "+100% improvement".

These are fetched rather than streamed. They are derived views over the
population the SSE stream already pushes, so streaming them too would double the
payload every tick for data most users are not looking at.

Both components fall back to their seed arrays when no engine is connected, so
a static deployment still renders. When the engine *is* connected but has no
champions yet, the audit view reports zero rather than seed data — an empty
result is a true statement about the population.

## Conflict detection

Two skills conflict when they reach *contradictory* conclusions on the same
scenario, not merely different ones. A forensic skill flagging a hidden
liability and a behavioural skill noting evasive language are both right and are
not in conflict. One concluding "reclassify $620M to financing" and another
concluding "the classification is correct as presented" are in conflict, and an
agent holding both produces incoherent output.

That distinction cannot be computed from scores, so it costs a judge call.
`phaseDetectConflicts` runs one candidate pair per tick — the pair space is
quadratic in population size and most pairs never conflict, so exhaustive
checking would crowd out the evaluations that actually drive evolution.
Champion-vs-champion pairs are checked first, since both are trusted and a
contradiction between them is the one that reaches output.

Comparison needs the actual text, so `SkillRuntime.recentOutputs` retains the
last four executions per skill, truncated to 4 kB. It is a comparison buffer,
not an archive. Conflicts involving a retired skill are pruned on every save.

## Measured telemetry

`CognitiveLoadMetrics` asks for eight numbers. Six are derivable from what the
API actually returns; two are not, and they are **null**:

| Metric | Source |
|---|---|
| `inferenceLatencyMs` | wall clock around the call |
| `contextWindowPressure` | `promptTokenCount` ÷ model input limit |
| `workingMemoryUsage` | `thoughtsTokenCount` ÷ total generated tokens |
| `tokenCertainty` | `exp(avgLogprobs)` — geometric mean per-token probability |
| `backtrackingCount` | sentences containing a revision marker, counted from the text |
| `cognitiveStrainIndex` | composite over whichever of the above were measurable |
| `attentionEntropy` | **null** — the API returns a mean log probability, not a distribution |
| `heuristicPruningRate` | **null** — would need visibility into a search space the model never exposes |

A proxy for entropy computed from `avgLogprobs` would look like a measurement
and be one. The UI renders these as `—`, and the profile declares them in an
`unavailable` array so the blank is explained rather than mysterious.

`samples` counts evaluations that actually carry telemetry, not the skill's
total evaluations — records written before instrumentation existed have none,
and reporting the larger number would overstate the evidence behind the
averages.

The synthetic stream in `CognitiveLoadMonitor` is switched off whenever real
profiles are present. Mixing generated points into a panel labelled telemetry is
exactly the failure this rewrite exists to remove.

## On-demand runs

Two dashboard actions now actually execute skills rather than simulating a
result. Both cost real model calls, both are operator-triggered, and both
**refuse to start** unless the whole run fits in the remaining hourly budget —
a run that dies halfway leaves a partial comparison, and partial results still
look like results. A budget refusal returns HTTP 429, not 500: it is the
operator's problem to act on, not a server fault.

**`POST /api/evolution/benchmark { skillId }`** runs the skill against every
held-out scenario through the same execute-and-judge path the tick loop uses, so
the number is directly comparable to a score earned during evolution. That
comparability is the reason there is no separate benchmark scorer.

Scenario selection in the UI is ignored on the live path — the engine
benchmarks against its own held-out split. Letting an operator pick scenarios
the skill was tuned on would produce a flattering number that means nothing.

Benchmark results are written into the *same* evidence pool the promotion gate
reads. They have to be: if manual runs were recorded as free observations, an
operator could re-run a skill until it got lucky. Because they land in the pool,
the gate's variance check sees them.

**`POST /api/evolution/swarm { scenarioId, skillIds }`** runs several skills
head-to-head on one scenario and ranks them. It reports `indecisive: true` when
every entrant lands within two points — the ranking is then noise, and naming a
winner would be reading a result out of nothing.

**`GET /api/evolution/skills/:id/lineage`** returns real lineage for a skill at
any stage. The seed helper synthesised a plausible history for skills it had no
record of; this returns what was actually recorded, including nothing.

## Conflict detection convergence

A clean pair was never recorded, so it stayed at the head of the queue and was
re-checked every tick: 36 of 38 checks went to one pair. Checks are now keyed on
both genomes, so each pair is judged once per genome version and again only
after one of them mutates. Up to `conflictChecksPerTick` (2) run per tick,
ordered by stakes and then by score divergence on a shared scenario.

## What is still mock

Both former holdouts now render real data when the engine is connected:
`AgentSwarmController` shows `LiveSwarmRunner` (real head-to-head runs, entrants
limited to skills covering the scenario), and `MutationProbabilityMap` shows
`MutationEffectivenessView`. The latter replaces a "champion probability" that
came from a hand-written formula clamped to 18–99.4%, with a projected-score
floor of 82 — it could not predict a weak outcome. The originals remain as the
no-engine fallback, behind a seed-data banner shown on every panel.
- `CognitiveLoadMonitor`'s streaming charts and thought-packet ticker. The
  measured table above them is real; the animated stream is not, and it is
  paused when real data is present rather than dressed up as live.

## The lineage graph

`GET /api/evolution/lineage-graph` returns the ancestry of the whole population,
rendered by `LineageGraphView` in place of the simulated synapse network.

It is **not** a synapse graph and does not claim to be. A synapse implies
co-activation — two skills firing together on a query — which the engine does not
measure. Ancestry is what it records, so ancestry is what is drawn, under its own
name. When real ancestry is available the simulated network is replaced outright
rather than shown beside it: a measured graph and a generated one under one
heading gives a viewer no way to tell which is which.

**Layout is deterministic**, not a force simulation. Depth sets the row and
position within a row is stable across renders. A physics layout drifts between
renders and invites reading meaning into distances that carry none. The only
spatial claim here is the one the data supports: an edge means "this was produced
from that", and downward means descending a lineage.

**Depth is computed from the edges, not from generation number.** A crossover
child takes `max(parent generations) + 1`, so two nodes can share a generation
while sitting at different distances from their roots — using generation as the
axis would render edges flat or backwards. A test asserts every edge goes
strictly downward.

**Both edge kinds appear**: a single solid edge for mutation, two dashed edges
for a crossover child, each labelled with that parent's genome contribution.

**Retired ancestors are kept**, drawn with a dashed outline. They are the reason
a lineage exists, and dropping them would orphan living skills whose recorded
parentage points at them.

### Mutation strategy

`mutationStrategy` decides whether a mutation creates a node:

**`branching`** (default) — the child is added as a new skill and the parent
survives. Both compete and selection decides; the parent is not privileged for
having existed first. The child starts with **no evaluation history at all** —
it is a different genome, so none of the parent's evidence transfers. This is
what puts mutation edges in the lineage graph.

**`in-place`** — the genome is overwritten. Hill-climbing: one lineage, one node,
no ancestry edge. Held-out history is cleared on mutation, because a genome that
changed cannot keep evidence it did not earn. Cheaper, but a lineage that walks
into a local optimum cannot walk back out.

Set it with `EVOLUTION_MUTATION_STRATEGY`.

Branching adds a skill to the pipeline every time it fires, so it falls back to
in-place when the population cap or the WIP cap leaves no room. A branch that is
immediately culled for population pressure costs the same as a refinement and
keeps neither, which is strictly worse than having refined.

The practical trade: branching explores more and gives you a readable ancestry,
at the cost of filling the evaluation pipeline faster. If promotions slow down
after switching, that is the WIP cap doing its job — raise `evaluationsPerTick`
or lower `maxDevelopmentWip`, don't raise `maxPopulation`.

## Limits worth knowing

- **Ten scenarios is a small bank.** The distinct-scenario gate needs four
  held-out, and there are only three or four in the held-out split. Adding
  scenarios to `SCENARIO_BANK` is the single highest-leverage improvement
  available — everything else is tuning.
- **The judge is a model.** It is more reliable than asking for a score, but it
  is not ground truth, and executor and judge being the same model family means
  correlated blind spots. Pointing `EVOLUTION_JUDGE_MODEL` at a different family
  than `EVOLUTION_EXECUTOR_MODEL` would help.
- **Hill-climbing, not population search.** Mutation replaces the parent, so a
  lineage can get stuck on a local optimum. Crossover and niche diversity
  pressure mitigate this; they do not eliminate it.
- **The success path has not run against a real key.** Everything reachable
  without one is verified live: the request shape is accepted by
  `generativelanguage.googleapis.com` (rejected only at auth, with
  `API_KEY_INVALID`), the model names are checked against Google's current model
  list, and the whole failure path — bad key, self-pause, persistence — was run
  against the live endpoint. What has *not* been exercised is a successful
  generation, so the genome and rubric prompts are unproven against real output.
  Expect to tune them once `npm run preflight:evolution` shows you what comes
  back.
