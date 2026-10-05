/**
 * Live preflight against the real Gemini API.
 *
 *   npm run preflight:evolution
 *
 * Run this before turning on EVOLUTION_AUTOSTART. It spends roughly five model
 * calls and answers the questions that only the live API can:
 *
 *   - is the key valid?
 *   - does the key have access to the three configured models?
 *   - does the architect actually return a usable genome?
 *   - does the executor produce something the judge can grade?
 *   - does the judge return a rubric that scores sensibly?
 *
 * Nothing is persisted and the engine loop never starts.
 */

import 'dotenv/config';
import { loadConfig } from './config.ts';
import { LlmClient, AuthFailureError } from './llm.ts';
import { SCENARIO_BANK, splitScenarios, validateSplit } from './scenarios.ts';
import { proposeSkill, ALL_VECTORS } from './genome.ts';
import { executeSkill, judgeExecution, scoreFromRubric } from './evaluator.ts';

const OK = '\x1b[32m✓\x1b[0m';
const BAD = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m!\x1b[0m';

function fail(message: string, hint?: string): never {
  console.error(`\n${BAD} ${message}`);
  if (hint) console.error(`  ${hint}`);
  console.error('');
  process.exit(1);
}

async function main() {
  console.log('\nEvolution engine — live preflight\n');

  // ---- 1. key present ---------------------------------------------------
  if (!process.env.GEMINI_API_KEY) {
    fail('GEMINI_API_KEY is not set.', 'Copy .env.example to .env and set it, then re-run.');
  }
  console.log(`${OK} GEMINI_API_KEY present (${process.env.GEMINI_API_KEY!.length} chars)`);

  const cfg = loadConfig();
  const llm = new LlmClient(cfg);

  console.log(`  executor:  ${cfg.executorModel}`);
  console.log(`  judge:     ${cfg.judgeModel}`);
  console.log(`  architect: ${cfg.architectModel}`);

  if (cfg.executorModel === cfg.judgeModel) {
    console.log(
      `${WARN} executor and judge are the same model — grading will share the executor's blind spots.`,
    );
  }

  // ---- 2. model reachability -------------------------------------------
  console.log('\nModel access');
  const models = [...new Set([cfg.executorModel, cfg.judgeModel, cfg.architectModel])];
  for (const model of models) {
    try {
      await llm.generate({ model, prompt: 'Reply with the single word: ok', maxOutputTokens: 256 });
      console.log(`  ${OK} ${model}`);
    } catch (err) {
      if (err instanceof AuthFailureError) {
        fail(
          `${model} rejected the key.`,
          'Either the key is invalid, or this project lacks access to that model. ' +
            'Gemini 2.5 models in particular are restricted to projects with prior usage and retire in October 2026. ' +
            'Set EVOLUTION_EXECUTOR_MODEL / EVOLUTION_JUDGE_MODEL / EVOLUTION_ARCHITECT_MODEL to a model you can reach.',
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { cause?: { code?: string } })?.cause?.code;
      if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|certificate|UNABLE_TO_|SELF_SIGNED/i.test(`${message} ${code ?? ''}`)) {
        fail(
          `Could not reach Google's API for ${model}${code ? ` (${code})` : ''}.`,
          'Check the internet connection. On a school or work network, TLS inspection can block it; ' +
            'set NODE_EXTRA_CA_CERTS to your organisation\'s certificate bundle.',
        );
      }
      fail(`${model} failed: ${message}`);
    }
  }

  // ---- 3. architect returns a usable genome -----------------------------
  console.log('\nGenome generation');
  let skill;
  try {
    skill = await proposeSkill(llm, cfg, ['Forensic Accounting', 'Statistics & Stochastic'], [], 1);
  } catch (err) {
    fail(
      `Architect did not return a parseable genome: ${err instanceof Error ? err.message : String(err)}`,
      'This is usually a prompt problem, not an API problem. Check genome.ts GENOME_SHAPE.',
    );
  }
  console.log(`  ${OK} proposed "${skill.name}"`);
  console.log(`     role:    ${skill.specialistRole}`);
  console.log(`     vectors: ${skill.vectors.join(', ')}`);
  console.log(`     rules:   ${skill.strictRules.length}`);
  if (skill.strictRules.length < 2) {
    console.log(`  ${WARN} fewer than 2 rules — the architect prompt may need tightening.`);
  }

  // ---- 4. execute + judge a real scenario -------------------------------
  const { holdout } = splitScenarios(SCENARIO_BANK, cfg.holdoutFraction);
  const scenario = holdout[0];
  console.log(`\nEvaluation against "${scenario.shortName}"`);

  const { output, reasoningSteps } = await executeSkill(llm, cfg, skill, scenario);
  console.log(`  ${OK} executor returned ${output.length} chars, ${reasoningSteps.length} reasoning steps`);
  if (reasoningSteps.length === 0) {
    console.log(`  ${WARN} no reasoning steps parsed — check extractReasoningSteps in evaluator.ts.`);
  }

  const rubric = await judgeExecution(llm, cfg, skill, scenario, output);
  const { score, ruleCompliance } = scoreFromRubric(rubric);
  const met = rubric.constraintResults.filter((c) => c.satisfied).length;

  console.log(`  ${OK} judge returned a rubric`);
  console.log(`     constraints met:    ${met}/${rubric.constraintResults.length}`);
  console.log(`     failure modes hit:  ${rubric.failureModesTriggered.length}`);
  console.log(`     unsupported claims: ${rubric.unsupportedClaims.length}`);
  console.log(`     rule violations:    ${rubric.ruleViolations.length}`);
  console.log(`     reasoning / calibration: ${rubric.reasoningQuality}/5, ${rubric.epistemicCalibration}/5`);
  console.log(`     → computed score:   ${score}%  (rule compliance ${ruleCompliance}%)`);
  console.log(`     verdict: ${rubric.convictionVerdict}`);

  // A judge that marks everything satisfied on a brand-new untrained genome is
  // not grading, it is rubber-stamping. Worth knowing before you trust scores.
  if (met === rubric.constraintResults.length && rubric.unsupportedClaims.length === 0) {
    console.log(
      `\n${WARN} The judge passed every constraint on a first-generation genome. That may be correct,\n` +
        `  but it is the signature of a lenient judge. Read the output above and sanity-check it\n` +
        `  before trusting the promotion gate.`,
    );
  }
  if (score >= cfg.championThreshold) {
    console.log(
      `${WARN} An untrained genome already scored above the ${cfg.championThreshold}% champion threshold.\n` +
        `  Either the scenario is too easy or the judge is too generous — raise the threshold,\n` +
        `  harden the scenario constraints, or use a stronger judge model.`,
    );
  }

  // ---- 4b. logprobs support --------------------------------------------
  const noLogprobs = llm.modelsWithoutLogprobs;
  if (noLogprobs.length > 0) {
    console.log(
      `\n${WARN} ${noLogprobs.join(', ')} rejected responseLogprobs. Calls succeed without it, but token\n` +
        `  certainty will show as unmeasured (—) for skills executed on ${noLogprobs.length === 1 ? 'that model' : 'those models'}.`,
    );
  } else {
    console.log(`\n${OK} logprobs supported on every model used so far`);
  }

  // ---- 4c. scenario coverage -------------------------------------------
  const { training: tr, holdout: ho } = splitScenarios(SCENARIO_BANK, cfg.holdoutFraction);
  const gaps = validateSplit(tr, ho, ALL_VECTORS).filter((r) => !r.ok);
  if (gaps.length > 0) {
    console.log(`${WARN} thin scenario coverage: ${gaps.map((g) => `${g.vector} (${g.training}/${g.holdout})`).join(', ')}`);
  } else {
    console.log(`${OK} every vector has training and held-out coverage (${SCENARIO_BANK.length} scenarios, ${ho.length} held-out)`);
  }

  // ---- 5. cost projection ----------------------------------------------
  const budget = llm.budget.status();
  // Two eval phases × evals/tick × 2 calls, champion regression and smoke test
  // (2 each), one variation call, and the conflict checks.
  const perTick = 2 * cfg.evaluationsPerTick * 2 + 4 + 1 + cfg.conflictChecksPerTick;
  const ticksPerHour = 3_600_000 / cfg.tickIntervalMs;
  console.log('\nProjected load');
  console.log(`  ${llm.callCount} calls used by this preflight`);
  console.log(`  ~${perTick} calls/tick × ${ticksPerHour.toFixed(1)} ticks/hour ≈ ${Math.round(perTick * ticksPerHour)} calls/hour`);
  console.log(`  ceiling: ${budget.maxCallsPerHour}/hour`);
  if (perTick * ticksPerHour > budget.maxCallsPerHour) {
    console.log(
      `  ${WARN} Projected demand exceeds the ceiling, so the engine will spend part of each hour\n` +
        `     throttled. Raise EVOLUTION_MAX_CALLS_PER_HOUR or increase EVOLUTION_TICK_MS.`,
    );
  } else {
    console.log(`  ${OK} projected demand fits inside the ceiling`);
  }

  console.log(`\n${OK} Preflight passed. Start the loop with EVOLUTION_AUTOSTART=true or the dashboard pulse button.\n`);
}

main().catch((err) => {
  console.error(`\n${BAD} Preflight crashed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
