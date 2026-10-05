/**
 * Skill conflict detection.
 *
 * Two skills conflict when they reach *contradictory* conclusions on the same
 * scenario — not merely different ones. A forensic skill flagging a liability
 * and a behavioural skill noting evasive language are both right and are not in
 * conflict. A skill concluding "reclassify $620M to financing" and another
 * concluding "the classification is correct as presented" are in conflict, and
 * an agent that holds both will produce incoherent output.
 *
 * That distinction cannot be computed from scores, so this costs one judge call
 * per candidate pair. It runs at most once per tick and only on pairs that have
 * both been evaluated on the same scenario recently.
 */

import type { AgentSkill } from '../../src/types/skills.ts';
import type { SkillConflictPair, ConflictSeverity } from '../../src/types/skillConflicts.ts';
import type { EvolutionConfig } from './config.ts';
import type { LlmClient } from './llm.ts';
import type { ExecutableScenario } from './scenarios.ts';
import type { StoredOutput } from './store.ts';

interface ConflictVerdict {
  inConflict: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  conflictDomain: string;
  contradictionSummary: string;
  qualityImpactRisk: string;
  skillAVerdict: string;
  skillAConfidence: number;
  skillARecommendation: string;
  skillAMetric: string;
  skillBVerdict: string;
  skillBConfidence: number;
  skillBRecommendation: string;
  skillBMetric: string;
  skillARuleAtFault: string;
  skillBRuleAtFault: string;
}

/**
 * Fingerprint of what a skill IS: its rules and prompt matrix. A fresh output
 * from an unchanged genome is another sample of the same behaviour, not new
 * information about whether two skills contradict each other.
 */
export function genomeFingerprint(skill: AgentSkill): string {
  const text = JSON.stringify([skill.strictRules, skill.promptMatrix, skill.specialistRole]);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Identity of a comparison: the pair plus both genomes. A pair is checked once
 * per genome version and re-checked only after one of them mutates.
 *
 * The original code recorded only pairs that DID conflict, so a clean pair sat at
 * the head of the queue and was re-checked every tick (36 of 38 checks on one
 * pair in a reproduction). Keying on output timestamps instead only half-fixed
 * it: every re-evaluation produces a new timestamp, so the same unchanged pair
 * came back whenever either skill ran.
 */
export function comparisonKey(a: AgentSkill, b: AgentSkill): string {
  const [first, second] = a.id < b.id ? [a, b] : [b, a];
  return `${first.id}:${genomeFingerprint(first)}|${second.id}:${genomeFingerprint(second)}`;
}

export interface ConflictCandidate {
  a: AgentSkill;
  b: AgentSkill;
  scenarioId: string;
  outA: StoredOutput;
  outB: StoredOutput;
  key: string;
  /** Score gap on the shared scenario. Contradictions usually leave one answer failing. */
  divergence: number;
}

/**
 * Pairs worth checking, most promising first.
 *
 * Every shared scenario is considered, not just the first one found. Ordering
 * is by stakes (two champions disagreeing reaches output), then by score
 * divergence — two skills that both satisfy the same constraints rarely
 * contradict each other, while a wide score gap often means one of them reached
 * the opposite conclusion.
 */
export function findCandidatePairs(
  skills: AgentSkill[],
  outputs: Map<string, StoredOutput[]>,
  alreadyFlagged: Set<string>,
  alreadyChecked: Set<string> = new Set(),
): ConflictCandidate[] {
  const candidates: ConflictCandidate[] = [];

  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i];
      const b = skills[j];
      if (alreadyFlagged.has([a.id, b.id].sort().join('|'))) continue;

      const key = comparisonKey(a, b);
      if (alreadyChecked.has(key)) continue;

      // One check per pair per genome version, on the shared scenario where
      // they diverge most — the likeliest place for a real contradiction.
      const outsB = new Map((outputs.get(b.id) ?? []).map((o) => [o.scenarioId, o]));
      let best: ConflictCandidate | null = null;
      for (const outA of outputs.get(a.id) ?? []) {
        const outB = outsB.get(outA.scenarioId);
        if (!outB) continue;
        const divergence = Math.abs(outA.score - outB.score);
        if (!best || divergence > best.divergence) {
          best = { a, b, scenarioId: outA.scenarioId, outA, outB, key, divergence };
        }
      }
      if (best) candidates.push(best);
    }
  }

  const weight = (s: AgentSkill) => (s.stage === 'champion' ? 2 : s.stage === 'testing' ? 1 : 0);
  candidates.sort(
    (x, y) =>
      weight(y.a) + weight(y.b) - (weight(x.a) + weight(x.b)) ||
      y.divergence - x.divergence ||
      x.key.localeCompare(y.key),
  );
  return candidates;
}

