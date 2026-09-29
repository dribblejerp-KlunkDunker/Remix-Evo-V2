export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type ConflictStatus = 'ACTIVE_FLAGGED' | 'ARBITRATED' | 'DISMISSED';

export type ArbitrationStrategy =
  | 'PRECEDENCE_HIERARCHY'
  | 'SYNTHETIC_INVARIANT_RULE'
  | 'CONDITIONAL_ROUTING'
  | 'RECONCILIATION_PROOF';

export interface ContradictoryDirectives {
  skillADirective: string;
  skillARule: string;
  skillBDirective: string;
  skillBRule: string;
}

export interface StressScenario {
  title: string;
  description: string;
  inputContext: string;
}

export interface SkillConclusion {
  verdict: string;
  confidence: number;
  actionableRecommendation: string;
  quantitativeMetric: string;
}

export interface AnalysisOutputClash {
  skillAConclusion: SkillConclusion;
  skillBConclusion: SkillConclusion;
  contradictionSummary: string;
  qualityImpactRisk: string; // Explains how this contradiction jeopardizes output precision
}

export interface ArbitrationResolution {
  resolvedAt: string;
  arbitrationStrategy: ArbitrationStrategy;
  resolutionRule: string;
  arbitrationRationale: string;
  resultingConsensusVerdict: string;
  reconciliationAuditScore: number; // e.g. 98.6%
}

export interface SkillConflictPair {
  id: string;
  skillAId: string;
  skillAName: string;
  skillACode: string;
  skillAVectors: string[];
  skillBId: string;
  skillBName: string;
  skillBCode: string;
  skillBVectors: string[];
  conflictDomain: string;
  severity: ConflictSeverity;
  status: ConflictStatus;
  detectedAt: string;
  contradictoryDirectives: ContradictoryDirectives;
  stressScenario: StressScenario;
  analysisOutputClash: AnalysisOutputClash;
  arbitrationResolution?: ArbitrationResolution;
}

export interface SwarmQualityMetrics {
  cohesionScore: number; // 0-100%
  activeConflictCount: number;
  criticalConflictCount: number;
  arbitratedConflictCount: number;
  contradictionRiskLevel: 'SAFE' | 'GUARDED' | 'ELEVATED' | 'CRITICAL';
  meanHarmonizationLatencyMs: number;
  qualityGatePassed: boolean;
}
