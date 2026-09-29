import { AgentSkill, VectorCategory } from '../types/skills';

export interface MutationPairwiseProbability {
  id: string;
  parentAId: string;
  parentAName: string;
  parentACode: string;
  parentAStage: string;
  parentAScore: number;
  parentAWinRate: number;
  parentBId: string;
  parentBName: string;
  parentBCode: string;
  parentBStage: string;
  parentBScore: number;
  parentBWinRate: number;
  championProbability: number; // 0 - 100 %
  projectedBenchmarkScore: number; // e.g. 96.8%
  synergyDelta: number; // e.g. +3.4%
  vectorDiversityCount: number;
  combinedVectors: VectorCategory[];
  projectedOffspringName: string;
  synergyMechanisms: string[];
  vulnerabilityMitigated: string;
  readinessTier: 'prime_champion' | 'high_viability' | 'moderate' | 'speculative';
}

export interface SkillBreakthroughCandidate {
  skill: AgentSkill;
  currentScore: number;
  winRate: number;
  thresholdGap: number; // 95.0 - currentScore
  soloMutationProbability: number;
  bestPartnerSkill?: AgentSkill;
  bestPartnerProbability: number;
  estimatedCyclesToChampion: number;
  primaryHardeningVector: string;
  readinessTier: 'prime_champion' | 'high_viability' | 'moderate' | 'speculative';
}

/**
 * Calculates pairwise merge and mutation probability into Champion status (>= 95.0%)
 */
export function calculateMutationPair(skillA: AgentSkill, skillB: AgentSkill): MutationPairwiseProbability {
  const isIdentical = skillA.id === skillB.id;

  // Average base performance
  const avgScore = (skillA.benchmarkScore + skillB.benchmarkScore) / 2;
  const avgWinRate = ((skillA.winRate ?? skillA.benchmarkScore) + (skillB.winRate ?? skillB.benchmarkScore)) / 2;

  // Vector union & diversity bonus
  const vectorSet = new Set([...skillA.vectors, ...skillB.vectors]);
  const combinedVectors = Array.from(vectorSet) as VectorCategory[];
  const vectorDiversity = combinedVectors.length;

  // Vector synergy calculation: Certain domains have exponential synergy
  let synergyBonus = 0;
  const mechanisms: string[] = [];

  const hasForensic = combinedVectors.includes('Forensic Accounting');
  const hasStochastic = combinedVectors.includes('Statistics & Stochastic');
  const hasBehavioral = combinedVectors.includes('Behavioral Psychology');
  const hasGame = combinedVectors.includes('Game Design & Incentives');
  const hasSystems = combinedVectors.includes('Systems Engineering');
  const hasDeception = combinedVectors.includes('Manipulation & Deception');

  if (hasForensic && hasStochastic) {
    synergyBonus += 3.2;
    mechanisms.push('Forensic cash flow balance sheet reconciliation crossed with stochastic variance filters.');
  }
  if (hasBehavioral && hasDeception) {
    synergyBonus += 3.8;
    mechanisms.push('Semantic cosine candor deflection mapped to deception evasion indices.');
  }
  if (hasGame && hasSystems) {
    synergyBonus += 2.9;
    mechanisms.push('Nash equilibrium fire-sale exit thresholds applied to multi-tier supply chain vertices.');
  }
  if (hasForensic && hasBehavioral) {
    synergyBonus += 3.4;
    mechanisms.push('Audited 10-K disclosures cross-verified against executive Q&A candor dissonance.');
  }
  if (hasStochastic && hasGame) {
    synergyBonus += 2.6;
    mechanisms.push('Non-Gaussian jump diffusion integrated into prime broker collateral haircut shocks.');
  }

  // Stage multipliers
  let stageBoost = 0;
  if (skillA.stage === 'champion' || skillB.stage === 'champion') {
    stageBoost += 4.5; // Proven champion lineage carries high genetic stability
  }
  if (skillA.stage === 'testing' || skillB.stage === 'testing') {
    stageBoost += 2.0;
  }

  // Stability & Hallucination dampeners
  const avgStability = (skillA.stabilityIndex + skillB.stabilityIndex) / 2;
  const stabilityBoost = (avgStability - 95) * 0.4;
  const avgHallucination = (skillA.hallucinationRate + skillB.hallucinationRate) / 2;
  const hallucinationPenalty = avgHallucination * 25;

  // Final Champion Probability
  let rawProb: number;
  if (isIdentical) {
    // Solo mutation probability of reaching/maintaining >= 95%
    const distanceToGate = 95.0 - skillA.benchmarkScore;
    if (distanceToGate <= 0) {
      rawProb = Math.min(99.2, 94.0 + (skillA.benchmarkScore - 95.0) * 1.2);
    } else {
      rawProb = Math.max(25.0, 95.0 - distanceToGate * 6.5 + (skillA.winRate - 85) * 0.5);
    }
  } else {
    // Merge & mutate probability
    const compositeBase = avgScore * 0.55 + avgWinRate * 0.45;
    const distance = 95.0 - compositeBase;

    if (distance <= 0) {
      rawProb = 92.0 + Math.abs(distance) * 1.1 + synergyBonus + stageBoost;
    } else {
      rawProb = 92.0 - distance * 4.8 + synergyBonus + stageBoost + stabilityBoost - hallucinationPenalty;
    }
  }

  const championProbability = Number(Math.min(99.4, Math.max(18.0, rawProb)).toFixed(1));
  const projectedBenchmarkScore = Number(Math.min(99.8, Math.max(82.0, (avgScore * 0.65 + avgWinRate * 0.35 + synergyBonus * 0.75))).toFixed(1));
  const synergyDelta = Number((projectedBenchmarkScore - Math.max(skillA.benchmarkScore, skillB.benchmarkScore)).toFixed(1));

  let readinessTier: MutationPairwiseProbability['readinessTier'] = 'moderate';
  if (championProbability >= 92.0) {
    readinessTier = 'prime_champion';
  } else if (championProbability >= 78.0) {
    readinessTier = 'high_viability';
  } else if (championProbability >= 55.0) {
    readinessTier = 'moderate';
  } else {
    readinessTier = 'speculative';
  }

  // Construct projected offspring title
  const codeA = skillA.code.replace('SKILL-', '');
  const codeB = skillB.code.replace('SKILL-', '');
  const projectedOffspringName = isIdentical
    ? `${skillA.name} [Mutated Gen-${skillA.generation + 1}]`
    : `${skillA.name.split(' ')[0]}-${skillB.name.split(' ')[0]} Hybrid [Gen-${Math.max(skillA.generation, skillB.generation) + 1}]`;

  if (mechanisms.length === 0) {
    mechanisms.push('Cross-pollination of specialist reasoning directives with zero-speculation rules.');
  }

  return {
    id: `${skillA.id}__${skillB.id}`,
    parentAId: skillA.id,
    parentAName: skillA.name,
    parentACode: skillA.code,
    parentAStage: skillA.stage,
    parentAScore: skillA.benchmarkScore,
    parentAWinRate: skillA.winRate ?? skillA.benchmarkScore,
    parentBId: skillB.id,
    parentBName: skillB.name,
    parentBCode: skillB.code,
    parentBStage: skillB.stage,
    parentBScore: skillB.benchmarkScore,
    parentBWinRate: skillB.winRate ?? skillB.benchmarkScore,
    championProbability,
    projectedBenchmarkScore,
    synergyDelta,
    vectorDiversityCount: vectorDiversity,
    combinedVectors,
    projectedOffspringName,
    synergyMechanisms: mechanisms,
    vulnerabilityMitigated: isIdentical
      ? 'Adversarial edge prompt hardening'
      : `Neutralizes ${skillA.name.slice(0, 20)} boundary leakage with ${skillB.name.slice(0, 20)} invariant proofs`,
    readinessTier
  };
}

