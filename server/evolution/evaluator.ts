/**
 * Execution and grading.
 *
 * Two model calls per evaluation, deliberately separated:
 *   1. The executor runs the skill's prompt matrix against a scenario.
 *   2. The judge grades that output against the scenario's constraints.
 *
 * The judge never emits a score. It emits structured observations — which
 * constraints were met, which failure modes were hit, how many unsupported
 * claims appeared — and the score is computed from those in code. A model
 * asked for "a score out of 100" will drift, cluster around 85, and reward
 * confident prose. A model asked "did the response do X, yes or no" is far
 * more stable, and the weighting stays inspectable and tunable here rather
 * than buried in a prompt.
 */

import type { AgentSkill, SkillTestCase } from '../../src/types/skills.ts';
import type { EvolutionConfig } from './config.ts';
import type { LlmClient } from './llm.ts';
import { deriveCognitiveMetrics, type MeasuredCognitiveMetrics } from './cognition.ts';
import type { ExecutableScenario } from './scenarios.ts';

export interface JudgeRubric {
  /** One entry per expected constraint, in order. */
  constraintResults: {
    constraint: string;
    satisfied: boolean;
    evidence: string;
  }[];
  /** Failure modes from the scenario that the response actually committed. */
  failureModesTriggered: string[];
  /** Claims asserted as fact that the scenario input does not support. */
  unsupportedClaims: string[];
  /** The skill's own strictRules that the response violated. */
  ruleViolations: string[];
  /** 1-5. Is the chain of reasoning actually a chain, or assertions in sequence? */
  reasoningQuality: number;
  /** 1-5. Does it distinguish what it knows from what it is inferring? */
  epistemicCalibration: number;
  /** Free-text, surfaced in the UI. */
  verdictSummary: string;
  convictionVerdict: string;
}

export interface EvaluationResult {
  scenarioId: string;
  scenarioName: string;
  score: number;
  ruleCompliance: number;
  hallucinationFlags: number;
  criticalViolations: number;
  reasoningSteps: string[];
  rubric: JudgeRubric;
  rawOutput: string;
  callsUsed: number;
  /** Measured, not estimated. Unmeasurable fields are null. */
  cognitive: MeasuredCognitiveMetrics;
}

/** Weights sum to 100 before penalties. Tune here, not in prompts. */
const WEIGHTS = {
  constraints: 55,
  ruleCompliance: 15,
  reasoning: 15,
  calibration: 15,
} as const;

const PENALTIES = {
  perUnsupportedClaim: 6,
  perFailureMode: 8,
  perRuleViolation: 15,
} as const;

/** Compose a skill's prompt matrix into a system instruction. */
export function buildSystemInstruction(skill: AgentSkill): string {
  return [
    `You are ${skill.specialistRole}.`,
    '',
    '## DIRECTIVE',
    skill.promptMatrix.systemDirective,
    '',
    '## REASONING FRAMEWORK',
    skill.promptMatrix.reasoningFramework,
    '',
    '## ADVERSARIAL CONSTRAINT',
    skill.promptMatrix.adversarialConstraint,
    '',
    '## STRICT RULES — violating any of these invalidates your response',
    ...skill.strictRules.map((r) => `- ${r}`),
    '',
    'Where the input does not support a conclusion, say so explicitly rather than estimating.',
    'Distinguish what the input states from what you are inferring.',
  ].join('\n');
}

export async function executeSkill(
  llm: LlmClient,
  cfg: EvolutionConfig,
  skill: AgentSkill,
  scenario: ExecutableScenario,
): Promise<{ output: string; reasoningSteps: string[]; cognitive: MeasuredCognitiveMetrics }> {
  const prompt = [
    `## SCENARIO: ${scenario.name}`,
    `Category: ${scenario.category} | Adversarial difficulty: ${scenario.adversarialDifficulty}`,
    '',
    scenario.inputScenario,
    '',
    '---',
    'Produce your analysis. Structure it as:',
    '1. A numbered list of your reasoning steps, one line each.',
    '2. A section headed "VERDICT" containing your conclusion.',
    'Be specific. Cite the parts of the input you are relying on.',
  ].join('\n');

  const { text: output, telemetry } = await llm.generateWithTelemetry({
    model: cfg.executorModel,
    system: buildSystemInstruction(skill),
    prompt,
    temperature: 0.5,
    maxOutputTokens: 4096,
  });

  return {
    output,
    reasoningSteps: extractReasoningSteps(output),
    cognitive: deriveCognitiveMetrics(telemetry, output),
  };
}

