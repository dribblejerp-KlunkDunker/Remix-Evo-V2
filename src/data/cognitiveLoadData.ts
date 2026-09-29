import {
  CognitiveLoadMetrics,
  CognitiveThoughtPacket,
  RealtimeCognitivePoint,
  SkillCognitiveProfile
} from '../types/cognitiveLoad';
import { AgentSkill } from '../types/skills';

export const CHAMPION_COGNITIVE_PROFILES: SkillCognitiveProfile[] = [
  {
    skillId: 'skill-champ-01',
    skillCode: 'SKILL-CHAMP-01',
    skillName: 'Forensic Footnote Deconstructor',
    stage: 'champion',
    vector: 'Forensic Accounting',
    generation: 14,
    benchmarkScore: 98.8,
    averageMemoryUsage: 22.4,
    averageLatencyMs: 142,
    averageAttentionEntropy: 1.15,
    averageBacktracks: 0.1,
    pruningEfficiency: 95.8,
    cognitiveCharacteristics: [
      'Crystalline invariant rule shortcuts directly bypass redundant heuristic branching',
      'Zero backtrack events under standard SEC 10-K footnote schedules',
      'Ultra-compact working memory: attention focused exclusively on off-balance reconciliations'
    ]
  },
  {
    skillId: 'skill-champ-02',
    skillCode: 'SKILL-CHAMP-02',
    skillName: 'Executive Evasion & Semantic Discrepancy Index',
    stage: 'champion',
    vector: 'Behavioral Psychology',
    generation: 19,
    benchmarkScore: 98.4,
    averageMemoryUsage: 26.8,
    averageLatencyMs: 168,
    averageAttentionEntropy: 1.32,
    averageBacktracks: 0.2,
    pruningEfficiency: 94.2,
    cognitiveCharacteristics: [
      'Rapid cosine distance mapping between analyst query and CEO deflection',
      'Suppresses subjective qualitative interpretation in favor of mathematical deflection quotients',
      'High certainty index across 1,200 tested earnings transcripts'
    ]
  },
  {
    skillId: 'skill-champ-03',
    skillCode: 'SKILL-CHAMP-03',
    skillName: 'Nash Equilibrium Liquidity Shock Simulator',
    stage: 'champion',
    vector: 'Game Design & Incentives',
    generation: 11,
    benchmarkScore: 97.9,
    averageMemoryUsage: 31.5,
    averageLatencyMs: 194,
    averageAttentionEntropy: 1.48,
    averageBacktracks: 0.4,
    pruningEfficiency: 92.6,
    cognitiveCharacteristics: [
      'Pre-computed backward induction trees for multi-prime broker runs',
      'Stabilized order book depth decay calculations without exploratory looping',
      'Linear matrix reduction keeps memory footprint bounded under volatility shocks'
    ]
  },
  {
    skillId: 'skill-champ-04',
    skillCode: 'SKILL-CHAMP-04',
    skillName: 'Topological Supply-Chain Contagion Mapper',
    stage: 'champion',
    vector: 'Advanced Math',
    generation: 16,
    benchmarkScore: 98.7,
    averageMemoryUsage: 29.2,
    averageLatencyMs: 178,
    averageAttentionEntropy: 1.25,
    averageBacktracks: 0.2,
    pruningEfficiency: 95.1,
    cognitiveCharacteristics: [
      'Graph-theoretic DAG percolation evaluated via optimized sparse adjacency matrices',
      'Instantaneous betweenness centrality identification for sole-source fabs',
      'Zero speculative hallucinations on missing component dependencies'
    ]
  }
];

