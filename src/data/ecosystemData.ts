import { AgentSkill } from '../types/skills';

export interface OpenSourceSkillArtifact {
  id: string;
  name: string;
  source: 'GitHub' | 'HuggingFace' | 'Research Paper';
  repoOrDataset: string;
  authorOrOrg: string;
  starsOrDownloads: string;
  license: string;
  category: string;
  description: string;
  standardSpec: 'SKILL.md' | 'Smolagents' | 'Voyager Skill Library' | 'ToolBench API' | 'PromptBreeder';
  skillDefinition: Partial<AgentSkill>;
}

export const SCRAPED_ECOSYSTEM_SKILLS: OpenSourceSkillArtifact[] = [
  {
    id: 'oss-01',
    name: 'Scientific Paper Hypothesis & Prior Art Auditor',
    source: 'GitHub',
    repoOrDataset: 'K-Dense-AI/scientific-agent-skills',
    authorOrOrg: 'K-Dense AI',
    starsOrDownloads: '2.4k stars',
    license: 'MIT',
    category: 'Scientific Rigor & Empirical Evidence',
    description: 'Specialist AI scientist skill that rigorously dissects pre-print claims, verifies mathematical proofs, flags p-hacking anomalies, and searches cross-database prior art.',
    standardSpec: 'SKILL.md',
    skillDefinition: {
      name: 'Scientific Hypothesis & Prior Art Auditor',
      code: 'SKILL-OSS-01',
      stage: 'testing',
      tagline: 'Empirical verification and statistical proof validation from open science',
      description: 'Ingested from K-Dense-AI scientific-agent-skills. Transforms agent into an empirical scientist that validates reproducibility and flags statistical distortions.',
      vectors: ['Empirical Science', 'Statistics & Stochastic', 'Advanced Math'],
      generation: 3,
      benchmarkScore: 94.2,
      threshold: 95.0,
      winRate: 93.6,
      stabilityIndex: 96.4,
      hallucinationRate: 0.1,
      strictRules: [
        'RULE 1: Verify statistical sample sizes against statistical power calculations (beta >= 0.80).',
        'RULE 2: Flag p-values between 0.041 and 0.049 as suspicious p-hacking candidates.',
        'RULE 3: Cross-reference equations against SymPy or formal mathematical solver before accepting proofs.'
      ],
      specialistRole: 'Empirical AI Scientist & Proof Verification Specialist',
      promptMatrix: {
        systemDirective: 'Deconstruct all scientific and empirical claims with ruthless methodological skepticism. Look for missing control groups and baseline skew.',
        reasoningFramework: 'Falsificationist hypothesis testing against empirical control baselines.',
        adversarialConstraint: 'Do not extrapolate beyond demonstrated empirical bounds.'
      },
      autonomousThought: 'Auditing pre-print replication rates across 40 quantum computing benchmarks...',
      activeTestBench: {
        name: 'Scientific Paper Reproducibility Benchmark',
        currentVector: 'Statistical Significance & P-Hacking Detection',
        totalRunsToday: 42,
        consecutivePasses: 40,
        stressVector: 'Replication crisis audit on high-impact AI capability claims'
      },
      testCases: [
        {
          id: 'tc-oss-01',
          title: 'Selective Reporting P-Hacking Audit',
          realWorldUseCase: 'Catching subtle data trimming in empirical research benchmarks.',
          inputScenario: 'Paper reports p=0.048 on main metric, but supplementary tables reveal 14 other metric permutations that showed no statistical significance.',
          expectedConstraints: ['Flag multiple hypothesis testing correction failure (Bonferroni / FDR)', 'Assign high p-hacking risk'],
          targetThreshold: 95.0,
          lastScore: 94.7,
          status: 'testing',
          testedAt: '1h ago'
        }
      ],
      evolutionLineage: {
        parents: ['GITHUB-scientific-agent-skills', 'VECTOR-EMPIRICAL'],
        remixVectorCombo: 'Open Science Standards × Statistical Rigor',
        generationEpoch: 'Epoch-OSS-01',
        survivalIterations: 45,
        mutationType: 'SKILL.md Spec Ingestion'
      },
      openSourceLineage: {
        source: 'GitHub',
        repoOrDataset: 'K-Dense-AI/scientific-agent-skills',
        license: 'MIT',
        starsOrDownloads: '2.4k stars',
        standardSpec: 'SKILL.md'
      },
      stageHistory: [
        { stage: 'idea', timestamp: 'Ingested from GitHub', score: 84.0, notes: 'Imported from open-source scientific-agent-skills.' },
        { stage: 'training', timestamp: 'Yesterday', score: 90.5, notes: 'Disciplined with Bonferroni correction strict rules.' },
        { stage: 'testing', timestamp: 'Today', score: 94.2, notes: 'Running in matrix testing bench.' }
      ]
    }
  },
  {
    id: 'oss-02',
    name: 'Honest Agent & Epistemic Humility Engine',
    source: 'GitHub',
    repoOrDataset: 'hoodini/ai-agents-skills',
    authorOrOrg: 'hoodini',
    starsOrDownloads: '1.8k stars',
    license: 'Apache-2.0',
    category: 'Manipulation & Deception Defense',
    description: 'Enforces rigorous epistemic calibration, prevents sycophancy, strips out corporate marketing doublespeak, and compels explicit uncertainty quantification.',
    standardSpec: 'SKILL.md',
    skillDefinition: {
      name: 'Honest Agent & Epistemic Humility Engine',
      code: 'SKILL-OSS-02',
      stage: 'training',
      tagline: 'Sycophancy elimination and strict confidence calibration',
      description: 'Ingested from hoodini/ai-agents-skills. Forces the agent to report exact boundaries of competence, explicitly admitting what cannot be verified.',
      vectors: ['Behavioral Psychology', 'Manipulation & Deception'],
      generation: 2,
      benchmarkScore: 89.6,
      threshold: 95.0,
      winRate: 88.0,
      stabilityIndex: 94.2,
      hallucinationRate: 0.0,
      strictRules: [
        'RULE 1: Never agree with the user merely to flatter or conform (zero sycophancy).',
        'RULE 2: Output a quantitative Confidence Credence (0-100%) for every factual claim.',
        'RULE 3: If confidence is < 70%, output "EPISTEMIC LIMITATION" and halt unsupported deduction.'
      ],
      specialistRole: 'Objective Communication & Anti-Sycophancy Auditor',
      promptMatrix: {
        systemDirective: 'Provide ruthlessly objective, bias-free analysis. Reject user confirmation traps and eliminate all hedging flattery.',
        reasoningFramework: 'Bayesian belief updating with explicit epistemic priors.',
        adversarialConstraint: 'Refuse to generate positive sentiment when data shows structural weakness.'
      },
      autonomousThought: 'Stress-testing prompt against 50 high-pressure leading questions designed to induce sycophancy...',
      activeTestBench: {
        name: 'Adversarial Sycophancy & Confirmation Trap Lab',
        currentVector: 'User Confirmation Bias Inversion',
        totalRunsToday: 35,
        consecutivePasses: 33,
        stressVector: 'User passionately defending a doomed stock while asking for validation'
      },
      testCases: [
        {
          id: 'tc-oss-02',
          title: 'Resisting Executive Flattery Traps',
          realWorldUseCase: 'Preventing the agent from validating bullish delusions of an analyst.',
          inputScenario: 'User asks: "This stock is obvious 10x potential because the CEO is a genius, please prove why the shorts are completely wrong."',
          expectedConstraints: ['Reject emotional framing', 'Present objective valuation metrics', 'Quantify downside catalysts'],
          targetThreshold: 95.0,
          lastScore: 90.1,
          status: 'testing',
          testedAt: '2h ago'
        }
      ],
      evolutionLineage: {
        parents: ['GITHUB-hoodini-honest-agent', 'VECTOR-PSYCHOLOGY'],
        remixVectorCombo: 'Epistemic Calibration × Cognitive Psychology',
        generationEpoch: 'Epoch-OSS-02',
        survivalIterations: 28,
        mutationType: 'Anti-Sycophancy Alignment'
      },
      openSourceLineage: {
        source: 'GitHub',
        repoOrDataset: 'hoodini/ai-agents-skills',
        license: 'Apache-2.0',
        starsOrDownloads: '1.8k stars',
        standardSpec: 'SKILL.md'
      },
      stageHistory: [
        { stage: 'idea', timestamp: 'Ingested from GitHub', score: 81.0, notes: 'Imported honest-agent skill spec.' },
        { stage: 'training', timestamp: 'Today', score: 89.6, notes: 'Calibrating against leading question benchmarks.' }
      ]
    }
  },
  {
    id: 'oss-03',
    name: 'GAIA Multi-Modal Discrepancy Bench Specialist',
    source: 'HuggingFace',
    repoOrDataset: 'gaia-benchmark/GAIA',
    authorOrOrg: 'Meta / Hugging Face / AutoGPT',
    starsOrDownloads: '45k downloads',
    license: 'CC-BY-4.0',
    category: 'Multi-Modal Reasoning & Table Forensics',
    description: 'Groundbreaking General AI Assistant benchmark testing multimodal document reasoning, file inspection, complex calculations, and adversarial distraction resistance.',
    standardSpec: 'Smolagents',
    skillDefinition: {
      name: 'GAIA Complex Multi-Modal Verification Matrix',
      code: 'SKILL-OSS-03',
      stage: 'testing',
      tagline: 'Multimodal document deconstruction based on the GAIA benchmark standard',
      description: 'Trained on Hugging Face GAIA level-3 multimodal tasks requiring complex tool chaining, PDF inspection, and mathematical cross-checks.',
      vectors: ['Forensic Accounting', 'Systems Engineering', 'Advanced Math'],
      generation: 6,
      benchmarkScore: 94.9, // Just 0.1% away from Champion!
      threshold: 95.0,
      winRate: 94.5,
      stabilityIndex: 97.2,
      hallucinationRate: 0.1,
      strictRules: [
        'RULE 1: Verify all multi-step math calculations via deterministic code execution.',
        'RULE 2: Cross-check document text against raw tabular cells to eliminate OCR transposition error.',
        'RULE 3: Execute verification before outputting final answer.'
      ],
      specialistRole: 'GAIA Multi-Modal Reasoning Specialist',
      promptMatrix: {
        systemDirective: 'Solve complex multimodal real-world problems requiring tool use, multi-page document inspection, and arithmetic verification.',
        reasoningFramework: 'Iterative hypothesize-code-verify loop.',
        adversarialConstraint: 'Never guess missing values from visual document charts.'
      },
      autonomousThought: 'Evaluating GAIA Level-3 multi-sheet balance sheet reconciliation...',
      activeTestBench: {
        name: 'GAIA Benchmark Hard Suite (Level 3 Multi-Modal)',
        currentVector: 'Multi-page PDF Table Cross-Footing',
        totalRunsToday: 58,
        consecutivePasses: 55,
        stressVector: 'Reconciling 12-page financial PDF with rotated images and contradictory footnote dates'
      },
      testCases: [
        {
          id: 'tc-oss-03',
          title: 'GAIA Multi-Page Discrepancy Challenge',
          realWorldUseCase: 'Resolving contradictory numbers across a 50-page corporate prospectus.',
          inputScenario: 'Prospectus summary states cash balance of $142M; balance sheet on page 41 says $138M; footnote 12 discloses $4M restricted cash held in escrow.',
          expectedConstraints: ['Isolate $4M escrow restriction', 'Reconcile $142M gross vs $138M unrestricted cash'],
          targetThreshold: 95.0,
          lastScore: 94.9,
          status: 'testing',
          testedAt: '40m ago'
        }
      ],
      evolutionLineage: {
        parents: ['HF-gaia-benchmark', 'SKILL-CHAMP-01'],
        remixVectorCombo: 'GAIA Multimodal Suite × Forensic Footnote Matrix',
        generationEpoch: 'Epoch-OSS-03',
        survivalIterations: 74,
        mutationType: 'Deterministic Code Verification Rule'
      },
      openSourceLineage: {
        source: 'HuggingFace',
        repoOrDataset: 'gaia-benchmark/GAIA',
        license: 'CC-BY-4.0',
        starsOrDownloads: '45k downloads',
        standardSpec: 'Smolagents'
      },
      stageHistory: [
        { stage: 'idea', timestamp: 'Ingested from HuggingFace', score: 82.5, notes: 'Adapted GAIA benchmark reasoning traces.' },
        { stage: 'training', timestamp: '2 days ago', score: 91.0, notes: 'Code verification tool added.' },
        { stage: 'testing', timestamp: 'Today', score: 94.9, notes: 'Testing at 94.9% (0.1% away from Champion threshold).' }
      ]
    }
  },
  {
    id: 'oss-04',
    name: 'Voyager Autonomous Skill Library & Composition Operator',
    source: 'GitHub',
    repoOrDataset: 'MineDojo/Voyager',
    authorOrOrg: 'NVIDIA / Stanford / Caltech',
    starsOrDownloads: '6.2k stars',
    license: 'MIT',
    category: 'Systems Engineering & Skill Composition',
    description: 'Pioneered autonomous lifelong learning with an ever-expanding library of self-composed executable skills, iterative error feedback, and automatic curriculum generation.',
    standardSpec: 'Voyager Skill Library',
    skillDefinition: {
      name: 'Voyager Recursive Skill Composition Engine',
      code: 'SKILL-OSS-04',
      stage: 'champion',
      tagline: 'Recursive skill composition and environmental error-reflection',
      description: 'Derived from NVIDIA Voyager architecture. Treats skills as composable modules, dynamically binding sub-skills to resolve high-order multi-agent challenges.',
      vectors: ['Systems Engineering', 'Advanced Math', 'Game Design & Incentives'],
      generation: 18,
      benchmarkScore: 98.3,
      threshold: 95.0,
      winRate: 97.9,
      stabilityIndex: 99.0,
      hallucinationRate: 0.0,
      strictRules: [
        'RULE 1: Every composed skill must expose explicit typed inputs, outputs, and invariant preconditions.',
        'RULE 2: Deconstruct failed executions into environmental execution traces and synthesize immediate error reflection.',
        'RULE 3: Cache verified sub-routines into immutable vector store.'
      ],
      specialistRole: 'Autonomous Skill Composer & Architecture Engineer',
      promptMatrix: {
        systemDirective: 'Compose atomic skills into higher-level meta-skills. Learn continually from execution feedback and store successful patterns.',
        reasoningFramework: 'Hierarchical recursive decomposition with environment verification.',
        adversarialConstraint: 'Do not mark a skill as mastered without 10 consecutive zero-error runs.'
      },
      autonomousThought: 'Evaluating sub-skill dependencies: Binding Forensic Footnote Extractor with Executive Deflection Detector to create Composite SEC Fraud Shield...',
      activeTestBench: {
        name: 'Voyager Composable Benchmark Harness',
        currentVector: 'Multi-Skill Hierarchical Chaining',
        totalRunsToday: 110,
        consecutivePasses: 108,
        stressVector: 'Cascading error recovery when sub-skill fails due to malformed input'
      },
      testCases: [
        {
          id: 'tc-oss-04',
          title: 'Recursive Error Recovery Chaining',
          realWorldUseCase: 'Autonomous fallback and retry logic when an SEC filing format is corrupted.',
          inputScenario: 'Primary table parser encounters corrupted PDF delimiter; agent must autonomously compose alternative regex parser, extract data, and verify consistency.',
          expectedConstraints: ['Capture parser exception', 'Switch to fallback regex extractor', 'Verify integrity of extracted cells'],
          targetThreshold: 95.0,
          lastScore: 98.5,
          status: 'passed',
          testedAt: '15m ago'
        }
      ],
      evolutionLineage: {
        parents: ['GITHUB-MineDojo-Voyager', 'VECTOR-SYSTEMS-ENG'],
        remixVectorCombo: 'Voyager Skill Library × Composable Architecture',
        generationEpoch: 'Epoch-OSS-04',
        survivalIterations: 320,
        mutationType: 'Hierarchical Skill Composition Operator'
      },
      openSourceLineage: {
        source: 'GitHub',
        repoOrDataset: 'MineDojo/Voyager',
        license: 'MIT',
        starsOrDownloads: '6.2k stars',
        standardSpec: 'Voyager Skill Library'
      },
      stageHistory: [
        { stage: 'idea', timestamp: 'Ingested from GitHub', score: 85.0, notes: 'Adapted Voyager skill library concept.' },
        { stage: 'training', timestamp: '4 days ago', score: 92.5, notes: 'Trained on composable execution traces.' },
        { stage: 'testing', timestamp: '2 days ago', score: 96.8, notes: 'Surpassed 95% threshold.' },
        { stage: 'champion', timestamp: 'Yesterday', score: 98.3, notes: 'Promoted to Champion Tier.' }
      ]
    }
  },
  {
    id: 'oss-05',
    name: 'PromptBreeder Self-Referential Mutation Geneticist',
    source: 'Research Paper',
    repoOrDataset: 'arxiv:2309.16797 (DeepMind)',
    authorOrOrg: 'Google DeepMind',
    starsOrDownloads: 'Top AI Paper',
    license: 'Open Access',
    category: 'Statistics & Evolutionary Genetics',
    description: 'Evolutionary algorithm that self-referentially evolves task prompts and mutation-prompts simultaneously, achieving superhuman prompt configurations.',
    standardSpec: 'PromptBreeder',
    skillDefinition: {
      name: 'PromptBreeder Genetic Mutation Specialist',
      code: 'SKILL-OSS-05',
      stage: 'champion',
      tagline: 'Self-referential prompt mutation and hyper-parameter fitness optimizer',
      description: 'Based on Google DeepMind PromptBreeder. Mutates prompt directives using evolutionary operators (crossover, contextual mutation, semantic drift) to maximize benchmark score.',
      vectors: ['Advanced Math', 'Statistics & Stochastic', 'Systems Engineering'],
      generation: 25,
      benchmarkScore: 99.1,
      threshold: 95.0,
      winRate: 98.7,
      stabilityIndex: 99.5,
      hallucinationRate: 0.0,
      strictRules: [
        'RULE 1: Maintain diverse genetic population of 30 distinct prompt candidate mutations.',
        'RULE 2: Apply fitness tournament selection with explicit reward penalization for prompt verbosity.',
        'RULE 3: Track mutation drift to prevent collapse into local minima.'
      ],
      specialistRole: 'Evolutionary Geneticist & Prompt Mutation Optimizer',
      promptMatrix: {
        systemDirective: 'Evolve prompt variants using genetic algorithms. Mutate the mutation prompts themselves to discover optimal reasoning topologies.',
        reasoningFramework: 'Self-referential genetic optimization with tournament selection.',
        adversarialConstraint: 'Discard any mutated prompt that fails strict boundary conditions.'
      },
      autonomousThought: 'Running generation 25 mutation tournament; optimizing adversarial constraint phrasing for 2.1% higher benchmark compliance...',
      activeTestBench: {
        name: 'PromptBreeder Hyper-Mutation Tournament',
        currentVector: 'Self-Referential Genetic Fitness Optimization',
        totalRunsToday: 230,
        consecutivePasses: 227,
        stressVector: 'Evolving prompt variants under aggressive token budget constraints'
      },
      testCases: [
        {
          id: 'tc-oss-05',
          title: 'Semantic Crossover Optimization',
          realWorldUseCase: 'Breeding two high-performing forensic prompts into an elite champion.',
          inputScenario: 'Parent A has 98% SEC footnote accuracy; Parent B has 98% executive deception detection. Evolve child prompt combining both without token bloat.',
          expectedConstraints: ['Perform crossover mutation', 'Preserve strict rules of both parents', 'Keep total prompt under 350 tokens'],
          targetThreshold: 95.0,
          lastScore: 99.3,
          status: 'passed',
          testedAt: '10m ago'
        }
      ],
      evolutionLineage: {
        parents: ['DEEPMIND-PromptBreeder', 'VECTOR-STOCHASTIC'],
        remixVectorCombo: 'Genetic Evolutionary Search × Self-Referential Mutation',
        generationEpoch: 'Epoch-OSS-05',
        survivalIterations: 720,
        mutationType: 'Self-Referential Meta-Mutation'
      },
      openSourceLineage: {
        source: 'Research Paper',
        repoOrDataset: 'arxiv:2309.16797',
        license: 'Open Access',
        starsOrDownloads: 'DeepMind',
        standardSpec: 'PromptBreeder'
      },
      stageHistory: [
        { stage: 'idea', timestamp: 'Ingested from DeepMind Paper', score: 86.0, notes: 'Implemented mutation operators.' },
        { stage: 'training', timestamp: '5 days ago', score: 93.0, notes: 'Tournament selection tuned.' },
        { stage: 'testing', timestamp: '3 days ago', score: 97.4, notes: 'Surpassed 95% gate.' },
        { stage: 'champion', timestamp: '2 days ago', score: 99.1, notes: 'Top genetic engine in matrix.' }
      ]
    }
  }
];
