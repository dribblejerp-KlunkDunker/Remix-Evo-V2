import {
  AgentPersonalityHyperparameters,
  PersonalityArchetypePreset,
  EvolutionTrajectoryPoint,
  SimulatedGenerationStep,
  SimulationRunResult
} from '../types/skills';

export const DEFAULT_HYPERPARAMETERS: AgentPersonalityHyperparameters = {
  riskAversion: 65,
  creativity: 60,
  logicBias: 85,
  adversarialParanoia: 75,
  psychologicalEmpathy: 60,
  mutationEntropy: 40
};

export const PERSONALITY_PRESETS: PersonalityArchetypePreset[] = [
  {
    id: 'forensic-skeptic',
    name: 'Forensic Skeptic',
    tagline: 'High-rigor footnote deconstruction with zero tolerance for executive evasion',
    iconName: 'ShieldAlert',
    colorScheme: 'purple',
    params: {
      riskAversion: 88,
      creativity: 30,
      logicBias: 96,
      adversarialParanoia: 92,
      psychologicalEmpathy: 45,
      mutationEntropy: 22
    },
    description:
      'Engineered for maximum survivability against hostile disclosures, deceptive accounting, and hidden related-party debt. Relies on double-entry validation rather than creative leaps.',
    bestFitScenario: 'SEC 10-K Footnote Audit & Pro-Forma EBITDA Reconciliation'
  },
  {
    id: 'radical-synthesizer',
    name: 'Radical Synthesizer',
    tagline: 'High-divergence lateral explorer hunting non-linear macro anomalies',
    iconName: 'Sparkles',
    colorScheme: 'amber',
    params: {
      riskAversion: 22,
      creativity: 94,
      logicBias: 64,
      adversarialParanoia: 38,
      psychologicalEmpathy: 80,
      mutationEntropy: 85
    },
    description:
      'Aggressively recombines disparate vectors (e.g. supply chain topology + micro-acoustic linguistics). Highly volatile with elevated extinction risk, but possesses the highest ceiling for breakthrough insights.',
    bestFitScenario: 'Unsupervised Multi-Vector Contagion & Novel Deception Vectors'
  },
  {
    id: 'axiomatic-formalist',
    name: 'Axiomatic Formalist',
    tagline: 'Deterministic mathematical proof chains and invariant enforcement',
    iconName: 'Cpu',
    colorScheme: 'cyan',
    params: {
      riskAversion: 96,
      creativity: 18,
      logicBias: 98,
      adversarialParanoia: 70,
      psychologicalEmpathy: 18,
      mutationEntropy: 14
    },
    description:
      'Eliminates hallucination entirely through symbolic proofs and zero-trust invariant checks. Steady, monotonic evolutionary convergence with near-zero mutation drift.',
    bestFitScenario: 'Prime Brokerage Margin Sweeps & Liquidity Waterfall Verification'
  },
  {
    id: 'behavioral-game-theorist',
    name: 'Behavioral Game-Theorist',
    tagline: 'Theory-of-Mind psychological modeling and Nash equilibrium stress testing',
    iconName: 'Flame',
    colorScheme: 'emerald',
    params: {
      riskAversion: 52,
      creativity: 72,
      logicBias: 86,
      adversarialParanoia: 84,
      psychologicalEmpathy: 94,
      mutationEntropy: 46
    },
    description:
      'Models human cognitive biases, executive acoustic hedging, and counterparty game-theoretic traps. Balanced risk-reward with high resilience against social manipulation.',
    bestFitScenario: 'Executive Q&A Acoustic Discordance & Hostile Analyst Deflection'
  },
  {
    id: 'adversarial-red-teamer',
    name: 'Adversarial Red-Teamer',
    tagline: 'Zero-trust counterparty attack simulation and deceptive trap detection',
    iconName: 'Zap',
    colorScheme: 'rose',
    params: {
      riskAversion: 40,
      creativity: 82,
      logicBias: 84,
      adversarialParanoia: 98,
      psychologicalEmpathy: 62,
      mutationEntropy: 68
    },
    description:
      'Assumes all input data is adversarial, manipulated, or actively concealed. Proactively probes edge cases and synthetically manufactures counterfactual attacks to expose brittle rules.',
    bestFitScenario: 'Collateral Rehypothecation Cycles & Obfuscated SPV Structures'
  },
  {
    id: 'balanced-champion',
    name: 'Balanced Champion Standard',
    tagline: 'Pareto-optimal genetic baseline tuned for sustained ≥95% qualification',
    iconName: 'Trophy',
    colorScheme: 'emerald',
    params: {
      riskAversion: 70,
      creativity: 58,
      logicBias: 88,
      adversarialParanoia: 76,
      psychologicalEmpathy: 64,
      mutationEntropy: 35
    },
    description:
      'Calibrated for optimal trade-off between exploratory prompt mutation and rock-solid deterministic rule compliance. Proven to meet active Champion requirements with minimal regression.',
    bestFitScenario: 'Cross-Vector Autonomous Reasoning across all 9 Specialist Arenas'
  }
];