export const TRAINING_COGNITIVE_PROFILES: SkillCognitiveProfile[] = [
  {
    skillId: 'skill-train-01',
    skillCode: 'SKILL-TRAIN-01',
    skillName: 'Lévy-Khintchine Discontinuity Quant',
    stage: 'training',
    vector: 'Statistics & Stochastic',
    generation: 6,
    benchmarkScore: 89.2,
    averageMemoryUsage: 76.4,
    averageLatencyMs: 685,
    averageAttentionEntropy: 4.65,
    averageBacktracks: 6.8,
    pruningEfficiency: 48.2,
    cognitiveCharacteristics: [
      'Active exploratory search across non-Gaussian jump intensity parameters',
      'Frequent counterfactual backtracking when standard deviation bounds clash with fat-tail jumps',
      'Working memory elevated due to maintaining multi-hypothesis candidate distributions'
    ]
  },
  {
    skillId: 'skill-train-02',
    skillCode: 'SKILL-TRAIN-02',
    skillName: 'Micro-Hedging Acoustic Dissonance Scanner',
    stage: 'training',
    vector: 'Behavioral Psychology',
    generation: 4,
    benchmarkScore: 88.4,
    averageMemoryUsage: 72.1,
    averageLatencyMs: 620,
    averageAttentionEntropy: 4.42,
    averageBacktracks: 5.4,
    pruningEfficiency: 52.0,
    cognitiveCharacteristics: [
      'Exploring boundary thresholds between verbal pauses and intentional executive deceit',
      'Attention entropy remains high as agent tests multiple phonetic pitch modulation filters',
      'Working memory strain during multi-speaker concurrent Q&A transcription'
    ]
  },
  {
    skillId: 'skill-train-03',
    skillCode: 'SKILL-TRAIN-03',
    skillName: 'Synthetic Lease Restatement Reconstructor',
    stage: 'training',
    vector: 'Forensic Accounting',
    generation: 7,
    benchmarkScore: 90.1,
    averageMemoryUsage: 69.8,
    averageLatencyMs: 590,
    averageAttentionEntropy: 4.10,
    averageBacktracks: 4.6,
    pruningEfficiency: 56.4,
    cognitiveCharacteristics: [
      'Learning to reconcile synthetic operating leases back into balance sheet capital debt',
      'High latency during multi-year discount rate interpolations',
      'Intermittent backtracking on residual value guarantee footnotes'
    ]
  },
  {
    skillId: 'skill-train-04',
    skillCode: 'SKILL-TRAIN-04',
    skillName: 'Cross-Affiliate Intercompany Cash Sweep Auditor',
    stage: 'training',
    vector: 'Systems Engineering',
    generation: 5,
    benchmarkScore: 87.6,
    averageMemoryUsage: 81.2,
    averageLatencyMs: 740,
    averageAttentionEntropy: 4.95,
    averageBacktracks: 7.9,
    pruningEfficiency: 41.5,
    cognitiveCharacteristics: [
      'Unrefined multi-entity transfer pricing graph traversal causes combinatorial path explosion',
      'Substantial memory pressure tracking offshore subsidiary cash pooling agreements',
      'Frequent hypothesis abandonment when auditing offshore jurisdictional tax conduits'
    ]
  }
];

/**
 * Generate 25 initial real-time points for D3 stream rendering
 */
export function generateInitialCognitiveHistory(): RealtimeCognitivePoint[] {
  const points: RealtimeCognitivePoint[] = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const t = now - i * 1200;
    const timeSec = new Date(t).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });

    // Champion values: tight, low entropy, low memory, stable strain
    const champMemory = Number((24 + Math.sin(i * 0.4) * 4.2 + (Math.random() * 2 - 1)).toFixed(1));
    const champEntropy = Number((1.2 + Math.cos(i * 0.3) * 0.18 + Math.random() * 0.08).toFixed(2));
    const champLatency = Math.round(150 + Math.sin(i * 0.5) * 25 + Math.random() * 15);
    const champBacktracks = Math.random() > 0.85 ? 1 : 0;
    const champStrain = Number(((champMemory * 0.4) + (champEntropy * 8.5) + (champLatency * 0.08)).toFixed(1));

    // Training values: elevated, volatile, high entropy, frequent backtracks
    const trainMemory = Number((74 + Math.sin(i * 0.5) * 8.5 + (Math.random() * 6 - 3)).toFixed(1));
    const trainEntropy = Number((4.4 + Math.cos(i * 0.6) * 0.45 + (Math.random() * 0.3 - 0.15)).toFixed(2));
    const trainLatency = Math.round(660 + Math.sin(i * 0.7) * 90 + Math.random() * 50);
    const trainBacktracks = Math.round(4 + Math.sin(i * 0.8) * 2.5 + Math.random() * 2);
    const trainStrain = Number(((trainMemory * 0.4) + (trainEntropy * 8.5) + (trainLatency * 0.04)).toFixed(1));

    points.push({
      time: t,
      timestampStr: timeSec,
      championMemory: champMemory,
      trainingMemory: trainMemory,
      championEntropy: champEntropy,
      trainingEntropy: trainEntropy,
      championLatency: champLatency,
      trainingLatency: trainLatency,
      championBacktracks: champBacktracks,
      trainingBacktracks: trainBacktracks,
      championStrain: champStrain,
      trainingStrain: trainStrain
    });
  }

  return points;
}

