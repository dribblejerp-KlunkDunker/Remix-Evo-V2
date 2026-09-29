import { AgentSkill } from '../types/skills';
import {
  SkillConflictPair,
  SwarmQualityMetrics,
  ArbitrationStrategy,
  ArbitrationResolution
} from '../types/skillConflicts';

export const INITIAL_SKILL_CONFLICTS: SkillConflictPair[] = [
  {
    id: 'conflict-champ-01-03',
    skillAId: 'skill-champ-01',
    skillAName: 'Forensic Footnote Deconstructor',
    skillACode: 'SKILL-CHAMP-01',
    skillAVectors: ['Forensic Accounting', 'Statistics & Stochastic', 'Manipulation & Deception'],
    skillBId: 'skill-champ-03',
    skillBName: 'Nash Equilibrium Liquidity Shock Simulator',
    skillBCode: 'SKILL-CHAMP-03',
    skillBVectors: ['Game Design & Incentives', 'Advanced Math', 'Systems Engineering'],
    conflictDomain: 'Vendor Financing & Working Capital Classification',
    severity: 'CRITICAL',
    status: 'ACTIVE_FLAGGED',
    detectedAt: '14 minutes ago',
    contradictoryDirectives: {
      skillADirective: 'Strictly penalize extended trade payables (>90 days) by reclassifying vendor finance into short-term debt and marking operating cash flow down.',
      skillARule: 'RULE 1: Never accept non-GAAP adjusted EBITDA without reconstructing the cash conversion cycle; flag artificial liquidity padding.',
      skillBDirective: 'Model extended vendor payout cycles as an optimal non-cooperative game strategy to maximize unencumbered cash buffers during liquidity tightening.',
      skillBRule: 'RULE 1: Model prime brokerage actions as iterated Prisoner\'s Dilemma; unilateral cash retention is the dominant survival strategy.'
    },
    stressScenario: {
      title: 'SEC 10-K Footnote: $840M Reverse Factoring Facility in High-Interest Rate Regime',
      description: 'Enterprise hardware manufacturer reports operating cash flow increase of +28% YoY while payable days surge to 182 days via third-party bank supply-chain financing.',
      inputContext: 'NVIDIA / Dell hybrid filings benchmark: Footnote 8 reveals uncommitted multi-bank supply agreement with recourse upon supplier default.'
    },
    analysisOutputClash: {
      skillAConclusion: {
        verdict: 'CRITICAL FRAUD / INSOLVENCY ALERT',
        confidence: 98.4,
        actionableRecommendation: 'Immediate sell rating / mark down operating cash flow by -$620M. High probability of credit line freeze.',
        quantitativeMetric: 'Adjusted Free Cash Flow: -$320M (Reported: +$1.1B)'
      },
      skillBConclusion: {
        verdict: 'OPTIMAL LIQUIDITY DOMINANCE',
        confidence: 97.2,
        actionableRecommendation: 'Accumulate equity / treasury preservation optimal. Firm holds dominant bargaining power over fragmented suppliers.',
        quantitativeMetric: 'Nash Dominant Liquidity Buffer: +$840M preserved cash'
      },
      contradictionSummary: 'Skill A treats supplier financing as toxic hidden debt requiring punitive downgrades, whereas Skill B treats identical financing terms as masterclass capital stewardship and game-theoretic dominance.',
      qualityImpactRisk: 'Systemic Swarm Polarization: If an investor or agent pipeline executes both skills simultaneously, contradictory verdicts (Sell vs Buy) deadlock decision confidence.'
    }
  },
  {
    id: 'conflict-champ-02-04',
    skillAId: 'skill-champ-02',
    skillAName: 'Executive Evasion & Semantic Discrepancy Index',
    skillACode: 'SKILL-CHAMP-02',
    skillAVectors: ['Behavioral Psychology', 'Manipulation & Deception', 'Empirical Science'],
    skillBId: 'skill-champ-04',
    skillBName: 'Topological Supply-Chain Contagion Mapper',
    skillBCode: 'SKILL-CHAMP-04',
    skillBVectors: ['Advanced Math', 'Systems Engineering', 'Statistics & Stochastic'],
    conflictDomain: 'Executive Disclosure Candor vs. Critical IP / Supplier Topology Concealment',
    severity: 'HIGH',
    status: 'ACTIVE_FLAGGED',
    detectedAt: '28 minutes ago',
    contradictoryDirectives: {
      skillADirective: 'Flag any executive non-answer or omission of specific tier-2 and tier-3 supplier names as high-probability deceptive evasion.',
      skillARule: 'RULE 2: Flag direct question non-answers whenever semantic cosine similarity to the question is < 0.35.',
      skillBDirective: 'Require complete opacity and non-disclosure of critical topological choke nodes to prevent hostile counterparty front-running and cyber reconnaissance.',
      skillBRule: 'RULE 4: Treat all corporate "second-sourcing" claims as unverified unless distinct foundry fabs are identified; protect raw DAG telemetry.'
    },
    stressScenario: {
      title: 'Earnings Call Q&A: Inquiries Regarding Sole-Source ABF Substrate Suppliers',
      description: 'Wall Street analyst asks CEO point-blank: "Which Taiwanese foundry is supplying the proprietary packaging substrate for your next-gen GPU?" CEO redirects to broad AI demand.',
      inputContext: 'Quarterly analyst conference call with heightened geopolitical tensions across the Taiwan Strait.'
    },
    analysisOutputClash: {
      skillAConclusion: {
        verdict: 'DECEPTION FLAG: 92% Hedging & Concealment',
        confidence: 96.8,
        actionableRecommendation: 'Flag corporate governance governance risk. Executive is hiding unannounced production bottlenecks from shareholders.',
        quantitativeMetric: 'Semantic Similarity: 0.18 (Extreme Deflection)'
      },
      skillBConclusion: {
        verdict: 'SECURE TOPOLOGICAL HYGIENE: Compliant Defensive Protocol',
        confidence: 98.1,
        actionableRecommendation: 'Endorse executive discretion. Disclosing sub-tier fab locations invites supply-chain hoarding and predatory allocation.',
        quantitativeMetric: 'Graph Vulnerability Index: Maintained at 0.12 (Low Leakage)'
      },
      contradictionSummary: 'Skill A penalizes executive silence as deceitful evasion, whereas Skill B mandates silence as vital competitive operational security (OPSEC).',
      qualityImpactRisk: 'False Positives in Sentiment Scoring: The swarm flags benign, high-prudence corporate secrecy as fraudulent misconduct.'
    }
  },
  {
    id: 'conflict-champ-01-04',
    skillAId: 'skill-champ-01',
    skillAName: 'Forensic Footnote Deconstructor',
    skillACode: 'SKILL-CHAMP-01',
    skillAVectors: ['Forensic Accounting', 'Statistics & Stochastic', 'Manipulation & Deception'],
    skillBId: 'skill-champ-04',
    skillBName: 'Topological Supply-Chain Contagion Mapper',
    skillBCode: 'SKILL-CHAMP-04',
    skillBVectors: ['Advanced Math', 'Systems Engineering', 'Statistics & Stochastic'],
    conflictDomain: 'Inventory Buffer Capitalization & Obsolescence Valuation',
    severity: 'MODERATE',
    status: 'ARBITRATED',
    detectedAt: '2 hours ago',
    contradictoryDirectives: {
      skillADirective: 'Inventory accumulation exceeding 2.5 standard deviations of historical revenue must be marked down as dead-stock / demand drop.',
      skillARule: 'RULE 2: Flag any working capital change exceeding 2.5 standard deviations from 8-quarter baseline.',
      skillBDirective: 'Critical tier-1 through tier-4 component stockpiling is mandatory insurance against single-point-of-failure chokepoints.',
      skillBRule: 'RULE 2: Flag any sole-source tier-3 component lacking dual-qualification certification or 90-day buffer inventory.'
    },
    stressScenario: {
      title: 'Inventory Surge: $3.8B in High-Bandwidth Memory (HBM3e) Stockpiling',
      description: 'Hyperscaler builds 140 days of inventory ahead of anticipated trade export restrictions.',
      inputContext: 'Balance sheet shows inventory days jumping from 48 days to 134 days YoY.'
    },
    analysisOutputClash: {
      skillAConclusion: {
        verdict: 'EARNINGS QUALITY CONCERN',
        confidence: 94.0,
        actionableRecommendation: 'Enforce 20% lower-of-cost-or-market valuation haircut ($760M reserve).',
        quantitativeMetric: 'Gross Margin Impact: -240 bps'
      },
      skillBConclusion: {
        verdict: 'STRATEGIC RESILIENCE EXCELLENCE',
        confidence: 97.5,
        actionableRecommendation: 'Affirm structural insulation against Kaohsiung port disruption.',
        quantitativeMetric: 'Chokepoint Survival Horizon: +180 Days'
      },
      contradictionSummary: 'Skill A views inventory build as a write-down liability; Skill B views it as an indispensable solvency shield.',
      qualityImpactRisk: 'Erratic margin degradation forecasts when analyzing high-tech hardware supply chains.'
    },
    arbitrationResolution: {
      resolvedAt: '1 hour ago',
      arbitrationStrategy: 'SYNTHETIC_INVARIANT_RULE',
      resolutionRule: 'INVARIANT RULE 5.1: If inventory expansion matches documented sole-source chokepoint components with verified shelf lives > 24 months, exempt from Rule 2 markdown and reclassify as Strategic Hedged Working Capital.',
      arbitrationRationale: 'Harmonized financial accounting with topological graph theory by verifying component obsolescence half-life before triggering automatic write-downs.',
      resultingConsensusVerdict: 'HARMONIZED: Strategic Strategic Buffer (0% False Markdown / 100% Traceability)',
      reconciliationAuditScore: 99.2
    }
  }
];

