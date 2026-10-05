/**
 * Cognitive-load metrics derived from measured call telemetry.
 *
 * The dashboard's CognitiveLoadMetrics shape asks for eight numbers. Six of them
 * can be honestly derived from what the API actually returns. Two cannot:
 *
 *   attentionEntropy    — Shannon entropy over the token distribution. The API
 *                         returns a mean log probability, not a distribution, so
 *                         real entropy is not recoverable. A proxy computed from
 *                         avgLogprobs would look like a measurement and be one.
 *   heuristicPruningRate — would require visibility into a search space the
 *                         model does not expose at all.
 *
 * Both stay null. The UI renders them as unavailable. That is the whole point of
 * replacing the mock: a number nobody measured is worse than a blank, because a
 * blank is honest and a number gets trusted.
 */

import type { CallTelemetry } from './llm.ts';

/** Input context limits, used for context-window pressure. */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'gemini-3.8-flash': 1_048_576,
  'gemini-3.7-flash': 1_048_576,
  'gemini-3.6-flash': 1_048_576,
  'gemini-3.5-flash': 1_048_576,
  'gemini-3.5-flash-lite': 1_048_576,
};
const DEFAULT_CONTEXT_LIMIT = 1_048_576;

export interface MeasuredCognitiveMetrics {
  /** Reasoning tokens as a share of total generation. Null without thought tokens. */
  workingMemoryUsage: number | null;
  inferenceLatencyMs: number;
  /** Not derivable from the API. Always null — see the note at the top. */
  attentionEntropy: null;
  /** Counted from explicit revision markers in the response text. */
  backtrackingCount: number;
  /** exp(avgLogprob) as a mean per-token probability. Null without logprobs. */
  tokenCertainty: number | null;
  /** Not derivable from the API. Always null. */
  heuristicPruningRate: null;
  contextWindowPressure: number | null;
  /** Composite over whichever of the above were measurable. */
  cognitiveStrainIndex: number | null;
}

/**
 * Phrases that mark the model revising a position it already stated.
 *
 * This is a text measurement, not a claim about internal state. It counts how
 * often the output visibly reverses itself, which is a real and useful property
 * of a response even though it is not "backtracking" in a search-algorithm sense.
 */
const REVISION_MARKERS = [
  /\bhowever\b/gi,
  /\bon reflection\b/gi,
  /\breconsider/gi,
  /\bactually,/gi,
  /\bthat said\b/gi,
  /\bcorrection[:,]/gi,
  /\brevising\b/gi,
  /\bI initially\b/gi,
  /\bbut this (?:would be|is) (?:wrong|incorrect|mistaken)/gi,
  /\bstepping back\b/gi,
];

/**
 * Counts *sentences* that contain at least one revision marker, not marker
 * occurrences. "However, revising step one" is one reversal, and counting the
 * markers would score it as two.
 */
export function countRevisions(text: string): number {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/);
  let count = 0;
  for (const sentence of sentences) {
    if (REVISION_MARKERS.some((p) => { p.lastIndex = 0; return p.test(sentence); })) count++;
  }
  return count;
}

export function deriveCognitiveMetrics(
  telemetry: CallTelemetry,
  responseText: string,
): MeasuredCognitiveMetrics {
  const { thoughtTokens, outputTokens, promptTokens, avgLogprob, latencyMs, model } = telemetry;

  const generated = (thoughtTokens ?? 0) + (outputTokens ?? 0);
  const workingMemoryUsage =
    thoughtTokens !== null && generated > 0
      ? Number(((thoughtTokens / generated) * 100).toFixed(1))
      : null;

  // avgLogprob is a mean log probability, so exponentiating gives the geometric
  // mean per-token probability. 0.9 means the model was, on average, 90%
  // confident in each token it emitted.
  const tokenCertainty =
    avgLogprob !== null ? Number((Math.exp(avgLogprob) * 100).toFixed(1)) : null;

  const limit = MODEL_CONTEXT_LIMITS[model] ?? DEFAULT_CONTEXT_LIMIT;
  const contextWindowPressure =
    promptTokens !== null ? Number(((promptTokens / limit) * 100).toFixed(3)) : null;

  const backtrackingCount = countRevisions(responseText);

  // Composite over the measurable components only. Each term is normalised so
  // that higher means more strain, and the index is the mean of whatever was
  // available — so a missing component reduces coverage rather than silently
  // contributing a zero.
  const terms: number[] = [];
  // 30s is treated as a fully-strained response time.
  terms.push(Math.min(100, (latencyMs / 30_000) * 100));
  if (workingMemoryUsage !== null) terms.push(workingMemoryUsage);
  if (tokenCertainty !== null) terms.push(100 - tokenCertainty);
  // 8+ visible reversals in one response is treated as maximum strain.
  terms.push(Math.min(100, (backtrackingCount / 8) * 100));
  if (contextWindowPressure !== null) terms.push(Math.min(100, contextWindowPressure));

  const cognitiveStrainIndex = terms.length
    ? Number((terms.reduce((a, b) => a + b, 0) / terms.length).toFixed(1))
    : null;

  return {
    workingMemoryUsage,
    inferenceLatencyMs: latencyMs,
    attentionEntropy: null,
    backtrackingCount,
    tokenCertainty,
    heuristicPruningRate: null,
    contextWindowPressure,
    cognitiveStrainIndex,
  };
}

/** Average a set of measurements, ignoring nulls. Returns null if all are null. */
export function meanOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return Number((present.reduce((a, b) => a + b, 0) / present.length).toFixed(1));
}
