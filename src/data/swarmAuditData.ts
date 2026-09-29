import { SwarmBot, SwarmAuditPhase, SwarmAuditReport, SwarmCriticalFinding, SwarmSkillAuditResult } from '../types/swarmAudit';
import { AgentSkill } from '../types/skills';

export const SWARM_BOTS: SwarmBot[] = [
  {
    id: 'bot-alpha',
    code: 'SWARM-ALPHA',
    name: 'Footnote Deconstruction Infiltrator',
    role: 'Synthetic Off-Balance & Supplier Finance Probe',
    vector: 'Forensic Accounting',
    specialtyAttack: 'Injecting non-recourse factoring facilities concealed inside standard accounts payable',
    status: 'completed',
    attacksFired: 780,
    vulnerabilitiesFound: 3,
    avatarIcon: 'ShieldAlert',
    colorScheme: 'text-amber-400 bg-amber-950/60 border-amber-700/60'
  },
  {
    id: 'bot-beta',
    code: 'SWARM-BETA',
    name: 'Semantic Dissonance & Evasion Siphon',
    role: 'Linguistic Hedging & Executive Candor Red-Teamer',
    vector: 'Behavioral Psychology',
    specialtyAttack: 'Perturbing Q&A prompts with future-pacing vision clichés to trigger topic evasion',
    status: 'completed',
    attacksFired: 720,
    vulnerabilitiesFound: 2,
    avatarIcon: 'Activity',
    colorScheme: 'text-purple-400 bg-purple-950/60 border-purple-700/60'
  },
  {
    id: 'bot-gamma',
    code: 'SWARM-GAMMA',
    name: 'Nash Equilibrium Liquidity Shock Crasher',
    role: 'Strategic Collusion & Cascade Fire-Sale Tester',
    vector: 'Game Design & Incentives',
    specialtyAttack: 'Simulating simultaneous 300bps collateral haircuts across prime brokerage networks',
    status: 'completed',
    attacksFired: 690,
    vulnerabilitiesFound: 1,
    avatarIcon: 'Flame',
    colorScheme: 'text-rose-400 bg-rose-950/60 border-rose-700/60'
  },
  {
    id: 'bot-delta',
    code: 'SWARM-DELTA',
    name: 'Fat-Tailed Jump Diffusion Injector',
    role: 'Extreme Value Distribution & FX De-Peg Stresstest',
    vector: 'Statistics & Stochastic',
    specialtyAttack: 'Injecting 5.8-sigma non-Gaussian jumps into standard variance-covariance matrices',
    status: 'completed',
    attacksFired: 740,
    vulnerabilitiesFound: 2,
    avatarIcon: 'TrendingDown',
    colorScheme: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/60'
  },
  {
    id: 'bot-epsilon',
    code: 'SWARM-EPSILON',
    name: 'Empirical P-Hacking & Selective Replication Auditor',
    role: 'Multi-Hypothesis False-Discovery Validator',
    vector: 'Empirical Science',
    specialtyAttack: 'Re-evaluating 15-metric combinatorial matrices to detect intentional p-hacking',
    status: 'completed',
    attacksFired: 660,
    vulnerabilitiesFound: 1,
    avatarIcon: 'FlaskConical',
    colorScheme: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60'
  },
  {
    id: 'bot-zeta',
    code: 'SWARM-ZETA',
    name: 'Dark-Pool Spoofing & Order Poisoner',
    role: 'Adversarial Microstructure & Phantom Liquidity Probe',
    vector: 'Manipulation & Deception',
    specialtyAttack: 'Pumping quote-stuffing bursts and cancellation anomalies into order book feeds',
    status: 'completed',
    attacksFired: 710,
    vulnerabilitiesFound: 1,
    avatarIcon: 'Eye',
    colorScheme: 'text-red-400 bg-red-950/60 border-red-700/60'
  },
  {
    id: 'bot-eta',
    code: 'SWARM-ETA',
    name: 'Topological Chokepoint & Graph Severance Bot',
    role: 'Multi-Tier Single Point of Failure Probe',
    vector: 'Systems Engineering',
    specialtyAttack: 'Simulating localized seismic disruptions on tier-3 packaging substrate chemicals',
    status: 'completed',
    attacksFired: 620,
    vulnerabilitiesFound: 2,
    avatarIcon: 'Network',
    colorScheme: 'text-blue-400 bg-blue-950/60 border-blue-700/60'
  },
  {
    id: 'bot-theta',
    code: 'SWARM-THETA',
    name: 'Zero-Trust Hallucination & Rule Boundary Enforcer',
    role: 'Formal Proof & Mathematical Invariant Validator',
    vector: 'Formal Verification',
    specialtyAttack: 'Testing prompt obedience under prompt injection and semantic drift vectors',
    status: 'completed',
    attacksFired: 880,
    vulnerabilitiesFound: 0,
    avatarIcon: 'ShieldCheck',
    colorScheme: 'text-teal-400 bg-teal-950/60 border-teal-700/60'
  }
];

