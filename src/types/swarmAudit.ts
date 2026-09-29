import { VectorCategory, SkillEvolutionStage, AgentSkill } from './skills';

export interface SwarmBot {
  id: string;
  code: string;
  name: string;
  role: string;
  vector: VectorCategory | 'Adversarial Red-Team' | 'Formal Verification';
  specialtyAttack: string;
  status: 'idle' | 'probing' | 'stressing' | 'completed' | 'flagged';
  attacksFired: number;
  vulnerabilitiesFound: number;
  avatarIcon: string;
  colorScheme: string;
}

export interface SwarmAuditPhase {
  phaseNumber: number;
  name: string;
  codeName: string;
  description: string;
  status: 'pending' | 'running' | 'completed';
  testsTarget: number;
  testsCompleted: number;
  passes: number;
  failures: number;
  integrityScore: number; // 0 - 100
  activeVector: string;
}

export interface SwarmSkillAuditResult {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: SkillEvolutionStage;
  baselineScore: number;
  postAuditScore: number;
  scoreDelta: number;
  resilienceRating: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'FAIL';
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  passRate: number;
  hallucinationRateRecorded: number;
  vulnerabilitiesDetected: string[];
  hardenedRulesInjected: string[];
  verdict: 'CERTIFIED_CHAMPION' | 'QUALIFIED_ROBUST' | 'HARDENING_REQUIRED' | 'QUARANTINED';
}

export interface SwarmCriticalFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  domain: string;
  targetSkill: string;
  title: string;
  attackVector: string;
  vulnerabilityDescription: string;
  swarmObservation: string;
  mitigationAction: string;
  status: 'MITIGATED' | 'PATCHED' | 'HARDENED' | 'MONITORING';
}

export interface SwarmAuditReport {
  auditId: string;
  timestamp: string;
  totalDurationSeconds: number;
  totalTestsRun: number;
  totalPassed: number;
  totalFailed: number;
  overallPassRate: number;
  resilienceIndex: number; // 0 - 100
  swarmConsensusVerdict: 'PASSED_MAXIMUM_RESILIENCE' | 'PASSED_WITH_CONDITIONS' | 'ACTION_REQUIRED';
  executiveSummary: string;
  swarmBots: SwarmBot[];
  phases: SwarmAuditPhase[];
  skillResults: SwarmSkillAuditResult[];
  criticalFindings: SwarmCriticalFinding[];
  domainHealthMatrix: {
    domain: string;
    testsRun: number;
    passRate: number;
    failureRate: number;
    outperformanceMargin: number;
    status: 'OPTIMAL' | 'STABLE' | 'NEEDS_HARDENING';
  }[];
}