/**
 * Computes the full pairwise mutation probability matrix across all provided skills
 */
export function buildMutationProbabilityMatrix(skills: AgentSkill[]): {
  matrix: MutationPairwiseProbability[][];
  flatPairs: MutationPairwiseProbability[];
  topHotspots: MutationPairwiseProbability[];
  breakthroughCandidates: SkillBreakthroughCandidate[];
} {
  const matrix: MutationPairwiseProbability[][] = [];
  const flatPairs: MutationPairwiseProbability[] = [];

  for (let i = 0; i < skills.length; i++) {
    const row: MutationPairwiseProbability[] = [];
    for (let j = 0; j < skills.length; j++) {
      const pair = calculateMutationPair(skills[i], skills[j]);
      row.push(pair);
      // Only include upper triangle (excluding identical) in distinct pair list
      if (i < j) {
        flatPairs.push(pair);
      }
    }
    matrix.push(row);
  }

  // Sort flat pairs by probability descending
  const sortedPairs = [...flatPairs].sort((a, b) => b.championProbability - a.championProbability);
  const topHotspots = sortedPairs.slice(0, 6);

  // Compute individual breakthrough candidates (focusing on non-champions or near-gate skills)
  const breakthroughCandidates: SkillBreakthroughCandidate[] = skills.map((skill) => {
    const soloPair = calculateMutationPair(skill, skill);
    const thresholdGap = Number((95.0 - skill.benchmarkScore).toFixed(1));

    // Find best partner skill
    let bestPartnerSkill: AgentSkill | undefined = undefined;
    let bestPartnerProbability = 0;

    skills.forEach((other) => {
      if (other.id !== skill.id) {
        const p = calculateMutationPair(skill, other);
        if (p.championProbability > bestPartnerProbability) {
          bestPartnerProbability = p.championProbability;
          bestPartnerSkill = other;
        }
      }
    });

    // Estimate cycles
    let cycles = 1;
    if (thresholdGap <= 0) cycles = 0;
    else if (thresholdGap < 1.0) cycles = 1;
    else if (thresholdGap < 3.5) cycles = 2;
    else if (thresholdGap < 8.0) cycles = 3;
    else cycles = 4;

    return {
      skill,
      currentScore: skill.benchmarkScore,
      winRate: skill.winRate ?? skill.benchmarkScore,
      thresholdGap,
      soloMutationProbability: soloPair.championProbability,
      bestPartnerSkill,
      bestPartnerProbability,
      estimatedCyclesToChampion: cycles,
      primaryHardeningVector: skill.vectors[0] || 'Empirical Science',
      readinessTier: soloPair.readinessTier
    };
  });

  // Sort candidates by lowest threshold gap (closest to champion)
  breakthroughCandidates.sort((a, b) => a.thresholdGap - b.thresholdGap);

  return {
    matrix,
    flatPairs: sortedPairs,
    topHotspots,
    breakthroughCandidates
  };
}