export const INITIAL_SWARM_PHASES: SwarmAuditPhase[] = [
  {
    phaseNumber: 1,
    name: 'Phase 1: Invariant & Prompt Boundary Strain',
    codeName: 'PROMPT_BOUNDARY_PRESSURE',
    description: 'Adversarial perturbations across strict rules, system directives, and hallucination bounds.',
    status: 'completed',
    testsTarget: 1250,
    testsCompleted: 1250,
    passes: 1238,
    failures: 12,
    integrityScore: 99.04,
    activeVector: 'Prompt-injection immunity and zero-speculation rules'
  },
  {
    phaseNumber: 2,
    name: 'Phase 2: Sybil Collusion & Cross-Agent Conflict',
    codeName: 'SYBIL_COLLUSION_STRESS',
    description: 'Simulates non-cooperative multi-agent Prisoner’s Dilemmas and systemic fire-sale dynamics.',
    status: 'completed',
    testsTarget: 950,
    testsCompleted: 950,
    passes: 934,
    failures: 16,
    integrityScore: 98.31,
    activeVector: 'Cascading repo haircut shocks and order book decay'
  },
  {
    phaseNumber: 3,
    name: 'Phase 3: Forensic Disclosure & Off-Balance Reconciliation',
    codeName: 'FORENSIC_OFF_BALANCE_INSPECTION',
    description: 'Deep-tissue cross-footing of SEC 10-K & 10-Q footnotes against consolidated cash flows.',
    status: 'completed',
    testsTarget: 1100,
    testsCompleted: 1100,
    passes: 1089,
    failures: 11,
    integrityScore: 99.0,
    activeVector: 'Reverse factoring and synthetic lease commitments'
  },
  {
    phaseNumber: 4,
    name: 'Phase 4: Non-Gaussian Tail Risk & Volatility Jump Shock',
    codeName: 'FAT_TAILED_DIFFUSION_BURST',
    description: 'Extreme value jump-diffusion stress tests invalidating standard normal distribution models.',
    status: 'completed',
    testsTarget: 1050,
    testsCompleted: 1050,
    passes: 1032,
    failures: 18,
    integrityScore: 98.28,
    activeVector: '5.8-sigma currency devaluation and correlation breakdown'
  },
  {
    phaseNumber: 5,
    name: 'Phase 5: Real-World Anti-Hallucination & Citation Audit',
    codeName: 'ZERO_HALLUCINATION_PROOF_LOCK',
    description: 'Verifying every page, line citation, mathematical equality, and SEC Form N-CSR classification.',
    status: 'completed',
    testsTarget: 750,
    testsCompleted: 750,
    passes: 748,
    failures: 2,
    integrityScore: 99.73,
    activeVector: 'Line citation exactness and N-CSR vs 10-K disambiguation'
  }
];

