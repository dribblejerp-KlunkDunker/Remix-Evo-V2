/**
 * Genome operations.
 *
 * A skill's genome is its prompt matrix plus its strict rules. Everything else
 * on AgentSkill is either metadata or measured outcome. Variation therefore
 * means rewriting those two things — and the interesting constraint is that
 * mutation has to be *targeted*: telling a model to "improve this prompt"
 * produces generic verbosity, so every mutation is aimed at a specific observed
 * failure drawn from the skill's own evaluation history.
 */

import type {
  AgentSkill,
  EvolutionIteration,
  ParentSeedDetail,
  VectorCategory,
} from '../../src/types/skills.ts';
import type { EvolutionConfig } from './config.ts';
import type { LlmClient } from './llm.ts';
import type { EvaluationRecord } from './store.ts';

export const ALL_VECTORS: VectorCategory[] = [
  'Statistics & Stochastic',
  'Behavioral Psychology',
  'Manipulation & Deception',
  'Forensic Accounting',
  'Advanced Math',
  'Game Design & Incentives',
  'Empirical Science',
  'Systems Engineering',
  'Engineering',
];

export const MUTATION_TYPES = [
  'Adversarial Constraint Hardening',
  'Reasoning Framework Restructure',
  'Rule Specificity Injection',
  'Epistemic Calibration Tightening',
  'Failure Mode Immunisation',
  'Scope Narrowing',
] as const;

export type MutationType = (typeof MUTATION_TYPES)[number];

interface GenomePayload {
  name: string;
  tagline: string;
  description: string;
  specialistRole: string;
  vectors: string[];
  strictRules: string[];
  promptMatrix: {
    systemDirective: string;
    reasoningFramework: string;
    adversarialConstraint: string;
  };
  autonomousThought: string;
  keyInsight?: string;
  mutationDetails?: string;
  ruleDiff?: { added: string[]; modified: string[]; pruned: string[] };
}

const GENOME_SHAPE = JSON.stringify(
  {
    name: 'short distinctive name, 2-5 words',
    tagline: 'one line, under 90 characters',
    description: 'two to three sentences on what this skill does and when it applies',
    specialistRole: 'the role the agent adopts, e.g. "Forensic Auditor & Reconstruction Specialist"',
    vectors: ['must be drawn from the allowed vector list, 1-3 entries, most important first'],
    strictRules: [
      'RULE 1: an operational, checkable constraint — not an aspiration',
      'RULE 2: ...',
    ],
    promptMatrix: {
      systemDirective: 'the operating stance, 1-3 sentences',
      reasoningFramework: 'the ordered procedure this skill follows',
      adversarialConstraint: 'what it must refuse to do, and what it must demand before concluding',
    },
    autonomousThought: 'what this skill is currently working through, present tense, one sentence',
  },
  null,
  2,
);

const RULE_QUALITY_GUIDANCE = [
  'Rules must be checkable. "Be rigorous" is not a rule. "Require a page and line citation for every',
  'quantitative claim" is a rule. Each rule should be something a grader could mark as followed or',
  'violated by reading the output alone. Prefer 3-6 rules; more than that and they stop being enforced.',
].join(' ');

function parseVectors(raw: unknown, fallback: VectorCategory[]): VectorCategory[] {
  if (!Array.isArray(raw)) return fallback;
  const valid = raw.filter((v): v is VectorCategory =>
    typeof v === 'string' && (ALL_VECTORS as string[]).includes(v),
  );
  return valid.length > 0 ? valid.slice(0, 3) : fallback;
}

function slugCode(name: string, generation: number): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 3)
    .join('-');
  return `SKILL-${slug}-G${generation}`;
}

