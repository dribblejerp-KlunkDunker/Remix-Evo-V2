import {
  SynapseLink,
  ComplexFinancialQuery,
  SynapseNetworkMetrics
} from '../types/neuralSynapse';

export const INITIAL_COMPLEX_QUERIES: ComplexFinancialQuery[] = [
  {
    id: 'query-01',
    title: 'Disguised Reverse Factoring & Strategic Payout Delays',
    queryPrompt: 'Audit multi-currency supplier financing facilities where accounts payable days surged to 182 days while operating cash flow expanded +28% YoY during interest rate dislocation.',
    financialDomain: 'Forensic Cash Reconstruction & Game-Theoretic Liquidity',
    difficulty: 'COMPLEX',
    primaryFiringSkillIds: ['skill-champ-01', 'skill-champ-03', 'skill-train-03'],
    expectedSynapsePath: ['SKILL-CHAMP-01 ⟷ SKILL-TRAIN-03', 'SKILL-CHAMP-01 ⟷ SKILL-CHAMP-03'],
    coActivationVerdict: 'COGNITIVE CONSENSUS: Classified $620M as short-term bank debt with dual-horizon liquidity reservation proof (+14% resilience under repo spike).',
    synthesisLatencyMs: 148,
    plasticityGain: 0.04
  },
  {
    id: 'query-02',
    title: 'Executive Deflection & Tier-3 Packaging Chokepoint Confidentiality',
    queryPrompt: 'Evaluate earnings call Q&A where CEO deflected direct queries regarding sole-source ABF substrate suppliers across the Taiwan Strait into generic multi-year software ARR guidance.',
    financialDomain: 'Behavioral Psychology & Topological Graph Security',
    difficulty: 'COMPLEX',
    primaryFiringSkillIds: ['skill-champ-02', 'skill-champ-04', 'skill-train-02'],
    expectedSynapsePath: ['SKILL-CHAMP-02 ⟷ SKILL-TRAIN-02', 'SKILL-CHAMP-02 ⟷ SKILL-CHAMP-04'],
    coActivationVerdict: 'COGNITIVE CONSENSUS: Reconciled semantic deflection against supply-chain DAG. Verified operational security defense; filtered false-positive fraud score from 92% down to 14%.',
    synthesisLatencyMs: 162,
    plasticityGain: 0.03
  },
  {
    id: 'query-03',
    title: 'Lévy Jump Discontinuity & Correlated Prime Broker Run',
    queryPrompt: 'Simulate systemic run-on-collateral when 4.2-sigma fat-tail tech debt sell-off triggers simultaneous 6% repo haircut across 5 prime brokers under illiquid order book decay.',
    financialDomain: 'Fat-Tail Stochastic & Non-Cooperative Nash Equilibrium',
    difficulty: 'EXTREME',
    primaryFiringSkillIds: ['skill-train-01', 'skill-champ-03', 'skill-train-04'],
    expectedSynapsePath: ['SKILL-TRAIN-01 ⟷ SKILL-CHAMP-03', 'SKILL-CHAMP-03 ⟷ SKILL-TRAIN-04'],
    coActivationVerdict: 'COGNITIVE CONSENSUS: Pinpointed exact fire-sale tipping point at $1.82B margin deficit. Intercompany cash pool buffers absorb first 36 hours of sweep.',
    synthesisLatencyMs: 184,
    plasticityGain: 0.05
  },
  {
    id: 'query-04',
    title: 'Offshore Intercompany Cash Sweep & Synthetic Lease Arbitrage',
    queryPrompt: 'Deconstruct off-balance synthetic operating leases held across 3 Cayman Island subsidiaries and verify whether intra-entity transfer pricing cash sweeps violate senior debt covenants.',
    financialDomain: 'Forensic Accounting & Cross-Affiliate Systems Engineering',
    difficulty: 'EXTREME',
    primaryFiringSkillIds: ['skill-champ-01', 'skill-train-03', 'skill-train-04'],
    expectedSynapsePath: ['SKILL-CHAMP-01 ⟷ SKILL-TRAIN-03', 'SKILL-TRAIN-03 ⟷ SKILL-TRAIN-04'],
    coActivationVerdict: 'COGNITIVE CONSENSUS: Discovered $340M synthetic residual lease exposure with zero-capitalization penalty; mapped covenant breach probability at 84.6%.',
    synthesisLatencyMs: 176,
    plasticityGain: 0.04
  },
  {
    id: 'query-05',
    title: 'Systemic Multi-Vector Restatement & Global Liquidity Cascade',
    queryPrompt: 'Simultaneous restatement event: Footnote supplier debt default, CEO resignation deflection, sole-source Kaohsiung port closure, and cross-border currency swap haircut freeze.',
    financialDomain: 'Full Swarm Cortical Cascade (All Neural Pathways Active)',
    difficulty: 'SYSTEMIC_CASCADE',
    primaryFiringSkillIds: [
      'skill-champ-01',
      'skill-champ-02',
      'skill-champ-03',
      'skill-champ-04',
      'skill-train-01',
      'skill-train-03'
    ],
    expectedSynapsePath: [
      'SKILL-CHAMP-01 ⟷ SKILL-CHAMP-03',
      'SKILL-CHAMP-02 ⟷ SKILL-CHAMP-04',
      'SKILL-CHAMP-03 ⟷ SKILL-TRAIN-01',
      'SKILL-CHAMP-01 ⟷ SKILL-TRAIN-03'
    ],
    coActivationVerdict: 'COGNITIVE CONSENSUS: Full cortical synchronization achieved in 218ms. Harmonized 6 distinct vector models to construct unified macro solvency breakdown report.',
    synthesisLatencyMs: 218,
    plasticityGain: 0.08
  }
];