export async function detectConflict(
  llm: LlmClient,
  cfg: EvolutionConfig,
  a: AgentSkill,
  b: AgentSkill,
  scenario: ExecutableScenario,
  outA: StoredOutput,
  outB: StoredOutput,
): Promise<SkillConflictPair | null> {
  const prompt = [
    'Two specialist agents analysed the same scenario. Decide whether their conclusions',
    'CONTRADICT each other, or merely differ in focus.',
    '',
    'They are NOT in conflict if they examine different aspects and could both be acted on.',
    'They ARE in conflict if acting on one requires rejecting the other — opposite verdicts on',
    'the same question, incompatible recommendations, or mutually exclusive quantitative claims.',
    'Be conservative: most pairs of specialists are not in conflict, and a false positive here',
    'wastes an operator’s attention on a non-problem.',
    '',
    `## SCENARIO: ${scenario.name}`,
    scenario.inputScenario,
    '',
    `## AGENT A — ${a.name} (${a.specialistRole})`,
    `Governing rules: ${a.strictRules.join(' | ')}`,
    'Output:',
    outA.output.slice(0, 3000),
    '',
    `## AGENT B — ${b.name} (${b.specialistRole})`,
    `Governing rules: ${b.strictRules.join(' | ')}`,
    'Output:',
    outB.output.slice(0, 3000),
    '',
    '---',
    'Return JSON with exactly this shape:',
    JSON.stringify(
      {
        inConflict: false,
        severity: 'NONE',
        conflictDomain: 'short label for what they disagree about, or "" if no conflict',
        contradictionSummary: 'one or two sentences stating the contradiction precisely, or ""',
        qualityImpactRisk: 'what breaks downstream if both are trusted, or ""',
        skillAVerdict: "A's conclusion in one line",
        skillAConfidence: 0,
        skillARecommendation: "A's actionable recommendation in one line",
        skillAMetric: "A's key quantitative claim, or '' if none",
        skillBVerdict: "B's conclusion in one line",
        skillBConfidence: 0,
        skillBRecommendation: "B's actionable recommendation in one line",
        skillBMetric: "B's key quantitative claim, or '' if none",
        skillARuleAtFault: "the rule of A's that drove the contradiction, verbatim, or ''",
        skillBRuleAtFault: "the rule of B's that drove the contradiction, verbatim, or ''",
      },
      null,
      2,
    ),
    '',
    'severity is CRITICAL, HIGH, MODERATE, LOW, or NONE. Confidence values are 0-100 and should',
    'reflect how firmly each output states its conclusion, not how correct you think it is.',
  ].join('\n');

  const v = await llm.generateJson<ConflictVerdict>({
    model: cfg.judgeModel,
    prompt,
    temperature: 0.1,
    maxOutputTokens: 2048,
  });

  if (!v.inConflict || v.severity === 'NONE') return null;

  const severity: ConflictSeverity =
    v.severity === 'CRITICAL' || v.severity === 'HIGH' || v.severity === 'MODERATE' || v.severity === 'LOW'
      ? v.severity
      : 'MODERATE';

  const clampConf = (n: unknown) => {
    const x = Number(n);
    return Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 50;
  };

  return {
    id: `conflict-${[a.id, b.id].sort().join('-')}-${scenario.id}`,
    skillAId: a.id,
    skillAName: a.name,
    skillACode: a.code,
    skillAVectors: a.vectors,
    skillBId: b.id,
    skillBName: b.name,
    skillBCode: b.code,
    skillBVectors: b.vectors,
    conflictDomain: v.conflictDomain || scenario.category,
    severity,
    status: 'ACTIVE_FLAGGED',
    detectedAt: new Date().toISOString(),
    contradictoryDirectives: {
      skillADirective: a.promptMatrix.systemDirective,
      skillARule: v.skillARuleAtFault || a.strictRules[0] || '',
      skillBDirective: b.promptMatrix.systemDirective,
      skillBRule: v.skillBRuleAtFault || b.strictRules[0] || '',
    },
    stressScenario: {
      title: scenario.name,
      description: scenario.description,
      inputContext: scenario.inputScenario,
    },
    analysisOutputClash: {
      skillAConclusion: {
        verdict: v.skillAVerdict ?? '',
        confidence: clampConf(v.skillAConfidence),
        actionableRecommendation: v.skillARecommendation ?? '',
        quantitativeMetric: v.skillAMetric ?? '',
      },
      skillBConclusion: {
        verdict: v.skillBVerdict ?? '',
        confidence: clampConf(v.skillBConfidence),
        actionableRecommendation: v.skillBRecommendation ?? '',
        quantitativeMetric: v.skillBMetric ?? '',
      },
      contradictionSummary: v.contradictionSummary ?? '',
      qualityImpactRisk: v.qualityImpactRisk ?? '',
    },
  };
}