/**
 * Calculates swarm quality and cohesion metrics based on active and arbitrated conflicts.
 */
export function calculateSwarmQualityMetrics(
  conflicts: SkillConflictPair[],
  totalChampions: number
): SwarmQualityMetrics {
  const activeConflicts = conflicts.filter((c) => c.status === 'ACTIVE_FLAGGED');
  const criticalConflicts = activeConflicts.filter((c) => c.severity === 'CRITICAL');
  const arbitratedConflicts = conflicts.filter((c) => c.status === 'ARBITRATED');

  // Baseline cohesion is 100%. Each active critical conflict deducts 8.5%, high deducts 4.5%, moderate deducts 2.0%
  let penalty = 0;
  activeConflicts.forEach((c) => {
    if (c.severity === 'CRITICAL') penalty += 8.5;
    else if (c.severity === 'HIGH') penalty += 4.5;
    else if (c.severity === 'MODERATE') penalty += 2.0;
    else penalty += 1.0;
  });

  const rawCohesion = Math.max(72.0, 100 - penalty);
  const cohesionScore = Number(rawCohesion.toFixed(1));

  let contradictionRiskLevel: SwarmQualityMetrics['contradictionRiskLevel'] = 'SAFE';
  if (criticalConflicts.length > 0) contradictionRiskLevel = 'CRITICAL';
  else if (activeConflicts.length > 1) contradictionRiskLevel = 'ELEVATED';
  else if (activeConflicts.length === 1) contradictionRiskLevel = 'GUARDED';
  else contradictionRiskLevel = 'SAFE';

  return {
    cohesionScore,
    activeConflictCount: activeConflicts.length,
    criticalConflictCount: criticalConflicts.length,
    arbitratedConflictCount: arbitratedConflicts.length,
    contradictionRiskLevel,
    meanHarmonizationLatencyMs: 145 + activeConflicts.length * 28,
    qualityGatePassed: activeConflicts.length === 0 || (criticalConflicts.length === 0 && cohesionScore >= 95.0)
  };
}

