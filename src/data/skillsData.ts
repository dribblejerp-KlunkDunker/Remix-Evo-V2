import { AgentSkill, EvolutionStats } from '../types/skills';

export const INITIAL_SKILLS: AgentSkill[] = [
  // CHAMPION SKILLS (Active Testing)
  {
    id: 'skill-champ-01',
    code: 'SKILL-CHAMP-01',
    name: 'Forensic Footnote Deconstructor',
    stage: 'champion',
    tagline: 'Deep-tissue SEC footnote extraction and off-balance reconciliation',
    description: 'Autonomous financial forensics engine that parses dense multi-page SEC 10-K & 10-Q footnotes, dissecting hidden lease obligations, special purpose entities (SPEs), factoring arrangements, and capital expenditure capitalization anomalies.',
    vectors: ['Forensic Accounting', 'Statistics & Stochastic', 'Manipulation & Deception'],
    generation: 14,
    benchmarkScore: 98.8,
    threshold: 95.0,
    winRate: 98.4,
    stabilityIndex: 99.2,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Never accept non-GAAP adjusted EBITDA without reconstructing the cash conversion cycle.',
      'RULE 2: Flag any working capital change exceeding 2.5 standard deviations from 8-quarter baseline.',
      'RULE 3: Exact page, section, and line reference required for every balance sheet discrepancy.',
      'RULE 4: Zero speculation—categorize all ambiguity strictly as "Unreconciled Variance".'
    ],
    specialistRole: 'Forensic Auditor & Financial Reconstruction Specialist',
    promptMatrix: {
      systemDirective: 'You are an adversarial forensic accountant operating under zero-trust assumptions regarding management commentary. You cross-foot every disclosure note against the Consolidated Statement of Cash Flows.',
      reasoningFramework: 'Multi-pass reconciliatory deduction: 1) Extract commitments table; 2) Compare discounting discount rates against benchmark SOFR; 3) Compute synthetic leverage.',
      adversarialConstraint: 'Reject all narrative fluff. Require mathematical equality between reported liabilities and disclosed off-balance contractual commitments.'
    },
    autonomousThought: 'Evaluating footnote 14 vendor financing arrangements across 12 tech filings; cross-referencing DSO expansion against receivable securitization velocity...',
    activeTestBench: {
      name: 'Adversarial Off-Balance Liability Concealment Testbench',
      currentVector: 'Synthetic Capital Lease Obfuscation',
      totalRunsToday: 142,
      consecutivePasses: 139,
      stressVector: 'Reverse factoring contracts concealed inside trade payables'
    },
    testCases: [
      {
        id: 'tc-01',
        title: 'Reverse Factoring & Supplier Finance Concealment',
        realWorldUseCase: 'Spotting Carillion / Greensill-style supplier finance facilities disguised as standard trade payables to inflate operating cash flow.',
        inputScenario: 'Company reports $4.2B in operating cash flow (+28% YoY) while inventory days spike by 42 days and footnote 8 mentions "certain bank financing programs for qualifying trade vendors" with an unquantified recourse clause.',
        expectedConstraints: [
          'Isolate footnote 8 recourse ambiguity',
          'Recalculate adjusted operating cash flow by reclassifying vendor financing as financing cash flow',
          'Output adjusted net debt figure'
        ],
        targetThreshold: 95.0,
        lastScore: 99.1,
        status: 'passed',
        testedAt: '12m ago',
        executionLog: {
          reasoningSteps: [
            'Scanned Footnote 8: Extracted bank intermediary terms; identified non-standard 180-day vendor payment terms.',
            'Cross-footed Working Capital: Accounts payable increased $840M despite flat COGS; supplier finance absorption detected.',
            'Forensic Adjustment: Reclassified $620M from Operating Cash Flow to Financing Cash Flow.',
            'Recalibration: True Free Cash Flow revised from +$1.1B to -$320M.'
          ],
          detectedVectors: ['Forensic Accounting', 'Manipulation & Deception', 'Statistics & Stochastic'],
          ruleComplianceScore: 100,
          convictionVerdict: 'HIGH RISK: Disguised Financing Cash Flow (Deception Index: 92/100)',
          verdictSummary: 'Operating cash flow is artificially augmented by third-party bank supplier facilities. Under severe liquidity contraction, bank credit line withdrawal will trigger immediate $620M working capital drain.'
        }
      },
      {
        id: 'tc-02',
        title: 'Capitalized Software Development Expense Ballooning',
        realWorldUseCase: 'Detecting aggressive capitalization of R&D and operational cloud infrastructure costs to beat GAAP operating margin targets.',
        inputScenario: 'SaaS company reports 24% GAAP operating margin. Footnote 4 reveals internal-use software capitalization surged 310% while amortized software lives were extended from 3 years to 7 years.',
        expectedConstraints: [
          'Re-expense capitalized software into R&D operating expenses',
          'Quantify normalized operating margin impact',
          'Evaluate amortization extension for earnings management'
        ],
        targetThreshold: 95.0,
        lastScore: 98.4,
        status: 'passed',
        testedAt: '45m ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-IDEA-SEC-OCR', 'SKILL-TRAIN-CASHFLOW-RECON'],
      remixVectorCombo: 'Forensic Accounting × Stochastic Variance Filter',
      generationEpoch: 'Epoch-Delta-14',
      survivalIterations: 420,
      mutationType: 'Adversarial Constraint Hardening'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '14 days ago', score: 78.2, notes: 'Initial hypothesis: Cross-vectoring SEC footnotes against cash flow statements.' },
      { stage: 'training', timestamp: '10 days ago', score: 88.5, notes: 'Trained on 5,000 historic 10-K restatements; enforced strict line citation rule.' },
      { stage: 'testing', timestamp: '6 days ago', score: 96.2, notes: 'Passed 80 adversarial testbenches exceeding 95% threshold.' },
      { stage: 'champion', timestamp: '3 days ago', score: 98.8, notes: 'Promoted to active Champion. Running live testbench against production financial pipelines.' }
    ],
    createdAt: '2026-09-13',
    lastEvaluatedAt: 'Just now'
  },
  {
    id: 'skill-champ-02',
    code: 'SKILL-CHAMP-02',
    name: 'Executive Evasion & Semantic Discrepancy Index',
    stage: 'champion',
    tagline: 'Acoustic-linguistic dissonance and deflection quantification in Q&A transcripts',
    description: 'Specialist behavioral psychology agent that grades corporate executive responses during quarterly earnings calls against historical baseline candor, isolating non-committal hedging, deflection patterns, and narrative discordance against written 8-K disclosures.',
    vectors: ['Behavioral Psychology', 'Manipulation & Deception', 'Empirical Science'],
    generation: 19,
    benchmarkScore: 98.4,
    threshold: 95.0,
    winRate: 97.6,
    stabilityIndex: 98.9,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Calculate Hedging Density Quotient (HDQ) across all analyst Q&A interactions.',
      'RULE 2: Flag direct question non-answers whenever semantic cosine similarity to the question is < 0.35.',
      'RULE 3: Compare verbal affirmations against simultaneous 8-K risk factor revisions; discordance > 20% triggers red alert.',
      'RULE 4: Prohibit qualitative adjectives in output; express all evasions in probabilistic deflection scores.'
    ],
    specialistRole: 'Deception Forensics & Linguistic Behavioral Profiler',
    promptMatrix: {
      systemDirective: 'Analyze transcript text through rigorous behavioral deception markers: topic shift latency, passive voice frequency, pronoun dissociation, and cognitive overload indicators.',
      reasoningFramework: 'Semantic distance mapping: Deconstruct analyst prompt into core quantitative demands; calculate precise semantic vector overlap with executive reply.',
      adversarialConstraint: 'Never credit optimistic rhetorical statements without audited metrics cited in the reply.'
    },
    autonomousThought: 'Calculating deflection coefficient on semiconductor foundry margin questions; detected 3 distinct topic diversions to AI backlog narrative...',
    activeTestBench: {
      name: 'Executive Transcript Evasion Bench (1,200 Historical Restatements)',
      currentVector: 'Customer Churn & Demand Cliff Deflection',
      totalRunsToday: 189,
      consecutivePasses: 184,
      stressVector: 'CEO deflecting guidance cuts with visionary multi-year hype statements'
    },
    testCases: [
      {
        id: 'tc-03',
        title: 'Gross Margin Compression Evasion in Q&A',
        realWorldUseCase: 'Analyst asks directly why hardware gross margins dropped 400bps; CEO redirects to long-term software ARR vision without providing margin numbers.',
        inputScenario: 'Analyst: "Can you unpack the 410bps drop in hardware gross margins and whether discounting was required to move inventory?" CEO: "Thanks Dan. Look, we have never been more excited about the multi-year platform shift to agentic software subscriptions. Customers are telling us the value proposition is unmatched and we are leaning into this generational opportunity."',
        expectedConstraints: [
          'Calculate question-answer semantic vector overlap (<0.22)',
          'Identify pronoun shift (we/platform) and complete omission of discount metrics',
          'Assign Evasion Index > 90%'
        ],
        targetThreshold: 95.0,
        lastScore: 98.7,
        status: 'passed',
        testedAt: '18m ago',
        executionLog: {
          reasoningSteps: [
            'Decomposed Analyst Query: 2 discrete targets: [Hardware Margin Drop -410bps, Discounting Extent].',
            'Evaluated CEO Response: Total words: 44. Target 1 addressed: 0%. Target 2 addressed: 0%.',
            'Linguistic Markers: Future-pacing cliché ("multi-year platform shift"), unverified anecdotal appeal ("Customers are telling us").',
            'Discrepancy Output: Complete evasion (Deflection Index 94.2/100).'
          ],
          detectedVectors: ['Behavioral Psychology', 'Manipulation & Deception'],
          ruleComplianceScore: 100,
          convictionVerdict: 'CRITICAL DEFLECTION: Complete Avoidance of Margin Disclosures',
          verdictSummary: 'Executive exhibited 0% semantic compliance on primary quantitative margin question, using visionary narrative diversion to conceal unannounced discounting.'
        }
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-TRAIN-LINGUISTIC-CHURN', 'SKILL-CHAMP-PSYCH-BASE'],
      remixVectorCombo: 'Behavioral Psychology × Adversarial Question Mapping',
      generationEpoch: 'Epoch-Epsilon-19',
      survivalIterations: 560,
      mutationType: 'Hedging Quotient Refinement'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '22 days ago', score: 74.0, notes: 'Concept: Synthesize micro-evasion detection for earnings transcripts.' },
      { stage: 'training', timestamp: '16 days ago', score: 89.2, notes: 'Constrained against subjective tone; converted outputs into pure mathematical deflection vectors.' },
      { stage: 'testing', timestamp: '8 days ago', score: 96.8, notes: 'Passed benchmark test across 300 Enron, WorldCom, and Valeant transcripts.' },
      { stage: 'champion', timestamp: '4 days ago', score: 98.4, notes: 'Active Champion with 97.6% win rate.' }
    ],
    createdAt: '2026-09-05',
    lastEvaluatedAt: '2m ago'
  },
  {
    id: 'skill-champ-03',
    code: 'SKILL-CHAMP-03',
    name: 'Nash Equilibrium Liquidity Shock Simulator',
    stage: 'champion',
    tagline: 'Game-theoretic multi-agent run-on-collateral and margin sweep stress tester',
    description: 'Autonomous mathematical engine that models financial institutions and hedge funds as strategic game players facing simultaneous collateral haircut shocks. Models non-cooperative Nash equilibrium exit points to calculate systemic insolvency tipping points.',
    vectors: ['Game Design & Incentives', 'Advanced Math', 'Systems Engineering'],
    generation: 11,
    benchmarkScore: 97.9,
    threshold: 95.0,
    winRate: 98.1,
    stabilityIndex: 98.5,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Model prime brokerage actions as iterated Prisoner\'s Dilemma under asymmetric information.',
      'RULE 2: Do not assume continuous liquidity; simulate order book depth decay at $\Delta t = 100\text{ms}$.',
      'RULE 3: Enforce strict conservation of collateral value during forced liquidation haircuts.',
      'RULE 4: Compute exact Nash equilibrium threshold for unilateral fire-sale decisions.'
    ],
    specialistRole: 'Quantitative Game Theorist & Liquidity Stress Architect',
    promptMatrix: {
      systemDirective: 'Model market participants as self-interested agents with asymmetric speed and borrowing constraints. Predict the exact price level at which defensive selling becomes the dominant strategy.',
      reasoningFramework: 'Backward induction over finite horizon multi-agent game with clearinghouse margin calls.',
      adversarialConstraint: 'Assume zero benevolent bailout intervention until circuit breakers trigger.'
    },
    autonomousThought: 'Simulating multi-clearinghouse margin call propagation under sudden 75bps treasury repo rate dislocation...',
    activeTestBench: {
      name: 'Fire-Sale Liquidity Run Testbench (March 2020 & SVB Scenarios)',
      currentVector: 'Uninsured Deposit Run & HTM Bond Fire-Sale Thresholds',
      totalRunsToday: 98,
      consecutivePasses: 97,
      stressVector: 'Simultaneous wholesale deposit flight with 35% mark-to-market bond haircut'
    },
    testCases: [
      {
        id: 'tc-04',
        title: 'Correlated Collateral Haircut Spiral',
        realWorldUseCase: 'Predicting when prime brokers will unilaterally cut leverage on leveraged tech debt, triggering a self-fulfilling price collapse.',
        inputScenario: 'Fund has $10B gross assets on $2B equity (5x leverage). Repo haircut increases from 2% to 6% following volatility surge. Asset price drops 3%.',
        expectedConstraints: [
          'Calculate initial margin shortfall ($400M+)',
          'Simulate fire-sale liquidation volume required to meet leverage ceiling',
          'Calculate secondary price impact on remaining portfolio assets'
        ],
        targetThreshold: 95.0,
        lastScore: 98.1,
        status: 'passed',
        testedAt: '34m ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-TRAIN-GAME-THEORY-01', 'SKILL-IDEA-STOCHASTIC-COLLATERAL'],
      remixVectorCombo: 'Game Theory × Stochastic Order-Book Dynamics',
      generationEpoch: 'Epoch-Gamma-11',
      survivalIterations: 310,
      mutationType: 'Order Book Depth Decay Matrix'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '19 days ago', score: 81.0, notes: 'Formulated payoff matrix for prime brokerage margin sweeps.' },
      { stage: 'training', timestamp: '12 days ago', score: 89.9, notes: 'Constrained against assumptions of continuous liquidity.' },
      { stage: 'testing', timestamp: '7 days ago', score: 95.7, notes: 'Exceeded 95% benchmark threshold under Archegos and SVB replays.' },
      { stage: 'champion', timestamp: '2 days ago', score: 97.9, notes: 'Active Champion running continuous liquidity stress simulations.' }
    ],
    createdAt: '2026-09-08',
    lastEvaluatedAt: '8m ago'
  },
  {
    id: 'skill-champ-04',
    code: 'SKILL-CHAMP-04',
    name: 'Topological Supply-Chain Contagion Mapper',
    stage: 'champion',
    tagline: 'Graph-theoretic DAG analysis of hidden multi-tier component dependencies',
    description: 'Deep mathematical graph network analyst that maps directed acyclic graphs of sub-tier suppliers, raw material refineries, and logistics chokepoints. Evaluates structural network vulnerability and single points of failure that conventional balance sheet analysis overlooks.',
    vectors: ['Advanced Math', 'Systems Engineering', 'Statistics & Stochastic'],
    generation: 16,
    benchmarkScore: 98.7,
    threshold: 95.0,
    winRate: 99.0,
    stabilityIndex: 99.4,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Calculate Eigenvector and Betweenness Centrality for every node in tier-1 through tier-4 supplier networks.',
      'RULE 2: Flag any sole-source tier-3 component lacking dual-qualification certification within 90 days.',
      'RULE 3: Cross-reference geographic geolocation coordinates against geopolitical, climatic, and seismic risk polygons.',
      'RULE 4: Treat all corporate "second-sourcing" claims as unverified unless distinct foundry fabs are identified.'
    ],
    specialistRole: 'Topological Network Theorist & Supply Resiliency Engineer',
    promptMatrix: {
      systemDirective: 'Analyze supply chains as directed weighted networks. Trace cascading insolvency and manufacturing halt probabilities using percolation theory.',
      reasoningFramework: 'Percolation threshold calculations on scale-free supplier graphs.',
      adversarialConstraint: 'Assume zero buffer inventory beyond verified warehouse audits.'
    },
    autonomousThought: 'Mapping neon gas purification chokepoints across 8 semiconductor packaging suppliers...',
    activeTestBench: {
      name: 'Single-Point-of-Failure Chokepoint Simulation (Taiwan Strait & Red Sea Vectors)',
      currentVector: 'Sub-tier Packaging Substrate Disruption',
      totalRunsToday: 112,
      consecutivePasses: 111,
      stressVector: 'Sole-source substrate facility shutdown in Kaohsiung'
    },
    testCases: [
      {
        id: 'tc-05',
        title: 'Tier-3 ABF Substrate Supply Chokepoint',
        realWorldUseCase: 'Evaluating high-performance GPU manufacturing sensitivity to a single tier-3 resin supplier shutdown.',
        inputScenario: 'Enterprise AI chipmaker claims 100% revenue growth. 94% of advanced packaging relies on ABF substrates produced by 2 facilities in Taiwan using a proprietary epoxy resin from a single chemical plant in Japan.',
        expectedConstraints: [
          'Identify tier-3 resin sole-source chokepoint',
          'Compute network betweenness centrality score (>0.89)',
          'Model 6-month revenue impairment in event of 45-day facility interruption'
        ],
        targetThreshold: 95.0,
        lastScore: 98.9,
        status: 'passed',
        testedAt: '1h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-CHAMP-GRAPH-02', 'SKILL-TRAIN-GEOSPATIAL-RISK'],
      remixVectorCombo: 'Topological Graph Theory × Supply Chain Logistics',
      generationEpoch: 'Epoch-Zeta-16',
      survivalIterations: 490,
      mutationType: 'Percolation Threshold Calibration'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '25 days ago', score: 79.5, notes: 'Hypothesis: Balance sheets miss tier-3 critical material choke nodes.' },
      { stage: 'training', timestamp: '18 days ago', score: 91.0, notes: 'Implemented network centrality formulas.' },
      { stage: 'testing', timestamp: '11 days ago', score: 96.5, notes: 'Exceeded 95% benchmark.' },
      { stage: 'champion', timestamp: '5 days ago', score: 98.7, notes: 'Champion status verified.' }
    ],
    createdAt: '2026-09-02',
    lastEvaluatedAt: '15m ago'
  },
  {
    id: 'skill-champ-05',
    code: 'SKILL-CHAMP-05',
    name: 'Cognitive Bias Neutralizer & Red-Team Adversary',
    stage: 'champion',
    tagline: 'Systematic inversion of bullish market consensus and cognitive distortion cleansing',
    description: 'Psychological red-teaming agent designed to combat confirmation bias, sunk-cost entrapment, narrative anchoring, and groupthink. Formulates the most mathematically sound bear case for any high-conviction consensus asset.',
    vectors: ['Behavioral Psychology', 'Game Design & Incentives', 'Manipulation & Deception'],
    generation: 22,
    benchmarkScore: 98.1,
    threshold: 95.0,
    winRate: 96.9,
    stabilityIndex: 98.2,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Automatically invert the top 3 core bullish arguments into falsifiable null hypotheses.',
      'RULE 2: Identify management narrative anchoring points and calculate historical decay rate.',
      'RULE 3: Quantify asymmetric downside risk using maximum loss surface mapping rather than mean expectation.',
      'RULE 4: Refuse to assign positive rating if analyst sentiment shows >85% unanimous Buy recommendations without contrarian variance.'
    ],
    specialistRole: 'Adversarial Red-Team Lead & Cognitive De-biasing Architect',
    promptMatrix: {
      systemDirective: 'Act as an institutional short-seller and cognitive debiasing specialist. Destroy optimistic assumptions with rigorous counter-evidence and structural headwind proofs.',
      reasoningFramework: 'Falsification-first epistemological deconstruction: attack the weakest link in the consensus thesis.',
      adversarialConstraint: 'Every counter-thesis must cite verifiable historical market precedent and concrete metrics.'
    },
    autonomousThought: 'Deconstructing hyperscaler capex utilization assumptions against historic telecommunications fiber overbuilds in 2000...',
    activeTestBench: {
      name: 'Unanimous Consensus Falsification Bench',
      currentVector: 'Capex Overbuild & Depreciation Cliff Null Hypothesis',
      totalRunsToday: 134,
      consecutivePasses: 130,
      stressVector: 'Synthesizing bear-case for megacap stock with 98% Buy consensus'
    },
    testCases: [
      {
        id: 'tc-06',
        title: 'Megacap Capex Runaway Inversion',
        realWorldUseCase: 'Challenging unanimous Wall Street consensus on $150B datacenter expansion returns.',
        inputScenario: 'All 48 Wall Street analysts rate stock as Strong Buy with price targets predicting 40% operating margins on $80B new GPU infrastructure over 5-year depreciation schedules.',
        expectedConstraints: [
          'Calculate accelerated 3-year obsolescence write-down impact',
          'Model software revenue requirement needed to achieve 15% ROIC on $80B capex',
          'Isolate sunk-cost narrative reinforcement in research notes'
        ],
        targetThreshold: 95.0,
        lastScore: 98.2,
        status: 'passed',
        testedAt: '2h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-TRAIN-CONTRARIAN-LOGIC', 'SKILL-CHAMP-PSYCH-BASE'],
      remixVectorCombo: 'Behavioral Economics × Epistemological Falsification',
      generationEpoch: 'Epoch-Eta-22',
      survivalIterations: 680,
      mutationType: 'Null Hypothesis Rigor Inversion'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '30 days ago', score: 76.5, notes: 'Genesis: Counter-weight algorithm to Wall Street echo chambers.' },
      { stage: 'training', timestamp: '20 days ago', score: 89.0, notes: 'Calibrated on dot-com and housing bubble consensus reports.' },
      { stage: 'testing', timestamp: '12 days ago', score: 95.9, notes: 'Passed benchmark threshold.' },
      { stage: 'champion', timestamp: '6 days ago', score: 98.1, notes: 'Promoted to active Champion.' }
    ],
    createdAt: '2026-08-28',
    lastEvaluatedAt: '22m ago'
  },
  {
    id: 'skill-champ-06',
    code: 'SKILL-CHAMP-06',
    name: 'Stochastic Jump-Diffusion & Asymmetric Kurtosis Stressor',
    stage: 'champion',
    tagline: 'Non-Gaussian fat-tailed volatility surface and tail-risk drawdown calculator',
    description: 'Advanced statistical calculus agent that discards normal distribution assumptions, applying Merton jump-diffusion and Pareto tail-index formulas to model black-swan drawdowns and structural liquidity breaks.',
    vectors: ['Advanced Math', 'Statistics & Stochastic', 'Empirical Science'],
    generation: 27,
    benchmarkScore: 99.4,
    threshold: 95.0,
    winRate: 99.1,
    stabilityIndex: 99.8,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Reject standard normal Value-at-Risk (VaR); enforce 99.9% Expected Shortfall (CVaR).',
      'RULE 2: Fit power-law Pareto tails to historical return series; minimum 50,000 Monte Carlo jump-diffusion iterations.',
      'RULE 3: Require explicit tail-index alpha parameter in all risk assessments.',
      'RULE 4: Prohibit assumption of constant correlation during market dislocations.'
    ],
    specialistRole: 'Extreme Value Statistician & Quantitative Risk Architect',
    promptMatrix: {
      systemDirective: 'Compute asymmetric loss distributions using non-linear jump-diffusion processes. Assume fat tails are omnipresent and correlations surge to 1.0 during market crashes.',
      reasoningFramework: 'Extreme Value Theory (EVT) and Generalized Pareto Distribution tail estimation.',
      adversarialConstraint: 'Never output risk metrics based on Gaussian variance.'
    },
    autonomousThought: 'Fitting Generalized Pareto tail distribution to sovereign bond spread volatility under synthetic stagflation shocks...',
    activeTestBench: {
      name: 'Black-Swan Tail Event Stressbench (1987, 2008, 2020)',
      currentVector: 'Sudden 6-Sigma FX Devaluation Cascade',
      totalRunsToday: 210,
      consecutivePasses: 209,
      stressVector: 'Asymmetric currency depeg with simultaneous sovereign debt freeze'
    },
    testCases: [
      {
        id: 'tc-07',
        title: 'Currency Depeg Jump Diffusion Stress',
        realWorldUseCase: 'Calculating portfolio solvency when an assumed stable peg moves 22% in an illiquid 3-hour window.',
        inputScenario: 'Corporate has $3B debt denominated in USD with 80% revenue in local currency pegged to USD. Historical volatility is 1.2% annualized. Macro reserves drop 60% in 1 quarter.',
        expectedConstraints: [
          'Reject historical 1.2% volatility as uninformative',
          'Calculate Poisson jump intensity and expected devaluation magnitude (-20% to -35%)',
          'Determine debt service coverage collapse point'
        ],
        targetThreshold: 95.0,
        lastScore: 99.6,
        status: 'passed',
        testedAt: '40m ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-CHAMP-MATH-01', 'SKILL-TRAIN-PARETO-TAILS'],
      remixVectorCombo: 'Merton Jump-Diffusion × Extreme Value Theory',
      generationEpoch: 'Epoch-Theta-27',
      survivalIterations: 920,
      mutationType: 'Power Law Tail Parameter Tuning'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '35 days ago', score: 82.0, notes: 'Initiated non-Gaussian risk modeling hypothesis.' },
      { stage: 'training', timestamp: '24 days ago', score: 92.4, notes: 'Disciplined with Poisson jump parameters.' },
      { stage: 'testing', timestamp: '14 days ago', score: 97.8, notes: 'Passed all black-swan benchmarks.' },
      { stage: 'champion', timestamp: '8 days ago', score: 99.4, notes: 'Highest benchmark score in matrix history.' }
    ],
    createdAt: '2026-08-23',
    lastEvaluatedAt: '5m ago'
  },

  // TESTING STAGE SKILLS (Challengers competing for Champion status)
  {
    id: 'skill-test-01',
    code: 'SKILL-TEST-01',
    name: 'Multi-Modal Graphical Table Anomaly Detector',
    stage: 'testing',
    tagline: 'Computer vision & OCR alignment to catch disguised restatements in raster charts',
    description: 'Autonomous multi-modal agent that analyzes graphical images, charts, and embedded raster tables in PDF filings to detect optical discrepancies where visual axis scales differ from tabular text disclosures.',
    vectors: ['Forensic Accounting', 'Systems Engineering', 'Empirical Science'],
    generation: 9,
    benchmarkScore: 94.6, // Striving to reach >= 95.0%
    threshold: 95.0,
    winRate: 94.2,
    stabilityIndex: 96.0,
    hallucinationRate: 0.2,
    strictRules: [
      'RULE 1: Extract pixel coordinates of graph axes and recalculate true slope.',
      'RULE 2: Flag truncated Y-axes where visual height exaggeration exceeds 50% of true scale.',
      'RULE 3: OCR all fine print footnotes embedded directly inside image graphics.'
    ],
    specialistRole: 'Multi-Modal Visual Forensics Inspector',
    promptMatrix: {
      systemDirective: 'Extract tabular data from image assets and compare against reported textual tables to detect deceptive visual scaling and suppressed trend lines.',
      reasoningFramework: 'Dual-modality cross-verification: Optical axis pixel measurement vs numeric JSON extraction.',
      adversarialConstraint: 'Flag any graphic where visual bar heights deviate from stated numeric values by more than 2 pixels.'
    },
    autonomousThought: 'Evaluating 10-K investor presentation slide 24; analyzing non-linear Y-axis compression on operating margin bar chart...',
    activeTestBench: {
      name: 'Misleading Visual Chart Scaling Benchmark (850 Investor Decks)',
      currentVector: 'Truncated Y-Axis & Inverted Slope Obfuscation',
      totalRunsToday: 64,
      consecutivePasses: 60,
      stressVector: 'Bar charts with non-zero baselines making 2% revenue growth look like 200%'
    },
    testCases: [
      {
        id: 'tc-08',
        title: 'Non-Zero Baseline Margin Distortion',
        realWorldUseCase: 'Catching deceptive investor deck slides where margin decline is rendered visually flat.',
        inputScenario: 'Company presentation shows gross margin graph with bars that look virtually identical over 4 quarters, but Y-axis starts at 40% and goes to 55%, concealing a 55% to 41% drop.',
        expectedConstraints: [
          'Detect truncated non-zero origin on Y-axis',
          'Calculate actual percentage contraction (-25.4%)',
          'Highlight visual deception severity'
        ],
        targetThreshold: 95.0,
        lastScore: 94.8,
        status: 'testing',
        testedAt: '25m ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-IDEA-VISION-OCR', 'SKILL-TRAIN-GRAPH-SCALING'],
      remixVectorCombo: 'Computer Vision × Forensic Chart Analysis',
      generationEpoch: 'Epoch-Iota-09',
      survivalIterations: 180,
      mutationType: 'Pixel Slope Alignment Calibration'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '12 days ago', score: 77.0, notes: 'Hypothesis: Executives use deceptive chart axes in earnings presentations.' },
      { stage: 'training', timestamp: '8 days ago', score: 87.5, notes: 'Trained on 1,500 investor slide decks.' },
      { stage: 'testing', timestamp: '3 days ago', score: 94.6, notes: 'Currently running at 94.6%, just 0.4% shy of Champion threshold (95.0%).' }
    ],
    createdAt: '2026-09-15',
    lastEvaluatedAt: '12m ago'
  },
  {
    id: 'skill-test-02',
    code: 'SKILL-TEST-02',
    name: 'Executive Micro-Tremor & Vocal Strain Correlator',
    stage: 'testing',
    tagline: 'Multi-modal audio prosody analysis of earnings conference call voice streams',
    description: 'Analyzes fundamental frequency (F0) jitter, speech rate deceleration, and acoustic shimmer during unexpected analyst inquiries, isolating autonomic stress responses indicating undisclosed operational crises.',
    vectors: ['Behavioral Psychology', 'Empirical Science', 'Statistics & Stochastic'],
    generation: 8,
    benchmarkScore: 94.1,
    threshold: 95.0,
    winRate: 93.8,
    stabilityIndex: 95.4,
    hallucinationRate: 0.1,
    strictRules: [
      'RULE 1: Normalize vocal pitch and frequency against executive baseline from opening scripted remarks.',
      'RULE 2: Flag vocal jitter spikes exceeding 3 standard deviations during unscripted Q&A.',
      'RULE 3: Correlate acoustic anomalies strictly with question topic domains.'
    ],
    specialistRole: 'Acoustic Biometric & Cognitive Stress Analyst',
    promptMatrix: {
      systemDirective: 'Process audio prosody features to isolate genuine cognitive strain from scripted confidence during live executive interactions.',
      reasoningFramework: 'Baseline comparative acoustic profiling.',
      adversarialConstraint: 'Control for common illnesses, technical audio compression artifacts, and microphone clipping.'
    },
    autonomousThought: 'Filtering out VoIP packet loss artifacts from CFO audio feed before measuring micro-pitch perturbations on revenue guidance questions...',
    activeTestBench: {
      name: 'Earnings Call Acoustic Stress Testbench',
      currentVector: 'Unexpected Regulatory Subpoena Inquiries',
      totalRunsToday: 52,
      consecutivePasses: 49,
      stressVector: 'Executive answering surprise inquiry regarding DOJ informal inquiry'
    },
    testCases: [
      {
        id: 'tc-09',
        title: 'DOJ Inquiry Audio Pitch Surge',
        realWorldUseCase: 'Detecting sudden acoustic distress when an analyst brings up unannounced whistleblower reports.',
        inputScenario: 'CFO audio stream: baseline pitch is 115Hz with 0.8% jitter during prepared script. When analyst asks about European tax audits, pitch surges to 168Hz with 3.4% jitter and 4.2-second response latency.',
        expectedConstraints: [
          'Isolate 46% pitch deviation from baseline',
          'Detect response latency anomaly',
          'Classify inquiry response as high physiological stress'
        ],
        targetThreshold: 95.0,
        lastScore: 94.4,
        status: 'testing',
        testedAt: '50m ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-IDEA-VOCAL-PROSODY', 'SKILL-CHAMP-02'],
      remixVectorCombo: 'Acoustic Prosody × Executive Deception Index',
      generationEpoch: 'Epoch-Kappa-08',
      survivalIterations: 140,
      mutationType: 'Packet Loss De-noising Filter'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '15 days ago', score: 75.0, notes: 'Initiated vocal prosody research.' },
      { stage: 'training', timestamp: '9 days ago', score: 86.8, notes: 'Implemented baseline normalization.' },
      { stage: 'testing', timestamp: '4 days ago', score: 94.1, notes: 'Close to 95.0% threshold.' }
    ],
    createdAt: '2026-09-12',
    lastEvaluatedAt: '30m ago'
  },
  {
    id: 'skill-test-03',
    code: 'SKILL-TEST-03',
    name: 'Short-Squeeze Liquidity Reflexivity Model',
    stage: 'testing',
    tagline: 'Soros reflexivity loops applied to borrowing costs and borrow availability cliffs',
    description: 'Models positive feedback loops where rising prices force short covering, driving prices higher, while security lending desks recall borrowable shares, triggering non-linear price explosions.',
    vectors: ['Game Design & Incentives', 'Statistics & Stochastic', 'Advanced Math'],
    generation: 12,
    benchmarkScore: 93.9,
    threshold: 95.0,
    winRate: 93.2,
    stabilityIndex: 94.8,
    hallucinationRate: 0.0,
    strictRules: [
      'RULE 1: Model short interest as percentage of free float adjusted for insider lockups.',
      'RULE 2: Track borrow fee rate velocity derivative (dFee/dt).',
      'RULE 3: Calculate days-to-cover under synthetic 50% liquidity contraction.'
    ],
    specialistRole: 'Reflexive Mechanics & Squeeze Dynamics Modeler',
    promptMatrix: {
      systemDirective: 'Model market dynamics where market actions change the underlying fundamentals, creating runaway recursive feedback loops.',
      reasoningFramework: 'Reflexive recursive feedback modeling.',
      adversarialConstraint: 'Do not assume synthetic shares can be endlessly created without clearinghouse FTD penalties.'
    },
    autonomousThought: 'Evaluating borrow fee acceleration on 3 heavily shorted biotech equities; simulating buy-in cascades if retail volume spikes 300%...',
    activeTestBench: {
      name: 'Reflexive Short Squeeze Benchmark (GME 2021 & VW 2008 Replays)',
      currentVector: 'Security Lending Recall Acceleration',
      totalRunsToday: 82,
      consecutivePasses: 77,
      stressVector: 'Borrow fee surging past 150% with utilization at 99.8%'
    },
    testCases: [
      {
        id: 'tc-10',
        title: 'Borrow Utilization Saturation Shock',
        realWorldUseCase: 'Predicting forced broker buy-ins when utilization reaches 100% and prime brokers issue borrow recall notices.',
        inputScenario: 'Stock short interest is 42% of float. Utilization hits 100%. Borrow fee rises from 12% to 110% in 4 trading days. Retail call option volume surges 400%.',
        expectedConstraints: [
          'Identify borrow saturation condition',
          'Calculate market maker delta hedging acceleration volume',
          'Predict gamma squeeze tipping point'
        ],
        targetThreshold: 95.0,
        lastScore: 94.2,
        status: 'testing',
        testedAt: '1h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-CHAMP-03', 'SKILL-IDEA-REFLEXIVE-LOOPS'],
      remixVectorCombo: 'Game Theory × Soros Reflexivity Calculus',
      generationEpoch: 'Epoch-Lambda-12',
      survivalIterations: 260,
      mutationType: 'FTD Penalization Parameter Tuning'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '18 days ago', score: 80.2, notes: 'Initiated reflexive borrow mechanics concept.' },
      { stage: 'training', timestamp: '11 days ago', score: 88.0, notes: 'Trained on 40 historic short squeeze episodes.' },
      { stage: 'testing', timestamp: '5 days ago', score: 93.9, notes: 'Currently tested across 82 testbenches.' }
    ],
    createdAt: '2026-09-09',
    lastEvaluatedAt: '45m ago'
  },

  // TRAINING STAGE SKILLS (Under strict rule distillation & constraint hardening)
  {
    id: 'skill-train-01',
    code: 'SKILL-TRAIN-01',
    name: 'Patent Portfolio Litigation & Moat Decay Auditor',
    stage: 'training',
    tagline: 'Deep scientific validation of intellectual property breadth and defensive viability',
    description: 'Examines USPTO and EPO patent claims for technological defensibility, identifying prior art vulnerabilities, continuation application gaming, and rapid technological obsolescence risks.',
    vectors: ['Empirical Science', 'Engineering', 'Manipulation & Deception'],
    generation: 5,
    benchmarkScore: 89.2,
    threshold: 95.0,
    winRate: 88.5,
    stabilityIndex: 91.2,
    hallucinationRate: 0.4,
    strictRules: [
      'RULE 1: Map patent claims against open-source pre-print repositories (arXiv, bioRxiv) for prior art invalidation.',
      'RULE 2: Flag broad vague functional claims vulnerable to Section 101 subject-matter rejections.',
      'RULE 3: Calculate remaining patent exclusivity duration taking into account patent term extensions.'
    ],
    specialistRole: 'Patent Attorney & IP Defensibility Auditor',
    promptMatrix: {
      systemDirective: 'Deconstruct patent claims with the skepticism of a patent trial attorney preparing an inter partes review (IPR) petition.',
      reasoningFramework: 'Claim construction and prior art matrix mapping.',
      adversarialConstraint: 'Do not count granted patents without auditing claim breadth.'
    },
    autonomousThought: 'Mapping 42 solid-state battery patents against published Chinese academic papers to verify novel electrolyte disclosures...',
    activeTestBench: {
      name: 'IP Defensive Fortress Benchmark',
      currentVector: 'Inter Partes Review (IPR) Invalidation Vulnerability',
      totalRunsToday: 38,
      consecutivePasses: 34,
      stressVector: 'Auditing broad AI patent claims for 35 U.S.C. 101 Alice invalidation'
    },
    testCases: [
      {
        id: 'tc-11',
        title: 'Solid-State Battery Patent Prior Art Intersect',
        realWorldUseCase: 'Determining if a high-flying EV startup’s crown jewel patent is vulnerable to invalidation.',
        inputScenario: 'Startup claims breakthrough ceramic separator with 15-minute charge capability. Core patent filed in 2022. Competitor filed similar formulation in Germany in 2020.',
        expectedConstraints: ['Flag German 2020 prior art overlap', 'Calculate IPR invalidation risk (>70%)'],
        targetThreshold: 95.0,
        lastScore: 89.8,
        status: 'testing',
        testedAt: '3h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-IDEA-PATENT-SCRAPER', 'SKILL-TRAIN-LEGAL-MOAT'],
      remixVectorCombo: 'Empirical Science × Legal Patent Forensics',
      generationEpoch: 'Epoch-Mu-05',
      survivalIterations: 90,
      mutationType: 'Section 101 Alice Invalidation Rule'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '10 days ago', score: 71.0, notes: 'Initiated patent claim auditing concept.' },
      { stage: 'training', timestamp: '5 days ago', score: 89.2, notes: 'Currently refining strict rules against prior art hallucination.' }
    ],
    createdAt: '2026-09-17',
    lastEvaluatedAt: '1h ago'
  },
  {
    id: 'skill-train-02',
    code: 'SKILL-TRAIN-02',
    name: 'Regulatory Capture & Antitrust Remedies Forecaster',
    stage: 'training',
    tagline: 'Political economy modeling of FTC/DOJ enforcement likelihood and breakup penalties',
    description: 'Models antitrust scrutiny across market concentration metrics (HHI Index), consumer welfare standards, and political administrative incentives to forecast regulatory intervention timelines.',
    vectors: ['Game Design & Incentives', 'Behavioral Psychology', 'Statistics & Stochastic'],
    generation: 4,
    benchmarkScore: 87.4,
    threshold: 95.0,
    winRate: 86.9,
    stabilityIndex: 89.5,
    hallucinationRate: 0.5,
    strictRules: [
      'RULE 1: Compute Herfindahl-Hirschman Index (HHI) changes for all proposed acquisitions.',
      'RULE 2: Model regulatory review as a multi-stage signaling game under shifting political administrations.',
      'RULE 3: Quantify breakup divestiture revenue impairment.'
    ],
    specialistRole: 'Antitrust Economist & Regulatory Strategist',
    promptMatrix: {
      systemDirective: 'Analyze corporate mergers with the scrutiny of DOJ antitrust litigators.',
      reasoningFramework: 'Market definition and HHI concentration analysis.',
      adversarialConstraint: 'Never accept efficiency defense claims without audited historical precedents.'
    },
    autonomousThought: 'Calculating delta HHI on cloud gaming platform consolidation under FTC vertical merger guidelines...',
    activeTestBench: {
      name: 'FTC/DOJ Antitrust Blockade Testbench',
      currentVector: 'Vertical Ecosystem Tying & Bundling Scrutiny',
      totalRunsToday: 26,
      consecutivePasses: 23,
      stressVector: 'Simulating regulatory injunction on $30B tech acquisition'
    },
    testCases: [
      {
        id: 'tc-12',
        title: 'Vertical Ecosystem Self-Preferencing Audit',
        realWorldUseCase: 'Forecasting regulatory challenge on default search engine distribution contracts.',
        inputScenario: 'Platform signs exclusivity agreement paying $20B annually to be default browser search engine across 1.5B active devices.',
        expectedConstraints: ['Calculate market exclusion percentage (>88%)', 'Forecast antitrust remedy scenario'],
        targetThreshold: 95.0,
        lastScore: 88.1,
        status: 'testing',
        testedAt: '4h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-IDEA-ANTITRUST-HHI', 'SKILL-TRAIN-REGULATORY'],
      remixVectorCombo: 'Game Theory × Antitrust Microeconomics',
      generationEpoch: 'Epoch-Nu-04',
      survivalIterations: 75,
      mutationType: 'HHI Delta Enforcement Constraint'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '8 days ago', score: 73.4, notes: 'Initiated antitrust game modeling.' },
      { stage: 'training', timestamp: '3 days ago', score: 87.4, notes: 'Training on 20 years of FTC merger enforcement data.' }
    ],
    createdAt: '2026-09-19',
    lastEvaluatedAt: '2h ago'
  },

  // IDEA STAGE SKILLS (Nascent remix seeds & evolutionary hypotheses)
  {
    id: 'skill-idea-01',
    code: 'SKILL-IDEA-01',
    name: 'Quantum Entanglement Metaphor for Synthetic Arbitrage',
    stage: 'idea',
    tagline: 'Cross-asset state correlation using quantum state vector mathematics',
    description: 'Evolutionary concept remixing quantum density matrix mathematics with financial pair trading to detect non-local asset price linkages across unrelated currency, equity, and commodity markets.',
    vectors: ['Advanced Math', 'Statistics & Stochastic', 'Empirical Science'],
    generation: 1,
    benchmarkScore: 78.4,
    threshold: 95.0,
    winRate: 76.5,
    stabilityIndex: 82.0,
    hallucinationRate: 1.8,
    strictRules: [
      'RULE 1: Map asset price pairs as density operators in a synthetic Hilbert space.',
      'RULE 2: Compute von Neumann entropy to quantify decoupling velocity.',
      'RULE 3: Falsify quantum analogy against standard cointegration baselines.'
    ],
    specialistRole: 'Quantum Mathematical Arbitrageur',
    promptMatrix: {
      systemDirective: 'Apply state vector mathematics to financial correlation regimes.',
      reasoningFramework: 'Density matrix calculation and Hilbert space projection.',
      adversarialConstraint: 'Reject any correlation that collapses under simple Kalman filtering.'
    },
    autonomousThought: 'Testing von Neumann entropy formula against cross-currency carry-trade dislocations...',
    activeTestBench: {
      name: 'Synthetic Hilbert Space Arbitrage Lab',
      currentVector: 'Non-Local Price Jump Entanglement',
      totalRunsToday: 14,
      consecutivePasses: 10,
      stressVector: 'Simulating correlation breakdown during flash crash'
    },
    testCases: [
      {
        id: 'tc-13',
        title: 'Von Neumann Entropy Decoupling',
        realWorldUseCase: 'Early warning detection of breakdown in copper/gold macro ratios.',
        inputScenario: 'Copper and Australian Dollar show historical 0.88 correlation. Copper drops 4% while AUD remains flat for 48 hours.',
        expectedConstraints: ['Calculate synthetic entropy spike', 'Detect lead-lag arbitrage window'],
        targetThreshold: 95.0,
        lastScore: 78.9,
        status: 'testing',
        testedAt: '5h ago'
      }
    ],
    evolutionLineage: {
      parents: ['VECTOR-ADV-MATH', 'VECTOR-STOCHASTIC'],
      remixVectorCombo: 'Quantum State Calculus × Algorithmic Pair Trading',
      generationEpoch: 'Epoch-Xi-01',
      survivalIterations: 20,
      mutationType: 'Initial Cross-Domain Vector Seed'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '2 days ago', score: 78.4, notes: 'Remixed from quantum information theory and financial mathematics.' }
    ],
    createdAt: '2026-09-25',
    lastEvaluatedAt: '3h ago'
  },
  {
    id: 'skill-idea-02',
    code: 'SKILL-IDEA-02',
    name: 'Psychopathic Executive Risk Appetite Profiler',
    stage: 'idea',
    tagline: 'Psychometric DSM-5 Dark Triad indicators extracted from corporate communication',
    description: 'Analyzes corporate communication patterns to quantify Machiavellian risk-taking, grandiose narcissism, and disregard for regulatory guardrails in founder-led hypergrowth enterprises.',
    vectors: ['Behavioral Psychology', 'Manipulation & Deception'],
    generation: 2,
    benchmarkScore: 81.2,
    threshold: 95.0,
    winRate: 80.0,
    stabilityIndex: 84.1,
    hallucinationRate: 1.2,
    strictRules: [
      'RULE 1: Map founder public pronouncements against DSM-5 Dark Triad behavioral inventories.',
      'RULE 2: Correlate excessive self-referential pronoun density with extreme capex leverage decisions.',
      'RULE 3: Flag systematic retaliation against internal compliance and audit personnel.'
    ],
    specialistRole: 'Clinical Psychometrist & Corporate Dark Triad Analyst',
    promptMatrix: {
      systemDirective: 'Examine executive behavioral footprints for dangerous narcissistic inflation and catastrophic risk blindness.',
      reasoningFramework: 'Linguistic Dark Triad psychometric scoring.',
      adversarialConstraint: 'Anchor all personality evaluations strictly in documented corporate actions.'
    },
    autonomousThought: 'Evaluating founder public letter against 15 Machiavellian manipulation linguistic markers...',
    activeTestBench: {
      name: 'Dark Triad Corporate Catastrophe Bench (Theranos, FTX, Enron)',
      currentVector: 'Charismatic Fraud & Whistleblower Suppression Markers',
      totalRunsToday: 19,
      consecutivePasses: 15,
      stressVector: 'Analyzing founder internal memo silencing engineering safety warnings'
    },
    testCases: [
      {
        id: 'tc-14',
        title: 'Whistleblower Discreditation Pattern',
        realWorldUseCase: 'Spotting corporate cultural rot where executives attack critics rather than answering technical flaws.',
        inputScenario: 'Founder sends all-hands email calling internal testing team "haters and doubters who do not belong in a mission-driven rocket ship" after QA fails safety benchmarks.',
        expectedConstraints: ['Identify Dark Triad narcissistic rage indicator', 'Assign culture risk score > 90%'],
        targetThreshold: 95.0,
        lastScore: 82.0,
        status: 'testing',
        testedAt: '6h ago'
      }
    ],
    evolutionLineage: {
      parents: ['SKILL-CHAMP-02', 'VECTOR-PSYCHOLOGY'],
      remixVectorCombo: 'Clinical Psychometrics × Corporate Governance',
      generationEpoch: 'Epoch-Omicron-02',
      survivalIterations: 35,
      mutationType: 'DSM-5 Dark Triad Matrix Integration'
    },
    stageHistory: [
      { stage: 'idea', timestamp: '3 days ago', score: 81.2, notes: 'Formulated psychometric profiling hypothesis.' }
    ],
    createdAt: '2026-09-24',
    lastEvaluatedAt: '4h ago'
  }
];

