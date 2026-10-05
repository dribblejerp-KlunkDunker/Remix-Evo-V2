/**
 * Model access for the evolution engine.
 *
 * The engine is designed to run unattended and indefinitely, so unbounded model
 * calls are the main operational risk. Everything goes through a governor that
 * enforces an hourly call ceiling and a concurrency cap; when the budget is
 * exhausted the engine idles instead of spending.
 */

import { GoogleGenAI } from '@google/genai';
import { extractJsonBlocks } from '../lib/jsonExtractor.ts';
import { multiProviderLlm } from '../lib/multiProviderLlm.ts';
import type { EvolutionConfig } from './config.ts';

export class BudgetExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExhaustedError';
  }
}

/**
 * A bad, revoked, or unentitled key. Distinct from a transient failure because
 * retrying cannot fix it — the caller should stop rather than spin.
 * Google returns HTTP 400 with reason API_KEY_INVALID for this, not 401.
 */
export class AuthFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFailureError';
  }
}

function isAuthFailure(message: string): boolean {
  return /API_KEY_INVALID|API key not valid|PERMISSION_DENIED|UNAUTHENTICATED|401|403/i.test(message);
}

/**
 * What one model call actually cost and how confident it was.
 *
 * Everything here is measured, not estimated. Fields the API does not return
 * stay null rather than being filled with a plausible number — a fabricated
 * telemetry value is worse than a missing one, because it looks like evidence.
 */
export interface CallTelemetry {
  latencyMs: number;
  promptTokens: number | null;
  outputTokens: number | null;
  /** Reasoning tokens, when the model reports them separately. */
  thoughtTokens: number | null;
  totalTokens: number | null;
  /** Mean log probability over generated tokens; null unless logprobs returned. */
  avgLogprob: number | null;
  model: string;
}

export interface CallOptions {
  model: string;
  system?: string;
  prompt: string;
  /** Lower for grading, higher for idea generation. */
  temperature?: number;
  maxOutputTokens?: number;
}

export interface BudgetStatus {
  callsInWindow: number;
  maxCallsPerHour: number;
  remaining: number;
  inFlight: number;
  maxConcurrency: number;
  throttled: boolean;
}

export class BudgetGovernor {
  private callTimestamps: number[] = [];
  private inFlight = 0;

  constructor(private cfg: EvolutionConfig) {}

  private prune(): void {
    const cutoff = Date.now() - 3_600_000;
    // Timestamps are appended in order, so a single scan from the front is enough.
    let i = 0;
    while (i < this.callTimestamps.length && this.callTimestamps[i] < cutoff) i++;
    if (i > 0) this.callTimestamps.splice(0, i);
  }

  status(): BudgetStatus {
    this.prune();
    const remaining = this.cfg.maxCallsPerHour - this.callTimestamps.length;
    return {
      callsInWindow: this.callTimestamps.length,
      maxCallsPerHour: this.cfg.maxCallsPerHour,
      remaining: Math.max(0, remaining),
      inFlight: this.inFlight,
      maxConcurrency: this.cfg.maxConcurrency,
      throttled: remaining <= this.cfg.maxCallsPerHour * this.cfg.budgetReservePct,
    };
  }

  /** True when there is enough headroom to start a unit of work of `cost` calls. */
  canAfford(cost: number): boolean {
    const s = this.status();
    return s.remaining - cost > this.cfg.maxCallsPerHour * this.cfg.budgetReservePct;
  }

  async acquire(): Promise<void> {
    this.prune();
    if (this.callTimestamps.length >= this.cfg.maxCallsPerHour) {
      throw new BudgetExhaustedError(
        `Hourly model call budget exhausted (${this.cfg.maxCallsPerHour}/hr).`,
      );
    }
    // Wait for a concurrency slot rather than rejecting — callers are batched.
    while (this.inFlight >= this.cfg.maxConcurrency) {
      await new Promise((r) => setTimeout(r, 150));
    }
    this.inFlight++;
    this.callTimestamps.push(Date.now());
  }

  release(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }

  /** Clears the hourly window and resets in-flight counters (e.g. on operator manual reset). */
  reset(): void {
    this.callTimestamps = [];
    this.inFlight = 0;
  }
}