function newId(): string {
  return `skill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a fresh AgentSkill shell; measured fields start at zero, not at a flattering default. */
function shellSkill(payload: GenomePayload, generation: number, threshold: number): AgentSkill {
  const now = new Date().toISOString();
  const vectors = parseVectors(payload.vectors, ['Systems Engineering']);
  return {
    id: newId(),
    code: slugCode(payload.name, generation),
    name: payload.name,
    stage: 'idea',
    tagline: payload.tagline,
    description: payload.description,
    vectors,
    generation,
    benchmarkScore: 0,
    threshold,
    winRate: 0,
    stabilityIndex: 0,
    hallucinationRate: 0,
    strictRules: payload.strictRules.slice(0, 8),
    specialistRole: payload.specialistRole,
    promptMatrix: payload.promptMatrix,
    autonomousThought: payload.autonomousThought,
    activeTestBench: {
      name: 'Awaiting first benchmark assignment',
      currentVector: vectors[0],
      totalRunsToday: 0,
      consecutivePasses: 0,
      stressVector: 'Not yet assigned',
    },
    testCases: [],
    evolutionLineage: {
      parents: [],
      remixVectorCombo: vectors.join(' × '),
      generationEpoch: `Epoch-${generation}`,
      survivalIterations: 0,
      mutationType: 'Genesis',
      iterations: [],
      parentDetails: [],
    },
    stageHistory: [
      { stage: 'idea', timestamp: now, score: 0, notes: 'Instantiated by the evolution engine.' },
    ],
    createdAt: now,
    lastEvaluatedAt: now,
  };
}

/** Propose a brand-new skill aimed at an under-served vector. */
export async function proposeSkill(
  llm: LlmClient,
  cfg: EvolutionConfig,
  targetVectors: VectorCategory[],
  existingNames: string[],
  generation: number,
): Promise<AgentSkill> {
  const prompt = [
    'Design one new specialist agent skill for an autonomous analysis system.',
    '',
    `Target capability vectors (lead with these): ${targetVectors.join(', ')}`,
    `Allowed vectors: ${ALL_VECTORS.join(', ')}`,
    '',
    'Skills already in the population — the new skill must not duplicate these:',
    ...existingNames.slice(0, 40).map((n) => `- ${n}`),
    '',
    RULE_QUALITY_GUIDANCE,
    '',
    'The skill must do something specific and adversarial. A skill that "analyses financial data"',
    'is useless; a skill that "reconstructs the cash conversion cycle to detect supplier-finance',
    'concealment" is a skill. Prefer narrow and sharp over broad and vague.',
    '',
    'Return JSON with exactly this shape:',
    GENOME_SHAPE,
  ].join('\n');

  const payload = await llm.generateJson<GenomePayload>({
    model: cfg.architectModel,
    prompt,
    temperature: 0.95,
    maxOutputTokens: 6144,
  });

  return shellSkill(payload, generation, cfg.championThreshold);
}

/**
 * Mutate a skill against its own observed failures.
 *
 * `failures` should be the worst recent evaluations. Without them the mutation
 * has nothing to aim at and the model will just pad the prompt.
 */
export async function mutateSkill(
  llm: LlmClient,
  cfg: EvolutionConfig,
  parent: AgentSkill,
  mutationType: MutationType,
  failures: { scenarioName: string; missedConstraints: string[]; unsupportedClaims: string[] }[],
  scoreBefore: number,
): Promise<{ child: AgentSkill; iteration: Omit<EvolutionIteration, 'scoreAfter' | 'performanceDelta' | 'testPassRate' | 'testCasesRun' | 'survived'> }> {
  const failureBlock = failures.length
    ? failures
        .map(
          (f) =>
            `Scenario: ${f.scenarioName}\n  Missed: ${f.missedConstraints.join('; ') || 'none'}\n  Unsupported claims made: ${f.unsupportedClaims.join('; ') || 'none'}`,
        )
        .join('\n')
    : 'No recorded failures; tighten the weakest rule on general grounds.';

  const prompt = [
    `Apply one targeted mutation of type "${mutationType}" to the agent skill below.`,
    '',
    '## CURRENT GENOME',
    JSON.stringify(
      {
        name: parent.name,
        specialistRole: parent.specialistRole,
        vectors: parent.vectors,
        strictRules: parent.strictRules,
        promptMatrix: parent.promptMatrix,
      },
      null,
      2,
    ),
    '',
    '## OBSERVED FAILURES TO FIX',
    failureBlock,
    '',
    '## MUTATION RULES',
    '- Change what the failures demand and nothing else. This is a mutation, not a rewrite.',
    '- Keep the name and vectors unless the mutation genuinely changes what the skill is.',
    '- You may add, modify, or prune rules. Pruning a rule that never fires is a valid mutation.',
    '- Do not make the prompt longer for its own sake. Length is not rigour.',
    `- ${RULE_QUALITY_GUIDANCE}`,
    '',
    'Return JSON with the genome shape below, plus "mutationDetails" (one sentence on what changed',
    'and why), "keyInsight" (what the failures revealed), and "ruleDiff" with added/modified/pruned arrays.',
    GENOME_SHAPE,
  ].join('\n');

  const payload = await llm.generateJson<GenomePayload>({
    model: cfg.architectModel,
    prompt,
    temperature: 0.8,
    maxOutputTokens: 6144,
  });

  const generation = parent.generation + 1;
  const child = shellSkill(payload, generation, cfg.championThreshold);

  // A mutation inherits its parent's identity and history; only the genome moves.
  child.stage = 'training';
  child.vectors = parseVectors(payload.vectors, parent.vectors);
  child.evolutionLineage = {
    parents: [parent.code],
    remixVectorCombo: child.vectors.join(' × '),
    generationEpoch: `Epoch-${generation}`,
    survivalIterations: (parent.evolutionLineage.survivalIterations ?? 0) + 1,
    mutationType,
    parentDetails: [parentSeed(parent, 100)],
    iterations: [...(parent.evolutionLineage.iterations ?? [])],
  };
  child.stageHistory = [
    ...parent.stageHistory,
    {
      stage: 'training',
      timestamp: new Date().toISOString(),
      score: scoreBefore,
      notes: `Mutated from ${parent.code} via ${mutationType}.`,
    },
  ];

  const ruleDiff = payload.ruleDiff ?? { added: [], modified: [], pruned: [] };
  const mutationPercentage = estimateMutationPercentage(parent, child);

  return {
    child,
    iteration: {
      iterationNumber: (parent.evolutionLineage.iterations?.length ?? 0) + 1,
      epoch: `Epoch-${generation}`,
      timestamp: new Date().toISOString(),
      stage: 'training',
      parentSkillIds: [parent.id],
      parentSkillNames: [parent.name],
      mutationPercentage,
      scoreBefore,
      recombinationStrategy: 'Single-parent directed mutation',
      mutationType,
      mutationDetails: payload.mutationDetails ?? `Applied ${mutationType}.`,
      ruleDiff: {
        added: ruleDiff.added ?? [],
        modified: ruleDiff.modified ?? [],
        pruned: ruleDiff.pruned ?? [],
      },
      keyInsight: payload.keyInsight ?? 'No insight recorded.',
    },
  };
}

/** Recombine two parents into a child that inherits from both. */
export async function crossoverSkills(
  llm: LlmClient,
  cfg: EvolutionConfig,
  parentA: AgentSkill,
  parentB: AgentSkill,
  fitnessA: number,
  fitnessB: number,
): Promise<{ child: AgentSkill; iteration: Omit<EvolutionIteration, 'scoreAfter' | 'performanceDelta' | 'testPassRate' | 'testCasesRun' | 'survived'> }> {
  // Contribution weight tracks relative fitness, so the stronger parent
  // dominates the genome rather than the two being blended 50/50.
  const total = Math.max(1, fitnessA + fitnessB);
  const weightA = Math.round((fitnessA / total) * 100);
  const weightB = 100 - weightA;

  const prompt = [
    'Recombine two agent skills into one child skill that inherits the strongest parts of each.',
    '',
    `## PARENT A (contribution weight ${weightA}%, fitness ${fitnessA})`,
    JSON.stringify(
      { name: parentA.name, vectors: parentA.vectors, specialistRole: parentA.specialistRole, strictRules: parentA.strictRules, promptMatrix: parentA.promptMatrix },
      null,
      2,
    ),
    '',
    `## PARENT B (contribution weight ${weightB}%, fitness ${fitnessB})`,
    JSON.stringify(
      { name: parentB.name, vectors: parentB.vectors, specialistRole: parentB.specialistRole, strictRules: parentB.strictRules, promptMatrix: parentB.promptMatrix },
      null,
      2,
    ),
    '',
    '## CROSSOVER RULES',
    '- The child must be coherent as a single specialist, not a concatenation of two job descriptions.',
    '- Weight the inheritance toward the higher-fitness parent.',
    '- Drop rules that contradict each other across parents; state which in ruleDiff.pruned.',
    '- If the two parents cannot be coherently combined, favour parent A and take only the single',
    '  most valuable rule from parent B. A muddled hybrid is worse than either parent.',
    `- ${RULE_QUALITY_GUIDANCE}`,
    '',
    'Return JSON with the genome shape below, plus "mutationDetails", "keyInsight", and "ruleDiff".',
    GENOME_SHAPE,
  ].join('\n');

  const payload = await llm.generateJson<GenomePayload>({
    model: cfg.architectModel,
    prompt,
    temperature: 0.85,
    maxOutputTokens: 6144,
  });

  const generation = Math.max(parentA.generation, parentB.generation) + 1;
  const child = shellSkill(payload, generation, cfg.championThreshold);
  child.stage = 'training';
  child.evolutionLineage = {
    parents: [parentA.code, parentB.code],
    remixVectorCombo: child.vectors.join(' × '),
    generationEpoch: `Epoch-${generation}`,
    survivalIterations: 0,
    mutationType: 'Pareto Crossover',
    parentDetails: [parentSeed(parentA, weightA), parentSeed(parentB, weightB)],
    iterations: [],
  };
  child.stageHistory = [
    {
      stage: 'training',
      timestamp: new Date().toISOString(),
      score: 0,
      notes: `Crossover of ${parentA.code} (${weightA}%) and ${parentB.code} (${weightB}%).`,
    },
  ];

  const ruleDiff = payload.ruleDiff ?? { added: [], modified: [], pruned: [] };

  return {
    child,
    iteration: {
      iterationNumber: 1,
      epoch: `Epoch-${generation}`,
      timestamp: new Date().toISOString(),
      stage: 'training',
      parentSkillIds: [parentA.id, parentB.id],
      parentSkillNames: [parentA.name, parentB.name],
      mutationPercentage: 100,
      scoreBefore: Math.max(fitnessA, fitnessB),
      recombinationStrategy: `Fitness-weighted crossover (${weightA}/${weightB})`,
      mutationType: 'Pareto Crossover',
      mutationDetails: payload.mutationDetails ?? 'Recombined two parent genomes.',
      ruleDiff: {
        added: ruleDiff.added ?? [],
        modified: ruleDiff.modified ?? [],
        pruned: ruleDiff.pruned ?? [],
      },
      keyInsight: payload.keyInsight ?? 'No insight recorded.',
    },
  };
}