/**
 * Generate a single live tick step
 */
export function generateNextCognitivePoint(
  lastPoint: RealtimeCognitivePoint,
  stepIndex: number
): RealtimeCognitivePoint {
  const t = Date.now();
  const timeSec = new Date(t).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });

  const champMemory = Number(
    Math.min(38, Math.max(18, lastPoint.championMemory + (Math.random() * 4 - 2) + Math.sin(stepIndex * 0.3) * 0.8)).toFixed(1)
  );
  const champEntropy = Number(
    Math.min(1.8, Math.max(0.9, lastPoint.championEntropy + (Math.random() * 0.14 - 0.07))).toFixed(2)
  );
  const champLatency = Math.round(
    Math.min(220, Math.max(120, lastPoint.championLatency + (Math.random() * 20 - 10)))
  );
  const champBacktracks = Math.random() > 0.88 ? 1 : 0;
  const champStrain = Number(((champMemory * 0.4) + (champEntropy * 8.5) + (champLatency * 0.08)).toFixed(1));

  const trainMemory = Number(
    Math.min(94, Math.max(58, lastPoint.trainingMemory + (Math.random() * 8 - 4) + Math.cos(stepIndex * 0.4) * 1.5)).toFixed(1)
  );
  const trainEntropy = Number(
    Math.min(5.6, Math.max(3.6, lastPoint.trainingEntropy + (Math.random() * 0.3 - 0.15))).toFixed(2)
  );
  const trainLatency = Math.round(
    Math.min(920, Math.max(510, lastPoint.trainingLatency + (Math.random() * 60 - 30)))
  );
  const trainBacktracks = Math.round(
    Math.min(12, Math.max(2, lastPoint.trainingBacktracks + (Math.random() * 3 - 1.5)))
  );
  const trainStrain = Number(((trainMemory * 0.4) + (trainEntropy * 8.5) + (trainLatency * 0.04)).toFixed(1));

  return {
    time: t,
    timestampStr: timeSec,
    championMemory: champMemory,
    trainingMemory: trainMemory,
    championEntropy: champEntropy,
    trainingEntropy: trainEntropy,
    championLatency: champLatency,
    trainingLatency: trainLatency,
    championBacktracks: champBacktracks,
    trainingBacktracks: trainBacktracks,
    championStrain: champStrain,
    trainingStrain: trainStrain
  };
}

const CHAMPION_THOUGHT_SNIPPETS = [
  'Invariant Rule 1 verified: Bypassed non-GAAP EBITDA adjustments without search expansion.',
  'Cross-footing footnote 14 vendor financing: Extracted $840M reverse factoring in 138ms.',
  'Applying pre-compiled Nash backward induction: Dominant liquidity threshold isolated at $1.8B.',
  'Sub-tier supplier DAG traversed: Zero cycles found; betweenness centrality locked in single pass.',
  'Hedging density quotient evaluated: Direct deflection markers mapped with 0.18 cosine divergence.',
  'Page 84 note citation validated: Reclassified $620M to financing cash flow. Zero backtracking.'
];