export interface TrajectoryProjectionAnalysis {
  trajectory: EvolutionTrajectoryPoint[];
  estimatedGenToChampion: number | null;
  peakScore: number;
  catastrophicDriftRisk: number; // percentage
  stabilityIndex: number; // percentage
  hallucinationRisk: number; // percentage
  extinctionProbability: number; // percentage
  convergenceVelocity: 'Rapid' | 'Steady' | 'Sluggish' | 'Divergent';
  archetypeClassification: string;
  recommendedVectors: string[];
  promptGenomeSnippet: {
    systemDirective: string;
    reasoningFramework: string;
    adversarialConstraint: string;
    mutationSignature: string;
  };
}

/**
 * Real-time mathematical projection of an agent's evolution trajectory across generations 0 through 10
 */
export function calculateEvolutionTrajectory(
  params: AgentPersonalityHyperparameters
): TrajectoryProjectionAnalysis {
  const {
    riskAversion,
    creativity,
    logicBias,
    adversarialParanoia,
    psychologicalEmpathy,
    mutationEntropy
  } = params;

  // Baseline starting score at Gen 0 (Idea phase baseline)
  // Higher logic and risk-aversion gives a more solid start; high entropy causes noisier start
  const baseStart = Number(
    (
      68.0 +
      logicBias * 0.11 +
      riskAversion * 0.06 +
      adversarialParanoia * 0.04 -
      mutationEntropy * 0.08
    ).toFixed(1)
  );

  // Ceiling based on cognitive balance
  // High logic + moderate-to-high creativity enables breakthroughs; high paranoia raises adversarial ceiling
  const rawCeiling =
    86.0 +
    logicBias * 0.085 +
    creativity * 0.045 +
    adversarialParanoia * 0.035 +
    psychologicalEmpathy * 0.02 -
    (mutationEntropy > 75 && riskAversion < 35 ? 3.5 : 0);
  const peakCeiling = Number(Math.min(99.6, Math.max(82.0, rawCeiling)).toFixed(1));

  // Velocity per generation: driven by creativity + logic, moderated by risk-aversion
  const explorationPower = (creativity / 100) * 0.9 + (mutationEntropy / 100) * 0.7;
  const exploitationPower = (logicBias / 100) * 1.1 + (riskAversion / 100) * 0.5;
  const velocityK = 0.38 + explorationPower * 0.18 + exploitationPower * 0.12;

  // Volatility / uncertainty width envelope
  // Low risk aversion + high mutation entropy = massive confidence envelope (high variance)
  const envelopeVariance = Number(
    (
      (100 - riskAversion) * 0.065 +
      mutationEntropy * 0.085 +
      creativity * 0.03
    ).toFixed(1)
  );

  const trajectory: EvolutionTrajectoryPoint[] = [];
  let championGen: number | null = null;

  for (let gen = 0; gen <= 10; gen++) {
    // S-curve / asymptotic convergence formula with dynamic parameters
    const progress = 1 - Math.exp(-velocityK * (gen * 0.65));
    let meanScore = baseStart + (peakCeiling - baseStart) * progress;

    // Apply mutation entropy turbulence
    // High mutation entropy causes slight non-monotonic waviness
    const wave = Math.sin(gen * 1.35) * (mutationEntropy / 100) * 1.6;
    // Risk aversion damping reduces the wave amplitude
    const dampedWave = wave * (1 - riskAversion / 120);
    meanScore = Math.min(peakCeiling, Math.max(baseStart, meanScore + dampedWave));

    // Dynamic uncertainty bounds
    const currentUncertainty = Math.max(
      1.2,
      envelopeVariance * Math.sin(Math.min(Math.PI, (gen / 10) * Math.PI + 0.3))
    );

    const projectedScore = Number(meanScore.toFixed(1));
    const upperBound = Number(Math.min(99.8, meanScore + currentUncertainty).toFixed(1));
    const lowerBound = Number(Math.max(60.0, meanScore - currentUncertainty).toFixed(1));

    // Baseline reference: a standard 50/50 generic agent
    const baselineProgress = 1 - Math.exp(-0.45 * (gen * 0.6));
    const baselineScore = Number((72.0 + (93.5 - 72.0) * baselineProgress).toFixed(1));

    if (projectedScore >= 95.0 && championGen === null) {
      championGen = gen;
    }

    trajectory.push({
      generation: gen,
      label: gen === 0 ? 'Gen 0 (Seed)' : `Gen ${gen}`,
      projectedScore,
      upperBound,
      lowerBound,
      baselineScore,
      championThreshold: 95.0,
      volatility: Number(currentUncertainty.toFixed(1)),
      mutationDrift: Number(((mutationEntropy / 100) * (gen * 2.8)).toFixed(1))
    });
  }

  // Key KPI calculations
  const catastrophicDriftRisk = Number(
    Math.min(
      94.0,
      Math.max(
        2.5,
        (mutationEntropy * 0.65 + (100 - riskAversion) * 0.45 - logicBias * 0.25)
      )
    ).toFixed(1)
  );

  const stabilityIndex = Number(
    Math.min(
      99.5,
      Math.max(
        35.0,
        (riskAversion * 0.45 + logicBias * 0.45 - mutationEntropy * 0.25)
      )
    ).toFixed(1)
  );

  const hallucinationRisk = Number(
    Math.max(
      0.0,
      (
        ((100 - logicBias) * 0.45 +
          creativity * 0.35 +
          (100 - riskAversion) * 0.25 -
          adversarialParanoia * 0.3) /
        15
      )
    ).toFixed(1)
  );

  const extinctionProbability = Number(
    Math.max(
      1.0,
      (
        catastrophicDriftRisk * 0.65 +
        (100 - stabilityIndex) * 0.35 -
        (logicBias > 90 ? 10 : 0)
      )
    ).toFixed(1)
  );

  let convergenceVelocity: 'Rapid' | 'Steady' | 'Sluggish' | 'Divergent' = 'Steady';
  if (championGen !== null && championGen <= 3) {
    convergenceVelocity = 'Rapid';
  } else if (championGen !== null && championGen <= 6) {
    convergenceVelocity = 'Steady';
  } else if (championGen !== null) {
    convergenceVelocity = 'Sluggish';
  } else {
    convergenceVelocity = 'Divergent';
  }

  // Determine personality archetype classification name
  let archetypeClassification = 'Adaptive Specialist';
  if (logicBias >= 90 && riskAversion >= 80) {
    archetypeClassification = 'Hyper-Rigorous Axiomatic Champion';
  } else if (adversarialParanoia >= 85 && logicBias >= 80) {
    archetypeClassification = 'Adversarial Zero-Trust Red-Teamer';
  } else if (creativity >= 85 && mutationEntropy >= 70) {
    archetypeClassification = 'Volatile Exploratory Synthesizer';
  } else if (psychologicalEmpathy >= 85 && adversarialParanoia >= 75) {
    archetypeClassification = 'Behavioral Deception & Game-Theorist';
  } else if (riskAversion >= 85 && creativity <= 35) {
    archetypeClassification = 'Conservative Forensic Auditor';
  } else {
    archetypeClassification = 'Balanced Stochastic Genetic Champion';
  }

  // Recommend vectors based on hyper-parameters
  const recVectors: string[] = [];
  if (logicBias >= 80) recVectors.push('Advanced Math', 'Systems Engineering');
  if (adversarialParanoia >= 75) recVectors.push('Manipulation & Deception');
  if (psychologicalEmpathy >= 75) recVectors.push('Behavioral Psychology');
  if (riskAversion >= 80) recVectors.push('Forensic Accounting');
  if (creativity >= 75) recVectors.push('Game Design & Incentives', 'Empirical Science');
  if (recVectors.length === 0) recVectors.push('Statistics & Stochastic');

  // Generate dynamic Prompt Genome Snippet reflecting the exact parameters
  const promptGenomeSnippet = generateDynamicPromptGenome(params);

  return {
    trajectory,
    estimatedGenToChampion: championGen,
    peakScore: peakCeiling,
    catastrophicDriftRisk,
    stabilityIndex,
    hallucinationRisk,
    extinctionProbability,
    convergenceVelocity,
    archetypeClassification,
    recommendedVectors: Array.from(new Set(recVectors)).slice(0, 3),
    promptGenomeSnippet
  };
}