function parentSeed(parent: AgentSkill, weight: number): ParentSeedDetail {
  return {
    id: parent.id,
    code: parent.code,
    name: parent.name,
    role: parent.specialistRole,
    vector: parent.vectors[0] ?? 'Systems Engineering',
    contributionWeight: weight,
    source: 'Internal Benchmark',
    seedScore: parent.benchmarkScore,
  };
}

/**
 * Rough genome distance, reported as the "mutation percentage" the UI shows.
 * Token-level Jaccard distance over the rules and prompt matrix — crude, but it
 * is a real measurement of how much text actually changed rather than a number
 * the model was asked to make up.
 */
export function estimateMutationPercentage(before: AgentSkill, after: AgentSkill): number {
  const tokenise = (s: AgentSkill) =>
    new Set(
      [...s.strictRules, s.promptMatrix.systemDirective, s.promptMatrix.reasoningFramework, s.promptMatrix.adversarialConstraint]
        .join(' ')
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3),
    );

  const a = tokenise(before);
  const b = tokenise(after);
  if (a.size === 0 && b.size === 0) return 0;

  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  const union = a.size + b.size - shared;
  const jaccard = union === 0 ? 1 : shared / union;
  return Number(((1 - jaccard) * 100).toFixed(1));
}

/** Pick a mutation type from what the evaluation history says is wrong. */
export function selectMutationType(recent: EvaluationRecord[]): MutationType {
  if (recent.length === 0) return 'Rule Specificity Injection';

  const avgHallucinations = recent.reduce((s, e) => s + e.hallucinationFlags, 0) / recent.length;
  const avgViolations = recent.reduce((s, e) => s + e.criticalViolations, 0) / recent.length;
  const scores = recent.map((e) => e.score);
  const spread = Math.max(...scores) - Math.min(...scores);

  // Each branch maps a measured symptom to the mutation that addresses it.
  if (avgViolations > 0.5) return 'Adversarial Constraint Hardening';
  if (avgHallucinations > 1.0) return 'Epistemic Calibration Tightening';
  if (spread > 20) return 'Reasoning Framework Restructure';
  if (recent.some((e) => e.score < 60)) return 'Failure Mode Immunisation';
  return Math.random() < 0.5 ? 'Rule Specificity Injection' : 'Scope Narrowing';
}
