export type SynapseStatus = 'ACTIVE_FIRING' | 'REINFORCING' | 'IDLE' | 'REFRACTORY';

export interface SynapseLink {
  id: string;
  sourceSkillId: string;
  sourceCode: string;
  targetSkillId: string;
  targetCode: string;
  weight: number; // Synaptic weight / connection strength: 0.05 to 1.00
  coActivationCount: number; // Number of times this pair solved queries together
  lastFiredTimestamp: number;
  firingFrequencyHz: number;
  status: SynapseStatus;
  synergyDomain: string; // e.g. 'Forensic Cash Reconciliation & Dynamic Game Solvency'
  plasticityHistory: number[]; // Recent weight trajectory
}

export interface NeuralSkillNode {
  skillId: string;
  skillCode: string;
  skillName: string;
  stage: 'champion' | 'training' | 'testing' | 'idea';
  generation: number;
  vector: string;
  membranePotentialMv: number; // Resting: -70mV, Action Potential: +30mV
  isFiring: boolean;
  firingRateHz: number;
  totalSynapses: number;
  strongestPartnerCode: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface ComplexFinancialQuery {
  id: string;
  title: string;
  queryPrompt: string;
  financialDomain: string;
  difficulty: 'COMPLEX' | 'EXTREME' | 'SYSTEMIC_CASCADE';
  primaryFiringSkillIds: string[];
  expectedSynapsePath: string[];
  coActivationVerdict: string;
  synthesisLatencyMs: number;
  plasticityGain: number; // e.g. +0.03 weight increment upon successful synthesis
}

export interface SynapseNetworkMetrics {
  totalSynapses: number;
  activeFiringSynapses: number;
  averageSynapticWeight: number;
  firingCoherenceRate: number; // 0 - 100%
  hebbianPlasticityGainToday: number;
  corticalTransmissionVelocity: number; // tokens/second or signals/ms
}