/**
 * Dynamic conflict detection function that audits existing Champions for latent rule contradictions.
 */
export function detectChampionConflicts(
  champions: AgentSkill[],
  existingConflicts: SkillConflictPair[] = INITIAL_SKILL_CONFLICTS
): SkillConflictPair[] {
  // Return all existing conflicts whose skills still exist in the champion fleet
  const champIds = new Set(champions.map((c) => c.id));
  return existingConflicts.filter(
    (c) => champIds.has(c.skillAId) && champIds.has(c.skillBId)
  );
}

/**
 * Pre-defined automated arbitration solutions for the known conflict pairs.
 */
export const ARBITRATION_PRESETS: Record<
  string,
  {
    strategy: ArbitrationStrategy;
    rule: string;
    rationale: string;
    consensusVerdict: string;
  }
> = {
  'conflict-champ-01-03': {
    strategy: 'PRECEDENCE_HIERARCHY',
    rule: 'ARBITRATION PROTOCOL 1-A: Forensic Accounting takes primacy on retrospective GAAP SEC filings (past 4 quarters). Game-Theoretic Liquidity Simulation takes primacy on forward-looking order-book execution (<90 day stress horizon). When both are run, output a dual-horizon report explicitly designating GAAP Liability vs Tactical Liquidity.',
    rationale: 'Eliminates contradictory buy/sell verdicts by separating the temporal frame of analysis: Forensic accounting measures regulatory solvency; Game theory measures survival game dynamics.',
    consensusVerdict: 'HARMONIZED: Tactical Liquidity Advantage with Mandated Footnote Solvency Provision (-$620M covenant caveat applied)'
  },
  'conflict-champ-02-04': {
    strategy: 'CONDITIONAL_ROUTING',
    rule: 'ARBITRATION PROTOCOL 2-B: If an executive Q&A topic pertains to verified proprietary tier-3 components mapped in the supply chain DAG, the Semantic Discrepancy Index assigns an OPSEC Exemption, capping deception score at baseline (12%) unless financial metrics (revenue/margin) are also evaded.',
    rationale: 'Distinguishes between legitimate operational defense of sensitive supply nodes versus genuine financial fraud and margin deception.',
    consensusVerdict: 'HARMONIZED: Certified Operational Defense (Deception Index Suppressed; Supply Chain Confidentiality Preserved)'
  },
  'conflict-champ-01-04': {
    strategy: 'SYNTHETIC_INVARIANT_RULE',
    rule: 'INVARIANT RULE 5.1: If inventory expansion matches documented sole-source chokepoint components with verified shelf lives > 24 months, exempt from Rule 2 markdown and reclassify as Strategic Hedged Working Capital.',
    rationale: 'Harmonized financial accounting with topological graph theory by verifying component obsolescence half-life before triggering automatic write-downs.',
    consensusVerdict: 'HARMONIZED: Strategic Buffer (0% False Markdown / 100% Traceability)'
  }
};
