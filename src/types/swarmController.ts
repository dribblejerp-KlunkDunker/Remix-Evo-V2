import { VectorCategory } from './skills';

export interface FinancialLogicPuzzle {
  id: string;
  code: string;
  title: string;
  category: VectorCategory | 'Forensic Arbitrage' | 'Game Theory' | 'Stochastic Modeling';
  difficulty: 'Grandmaster' | 'Hard' | 'Extreme';
  timeLimitSec: number;
  scenarioBrief: string;
  problemStatement: string;
  hiddenTraps: string[];
  expectedInvariant: string;
  targetAnswer: string;
  benchmarkBaselineScore: number;
}

export interface CompetingAgentInstance {
  id: string;
  code: string;
  name: string;
  archetype: string;
  generation: number;
  strategyProfile: string;
  hyperparameters: {
    logicBias: number; // 0 - 100
    riskAversion: number; // 0 - 100
    creativity: number; // 0 - 100
    adversarialParanoia: number; // 0 - 100
    mutationEntropy: number; // 0 - 100
  };
  color: string;
  avatarIcon: string;
  
  // Real-time round execution state
  status: 'idle' | 'analyzing' | 'calculating' | 'cross_verifying' | 'submitting' | 'solved' | 'failed';
  currentThoughtTrace: string;
  solutionAttempt: string;
  stepProgress: number; // 0 - 100 %
  latencyMs: number;
  
  // Performance & Fitness Metrics
  evolutionaryFitness: number; // 0 - 100
  fitnessDelta: number; // +/- delta
  historicalFitness: number[]; // Sparkline history
  accuracyScore: number; // 0 - 100%
  taskSuccessRate?: number; // 0 - 100%
  cognitiveEfficiency?: number; // 0 - 100% (memory, entropy, backtrack efficiency)
  domainSpecialization?: string;
  workingMemoryMb?: number;
  attentionEntropyBits?: number;
  activeSwarmNodesCount?: number;
  ruleCompliance: number; // 0 - 100%
  puzzlesSolved: number;
  puzzlesAttempted: number;
  eloRating: number;
  trapsAvoidedCount: number;
  rank: number;
  previousRank: number;
}

export interface CompetitionRound {
  roundId: string;
  puzzle: FinancialLogicPuzzle;
  status: 'ready' | 'competing' | 'evaluating' | 'completed';
  elapsedTimeMs: number;
  winnerAgentId?: string;
  topFitnessAgentId?: string;
}