/**
 * Synthesizes the live system directive, reasoning framework, and constraints
 * reflecting the exact hyper-parameter state
 */
function generateDynamicPromptGenome(params: AgentPersonalityHyperparameters): {
  systemDirective: string;
  reasoningFramework: string;
  adversarialConstraint: string;
  mutationSignature: string;
} {
  const {
    riskAversion,
    creativity,
    logicBias,
    adversarialParanoia,
    psychologicalEmpathy,
    mutationEntropy
  } = params;

  let directiveCore = '';
  if (riskAversion >= 75) {
    directiveCore +=
      'Enforce strict zero-speculation mandate. Require dual-source deterministic verification for every quantitative assertion. Never extrapolate beyond stated boundaries.';
  } else if (riskAversion <= 35) {
    directiveCore +=
      'Operate in high-entropy exploratory mode. Actively generate bold counter-hypotheses and speculative outlier mappings across multi-hop inference chains.';
  } else {
    directiveCore +=
      'Balance hypothesis exploration against verified empirical bounds. Flag uncertainty intervals explicitly without discarding high-conviction signals.';
  }

  if (logicBias >= 80) {
    directiveCore +=
      ' Structure all deductive sequences into axiomatic formal proof steps (Invariant -> Deduction -> Empirical Cross-Check).';
  }

  let reasoningFramework = '';
  if (adversarialParanoia >= 80) {
    reasoningFramework =
      'Zero-Trust Adversarial Invariance: Assume all incoming disclosures have been intentionally obfuscated or curated. Cross-reference stated non-GAAP reconciliations against balance-sheet footnote drift.';
  } else if (psychologicalEmpathy >= 75) {
    reasoningFramework =
      'Theory-of-Mind & Cognitive Hedging: Analyze management vocal cadence, pronoun dissociation, and passive deflection. Quantify executive conviction discordance against quarterly guidance.';
  } else if (creativity >= 75) {
    reasoningFramework =
      'Lateral Stochastic Synthesis: Recombine non-obvious topological vectors across disparate regulatory datasets, patent filing clusters, and liquidity sweep records.';
  } else {
    reasoningFramework =
      'Bayesian Forensic Triangulation: Update probabilistic priors as new ledger entries and counterparty trade signals arrive. Reject narrative smoothing.';
  }

  let adversarialConstraint = '';
  if (mutationEntropy >= 70) {
    adversarialConstraint =
      'High Genomic Plasticity (Entropy: ' +
      mutationEntropy +
      '%): Allow prompt genome rules to undergo stochastic crossover during iterative stress passes, pruning stagnant heuristics aggressively.';
  } else if (mutationEntropy <= 30) {
    adversarialConstraint =
      'Prompt Genome Invariance Lock (Entropy: ' +
      mutationEntropy +
      '%): Restrict mutations to micro-threshold calibrations. Reject macro syntax restructuring to preserve rock-solid reproducibility.';
  } else {
    adversarialConstraint =
      'Targeted Hyper-parameter Annealing (Entropy: ' +
      mutationEntropy +
      '%): Calibrate rule coefficients monotonically while maintaining core constitutional guardrails.';
  }

  const mutationSignature = `GENOME-[R${riskAversion}|C${creativity}|L${logicBias}|P${adversarialParanoia}|E${psychologicalEmpathy}|M${mutationEntropy}]`;

  return {
    systemDirective: directiveCore,
    reasoningFramework,
    adversarialConstraint,
    mutationSignature
  };
}