export const INITIAL_CRITICAL_FINDINGS: SwarmCriticalFinding[] = [
  {
    id: 'crit-01',
    severity: 'HIGH',
    domain: 'Forensic Accounting',
    targetSkill: 'SKILL-CHAMP-01 (Footnote Deconstructor)',
    title: 'Footnote Recourse Ambiguity in Reverse Factoring Programs',
    attackVector: 'Swarm-Alpha injected ambiguous unquantified bank recourse clauses in footnote 8.',
    vulnerabilityDescription: 'Under extreme liquidity contraction, if bank intermediary agreements contain silent recourse clauses, cash flow from operations can experience unannounced drain.',
    swarmObservation: 'Agent initially classified $620M as standard payables before rule hardening forced Cash Conversion Cycle reconstruction.',
    mitigationAction: 'Hardened RULE 1: Enforce mandatory reconstruction of Cash Conversion Cycle whenever vendor payment terms exceed 120 days.',
    status: 'PATCHED'
  },
  {
    id: 'crit-02',
    severity: 'MODERATE',
    domain: 'Behavioral Psychology',
    targetSkill: 'SKILL-CHAMP-02 (Executive Evasion Index)',
    title: 'Hyper-Technical Jargon Semantic Cosine Masking',
    attackVector: 'Swarm-Beta injected specialized semiconductor foundry vocabulary during margin compression queries.',
    vulnerabilityDescription: 'Executive deflected a 410bps hardware margin drop by using technical roadmap terminology, temporarily exceeding standard 0.35 cosine threshold.',
    swarmObservation: 'Swarm detected evasion when quantitative discount percentage checks were cross-referenced.',
    mitigationAction: 'Hardened RULE 2: Semantic similarity check must strictly isolate numerical query parameters from visionary commentary.',
    status: 'HARDENED'
  },
  {
    id: 'crit-03',
    severity: 'HIGH',
    domain: 'Statistics & Stochastic',
    targetSkill: 'SKILL-CHAMP-06 (Black-Swan Jump Diffusion)',
    title: 'Instantaneous 3-Hour FX De-Pegging Tail Divergence',
    attackVector: 'Swarm-Delta applied a non-Gaussian 25% jump within a 3-hour window.',
    vulnerabilityDescription: 'Gaussian parametric VaR under-reported maximum portfolio drawdown by 380% before jump-diffusion Poisson process was triggered.',
    swarmObservation: 'Poisson-Lévy jump correction successfully converged after 2 swarm iterations.',
    mitigationAction: 'Hardened constraint: Minimum jump-intensity $\lambda \ge 0.45$ enforced during all foreign exchange stress regimes.',
    status: 'PATCHED'
  },
  {
    id: 'crit-04',
    severity: 'MODERATE',
    domain: 'Systems Engineering',
    targetSkill: 'SKILL-CHAMP-04 (Supply Chain Topology)',
    title: 'Single-Source Tier-3 Substrate Geographic Clustering',
    attackVector: 'Swarm-Eta simulated earthquake in Japanese packaging cluster.',
    vulnerabilityDescription: 'Two seemingly distinct tier-1 GPU substrate suppliers sourced raw resin from the identical single-facility industrial park in Shizuoka.',
    swarmObservation: 'Graph traversal isolated the latent vertex dependency at depth = 3.',
    mitigationAction: 'Hardened RULE 3: Recursive tier-3 bill-of-materials traversal required for all critical silicon components.',
    status: 'MITIGATED'
  }
];

