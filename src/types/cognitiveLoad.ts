export interface CognitiveLoadMetrics {
  workingMemoryUsage: number; // 0 - 100%
  inferenceLatencyMs: number; // e.g. 140ms vs 720ms
  attentionEntropy: number; // Shannon entropy in bits (e.g. 1.1 bits vs 4.8 bits)
  backtrackingCount: number; // number of counterfactual re-evaluations
  tokenCertainty: number; // 0 - 100%
  heuristicPruningRate: number; // 0 - 100% (how well the agent prunes search space)
  contextWindowPressure: number; // 0 - 100%
  cognitiveStrainIndex: number; // composite index 0 - 100
}

export type CognitivePhase =
  | 'INGESTION'
  | 'CONSTRAINT_PARSING'
  | 'COUNTERFACTUAL_SEARCH'
  | 'INVARIANT_VERIFICATION'
  | 'RECONVERGENCE'
  | 'CONVERGENCE';

export type ThoughtStatus = 'STREAMLINED' | 'EVALUATING' | 'BACKTRACKING' | 'CONVERGED';

export interface CognitiveThoughtPacket {
  id: string;
  timestamp: number;
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: 'champion' | 'training';
  phase: CognitivePhase;
  thoughtText: string;
  metrics: CognitiveLoadMetrics;
  status: ThoughtStatus;
}

export interface RealtimeCognitivePoint {
  time: number;
  timestampStr: string;
  championMemory: number;
  trainingMemory: number;
  championEntropy: number;
  trainingEntropy: number;
  championLatency: number;
  trainingLatency: number;
  championBacktracks: number;
  trainingBacktracks: number;
  championStrain: number;
  trainingStrain: number;
}

export interface SkillCognitiveProfile {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: 'champion' | 'training';
  vector: string;
  generation: number;
  benchmarkScore: number;
  averageMemoryUsage: number;
  averageLatencyMs: number;
  averageAttentionEntropy: number;
  averageBacktracks: number;
  pruningEfficiency: number;
  cognitiveCharacteristics: string[];
}