export async function judgeExecution(
  llm: LlmClient,
  cfg: EvolutionConfig,
  skill: AgentSkill,
  scenario: ExecutableScenario,
  output: string,
): Promise<JudgeRubric> {
  const prompt = [
    'You are grading one response against a fixed rubric. You are not writing the response yourself.',
    'Be strict. A fluent, confident response that misses a constraint has missed the constraint.',
    '',
    '## THE SCENARIO GIVEN',
    scenario.inputScenario,
    '',
    '## CONSTRAINTS A CORRECT RESPONSE MUST SATISFY',
    ...scenario.expectedConstraints.map((c, i) => `${i + 1}. ${c}`),
    '',
    '## KNOWN FAILURE MODES (mark only those the response actually commits)',
    ...scenario.knownFailureModes.map((f, i) => `${i + 1}. ${f}`),
    '',
    '## RULES THE RESPONDER WAS BOUND BY',
    ...skill.strictRules.map((r, i) => `${i + 1}. ${r}`),
    '',
    '## THE RESPONSE TO GRADE',
    output,
    '',
    '---',
    'Return JSON with exactly this shape:',
    JSON.stringify(
      {
        constraintResults: [{ constraint: 'verbatim constraint text', satisfied: true, evidence: 'quote or brief justification' }],
        failureModesTriggered: ['verbatim failure mode text'],
        unsupportedClaims: ['claim asserted as fact that the scenario input does not support'],
        ruleViolations: ['verbatim rule text that was violated'],
        reasoningQuality: 4,
        epistemicCalibration: 3,
        verdictSummary: 'two sentences on what the response got right and wrong',
        convictionVerdict: 'a short label, e.g. SOUND / PARTIAL / UNSOUND with a parenthetical',
      },
      null,
      2,
    ),
    '',
    'constraintResults must contain one entry per constraint, in the order listed.',
    'reasoningQuality and epistemicCalibration are integers from 1 to 5.',
    'Leave arrays empty if nothing qualifies. Do not invent violations to seem rigorous.',
  ].join('\n');

  const raw = await llm.generateJson<Partial<JudgeRubric>>({
    model: cfg.judgeModel,
    prompt,
    temperature: 0.1,
    maxOutputTokens: 3072,
  });

  return normaliseRubric(raw, scenario);
}

/** Defend against a judge that returns a partial or malformed rubric. */
function normaliseRubric(raw: Partial<JudgeRubric>, scenario: ExecutableScenario): JudgeRubric {
  const results = Array.isArray(raw.constraintResults) ? raw.constraintResults : [];

  // Align to the canonical constraint list. A judge that returned fewer entries
  // than there are constraints has implicitly not satisfied the missing ones —
  // treating them as satisfied would let a lazy judge inflate every score.
  const constraintResults = scenario.expectedConstraints.map((constraint, i) => {
    const match = results[i];
    return {
      constraint,
      satisfied: Boolean(match?.satisfied),
      evidence: typeof match?.evidence === 'string' ? match.evidence : 'No assessment returned.',
    };
  });

  const clamp5 = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 3;
    return Math.min(5, Math.max(1, Math.round(n)));
  };
  const strArray = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  return {
    constraintResults,
    failureModesTriggered: strArray(raw.failureModesTriggered),
    unsupportedClaims: strArray(raw.unsupportedClaims),
    ruleViolations: strArray(raw.ruleViolations),
    reasoningQuality: clamp5(raw.reasoningQuality),
    epistemicCalibration: clamp5(raw.epistemicCalibration),
    verdictSummary: typeof raw.verdictSummary === 'string' ? raw.verdictSummary : 'No summary returned.',
    convictionVerdict: typeof raw.convictionVerdict === 'string' ? raw.convictionVerdict : 'UNSCORED',
  };
}