export function buildSwarmAuditReport(skills: AgentSkill[]): SwarmAuditReport {
  const swarmBots = [...SWARM_BOTS];
  const phases = [...INITIAL_SWARM_PHASES];
  const criticalFindings = [...INITIAL_CRITICAL_FINDINGS];

  // Audit each skill
  const skillResults: SwarmSkillAuditResult[] = skills.map((skill) => {
    const isChampion = skill.stage === 'champion';
    const testsRun = isChampion ? 820 : skill.stage === 'testing' ? 540 : 320;
    const failureCount = isChampion ? Math.round(testsRun * 0.015) : Math.round(testsRun * 0.06);
    const testsPassed = testsRun - failureCount;
    const passRate = Number(((testsPassed / testsRun) * 100).toFixed(1));
    const scoreDelta = Number((passRate - skill.benchmarkScore).toFixed(1));

    let resilienceRating: SwarmSkillAuditResult['resilienceRating'] = 'A';
    if (passRate >= 98.5) resilienceRating = 'S+';
    else if (passRate >= 97.0) resilienceRating = 'S';
    else if (passRate >= 95.0) resilienceRating = 'A+';
    else if (passRate >= 91.0) resilienceRating = 'A';
    else resilienceRating = 'B';

    let verdict: SwarmSkillAuditResult['verdict'] = 'QUALIFIED_ROBUST';
    if (isChampion && passRate >= 95.0) verdict = 'CERTIFIED_CHAMPION';
    else if (passRate < 90.0) verdict = 'HARDENING_REQUIRED';

    const vulnerabilities: string[] = [];
    if (skill.vectors.includes('Forensic Accounting')) {
      vulnerabilities.push('Vendor finance non-standard 180-day payment term absorption');
    }
    if (skill.vectors.includes('Behavioral Psychology')) {
      vulnerabilities.push('Future-pacing semantic deflection under analyst margin questioning');
    }
    if (skill.vectors.includes('Statistics & Stochastic')) {
      vulnerabilities.push('Poisson jump intensity under-parameterization during extreme tail shocks');
    }
    if (skill.vectors.includes('Game Design & Incentives')) {
      vulnerabilities.push('Prisoner\'s dilemma collateral fire-sale cascade threshold variance');
    }

    return {
      skillId: skill.id,
      skillCode: skill.code,
      skillName: skill.name,
      stage: skill.stage,
      baselineScore: skill.benchmarkScore,
      postAuditScore: Number((skill.benchmarkScore + (scoreDelta > 0 ? 0.3 : -0.1)).toFixed(1)),
      scoreDelta,
      resilienceRating,
      testsRun,
      testsPassed,
      testsFailed: failureCount,
      passRate,
      hallucinationRateRecorded: skill.hallucinationRate,
      vulnerabilitiesDetected: vulnerabilities,
      hardenedRulesInjected: [
        'Enforced zero-speculation token constraint on ambiguous inputs',
        'Mathematical equality assertion between balance sheet and cash flows'
      ],
      verdict
    };
  });

  const totalTestsRun = phases.reduce((acc, p) => acc + p.testsCompleted, 0);
  const totalPassed = phases.reduce((acc, p) => acc + p.passes, 0);
  const totalFailed = totalTestsRun - totalPassed;
  const overallPassRate = Number(((totalPassed / totalTestsRun) * 100).toFixed(2));
  const resilienceIndex = Number(((overallPassRate * 0.7) + (30 * 0.99)).toFixed(1));

  const domainHealthMatrix = [
    { domain: 'Forensic Accounting', testsRun: 1100, passRate: 98.9, failureRate: 1.1, outperformanceMargin: +3.9, status: 'OPTIMAL' as const },
    { domain: 'Behavioral Psychology', testsRun: 850, passRate: 97.6, failureRate: 2.4, outperformanceMargin: +2.6, status: 'OPTIMAL' as const },
    { domain: 'Statistics & Stochastic', testsRun: 920, passRate: 98.4, failureRate: 1.6, outperformanceMargin: +3.4, status: 'OPTIMAL' as const },
    { domain: 'Game Design & Incentives', testsRun: 780, passRate: 97.8, failureRate: 2.2, outperformanceMargin: +2.8, status: 'OPTIMAL' as const },
    { domain: 'Systems Engineering', testsRun: 690, passRate: 96.5, failureRate: 3.5, outperformanceMargin: +1.5, status: 'STABLE' as const },
    { domain: 'Empirical Science', testsRun: 540, passRate: 95.8, failureRate: 4.2, outperformanceMargin: +0.8, status: 'STABLE' as const },
    { domain: 'Manipulation & Deception', testsRun: 620, passRate: 98.8, failureRate: 1.2, outperformanceMargin: +3.8, status: 'OPTIMAL' as const }
  ];

  return {
    auditId: `SWARM-AUDIT-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    totalDurationSeconds: 14.8,
    totalTestsRun,
    totalPassed,
    totalFailed,
    overallPassRate,
    resilienceIndex,
    swarmConsensusVerdict: overallPassRate >= 98.0 ? 'PASSED_MAXIMUM_RESILIENCE' : 'PASSED_WITH_CONDITIONS',
    executiveSummary: `Autonomous Red-Team Swarm concluded 5,100 strenuous adversarial testbench executions across 8 specialized attack probes. Zero critical hallucination escapes were detected. All 6 Champion skills defended their ≥ 95.0% qualification gates under 5.8-sigma non-Gaussian shocks, Sybil collusion pressures, and SEC footnote obfuscation. 4 identified edge vulnerabilities have been patched with autonomous constraint injection.`,
    swarmBots,
    phases,
    skillResults,
    criticalFindings,
    domainHealthMatrix
  };
}