export class LlmClient {
  private ai: GoogleGenAI;
  public readonly budget: BudgetGovernor;
  private totalCalls = 0;
  private consecutiveAuthFailures = 0;
  /**
   * Models that rejected `responseLogprobs`. Logprobs are only telemetry, so a
   * model that does not support them must not take every call down with it —
   * the flag is dropped for that model and the call retried once without it.
   */
  private logprobsUnsupported = new Set<string>();

  constructor(private cfg: EvolutionConfig, apiKey = process.env.GEMINI_API_KEY) {
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'x-goog-api-client': 'remix-evo-engine/1.0.0' } },
      });
    } else {
      // If GEMINI_API_KEY is unset, check if another provider key is available
      const otherKeys = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY);
      if (!otherKeys) {
        throw new Error('No LLM API key configured (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY, or GROQ_API_KEY).');
      }
      this.ai = null as any;
    }
    this.budget = new BudgetGovernor(cfg);
  }

  get callCount(): number {
    return this.totalCalls;
  }

  /** Models that turned out not to support logprobs, for the preflight report. */
  get modelsWithoutLogprobs(): string[] {
    return [...this.logprobsUnsupported];
  }

  /** Consecutive auth failures; the engine pauses itself past the configured limit. */
  get authFailures(): number {
    return this.consecutiveAuthFailures;
  }

  /** Raw text generation with retry on transient failures. */
  async generate(opts: CallOptions & { responseMimeType?: string }): Promise<string> {
    return (await this.generateWithTelemetry(opts)).text;
  }

  /** As generate(), but also returns measured cost and confidence for the call. */
  async generateWithTelemetry(
    opts: CallOptions & { responseMimeType?: string },
  ): Promise<{ text: string; telemetry: CallTelemetry }> {
    const maxAttempts = 5;
    let lastErr: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.budget.acquire();
      let released = false;
      try {
        // A hung request would hold a concurrency slot indefinitely.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.cfg.requestTimeoutMs);
        const startedAt = Date.now();
        // Route non-Gemini models (Claude, OpenAI, DeepSeek, Groq, etc.)
        const isNonGemini = opts.model.includes(':') ||
          opts.model.toLowerCase().includes('claude') ||
          opts.model.toLowerCase().includes('gpt') ||
          opts.model.toLowerCase().startsWith('o3') ||
          opts.model.toLowerCase().includes('deepseek') ||
          opts.model.toLowerCase().includes('llama') ||
          opts.model.toLowerCase().includes('mixtral') ||
          !this.ai;

        if (isNonGemini) {
          try {
            const multiRes = await multiProviderLlm.generateText({
              model: opts.model,
              prompt: opts.prompt,
              system: opts.system,
              temperature: opts.temperature,
              maxTokens: opts.maxOutputTokens,
              responseMimeType: opts.responseMimeType,
              signal: controller.signal
            });
            this.totalCalls++;
            this.consecutiveAuthFailures = 0;
            return {
              text: multiRes.text,
              telemetry: {
                latencyMs: multiRes.telemetry.latencyMs,
                promptTokens: multiRes.telemetry.promptTokens,
                outputTokens: multiRes.telemetry.outputTokens,
                thoughtTokens: null,
                totalTokens: multiRes.telemetry.totalTokens,
                avgLogprob: null,
                model: opts.model
              }
            };
          } finally {
            clearTimeout(timeout);
          }
        }

        let currentModel = opts.model;
        if (attempt >= 2 && (currentModel === 'gemini-3.8-flash' || currentModel === 'gemini-3.8-flash-thinking')) {
          currentModel = 'gemini-3.6-flash';
        }

        let response;
        try {
          response = await this.ai.models.generateContent({
            model: currentModel,
            contents: opts.prompt,
            config: {
              temperature: opts.temperature ?? 0.7,
              maxOutputTokens: opts.maxOutputTokens ?? 4096,
              abortSignal: controller.signal,
              // The only honest source for token certainty — when the model has it.
              ...(this.logprobsUnsupported.has(currentModel) ? {} : { responseLogprobs: true }),
              ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
              ...(opts.system ? { systemInstruction: opts.system } : {}),
            },
          });
        } finally {
          clearTimeout(timeout);
        }
        this.totalCalls++;
        this.consecutiveAuthFailures = 0;
        const text = response.text ?? '';
        if (!text.trim()) throw new Error('Model returned an empty response.');

        if (text.trim().startsWith('{"error":')) {
          try {
            const errObj = JSON.parse(text.trim());
            if (errObj?.error?.message) {
              throw new Error(`API Error ${errObj.error.code || ''}: ${errObj.error.message}`);
            }
          } catch (e: any) {
            if (e.message?.startsWith('API Error')) throw e;
          }
        }

        const usage = response.usageMetadata;
        const avgLogprob = response.candidates?.[0]?.avgLogprobs;
        return {
          text,
          telemetry: {
            latencyMs: Date.now() - startedAt,
            promptTokens: usage?.promptTokenCount ?? null,
            outputTokens: usage?.candidatesTokenCount ?? null,
            thoughtTokens: usage?.thoughtsTokenCount ?? null,
            totalTokens: usage?.totalTokenCount ?? null,
            avgLogprob: typeof avgLogprob === 'number' ? avgLogprob : null,
            model: currentModel,
          },
        };
      } catch (err) {
        lastErr = err;
        const message = err instanceof Error ? err.message : String(err);

        // A model that does not support logprobs answers 400 INVALID_ARGUMENT.
        // That must not be mistaken for an auth failure or a dead call: drop the
        // flag for this model and retry. Token certainty for it becomes null,
        // which the cognition layer already treats as "not measured".
        if (!this.logprobsUnsupported.has(opts.model) && /logprob/i.test(message)) {
          this.logprobsUnsupported.add(opts.model);
          console.warn(`[evolution/llm] ${opts.model} rejected responseLogprobs; continuing without token certainty for it.`);
          released = true;
          this.budget.release();
          attempt--; // this attempt does not count; the request itself was malformed for this model
          continue;
        }

        // Auth failures are terminal — retrying a bad key just burns the budget.
        if (isAuthFailure(message)) {
          this.consecutiveAuthFailures++;
          released = true;
          this.budget.release();
          throw new AuthFailureError(
            `Authentication failed for model ${opts.model}: ${message}`,
          );
        }

        const retryable = /429|500|502|503|504|deadline|timeout|unavailable|aborted|resource_exhausted|quota|rate\s*limit/i.test(message);
        if (!retryable || attempt === maxAttempts - 1) break;
        // Parse retryDelay from Google API message if available (e.g. "Please retry in 4.69s")
        const retryDelayMatch = message.match(/retry in ([0-9.]+)s/i) || message.match(/"retryDelay":\s*"(\d+)s"/i);
        const parsedRetryMs = retryDelayMatch ? Math.ceil(parseFloat(retryDelayMatch[1]) * 1000) + 800 : 0;
        const baseDelay = /429|resource_exhausted|quota|rate/i.test(message)
          ? Math.max(parsedRetryMs, 4500)
          : 800;
        const delay = Math.max(baseDelay, 1200 * 2 ** attempt) + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
      } finally {
        if (!released) {
          released = true;
          this.budget.release();
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /**
   * Generation that must return a JSON object.
   *
   * Tries native JSON mode first, then falls back to fenced-block extraction,
   * then to a brace-matched substring. A schema violation is the caller's
   * problem — this only guarantees "some parsed object".
   */
  async generateJson<T>(opts: CallOptions): Promise<T> {
    const jsonPrompt = `${opts.prompt}\n\nRespond with a single raw JSON object and nothing else. No prose, no markdown fences.`;
    // Native JSON mode constrains decoding, which is far more reliable than
    // asking politely. coerceJson below still covers the cases it misses.
    const text = await this.generate({
      ...opts,
      prompt: jsonPrompt,
      temperature: opts.temperature ?? 0.4,
      responseMimeType: 'application/json',
    });

    const parsed = coerceJson<T>(text);
    if (parsed === null) {
      throw new Error(`Model output could not be parsed as JSON: ${text.slice(0, 300)}`);
    }
    return parsed;
  }
}

/** Best-effort JSON recovery from a model response. */
export function coerceJson<T>(text: string): T | null {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  const blocks = extractJsonBlocks(trimmed);
  if (blocks.length > 0) return blocks[0] as T;

  // Last resort: take the outermost balanced brace pair.
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    } catch {
      /* give up */
    }
  }
  return null;
}
