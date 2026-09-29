export interface EvidenceExpectation {
  id: string;
  description: string;
  anchors: string[];
  weight: number;
}

export interface BenchmarkCase {
  id: string;
  title: string;
  task: string;
  document: {
    sourceType: 'fixture' | 'sec_filing';
    title: string;
    sourceUrl?: string;
    filingDate?: string;
    text: string;
  };
  expectations: EvidenceExpectation[];
  requiredConstraints: string[];
  forbiddenPatterns?: string[];
}

export interface CaseEvaluation {
  caseId: string;
  score: number;
  passed: boolean;
  evidenceCoverage: number;
  constraintCompliance: number;
  numericAccuracy: number;
  citationAccuracy: number;
  failures: string[];
  matchedEvidence: string[];
  missingEvidence: string[];
  matchedConstraints: string[];
  missingConstraints: string[];
  citationIssues: string[];
}

export interface BenchmarkReport {
  benchmarkId: string;
  skillId: string;
  skillVersion: string;
  model: string;
  executedAt: string;
  caseCount: number;
  passedCount: number;
  meanScore: number;
  criticalFailures: number;
  cases: CaseEvaluation[];
}

export interface SkillExecutionRequest {
  systemDirective: string;
  reasoningFramework: string;
  adversarialConstraint: string;
  strictRules: string[];
  task: string;
  documentText: string;
  sourceUrl?: string;
}

export interface SkillExecutionResult {
  outputText: string;
  tokens?: number;
  latencyMs: number;
}