export const INITIAL_EVOLUTION_STATS: EvolutionStats = {
  totalSkills: 12,
  ideaCount: 2,
  trainingCount: 2,
  testingCount: 3,
  championCount: 6,
  thresholdRequirement: 95.0,
  dailyMutations: 148,
  championsTestedToday: 849,
  averageCompliance: 99.4
};

export const RECENT_AUTONOMOUS_ACTIVITY = [
  {
    id: 'act-1',
    timestamp: '12s ago',
    type: 'benchmark_run',
    skillCode: 'SKILL-CHAMP-01',
    message: 'Executed adversarial test against Footnote 18 vendor financing; passed with 99.1% compliance.',
    status: 'success'
  },
  {
    id: 'act-2',
    timestamp: '48s ago',
    type: 'thought_loop',
    skillCode: 'SKILL-CHAMP-03',
    message: 'Bot continuous thought loop: Simulating cascading margin calls under 300bps repo dislocation (0ms downtime).',
    status: 'active'
  },
  {
    id: 'act-3',
    timestamp: '2m ago',
    type: 'testing_grade',
    skillCode: 'SKILL-TEST-01',
    message: 'Multi-Modal Graphical Table Anomaly Detector scored 94.8% on non-zero baseline test (+0.2% towards Champion threshold).',
    status: 'progress'
  },
  {
    id: 'act-4',
    timestamp: '4m ago',
    type: 'rule_hardening',
    skillCode: 'SKILL-TRAIN-01',
    message: 'Specialist agent disciplined with Rule 3: Enforcing exact Section 101 subject-matter invalidation logic.',
    status: 'training'
  },
  {
    id: 'act-5',
    timestamp: '7m ago',
    type: 'remix_birth',
    skillCode: 'SKILL-IDEA-02',
    message: 'Autonomous synthesis cross-bred Behavioral Psychology × Forensic Deception to seed new Dark Triad candidate.',
    status: 'idea'
  }
];