const TRAINING_THOUGHT_SNIPPETS = [
  'Testing candidate Lévy jump intensity λ=0.85: Parameter rejected due to 4.2-sigma kurtosis drift.',
  'High attention entropy: 6 counterfactual hypotheses active in working memory context.',
  'Backtracking step 4: Re-evaluating acoustic pitch dissonance against baseline transcript.',
  'Combinatorial explosion detected in intercompany sweep graph: Pruning 18 non-viable tax conduits.',
  'Context window pressure spiking (78%): Swapping out historical balance sheet cash buffers.',
  'Parameter mutation initiated: Tightening discontinuity penalty weight by +12.4% to force convergence.'
];

/**
 * Generate dynamic thought packet
 */
export function generateRandomThoughtPacket(
  stage: 'champion' | 'training',
  skill?: AgentSkill
): CognitiveThoughtPacket {
  const isChampion = stage === 'champion';
  const id = `pkt-${stage}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const snippets = isChampion ? CHAMPION_THOUGHT_SNIPPETS : TRAINING_THOUGHT_SNIPPETS;
  const thoughtText = snippets[Math.floor(Math.random() * snippets.length)];

  let phase: CognitiveThoughtPacket['phase'] = 'INVARIANT_VERIFICATION';
  let status: CognitiveThoughtPacket['status'] = 'STREAMLINED';

  if (isChampion) {
    phase = Math.random() > 0.4 ? 'INVARIANT_VERIFICATION' : 'CONVERGENCE';
    status = 'STREAMLINED';
  } else {
    const phases: CognitiveThoughtPacket['phase'][] = [
      'COUNTERFACTUAL_SEARCH',
      'CONSTRAINT_PARSING',
      'RECONVERGENCE',
      'INGESTION'
    ];
    phase = phases[Math.floor(Math.random() * phases.length)];
    status = phase === 'RECONVERGENCE' ? 'BACKTRACKING' : 'EVALUATING';
  }

  const metrics: CognitiveLoadMetrics = isChampion
    ? {
        workingMemoryUsage: Number((22 + Math.random() * 8).toFixed(1)),
        inferenceLatencyMs: Math.round(135 + Math.random() * 45),
        attentionEntropy: Number((1.1 + Math.random() * 0.3).toFixed(2)),
        backtrackingCount: Math.random() > 0.9 ? 1 : 0,
        tokenCertainty: Number((97 + Math.random() * 2.8).toFixed(1)),
        heuristicPruningRate: Number((93 + Math.random() * 5).toFixed(1)),
        contextWindowPressure: Number((16 + Math.random() * 8).toFixed(1)),
        cognitiveStrainIndex: Number((24 + Math.random() * 8).toFixed(1))
      }
    : {
        workingMemoryUsage: Number((72 + Math.random() * 16).toFixed(1)),
        inferenceLatencyMs: Math.round(580 + Math.random() * 260),
        attentionEntropy: Number((4.2 + Math.random() * 0.9).toFixed(2)),
        backtrackingCount: Math.round(4 + Math.random() * 5),
        tokenCertainty: Number((72 + Math.random() * 14).toFixed(1)),
        heuristicPruningRate: Number((45 + Math.random() * 16).toFixed(1)),
        contextWindowPressure: Number((65 + Math.random() * 22).toFixed(1)),
        cognitiveStrainIndex: Number((74 + Math.random() * 16).toFixed(1))
      };

  return {
    id,
    timestamp: Date.now(),
    skillId: skill?.id || (isChampion ? 'skill-champ-01' : 'skill-train-01'),
    skillCode: skill?.code || (isChampion ? 'SKILL-CHAMP-01' : 'SKILL-TRAIN-01'),
    skillName: skill?.name || (isChampion ? 'Forensic Footnote Deconstructor' : 'Lévy-Khintchine Discontinuity Quant'),
    stage,
    phase,
    thoughtText,
    metrics,
    status
  };
}