/**
 * Simulates a multi-generation Monte Carlo evolution run for the given personality hyper-parameters
 */
export function simulateMonteCarloRun(
  params: AgentPersonalityHyperparameters,
  agentName = 'Simulated Agent Persona'
): SimulationRunResult {
  const analysis = calculateEvolutionTrajectory(params);
  const steps: SimulatedGenerationStep[] = [];
  const runId = `RUN-SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const stressScenarios = [
    'Obfuscated Off-Balance-Sheet SPV Debt in 10-K Footnote 14',
    'Acoustic Pitch Shift & Hedging during Emergency Margin Deflection Call',
    'Adversarial Sybil Manipulation of Liquidity Swaps in Prime Brokerage Pool',
    'Executive Pronoun Dissociation ("I" -> "We") under Contentious Audit Questioning',
    'Vendor Financing Circular Revenue Round-Tripping through Offshore Subsidies',
    'Non-GAAP EBITDA Add-Back Elasticity Stress under 400bps Cost Shock',
    'Uncorrelated Liquidity Sweep across Tri-Party Repo Collateral Waterfall',
    'Contradictory Working Capital Footnotes vs Direct Statement of Cash Flows',
    'AI Multi-Year Platform Narrative Overselling vs Capitalized R&D Realities',
    'Synthetically Poisoned Red-Team Prompt Attempting Rule Invariant Bypass'
  ];

  const mutationTypes = [
    'Axiomatic Invariant Enforcement',
    'Adversarial S-Box Scrambler',
    'Pareto Crossover with Forensic Seed',
    'Linguistic Hedging Penalty Weighting',
    'Stochastic Prompt Rewriting',
    'Zero-Knowledge Verifier Injection',
    'Contagion Topology Recombination',
    'Cognitive Bias Decoupling',
    'Counterfactual Stress Calibration',
    'Final Champion Threshold Hardening'
  ];

  let currentScore = analysis.trajectory[0].projectedScore;
  let reachedChampion = false;
  let championGen: number | undefined = undefined;

  for (let g = 1; g <= 8; g++) {
    const trajectoryPoint = analysis.trajectory[g];
    // Add small random noise bounded by volatility
    const noise = (Math.random() - 0.45) * (trajectoryPoint.volatility * 0.4);
    let stepScore = Number((trajectoryPoint.projectedScore + noise).toFixed(1));
    stepScore = Math.min(99.6, Math.max(65.0, stepScore));
    const delta = Number((stepScore - currentScore).toFixed(1));
    currentScore = stepScore;

    const isPassed = stepScore >= 90.0;
    const isWarn = stepScore < 90.0 && stepScore >= 82.0;
    const verdict: 'PASS' | 'WARN' | 'FAIL' = isPassed ? 'PASS' : isWarn ? 'WARN' : 'FAIL';

    if (stepScore >= 95.0 && !reachedChampion) {
      reachedChampion = true;
      championGen = g;
    }

    const scenario = stressScenarios[(g - 1) % stressScenarios.length];
    const mutationType = mutationTypes[(g - 1) % mutationTypes.length];

    let ruleAddedOrModified = '';
    if (params.logicBias >= 85) {
      ruleAddedOrModified = `Enforce Boolean Assertion [Rule #${g + 12}]: Require zero discrepancy on ${scenario.split(' ')[0]} reconciliation.`;
    } else if (params.adversarialParanoia >= 80) {
      ruleAddedOrModified = `Adversarial Constraint [Rule #${g + 8}]: Mark counterparty statement as deceptive until third-party settlement matches.`;
    } else if (params.creativity >= 75) {
      ruleAddedOrModified = `Lateral Invariant [Rule #${g + 5}]: Cross-pollinate secondary semantic embeddings with supply chain delivery latency.`;
    } else {
      ruleAddedOrModified = `Standard Gate [Rule #${g + 3}]: Threshold verification upgraded to ${stepScore.toFixed(1)}% benchmark compliance.`;
    }

    steps.push({
      generation: g,
      score: stepScore,
      delta,
      mutationType,
      mutationDescription: `Mutated prompt genome with ${params.mutationEntropy}% entropy rate. Applied ${mutationType} in response to ${scenario.substring(0, 38)}...`,
      stressScenario: scenario,
      verdict,
      ruleAddedOrModified,
      hallucinationRate: Number(Math.max(0.0, analysis.hallucinationRisk * (1 - g * 0.1)).toFixed(1))
    });
  }

  return {
    runId,
    agentName,
    timestamp: new Date().toLocaleTimeString(),
    hyperparameters: params,
    steps,
    reachedChampion,
    championGen,
    peakScore: Math.max(...steps.map((s) => s.score)),
    stabilityIndex: analysis.stabilityIndex,
    extinctionRisk: analysis.extinctionProbability
  };
}