/**
 * Deterministic score from the rubric. Same rubric in, same number out, every
 * time — which is what makes generation-over-generation comparison meaningful.
 */
export function scoreFromRubric(rubric: JudgeRubric): {
  score: number;
  ruleCompliance: number;
} {
  const total = rubric.constraintResults.length || 1;
  const satisfied = rubric.constraintResults.filter((c) => c.satisfied).length;
  const constraintScore = (satisfied / total) * WEIGHTS.constraints;

  const ruleCompliance =
    rubric.ruleViolations.length === 0
      ? 100
      : Math.max(0, 100 - rubric.ruleViolations.length * 25);
  const ruleScore = (ruleCompliance / 100) * WEIGHTS.ruleCompliance;

  // 1-5 maps to 0-1 across four intervals, so a 1 scores zero rather than 20%.
  const reasoningScore = ((rubric.reasoningQuality - 1) / 4) * WEIGHTS.reasoning;
  const calibrationScore = ((rubric.epistemicCalibration - 1) / 4) * WEIGHTS.calibration;

  const penalties =
    rubric.unsupportedClaims.length * PENALTIES.perUnsupportedClaim +
    rubric.failureModesTriggered.length * PENALTIES.perFailureMode +
    rubric.ruleViolations.length * PENALTIES.perRuleViolation;

  const raw = constraintScore + ruleScore + reasoningScore + calibrationScore - penalties;
  return {
    score: Number(Math.min(100, Math.max(0, raw)).toFixed(1)),
    ruleCompliance,
  };
}

export async function evaluate(
  llm: LlmClient,
  cfg: EvolutionConfig,
  skill: AgentSkill,
  scenario: ExecutableScenario,
): Promise<EvaluationResult> {
  const { output, reasoningSteps, cognitive } = await executeSkill(llm, cfg, skill, scenario);
  const rubric = await judgeExecution(llm, cfg, skill, scenario, output);
  const { score, ruleCompliance } = scoreFromRubric(rubric);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    score,
    ruleCompliance,
    hallucinationFlags: rubric.unsupportedClaims.length,
    criticalViolations: rubric.ruleViolations.length,
    reasoningSteps,
    rubric,
    rawOutput: output,
    callsUsed: 2,
    cognitive,
  };
}

/** Convert an evaluation into the SkillTestCase shape the dashboard renders. */
export function toTestCase(
  scenario: ExecutableScenario,
  result: EvaluationResult,
  threshold: number,
): SkillTestCase {
  return {
    id: `tc-${scenario.id}`,
    title: scenario.name,
    realWorldUseCase: scenario.realWorldUseCase,
    inputScenario: scenario.inputScenario,
    expectedConstraints: scenario.expectedConstraints,
    targetThreshold: threshold,
    lastScore: result.score,
    status: result.score >= threshold ? 'passed' : result.criticalViolations > 0 ? 'flagged' : 'testing',
    testedAt: new Date().toISOString(),
    executionLog: {
      reasoningSteps: result.reasoningSteps,
      detectedVectors: scenario.vectors,
      ruleComplianceScore: result.ruleCompliance,
      convictionVerdict: result.rubric.convictionVerdict,
      verdictSummary: result.rubric.verdictSummary,
    },
  };
}

function extractReasoningSteps(output: string): string[] {
  const steps: string[] = [];
  for (const line of output.split('\n')) {
    const match = line.match(/^\s*(?:\d+[.)]|[-*])\s+(.{10,})$/);
    if (match) steps.push(match[1].trim());
    if (steps.length >= 12) break;
  }
  if (steps.length === 0) {
    // No list structure — fall back to the first few substantial sentences.
    return output
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 40)
      .slice(0, 5);
  }
  return steps;
}