export const INITIAL_SYNAPSE_LINKS: SynapseLink[] = [
  // Inter-Champion Synapses (Crystalline, high baseline weight)
  {
    id: 'syn-c1-c3',
    sourceSkillId: 'skill-champ-01',
    sourceCode: 'SKILL-CHAMP-01',
    targetSkillId: 'skill-champ-03',
    targetCode: 'SKILL-CHAMP-03',
    weight: 0.94,
    coActivationCount: 428,
    lastFiredTimestamp: Date.now() - 14000,
    firingFrequencyHz: 182,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'Footnote Reconciliation & Nash Liquidity Buffers',
    plasticityHistory: [0.88, 0.90, 0.92, 0.94]
  },
  {
    id: 'syn-c2-c4',
    sourceSkillId: 'skill-champ-02',
    sourceCode: 'SKILL-CHAMP-02',
    targetSkillId: 'skill-champ-04',
    targetCode: 'SKILL-CHAMP-04',
    weight: 0.91,
    coActivationCount: 386,
    lastFiredTimestamp: Date.now() - 32000,
    firingFrequencyHz: 164,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'Executive Candor & Topological Supplier OPSEC',
    plasticityHistory: [0.85, 0.87, 0.89, 0.91]
  },
  {
    id: 'syn-c1-c4',
    sourceSkillId: 'skill-champ-01',
    sourceCode: 'SKILL-CHAMP-01',
    targetSkillId: 'skill-champ-04',
    targetCode: 'SKILL-CHAMP-04',
    weight: 0.85,
    coActivationCount: 294,
    lastFiredTimestamp: Date.now() - 85000,
    firingFrequencyHz: 122,
    status: 'IDLE',
    synergyDomain: 'Balance Sheet Inventory Valuation & Sub-tier DAG',
    plasticityHistory: [0.78, 0.81, 0.83, 0.85]
  },
  {
    id: 'syn-c2-c3',
    sourceSkillId: 'skill-champ-02',
    sourceCode: 'SKILL-CHAMP-02',
    targetSkillId: 'skill-champ-03',
    targetCode: 'SKILL-CHAMP-03',
    weight: 0.79,
    coActivationCount: 210,
    lastFiredTimestamp: Date.now() - 120000,
    firingFrequencyHz: 98,
    status: 'IDLE',
    synergyDomain: 'Acoustic Hedging & Prime Broker Margin Call Timing',
    plasticityHistory: [0.74, 0.76, 0.78, 0.79]
  },
  {
    id: 'syn-c3-c4',
    sourceSkillId: 'skill-champ-03',
    sourceCode: 'SKILL-CHAMP-03',
    targetSkillId: 'skill-champ-04',
    targetCode: 'SKILL-CHAMP-04',
    weight: 0.83,
    coActivationCount: 260,
    lastFiredTimestamp: Date.now() - 48000,
    firingFrequencyHz: 135,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'Systemic Fire-Sale Liquidity & Chokepoint Disruption',
    plasticityHistory: [0.79, 0.80, 0.82, 0.83]
  },

  // Champion <-> In-Training Synapses (Active cross-breeding & mentorship bridges)
  {
    id: 'syn-c1-t3',
    sourceSkillId: 'skill-champ-01',
    sourceCode: 'SKILL-CHAMP-01',
    targetSkillId: 'skill-train-03',
    targetCode: 'SKILL-TRAIN-03',
    weight: 0.89,
    coActivationCount: 312,
    lastFiredTimestamp: Date.now() - 22000,
    firingFrequencyHz: 156,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'GAAP Footnotes & Synthetic Lease Restatements',
    plasticityHistory: [0.72, 0.79, 0.84, 0.89]
  },
  {
    id: 'syn-c2-t2',
    sourceSkillId: 'skill-champ-02',
    sourceCode: 'SKILL-CHAMP-02',
    targetSkillId: 'skill-train-02',
    targetCode: 'SKILL-TRAIN-02',
    weight: 0.87,
    coActivationCount: 295,
    lastFiredTimestamp: Date.now() - 28000,
    firingFrequencyHz: 148,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'Transcript Deflection & Micro-Hedging Acoustic Pitch',
    plasticityHistory: [0.70, 0.77, 0.82, 0.87]
  },
  {
    id: 'syn-c3-t1',
    sourceSkillId: 'skill-champ-03',
    sourceCode: 'SKILL-CHAMP-03',
    targetSkillId: 'skill-train-01',
    targetCode: 'SKILL-TRAIN-01',
    weight: 0.88,
    coActivationCount: 304,
    lastFiredTimestamp: Date.now() - 19000,
    firingFrequencyHz: 162,
    status: 'ACTIVE_FIRING',
    synergyDomain: 'Non-Gaussian Lévy Jumps & Collateral Run Thresholds',
    plasticityHistory: [0.71, 0.78, 0.83, 0.88]
  },
  {
    id: 'syn-t3-t4',
    sourceSkillId: 'skill-train-03',
    sourceCode: 'SKILL-TRAIN-03',
    targetSkillId: 'skill-train-04',
    targetCode: 'SKILL-TRAIN-04',
    weight: 0.78,
    coActivationCount: 184,
    lastFiredTimestamp: Date.now() - 95000,
    firingFrequencyHz: 92,
    status: 'IDLE',
    synergyDomain: 'Synthetic Leases & Offshore Intercompany Sweeps',
    plasticityHistory: [0.65, 0.70, 0.75, 0.78]
  },
  {
    id: 'syn-t1-t4',
    sourceSkillId: 'skill-train-01',
    sourceCode: 'SKILL-TRAIN-01',
    targetSkillId: 'skill-train-04',
    targetCode: 'SKILL-TRAIN-04',
    weight: 0.74,
    coActivationCount: 162,
    lastFiredTimestamp: Date.now() - 110000,
    firingFrequencyHz: 84,
    status: 'IDLE',
    synergyDomain: 'Lévy Discontinuities & Intercompany Cash Velocity',
    plasticityHistory: [0.62, 0.66, 0.70, 0.74]
  },
  {
    id: 'syn-c4-t1',
    sourceSkillId: 'skill-champ-04',
    sourceCode: 'SKILL-CHAMP-04',
    targetSkillId: 'skill-train-01',
    targetCode: 'SKILL-TRAIN-01',
    weight: 0.76,
    coActivationCount: 178,
    lastFiredTimestamp: Date.now() - 145000,
    firingFrequencyHz: 88,
    status: 'IDLE',
    synergyDomain: 'Graph Percolation & Discontinuous Price Shocks',
    plasticityHistory: [0.68, 0.71, 0.73, 0.76]
  }
];

export function calculateSynapseMetrics(links: SynapseLink[]): SynapseNetworkMetrics {
  const activeFiring = links.filter((l) => l.status === 'ACTIVE_FIRING');
  const sumWeight = links.reduce((acc, l) => acc + l.weight, 0);
  const avgWeight = Number((sumWeight / (links.length || 1)).toFixed(2));

  return {
    totalSynapses: links.length,
    activeFiringSynapses: activeFiring.length,
    averageSynapticWeight: avgWeight,
    firingCoherenceRate: Math.round((activeFiring.length / (links.length || 1)) * 100),
    hebbianPlasticityGainToday: Number((0.084 + (activeFiring.length * 0.012)).toFixed(3)),
    corticalTransmissionVelocity: Math.round(340 + avgWeight * 420)
  };
}
