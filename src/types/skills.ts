export type SkillEvolutionStage = 'idea' | 'training' | 'testing' | 'champion';

export type VectorCategory =
  | 'Statistics & Stochastic'
  | 'Behavioral Psychology'
  | 'Manipulation & Deception'
  | 'Forensic Accounting'
  | 'Advanced Math'
  | 'Game Design & Incentives'
  | 'Empirical Science'
  | 'Systems Engineering'
  | 'Engineering';

export interface SkillTestCase {
  id: string;
  title: string;
  realWorldUseCase: string;
  inputScenario: string;
  expectedConstraints: string[];
  targetThreshold: number; // e.g. 95%
  lastScore: number;
  status: 'passed' | 'testing' | 'flagged';
  testedAt: string;
  executionLog?: {
    reasoningSteps: string[];
    detectedVectors: string[];
    ruleComplianceScore: number;
    convictionVerdict: string;
    verdictSummary: string;
  };
}

export interface EvolutionIteration {
  iterationNumber: number;
  epoch: string;
  timestamp: string;
  stage: SkillEvolutionStage;
  parentSkillIds: string[];
  parentSkillNames: string[];
  mutationPercentage: number; // e.g. 18.5%
  performanceDelta: number; // e.g. +6.8%
  scoreBefore: number; // e.g. 84.2%
  scoreAfter: number; // e.g. 91.0%
  recombinationStrategy: string; // e.g. 'Pareto Crossover & Adversarial Invariance Injection'
  mutationType: string;
  mutationDetails: string;
  ruleDiff: {
    added: string[];
    modified: string[];
    pruned?: string[];
  };
  testPassRate: number; // e.g. 96.5%
  testCasesRun: number;
  survived: boolean;
  keyInsight: string;
}

export interface ParentSeedDetail {
  id: string;
  code: string;
  name: string;
  role: string;
  vector: VectorCategory;
  contributionWeight: number; // percentage 0-100
  source: 'GitHub' | 'HuggingFace' | 'Internal Benchmark' | 'SEC Research Paper' | 'Research Paper' | 'Voyager Skill Library';
  seedScore: number;
}

export interface ChampionEvolutionLineageAudit {
  championId: string;
  championCode: string;
  championName: string;
  tagline: string;
  specialistRole: string;
  currentScore: number;
  initialScore: number;
  totalPerformanceDelta: number;
  averageMutationRate: number;
  parentSeeds: ParentSeedDetail[];
  remixVectorCombo: string;
  iterations: EvolutionIteration[];
  championMilestoneAchievedAt: string;
  lineageSummary: string;
}

export interface EvolutionLineage {
  parents: string[];
  remixVectorCombo: string;
  generationEpoch: string;
  survivalIterations: number;
  mutationType: string;
  totalMutationPercentage?: number;
  overallImprovementDelta?: number;
  parentDetails?: ParentSeedDetail[];
  iterations?: EvolutionIteration[];
  auditLog?: ChampionEvolutionLineageAudit;
}

export interface StageHistoryItem {
  stage: SkillEvolutionStage;
  timestamp: string;
  score: number;
  notes: string;
}

export interface SkillAttachedFile {
  id: string;
  name: string;
  type: 'txt' | 'md' | 'pdf';
  sizeBytes: number;
  uploadedAt: string;
  contentPreview?: string;
  fullContent?: string;
  blobUrl?: string;
  parsedData?: {
    extractedTitle?: string;
    extractedDescription?: string;
    extractedDirectives?: string[];
    extractedRules?: string[];
    codeSnippets?: string[];
    pdfPageCount?: number;
    charCount?: number;
  };
}

export interface AgentSkill {
  id: string;
  code: string;
  name: string;
  stage: SkillEvolutionStage;
  tagline: string;
  description: string;
  vectors: VectorCategory[];
  generation: number;
  benchmarkScore: number; // 0-100
  threshold: number; // typically 95 to qualify as champion
  winRate: number; // percentage
  stabilityIndex: number; // percentage
  hallucinationRate: number; // percentage e.g. 0.0%
  strictRules: string[];
  specialistRole: string;
  promptMatrix: {
    systemDirective: string;
    reasoningFramework: string;
    adversarialConstraint: string;
  };
  autonomousThought: string; // What the agent is thinking/evaluating right now
  activeTestBench: {
    name: string;
    currentVector: string;
    totalRunsToday: number;
    consecutivePasses: number;
    stressVector: string;
  };
  testCases: SkillTestCase[];
  evolutionLineage: EvolutionLineage;
  attachedFiles?: SkillAttachedFile[];
  openSourceLineage?: {
    source: 'GitHub' | 'HuggingFace' | 'Research Paper' | 'Internal';
    repoOrDataset?: string;
    license?: string;
    starsOrDownloads?: string;
    standardSpec?: string;
  };
  stageHistory: StageHistoryItem[];
  createdAt: string;
  lastEvaluatedAt: string;
}

export interface EvolutionStats {
  totalSkills: number;
  ideaCount: number;
  trainingCount: number;
  testingCount: number;
  championCount: number;
  thresholdRequirement: number;
  dailyMutations: number;
  championsTestedToday: number;
  averageCompliance: number;
}

export interface ScenarioHeatmapPoint {
  specialistId: string;
  specialistName: string;
  specialistVector: VectorCategory;
  scenarioId: string;
  scenarioName: string;
  scenarioShort: string;
  scenarioCategory: string;
  successRate: number; // 0 - 100
  testRuns: number;
  ruleCompliance: number; // 0 - 100
  status: 'champion' | 'testing' | 'baseline';
  keyInsight: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  adversarialDifficulty: 'Extreme' | 'High' | 'Moderate';
}

export interface AgentPersonalityHyperparameters {
  riskAversion: number; // 0 - 100
  creativity: number; // 0 - 100
  logicBias: number; // 0 - 100
  adversarialParanoia: number; // 0 - 100
  psychologicalEmpathy: number; // 0 - 100
  mutationEntropy: number; // 0 - 100
}

export interface PersonalityArchetypePreset {
  id: string;
  name: string;
  tagline: string;
  iconName: string;
  colorScheme: string;
  params: AgentPersonalityHyperparameters;
  description: string;
  bestFitScenario: string;
}

export interface EvolutionTrajectoryPoint {
  generation: number;
  label: string;
  projectedScore: number;
  upperBound: number;
  lowerBound: number;
  baselineScore: number;
  championThreshold: number;
  volatility: number;
  mutationDrift: number;
}

export interface SimulatedGenerationStep {
  generation: number;
  score: number;
  delta: number;
  mutationType: string;
  mutationDescription: string;
  stressScenario: string;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  ruleAddedOrModified: string;
  hallucinationRate: number;
}

export interface SimulationRunResult {
  runId: string;
  agentName: string;
  timestamp: string;
  hyperparameters: AgentPersonalityHyperparameters;
  steps: SimulatedGenerationStep[];
  reachedChampion: boolean;
  championGen?: number;
  peakScore: number;
  stabilityIndex: number;
  extinctionRisk: number;
}
