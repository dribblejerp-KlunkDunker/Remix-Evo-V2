import { createInteraction, streamInteraction } from '../lib/agentClient';
import {
  FORENSIC_FOOTNOTE_BENCHMARK_ID,
  FORENSIC_FOOTNOTE_CASES,
  FORENSIC_FOOTNOTE_SKILL,
} from './forensicFootnoteBenchmark';
import { BenchmarkCase, BenchmarkReport, SkillExecutionRequest } from './types';
import { evaluateBenchmark } from './evaluator';

export type SkillExecutor = (
  request: SkillExecutionRequest,
) => Promise<{ outputText: string; tokens?: number; latencyMs: number }>;

function buildPrompt(request: SkillExecutionRequest): string {
  return [
    'Execute the supplied specialist skill against the benchmark document.',
    'This is a controlled evaluation. Do not search the web and do not use outside facts.',
    'Return a concise evidence-grounded answer to the task.',
    'Include the exact source URL when one is provided.',
    '',
    'SYSTEM DIRECTIVE:',
    request.systemDirective,
    '',
    'REASONING FRAMEWORK:',
    request.reasoningFramework,
    '',
    'ADVERSARIAL CONSTRAINT:',
    request.adversarialConstraint,
    '',
    'STRICT RULES:',
    ...request.strictRules.map((rule, index) => `${index + 1}. ${rule}`),
    '',
    'TASK:',
    request.task,
    '',
    'BENCHMARK DOCUMENT:',
    request.documentText,
    '',
    request.sourceUrl ? `SOURCE URL: ${request.sourceUrl}` : '',
  ].join('\n');
}

export const geminiSkillExecutor: SkillExecutor = async (request) => {
  const started = Date.now();
  const response = await createInteraction({
    prompt: buildPrompt(request),
    inlineSources: [
      {
        type: 'inline',
        content: request.documentText,
        target: '/.benchmarks/controlled-document.txt',
      },
    ],
    tools: [],
  });

  if (!response.ok) {
    throw new Error(`Gemini interaction failed: ${response.status} ${await response.text()}`);
  }

  let outputText = '';
  let tokens: number | undefined;

  for await (const event of streamInteraction(response)) {
    if (event.type === 'text' && event.text) outputText += event.text;

    if (event.type === 'complete' && event.interaction) {
      const usage = event.interaction.usage || event.interaction.usage_metadata;
      if (usage) {
        const record = usage as Record<string, unknown>;
        tokens =
          Number(
            record.total_tokens ??
              record.totalTokenCount ??
              record.total_token_count ??
              0,
          ) || undefined;
      }
    }

    if (event.type === 'error') {
      throw new Error(event.message || 'Gemini benchmark execution failed.');
    }
  }

  return {
    outputText,
    tokens,
    latencyMs: Date.now() - started,
  };
};

export async function runBenchmark(
  benchmarkId: string,
  benchmarkCases: BenchmarkCase[],
  skill: {
    id: string;
    version: string;
    systemDirective: string;
    reasoningFramework: string;
    adversarialConstraint: string;
    strictRules: string[];
  },
  executor: SkillExecutor,
  model: string,
): Promise<BenchmarkReport> {
  const outputs: Record<string, string> = {};

  for (const benchmarkCase of benchmarkCases) {
    const result = await executor({
      systemDirective: skill.systemDirective,
      reasoningFramework: skill.reasoningFramework,
      adversarialConstraint: skill.adversarialConstraint,
      strictRules: skill.strictRules,
      task: benchmarkCase.task,
      documentText: benchmarkCase.document.text,
      sourceUrl: benchmarkCase.document.sourceUrl,
    });
    outputs[benchmarkCase.id] = result.outputText;
  }

  return evaluateBenchmark(
    benchmarkId,
    skill.id,
    skill.version,
    model,
    benchmarkCases,
    outputs,
  );
}

export async function runForensicFootnoteBenchmark(
  executor: SkillExecutor = geminiSkillExecutor,
  model = 'antigravity-preview-05-2026',
): Promise<BenchmarkReport> {
  return runBenchmark(
    FORENSIC_FOOTNOTE_BENCHMARK_ID,
    FORENSIC_FOOTNOTE_CASES,
    FORENSIC_FOOTNOTE_SKILL,
    executor,
    model,
  );
}
