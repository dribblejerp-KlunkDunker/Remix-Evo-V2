import { AgentSkill, ChampionEvolutionLineageAudit, EvolutionIteration, ParentSeedDetail, VectorCategory } from '../types/skills';
import { CHAMPION_EVOLUTION_AUDIT_LOGS } from './evolutionAuditData';

/**
 * Resolves or synthesizes a rich, detailed Evolution Lineage Audit for ANY AgentSkill.
 * If the skill is in the pre-crafted CHAMPION_EVOLUTION_AUDIT_LOGS, returns it.
 * Otherwise, generates a deterministic, high-fidelity audit using the skill's actual
 * parents, stage history, vectors, and rules.
 */
export function getSkillEvolutionHistory(
  skill: AgentSkill,
  allSkills: AgentSkill[] = []
): ChampionEvolutionLineageAudit {
  // 1. Look for pre-compiled audit log by id or code
  const existing = CHAMPION_EVOLUTION_AUDIT_LOGS.find(
    (log) =>
      log.championId.toLowerCase() === skill.id.toLowerCase() ||
      log.championCode.toLowerCase() === skill.code.toLowerCase()
  );

  if (existing) {
    // Sync current live score and generation if the skill was updated in-session
    return {
      ...existing,
      currentScore: skill.benchmarkScore,
      championName: skill.name,
      tagline: skill.tagline || existing.tagline,
      specialistRole: skill.specialistRole || existing.specialistRole
    };
  }

  // 2. Synthesize Parent Seeds from skill.evolutionLineage.parents
  const parentIds = skill.evolutionLineage?.parents || ['SEED-ALPHA-GENESIS', 'SEED-BETA-GENESIS'];
  const parentSeeds: ParentSeedDetail[] = parentIds.map((pCode, idx) => {
    // Try to find if parent exists in allSkills
    const matchedSkill = allSkills.find(
      (s) => s.code.toLowerCase() === pCode.toLowerCase() || s.id.toLowerCase() === pCode.toLowerCase()
    );

    if (matchedSkill) {
      return {
        id: `seed-${matchedSkill.id}`,
        code: matchedSkill.code,
        name: matchedSkill.name,
        role: matchedSkill.specialistRole,
        vector: matchedSkill.vectors[0] || 'Forensic Accounting',
        contributionWeight: idx === 0 ? 56 : 44,
        source: matchedSkill.stage === 'champion' ? 'Internal Benchmark' : 'Voyager Skill Library',
        seedScore: Number((matchedSkill.benchmarkScore * 0.88).toFixed(1))
      };
    }

    // Otherwise generate clean metadata from code name
    const friendlyName = pCode
      .replace(/^(SKILL-|VECTOR-|SEED-)/i, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const vector: VectorCategory =
      idx === 0
        ? skill.vectors[0] || 'Forensic Accounting'
        : skill.vectors[1] || skill.vectors[0] || 'Statistics & Stochastic';

    return {
      id: `seed-synth-${idx}-${pCode.toLowerCase()}`,
      code: pCode,
      name: friendlyName || `Parent Genetic Seed ${idx + 1}`,
      role: idx === 0 ? 'Primary Feature & Structural Logic Seed' : 'Adversarial Constraint & Stochastic Filter Seed',
      vector,
      contributionWeight: idx === 0 ? 58 : 42,
      source: idx === 0 ? 'Research Paper' : 'GitHub',
      seedScore: Number(Math.max(68.0, skill.benchmarkScore - 18 - idx * 4).toFixed(1))
    };
  });

  const initialScore = Number(
    (
      parentSeeds.reduce((acc, p) => acc + p.seedScore * (p.contributionWeight / 100), 0)
    ).toFixed(1)
  );

  const totalDelta = Number((skill.benchmarkScore - initialScore).toFixed(1));

  // 3. Build chronological iterations based on stageHistory or generation
  const iterations: EvolutionIteration[] = [];
  const stagesInHistory = skill.stageHistory || [];

  if (stagesInHistory.length > 0) {
    let prevScore = initialScore;
    stagesInHistory.forEach((sh, idx) => {
      const iterNum = idx + 1;
      const scoreAfter = sh.score || Number((prevScore + 4.2).toFixed(1));
      const delta = Number((scoreAfter - prevScore).toFixed(1));
      const mutationPct = Number((28.0 - idx * 5.2).toFixed(1));

      iterations.push({
        iterationNumber: iterNum,
        epoch: `Epoch-${String.fromCharCode(945 + idx)}-${iterNum} (${sh.stage.toUpperCase()} Phase)`,
        timestamp: sh.timestamp || `${14 - idx * 3} days ago`,
        stage: sh.stage,
        parentSkillIds: parentIds,
        parentSkillNames: parentSeeds.map((p) => p.name),
        mutationPercentage: Math.max(4.0, mutationPct),
        scoreBefore: prevScore,
        scoreAfter: scoreAfter,
        performanceDelta: delta,
        recombinationStrategy:
          idx === 0
            ? `Genetic Fusion: Merged ${parentSeeds[0]?.name} with ${parentSeeds[1]?.name || 'Adversarial Filter'}.`
            : `Constraint Annealing: Hardened reasoning prompt matrix against false positive alerts.`,
        mutationType:
          idx === 0
            ? 'Parent Recombination & Crossover'
            : idx === 1
            ? 'Adversarial Constraint Hardening'
            : idx === 2
            ? 'Stressbench Rigor Injection'
            : 'Champion Production Freeze',
        mutationDetails: sh.notes || `Adversarial optimization pass in ${sh.stage} stage.`,
        ruleDiff: {
          added: [
            skill.strictRules[idx] ||
              `RULE ${idx + 1}: Validate boundary invariant constraints for ${skill.vectors[0] || 'core vector'}.`
          ],
          modified: idx > 0 ? [`Tuned threshold parameters to eliminate hallucination drift.`] : [],
          pruned: idx === 1 ? [`Pruned redundant natural language fluff to enforce deterministic outputs.`] : []
        },
        testPassRate: Number(Math.min(99.8, 80 + idx * 6.2).toFixed(1)),
        testCasesRun: (idx + 1) * 75,
        survived: true,
        keyInsight:
          idx === 0
            ? `Combining ${parentSeeds[0]?.name} and ${parentSeeds[1]?.name} produced immediate synergy, exceeding baseline seed scores by +${delta}%.`
            : idx === stagesInHistory.length - 1
            ? `Attained ${scoreAfter}% benchmark score with 0.0% hallucination rate across adversarial testbenches.`
            : `Hardening boundary invariants improved model conviction stability under adversarial injection attacks.`
      });

      prevScore = scoreAfter;
    });
  } else {
    // Generate default iterations from generation count
    const numIters = Math.min(5, Math.max(3, Math.floor(skill.generation / 3) + 1));
    let currentS = initialScore;
    const stepDelta = totalDelta / numIters;

    for (let i = 0; i < numIters; i++) {
      const nextS = Number(Math.min(skill.benchmarkScore, currentS + stepDelta).toFixed(1));
      const delta = Number((nextS - currentS).toFixed(1));
      const stage = i === 0 ? 'idea' : i < numIters - 2 ? 'training' : i === numIters - 1 && skill.stage === 'champion' ? 'champion' : 'testing';

      iterations.push({
        iterationNumber: i + 1,
        epoch: `Epoch-${String.fromCharCode(945 + i)}-${i + 1}`,
        timestamp: `${16 - i * 3} days ago`,
        stage,
        parentSkillIds: parentIds,
        parentSkillNames: parentSeeds.map((p) => p.name),
        mutationPercentage: Number((24 - i * 4.5).toFixed(1)),
        scoreBefore: currentS,
        scoreAfter: nextS,
        performanceDelta: delta,
        recombinationStrategy: `Recombination Iteration ${i + 1}: Cross-domain feature alignment.`,
        mutationType: i === 0 ? 'Seed Recombination' : 'Prompt Gradient Optimization',
        mutationDetails: `Evolved prompt matrix to satisfy ${skill.vectors.join(' × ')} constraints.`,
        ruleDiff: {
          added: [skill.strictRules[i % skill.strictRules.length] || `Strict boundary rule ${i + 1}`],
          modified: []
        },
        testPassRate: Number((84 + i * 3.8).toFixed(1)),
        testCasesRun: (i + 1) * 60,
        survived: true,
        keyInsight: `Continuous adversarial testing in ${stage} drove score upwards by +${delta}%.`
      });

      currentS = nextS;
    }
  }

  return {
    championId: skill.id,
    championCode: skill.code,
    championName: skill.name,
    tagline: skill.tagline,
    specialistRole: skill.specialistRole,
    currentScore: skill.benchmarkScore,
    initialScore,
    totalPerformanceDelta: totalDelta > 0 ? totalDelta : 14.5,
    averageMutationRate: Number(
      (iterations.reduce((sum, it) => sum + it.mutationPercentage, 0) / (iterations.length || 1)).toFixed(1)
    ),
    parentSeeds,
    remixVectorCombo:
      skill.evolutionLineage?.remixVectorCombo ||
      skill.vectors.slice(0, 2).join(' × ') ||
      'Cross-Domain Synthesis',
    championMilestoneAchievedAt:
      skill.stage === 'champion'
        ? skill.stageHistory?.find((s) => s.stage === 'champion')?.timestamp || 'Recently Achieved'
        : 'Pending Qualification (Threshold: ≥ 95.0%)',
    lineageSummary: `Developed through algorithmic fusion of ${parentSeeds[0]?.name || 'Primary Seed'} and ${parentSeeds[1]?.name || 'Secondary Seed'}. Iterative constraint hardening across ${skill.generation} generations systematically eliminated hallucinations, raising score from ${initialScore}% to ${skill.benchmarkScore}%.`,
    iterations
  };
}

/**
 * Simulates a live next-generation mutation for a skill directly inside the side panel.
 * Updates the skill's score, generation, strict rules, and records a brand new mutation epoch!
 */
export function simulateNextGenerationMutation(
  currentAudit: ChampionEvolutionLineageAudit,
  targetSkill: AgentSkill
): {
  updatedAudit: ChampionEvolutionLineageAudit;
  updatedSkill: AgentSkill;
  newIteration: EvolutionIteration;
} {
  const lastIter = currentAudit.iterations[currentAudit.iterations.length - 1];
  const iterNum = (lastIter ? lastIter.iterationNumber : currentAudit.iterations.length) + 1;
  const scoreBefore = targetSkill.benchmarkScore;

  // Realistic incremental performance delta (+0.2% to +0.8%, capped at 99.8%)
  const scoreGain = Number((Math.random() * 0.6 + 0.2).toFixed(1));
  const scoreAfter = Math.min(99.8, Number((scoreBefore + scoreGain).toFixed(1)));
  const actualDelta = Number((scoreAfter - scoreBefore).toFixed(1));
  const mutationPct = Number((Math.random() * 4.5 + 3.0).toFixed(1));

  const newRuleText = `RULE ${targetSkill.strictRules.length + 1}: Enforce autonomous cross-verification against dynamic ${targetSkill.vectors[0] || 'adversarial'} invariants.`;

  const newIteration: EvolutionIteration = {
    iterationNumber: iterNum,
    epoch: `Epoch-NextGen-${iterNum} (Autonomous Live Mutation)`,
    timestamp: 'Just now',
    stage: targetSkill.stage,
    parentSkillIds: currentAudit.parentSeeds.map((p) => p.code),
    parentSkillNames: currentAudit.parentSeeds.map((p) => p.name),
    mutationPercentage: mutationPct,
    scoreBefore,
    scoreAfter,
    performanceDelta: actualDelta,
    recombinationStrategy: 'Adversarial Boundary Perturbation: Autonomous agent matrix mutated reasoning directives to eliminate edge-case vulnerabilities.',
    mutationType: 'Live Prompt Genome Hardening',
    mutationDetails: `Injected real-time invariant constraint: "${newRuleText}". Recalibrated sensitivity parameters across 150 simulated adversarial edge cases.`,
    ruleDiff: {
      added: [newRuleText],
      modified: ['Refined threshold trigger conditions to reduce false positive friction.']
    },
    testPassRate: Number(Math.min(99.9, (lastIter?.testPassRate || 95) + 0.3).toFixed(1)),
    testCasesRun: (lastIter?.testCasesRun || 300) + 75,
    survived: true,
    keyInsight: `Next-gen prompt perturbation discovered an edge-case loophole in prior boundary logic; applying invariant constraint lifted benchmark score to ${scoreAfter}%.`
  };

  const updatedIterations = [...currentAudit.iterations, newIteration];

  const updatedAudit: ChampionEvolutionLineageAudit = {
    ...currentAudit,
    currentScore: scoreAfter,
    totalPerformanceDelta: Number((scoreAfter - currentAudit.initialScore).toFixed(1)),
    iterations: updatedIterations
  };

  const updatedSkill: AgentSkill = {
    ...targetSkill,
    generation: targetSkill.generation + 1,
    benchmarkScore: scoreAfter,
    strictRules: [...targetSkill.strictRules, newRuleText],
    stageHistory: [
      ...targetSkill.stageHistory,
      {
        stage: targetSkill.stage,
        timestamp: 'Just now',
        score: scoreAfter,
        notes: `Autonomous mutation (Gen-${targetSkill.generation + 1}): Added strict rule and elevated score by +${actualDelta}%.`
      }
    ]
  };

  return { updatedAudit, updatedSkill, newIteration };
}
