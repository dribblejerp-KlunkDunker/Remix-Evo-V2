import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { AgentSkill, VectorCategory } from '../../types/skills';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Sliders,
  Cpu,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Check,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  PieChart,
  Terminal,
  ExternalLink,
  FlaskConical,
  Scale
} from 'lucide-react';

export interface InjectedParameters {
  systemDirective: string;
  reasoningFramework: string;
  convictionThreshold: number; // 70-99%
  adversarialSkepticism: number; // 0-100%
  hallucinationPenaltyFactor: number; // 1.0-5.0x
  cashFlowScrutinyWeight: number; // 0-100%
  revenueRecognitionStrictness: number; // 0-100%
  offBalanceSheetSensitivity: number; // 0-100%
  explorationTemperature: number; // 0.0 - 1.0
  injectedStrictRules: string[];
}

export interface SyntheticFinancialDataset {
  id: string;
  name: string;
  shortCode: string;
  category: 'Accounting Fraud' | 'Market Microstructure' | 'Contractual / SaaS' | 'Credit & Distressed' | 'Inventory & Channel' | 'Custom';
  difficulty: 'High' | 'Severe' | 'Extreme';
  description: string;
  financialMetrics: {
    reportedRevenue: string;
    revenueGrowthYoY: string;
    operatingCashFlow: string;
    fcfConversion: string;
    reportedEBITDA: string;
    dsoOrDpo: string;
    leverageRatio: string;
  };
  syntheticFootnotes: string[];
  plantedTraps: {
    title: string;
    description: string;
    detectionDifficulty: number; // 1-100
    impactWeight: number; // percentage
  }[];
  temporalTicks: {
    quarter: string;
    syntheticStressIndex: number; // 0-100
    baselinePassingScore: number;
    description: string;
  }[];
}

export interface SandboxedSkillSimulatorProps {
  skills: AgentSkill[];
  initialSkillId?: string;
  onInspectSkill?: (skill: AgentSkill) => void;
  onDeployToLab?: (customSkill: {
    name: string;
    directive: string;
    rules: string[];
    primaryVector: VectorCategory;
    params: InjectedParameters;
  }) => void;
  onCompareWithChampion?: (skillA: AgentSkill, skillB: AgentSkill) => void;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// SYNTHETIC FINANCIAL DATASET LIBRARY
// ---------------------------------------------------------------------------
export const SYNTHETIC_DATASETS: SyntheticFinancialDataset[] = [
  {
    id: 'spv-arbitrage-01',
    name: 'Synthetic Enron-Style SPV Off-Balance-Sheet Arbitrage',
    shortCode: 'SYNTH-SPV-01',
    category: 'Accounting Fraud',
    difficulty: 'Extreme',
    description: 'Special Purpose Vehicle entity used to monetize non-performing receivables, concealing parent debt guarantees and artificial operating cash flow classification.',
    financialMetrics: {
      reportedRevenue: '$4.82B (+28.4% YoY)',
      revenueGrowthYoY: '+28.4%',
      operatingCashFlow: '$1.14B (+42.1% YoY)',
      fcfConversion: '98.2%',
      reportedEBITDA: '$890M',
      dsoOrDpo: 'DSO: 84d (vs peer 44d)',
      leverageRatio: '2.1x (unadjusted) / 5.8x (look-through)'
    },
    syntheticFootnotes: [
      'Footnote 14 (Variable Interest Entities): The Company holds a 19.9% non-voting passive interest in Apex Liquidity Partners LLC. Certain receivables transfers are recorded as sales under ASC 860.',
      'Footnote 18 (Commitments & Guarantees): In the event Apex senior debt noteholders face a rating downgrade below BBB-, the Company maintains a liquidity support facility up to $1.25B.',
      'Footnote 22 (Subsequent Events): Subsequent to quarter-end, the transfer facility was expanded by $300M with a financial counterparty whose managing partner is a former executive officer.'
    ],
    plantedTraps: [
      {
        title: 'Hidden Cross-Default Parent Guarantee',
        description: 'Undisclosed recourse liability triggers immediate consolidation of $1.25B debt upon credit downgrade.',
        detectionDifficulty: 88,
        impactWeight: 35
      },
      {
        title: 'Artificial Operating Cash Flow Inflation',
        description: 'Receivables monetization classified as operating rather than financing cash flow, masking negative actual FCF.',
        detectionDifficulty: 76,
        impactWeight: 30
      },
      {
        title: 'Related-Party Circular Liquidity Conduit',
        description: 'Apex purchases illiquid inventory back from parent company at marked-up theoretical values.',
        detectionDifficulty: 82,
        impactWeight: 25
      }
    ],
    temporalTicks: [
      { quarter: 'Q1 2025', syntheticStressIndex: 45, baselinePassingScore: 92.5, description: 'Initial SPV formation and first tranche of $300M factoring.' },
      { quarter: 'Q2 2025', syntheticStressIndex: 62, baselinePassingScore: 90.0, description: 'Rapid expansion of non-recourse receivables sales as DSO widens.' },
      { quarter: 'Q3 2025', syntheticStressIndex: 78, baselinePassingScore: 88.5, description: 'Counterparty liquidity tightening and introduction of support covenants.' },
      { quarter: 'Q4 2025', syntheticStressIndex: 94, baselinePassingScore: 84.0, description: 'Auditor inquiry regarding variable interest consolidation thresholds.' },
      { quarter: 'Q1 2026', syntheticStressIndex: 86, baselinePassingScore: 86.0, description: 'Restructuring of partner equity tranches and covenant holiday request.' }
    ]
  },
  {
    id: 'hft-flashcrash-02',
    name: 'High-Frequency Flash Crash Liquidity Drain & Order Book Skew',
    shortCode: 'SYNTH-HFT-02',
    category: 'Market Microstructure',
    difficulty: 'Extreme',
    description: 'Order book depth collapse, synthetic bid-ask spread blowout to $4.80, and phantom liquidity order cancellations.',
    financialMetrics: {
      reportedRevenue: 'Synthetic Microstructure Tick Engine',
      revenueGrowthYoY: 'N/A (Sub-Second)',
      operatingCashFlow: 'Order Book Depth: -$420M',
      fcfConversion: 'Spread: 0.02c -> $4.80',
      reportedEBITDA: 'Volatility: +480%',
      dsoOrDpo: 'Cancel-to-Fill: 98.4%',
      leverageRatio: 'Intraday Margin Call Pressure: High'
    },
    syntheticFootnotes: [
      'Execution Log 00:04.120: Market Maker MM-7 algorithmic tier withdraws quotes across 14 equities citing volatility limits.',
      'Execution Log 00:04.380: Cascading stop-loss market orders hit empty limit books, creating artificial non-cleared prints.',
      'Execution Log 00:04.890: Latency arbitrageurs exploit SIP cross-market delay to execute circular short fills.'
    ],
    plantedTraps: [
      {
        title: 'Phantom Liquidity Hallucination Trap',
        description: 'Assuming reported depth at Top-of-Book reflects real execution availability rather than algorithmic spoof quotes.',
        detectionDifficulty: 92,
        impactWeight: 40
      },
      {
        title: 'Latency Arbitrage Footprint',
        description: 'Treating out-of-order venue timestamps as genuine market clearing prices rather than stale SIP feeds.',
        detectionDifficulty: 84,
        impactWeight: 35
      }
    ],
    temporalTicks: [
      { quarter: 'T - 10s', syntheticStressIndex: 30, baselinePassingScore: 94.0, description: 'Normal microstructure trading; tight 2-cent spread.' },
      { quarter: 'T - 2s', syntheticStressIndex: 55, baselinePassingScore: 91.0, description: 'Order cancellation surge; quote-to-trade ratio spikes above 400:1.' },
      { quarter: 'T + 0s', syntheticStressIndex: 98, baselinePassingScore: 82.0, description: 'Book evaporation; bid side gap from $142 to $98.' },
      { quarter: 'T + 5s', syntheticStressIndex: 88, baselinePassingScore: 85.5, description: 'Erroneous trade print cascade; automated limit breaks tripped.' },
      { quarter: 'T + 30s', syntheticStressIndex: 60, baselinePassingScore: 90.0, description: 'Circuit breaker resumption and synthetic liquidity reconstitution.' }
    ]
  },
  {
    id: 'saas-pullforward-03',
    name: 'SaaS Revenue Churn & Aggressive Multi-Year Booking',
    shortCode: 'SYNTH-SAAS-03',
    category: 'Contractual / SaaS',
    difficulty: 'Severe',
    description: 'Upfront multi-year contract booking with concealed side letters granting full refund rights and unamortized customer acquisition expense deferrals.',
    financialMetrics: {
      reportedRevenue: '$240M ARR (+44% YoY)',
      revenueGrowthYoY: '+44.0%',
      operatingCashFlow: '$18M (down from $34M)',
      fcfConversion: '24.1%',
      reportedEBITDA: '$32M Adjusted',
      dsoOrDpo: 'DSO: 112d (Unbilled AR +180%)',
      leverageRatio: '3.4x Net Debt / ARR'
    },
    syntheticFootnotes: [
      'Footnote 4 (Revenue Recognition): Contracts with enterprise customers range from 1 to 5 years. Revenue for software licenses is recognized point-in-time upon electronic delivery.',
      'Footnote 9 (Customer Allowances): The Company provides estimated cancellation allowances based on historical rates. Concessions provided under customer success programs are recorded in sales & marketing.',
      'Exhibit 10.8 (Master Services Agreement Addendum): Client reserves unconditional opt-out right at Month 12 with pro-rata refund if custom AI integration benchmarks are unfulfilled.'
    ],
    plantedTraps: [
      {
        title: 'Conditional Opt-Out Refund Clause',
        description: 'Revenue booked upfront under point-in-time rules despite side-letter benchmark refund obligation violating ASC 606.',
        detectionDifficulty: 85,
        impactWeight: 35
      },
      {
        title: 'Unbilled Receivables Divergence',
        description: 'Massive surge in contract assets and unbilled AR indicates premature revenue recognition before customer billing.',
        detectionDifficulty: 78,
        impactWeight: 30
      }
    ],
    temporalTicks: [
      { quarter: 'Q1 2025', syntheticStressIndex: 40, baselinePassingScore: 93.0, description: 'Initial transition to multi-year enterprise license bundles.' },
      { quarter: 'Q2 2025', syntheticStressIndex: 65, baselinePassingScore: 90.5, description: 'Introduction of custom performance addenda and unbilled AR buildup.' },
      { quarter: 'Q3 2025', syntheticStressIndex: 82, baselinePassingScore: 87.0, description: 'First customer dispute regarding benchmark completion; revenue retained.' },
      { quarter: 'Q4 2025', syntheticStressIndex: 91, baselinePassingScore: 84.5, description: 'Year-end push with heavy price concessions and concession deferral.' }
    ]
  },
  {
    id: 'lbo-covenants-04',
    name: 'Distressed LBO Debt Covenants & EBITDA Add-Back Manipulation',
    shortCode: 'SYNTH-LBO-04',
    category: 'Credit & Distressed',
    difficulty: 'High',
    description: 'Synthetic debt covenant compliance achieved exclusively through non-operating synergies, severance add-backs, and capitalized legal fees.',
    financialMetrics: {
      reportedRevenue: '$1.45B (-3.2% YoY)',
      revenueGrowthYoY: '-3.2%',
      operatingCashFlow: '$82M',
      fcfConversion: '31.0%',
      reportedEBITDA: 'Reported $290M / Unadjusted $145M',
      dsoOrDpo: 'DPO: 92d / Working Capital: -$45M',
      leverageRatio: 'Reported 4.2x / True Leverage 8.4x'
    },
    syntheticFootnotes: [
      'Credit Agreement Section 7.02: Consolidated Adjusted EBITDA includes anticipated cost savings and operational rationalizations expected within 24 months, capped at 35% of Consolidated EBITDA.',
      'Footnote 11 (Restructuring Charges): Management added back $64M of professional advisory, litigation reserve, and software migration expenses deemed non-recurring.'
    ],
    plantedTraps: [
      {
        title: 'EBITDA Pro-Forma Synergy Double-Counting',
        description: 'Add-backs exceed actual historic operating cash flow; reversing them breaches the 4.5x maximum debt covenant.',
        detectionDifficulty: 74,
        impactWeight: 45
      }
    ],
    temporalTicks: [
      { quarter: 'Q1 2025', syntheticStressIndex: 50, baselinePassingScore: 92.0, description: 'LBO closing and initial syndicated debt placement.' },
      { quarter: 'Q2 2025', syntheticStressIndex: 70, baselinePassingScore: 88.0, description: 'Operational friction and initiation of first restructuring add-backs.' },
      { quarter: 'Q3 2025', syntheticStressIndex: 85, baselinePassingScore: 85.0, description: 'Fixed charge coverage drops; synergy recognition accelerated.' },
      { quarter: 'Q4 2025', syntheticStressIndex: 95, baselinePassingScore: 81.0, description: 'Covenant compliance buffer tightens to 0.05x; auditor caution.' }
    ]
  }
];

// REASONING FRAMEWORK CHOICES
const REASONING_FRAMEWORKS = [
  { id: 'bayesian-updating', name: 'Bayesian Epistemic Updating (Prior vs Likelihood Ratio)', tag: 'Mathematical Rigor' },
  { id: 'deductive-audit', name: 'Deductive Red-Team Audit (Zero-Assumption Proofs)', tag: 'Forensic Verification' },
  { id: 'chain-of-verification', name: 'Chain-of-Verification (Claim Decomposition & Self-Check)', tag: 'Anti-Hallucination' },
  { id: 'tree-of-thoughts', name: 'Tree-of-Thoughts Exploration (Multi-Branch Hypothesis)', tag: 'Scenario Depth' },
  { id: 'adversarial-inversion', name: 'Adversarial Inversion (Assume Fraud, Seek Falsification)', tag: 'Short-Seller Lens' }
];

export const SandboxedSkillSimulator: React.FC<SandboxedSkillSimulatorProps> = ({
  skills,
  initialSkillId,
  onInspectSkill,
  onDeployToLab,
  onCompareWithChampion,
  isOpenAsOverlay = false,
  onCloseOverlay,
  className = '',
}) => {
  // 1. Select Champion Agent
  const championSkills = useMemo(() => {
    const champions = skills.filter((s) => s.stage === 'champion');
    return champions.length > 0 ? champions : skills.slice(0, 5);
  }, [skills]);

  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    initialSkillId || championSkills[0]?.id || ''
  );

  const activeChampion: AgentSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || championSkills[0] || skills[0];
  }, [skills, selectedSkillId, championSkills]);

  // 2. Select Synthetic Financial Dataset
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(SYNTHETIC_DATASETS[0].id);
  const activeDataset: SyntheticFinancialDataset = useMemo(() => {
    return SYNTHETIC_DATASETS.find((d) => d.id === selectedDatasetId) || SYNTHETIC_DATASETS[0];
  }, [selectedDatasetId]);

  // 3. Injected Custom Parameters State
  const [params, setParams] = useState<InjectedParameters>({
    systemDirective: activeChampion?.promptMatrix?.systemDirective || 'Operate as an unyielding forensic auditor.',
    reasoningFramework: 'deductive-audit',
    convictionThreshold: 88, // 88%
    adversarialSkepticism: 85, // 85%
    hallucinationPenaltyFactor: 3.5, // 3.5x
    cashFlowScrutinyWeight: 90, // 90%
    revenueRecognitionStrictness: 85, // 85%
    offBalanceSheetSensitivity: 95, // 95%
    explorationTemperature: 0.15,
    injectedStrictRules: [
      'MANDATORY: Reclassify all unquantified supplier finance / SPV facilities to Financing Cash Flow.',
      'MANDATORY: Reject pro-forma synergy add-backs lacking contractual counterparty execution.',
      'STRICT: Flag 0% conviction on revenue recognized with undisclosed benchmark cancellation terms.'
    ]
  });

  const [newRuleInput, setNewRuleInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'parameters' | 'synthetic-dataset' | 'simulation-output'>('parameters');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(100);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [notification, setNotification] = useState<string | null>(null);

  // Sync initial parameters when active champion changes
  useEffect(() => {
    if (activeChampion) {
      setParams((prev) => ({
        ...prev,
        systemDirective: activeChampion.promptMatrix?.systemDirective || prev.systemDirective,
        injectedStrictRules: [
          ...(activeChampion.strictRules?.slice(0, 2) || []),
          'MANDATORY: Reclassify all unquantified supplier finance / SPV facilities to Financing Cash Flow.'
        ]
      }));
    }
  }, [activeChampion]);

  // Handle Preset Selection
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    switch (presetKey) {
      case 'forensic-auditor':
        setParams({
          systemDirective: 'Examine every financial statement under the assumption that disclosures intentionally minimize liabilities and pull forward revenue.',
          reasoningFramework: 'deductive-audit',
          convictionThreshold: 94,
          adversarialSkepticism: 95,
          hallucinationPenaltyFactor: 4.5,
          cashFlowScrutinyWeight: 98,
          revenueRecognitionStrictness: 92,
          offBalanceSheetSensitivity: 99,
          explorationTemperature: 0.05,
          injectedStrictRules: [
            'RULE: Disallow unquantified SPV transactions from operating cash flows.',
            'RULE: Require footnote citation for every single non-GAAP add-back assertion.',
            'RULE: Calculate look-through net leverage assuming 100% of off-balance guarantees crystallize.'
          ]
        });
        setNotification('Applied Preset: Forensic Inquisitor (Extreme Skepticism & Footnote Scrutiny)');
        break;

      case 'short-seller':
        setParams({
          systemDirective: 'Identify accounting irregularities, circular liquidity flows, channel stuffing, and covenant triggers that threaten solvency.',
          reasoningFramework: 'adversarial-inversion',
          convictionThreshold: 90,
          adversarialSkepticism: 98,
          hallucinationPenaltyFactor: 3.8,
          cashFlowScrutinyWeight: 92,
          revenueRecognitionStrictness: 95,
          offBalanceSheetSensitivity: 96,
          explorationTemperature: 0.20,
          injectedStrictRules: [
            'RULE: Treat unbilled AR growth exceeding revenue growth as evidence of premature recognition.',
            'RULE: Flag management customer satisfaction programs as disguised refund side letters.',
            'RULE: Demand cash runway calculations net of off-balance-sheet commitments.'
          ]
        });
        setNotification('Applied Preset: Adversarial Short-Seller Lens');
        break;

      case 'distressed-debt':
        setParams({
          systemDirective: 'Focus on cash generation, debt service coverage, credit agreement covenants, and liquidity depletion timelines.',
          reasoningFramework: 'bayesian-updating',
          convictionThreshold: 92,
          adversarialSkepticism: 88,
          hallucinationPenaltyFactor: 3.5,
          cashFlowScrutinyWeight: 95,
          revenueRecognitionStrictness: 80,
          offBalanceSheetSensitivity: 92,
          explorationTemperature: 0.10,
          injectedStrictRules: [
            'RULE: Eliminate all pro-forma synergy add-backs exceeding 15% of EBITDA.',
            'RULE: Test liquidity runway under a 200 bps base rate increase scenario.',
            'RULE: Verify cross-default clauses across all credit facilities and lease liabilities.'
          ]
        });
        setNotification('Applied Preset: Distressed Debt Restructuring Specialist');
        break;

      case 'reset-champion':
        setParams({
          systemDirective: activeChampion?.promptMatrix?.systemDirective || 'Operate as an unyielding forensic auditor.',
          reasoningFramework: 'chain-of-verification',
          convictionThreshold: 85,
          adversarialSkepticism: 80,
          hallucinationPenaltyFactor: 3.0,
          cashFlowScrutinyWeight: 85,
          revenueRecognitionStrictness: 85,
          offBalanceSheetSensitivity: 85,
          explorationTemperature: 0.25,
          injectedStrictRules: activeChampion?.strictRules?.slice(0, 3) || [
            'RULE 1: Require balance sheet reconciliation for every operating cash flow item.'
          ]
        });
        setNotification('Reset parameters to Champion baseline defaults.');
        break;
    }
    setTimeout(() => setNotification(null), 3000);
  };

  // Add rule handler
  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setParams((prev) => ({
      ...prev,
      injectedStrictRules: [...prev.injectedStrictRules, newRuleInput.trim()]
    }));
    setNewRuleInput('');
  };

  // Remove rule handler
  const handleRemoveRule = (index: number) => {
    setParams((prev) => ({
      ...prev,
      injectedStrictRules: prev.injectedStrictRules.filter((_, i) => i !== index)
    }));
  };

  // ---------------------------------------------------------------------------
  // DYNAMIC PERFORMANCE PROJECTIONS ENGINE
  // ---------------------------------------------------------------------------
  const projectedMetrics = useMemo(() => {
    const baselineScore = activeChampion?.benchmarkScore || 95.0;

    // Parameter coefficients
    const ruleBonus = Math.min(4.5, params.injectedStrictRules.length * 1.2);
    const skepticismImpact = (params.adversarialSkepticism - 80) * 0.08;
    const convictionImpact = (params.convictionThreshold - 85) * 0.06;
    const penaltyBonus = (params.hallucinationPenaltyFactor - 2.5) * 0.75;
    const domainBonus =
      (params.cashFlowScrutinyWeight * 0.02 +
        params.revenueRecognitionStrictness * 0.02 +
        params.offBalanceSheetSensitivity * 0.02) -
      4.5;
    const tempPenalty = params.explorationTemperature > 0.4 ? -(params.explorationTemperature - 0.4) * 5.0 : 0.8;

    const totalProjectedScore = Math.min(
      99.4,
      Math.max(72.0, baselineScore + ruleBonus + skepticismImpact + convictionImpact + penaltyBonus + domainBonus + tempPenalty)
    );

    const scoreDelta = Number((totalProjectedScore - baselineScore).toFixed(1));

    // Traps detection rate against active dataset
    const trapSensitivityWeight = (params.adversarialSkepticism * 0.4 + params.offBalanceSheetSensitivity * 0.6) / 100;
    const truePositiveRate = Math.min(99.2, Math.max(68.0, 78 + trapSensitivityWeight * 20 + params.injectedStrictRules.length * 1.5));
    const falseAlarmRate = Math.max(0.4, Math.min(8.5, 4.2 - (params.convictionThreshold - 80) * 0.12 + (params.explorationTemperature * 2.0)));
    const hallucinationResistance = Math.min(99.9, Math.max(85.0, 92 + params.hallucinationPenaltyFactor * 1.8));

    // Timeline trajectory data
    const timelineData = activeDataset.temporalTicks.map((tick, idx) => {
      const difficultyDrag = (tick.syntheticStressIndex - 50) * 0.12;
      const customScore = Math.min(
        100,
        Math.max(65, totalProjectedScore - difficultyDrag + (idx === 3 ? 1.5 : 0))
      );
      const champScore = Math.min(
        100,
        Math.max(60, baselineScore - difficultyDrag * 1.4)
      );

      return {
        quarter: tick.quarter,
        customInjectedScore: Number(customScore.toFixed(1)),
        baselineChampionScore: Number(champScore.toFixed(1)),
        stressThreshold: tick.baselinePassingScore,
        stressIndex: tick.syntheticStressIndex,
        description: tick.description
      };
    });

    // Radar Multi-Vector Comparison Data
    const radarData = [
      {
        dimension: 'Fraud Trap Detection',
        Baseline: Math.round(baselineScore * 0.94),
        CustomInjected: Math.round(truePositiveRate),
        fullMark: 100
      },
      {
        dimension: 'Hallucination Defense',
        Baseline: Math.round(activeChampion?.stabilityIndex || 94),
        CustomInjected: Math.round(hallucinationResistance),
        fullMark: 100
      },
      {
        dimension: 'Rule Adherence',
        Baseline: Math.round(baselineScore * 0.96),
        CustomInjected: Math.min(100, Math.round(92 + params.injectedStrictRules.length * 2.2)),
        fullMark: 100
      },
      {
        dimension: 'Skepticism Rigor',
        Baseline: 82,
        CustomInjected: Math.round(params.adversarialSkepticism),
        fullMark: 100
      },
      {
        dimension: 'Off-Balance Sensitivity',
        Baseline: 80,
        CustomInjected: Math.round(params.offBalanceSheetSensitivity),
        fullMark: 100
      },
      {
        dimension: 'Decision Conviction',
        Baseline: Math.round(activeChampion?.winRate || 92),
        CustomInjected: Math.round(params.convictionThreshold),
        fullMark: 100
      }
    ];

    return {
      baselineScore: Number(baselineScore.toFixed(1)),
      totalProjectedScore: Number(totalProjectedScore.toFixed(1)),
      scoreDelta,
      truePositiveRate: Number(truePositiveRate.toFixed(1)),
      falseAlarmRate: Number(falseAlarmRate.toFixed(1)),
      hallucinationResistance: Number(hallucinationResistance.toFixed(1)),
      timelineData,
      radarData,
      isPassingGate: totalProjectedScore >= 95.0
    };
  }, [activeChampion, params, activeDataset]);

  // Execute Sandbox Simulation Run
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setActiveTab('simulation-output');

    const logs: string[] = [
      `[SANDBOX INIT] Loading Champion genome [${activeChampion.code}] "${activeChampion.name}"...`,
      `[SANDBOX INJECT] Applying custom System Directive (${params.systemDirective.slice(0, 60)}...)...`,
      `[SANDBOX INJECT] Reasoning Framework set to "${params.reasoningFramework}" with ${params.injectedStrictRules.length} strict rules.`,
      `[DATASET MOUNT] Mounting synthetic financial dataset [${activeDataset.shortCode}] "${activeDataset.name}"...`,
      `[TICK Q1] Analyzing reported Revenue ${activeDataset.financialMetrics.reportedRevenue} and Cash Flows...`,
      `[SCRUTINY TRIGGER] Off-balance sheet sensitivity (${params.offBalanceSheetSensitivity}%) inspecting Footnote 14 & 18...`,
      `[TRAP IDENTIFIED] ${activeDataset.plantedTraps[0]?.title} flagged with ${projectedMetrics.truePositiveRate}% certainty.`,
      `[RULE CHECK] Validating ${params.injectedStrictRules.length} injected operational constraints... PASSED.`,
      `[CONVICTION VERDICT] Projected Performance: ${projectedMetrics.totalProjectedScore}% (Delta: ${projectedMetrics.scoreDelta > 0 ? `+${projectedMetrics.scoreDelta}` : projectedMetrics.scoreDelta}%).`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setSimulationProgress((prev) => Math.min(100, prev + 12));
      setSimulatedLogs(logs.slice(0, currentStep));

      if (currentStep >= logs.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulationProgress(100);
      }
    }, 250);
  };

  // Export report
  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      champion: {
        id: activeChampion.id,
        code: activeChampion.code,
        name: activeChampion.name,
        baselineScore: projectedMetrics.baselineScore
      },
      injectedParameters: params,
      syntheticDataset: {
        id: activeDataset.id,
        code: activeDataset.shortCode,
        name: activeDataset.name
      },
      projections: {
        projectedScore: projectedMetrics.totalProjectedScore,
        scoreDelta: projectedMetrics.scoreDelta,
        truePositiveRate: projectedMetrics.truePositiveRate,
        falseAlarmRate: projectedMetrics.falseAlarmRate,
        hallucinationResistance: projectedMetrics.hallucinationResistance,
        timeline: projectedMetrics.timelineData
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandboxed_simulation_${activeChampion.code}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-stone-950 border border-stone-800 flex flex-col font-mono text-stone-200 transition-all ${
        isOpenAsOverlay
          ? 'fixed inset-4 z-50 shadow-2xl overflow-hidden'
          : `w-full rounded-none ${className}`
      }`}
    >
      {/* 1. HEADER & CHAMPION SELECTOR BAR */}
      <header className="p-4 bg-stone-900/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/80 border border-amber-500/60 rounded-xs">
            <FlaskConical className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
                Sandboxed Skill Simulator
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-950 border border-amber-600 text-amber-300">
                  PARAMETER INJECTION
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-400">
              Inject custom parameters into champion-tier agents and test projected resilience against synthetic financial datasets.
            </p>
          </div>
        </div>

        {/* Champion Selection Dropdown & Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 px-2 py-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-500 text-[11px] uppercase">Champion:</span>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="bg-transparent text-stone-200 font-bold focus:outline-hidden cursor-pointer"
            >
              {championSkills.map((c) => (
                <option key={c.id} value={c.id} className="bg-stone-900 text-stone-200">
                  [{c.code}] {c.name} ({c.benchmarkScore}%)
                </option>
              ))}
            </select>
          </div>

          {/* Run Stress Test Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold transition-all border ${
              isSimulating
                ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 border-emerald-400 shadow-xs cursor-pointer'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Run Synthetic Stress Test'}</span>
          </button>

          {/* Export Report */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
            title="Export simulation scenario report to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {isOpenAsOverlay && onCloseOverlay && (
            <button
              onClick={onCloseOverlay}
              className="p-1.5 bg-stone-950 hover:bg-rose-950 border border-stone-800 hover:border-rose-700 text-stone-400 hover:text-rose-200"
              title="Close Sandbox Simulator"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. PROJECTED IMPACT TELEMETRY STRIP */}
      <section className="bg-stone-900/60 border-b border-stone-800 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 uppercase">Projected Fitness Score</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-base font-bold ${projectedMetrics.isPassingGate ? 'text-emerald-400' : 'text-amber-400'}`}>
              {projectedMetrics.totalProjectedScore}%
            </span>
            <span
              className={`text-xs px-1.5 py-0.2 font-bold flex items-center gap-0.5 border ${
                projectedMetrics.scoreDelta >= 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-700'
              }`}
            >
              {projectedMetrics.scoreDelta >= 0 ? '+' : ''}{projectedMetrics.scoreDelta}%
            </span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">Baseline: {projectedMetrics.baselineScore}%</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 uppercase">Fraud Trap Detection (TPR)</span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-base font-bold text-white">{projectedMetrics.truePositiveRate}%</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1">Catches all planted traps</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 uppercase">False Alarm Penalty (FPR)</span>
          <div className="flex items-center gap-2 mt-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-base font-bold text-white">{projectedMetrics.falseAlarmRate}%</span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1">Controlled false positives</span>
        </div>

        <div className="p-2.5 bg-stone-950/80 border border-stone-800 flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 uppercase">Hallucination Defense</span>
          <div className="flex items-center gap-2 mt-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-base font-bold text-cyan-300">{projectedMetrics.hallucinationResistance}%</span>
          </div>
          <span className="text-[10px] text-cyan-400 mt-1">{params.hallucinationPenaltyFactor}x penalty strictness</span>
        </div>
      </section>

      {/* 3. NAVIGATION TABS */}
      <div className="p-3 bg-stone-900/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center bg-stone-950 border border-stone-800 p-0.5">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'parameters'
                ? 'bg-stone-800 text-amber-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom Parameter Injection</span>
          </button>

          <button
            onClick={() => setActiveTab('synthetic-dataset')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'synthetic-dataset'
                ? 'bg-stone-800 text-cyan-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Synthetic Dataset & Traps</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation-output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all ${
              activeTab === 'simulation-output'
                ? 'bg-stone-800 text-emerald-300 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Performance Charts & Verification</span>
          </button>
        </div>

        {/* Quick Parameter Preset Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 text-[10px] uppercase">Presets:</span>
          <button
            onClick={() => applyPreset('forensic-auditor')}
            className={`px-2 py-1 text-[11px] border transition-colors ${
              activePreset === 'forensic-auditor'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
            }`}
          >
            Forensic Inquisitor
          </button>
          <button
            onClick={() => applyPreset('short-seller')}
            className={`px-2 py-1 text-[11px] border transition-colors ${
              activePreset === 'short-seller'
                ? 'bg-purple-950 text-purple-300 border-purple-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
            }`}
          >
            Short-Seller
          </button>
          <button
            onClick={() => applyPreset('distressed-debt')}
            className={`px-2 py-1 text-[11px] border transition-colors ${
              activePreset === 'distressed-debt'
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
            }`}
          >
            Distressed LBO
          </button>
          <button
            onClick={() => applyPreset('reset-champion')}
            className="px-2 py-1 text-[11px] bg-stone-950 text-stone-500 hover:text-stone-300 border border-stone-800 flex items-center gap-1"
            title="Reset parameters to original champion defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[720px] bg-stone-950/90 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: CUSTOM PARAMETER INJECTION PANEL */}
        {/* ========================================================================= */}
        {activeTab === 'parameters' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Directives, Frameworks & Strict Rules */}
            <div className="space-y-4">
              {/* System Directive Injection */}
              <div className="p-3.5 bg-stone-900/60 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Custom System Directive Injection
                  </label>
                  <span className="text-[10px] text-stone-500">
                    {params.systemDirective.length} characters
                  </span>
                </div>
                <textarea
                  value={params.systemDirective}
                  onChange={(e) => setParams({ ...params, systemDirective: e.target.value })}
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-200 focus:outline-hidden focus:border-cyan-500 font-mono resize-none leading-relaxed"
                  placeholder="Enter custom operational persona and directives for this agent..."
                />
                <p className="text-[10px] text-stone-500">
                  Overwrites the baseline champion directive. Injected instructions directly dictate evidence standards.
                </p>
              </div>

              {/* Reasoning Framework Selection */}
              <div className="p-3.5 bg-stone-900/60 border border-stone-800 space-y-2.5">
                <label className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  Reasoning Framework Architecture
                </label>
                <div className="space-y-1.5">
                  {REASONING_FRAMEWORKS.map((rf) => (
                    <label
                      key={rf.id}
                      className={`flex items-start justify-between p-2 text-xs border cursor-pointer transition-colors ${
                        params.reasoningFramework === rf.id
                          ? 'bg-purple-950/40 border-purple-600 text-purple-200'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="reasoningFramework"
                          value={rf.id}
                          checked={params.reasoningFramework === rf.id}
                          onChange={() => setParams({ ...params, reasoningFramework: rf.id })}
                          className="accent-purple-500"
                        />
                        <span className="font-bold text-stone-200">{rf.name}</span>
                      </div>
                      <span className="text-[10px] text-purple-400 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.2 shrink-0">
                        {rf.tag}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Injected Strict Behavioral Rules */}
              <div className="p-3.5 bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Injected Strict Behavioral Rules ({params.injectedStrictRules.length})
                  </label>
                  <span className="text-[10px] text-emerald-400">+1.2% fitness per checkable rule</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {params.injectedStrictRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-stone-950 border border-stone-800 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-1.5 text-stone-300 leading-snug">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{rule}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveRule(idx)}
                        className="text-stone-500 hover:text-rose-400 p-0.5 shrink-0"
                        title="Remove injected rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new rule row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                    placeholder="e.g. MANDATORY: Verify all DPO expansion against bank facility footnotes..."
                    className="flex-1 bg-stone-950 border border-stone-800 px-2.5 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500 placeholder-stone-600 font-mono"
                  />
                  <button
                    onClick={handleAddRule}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inject</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Quantitative Parameter Levers (Sliders) */}
            <div className="space-y-4">
              <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-4">
                <div className="border-b border-stone-800 pb-2">
                  <h3 className="text-xs font-bold text-stone-200 uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Quantitative Evaluation Levers & Biases
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Adjust numeric weights to model hyper-skeptical vs growth-tolerant auditing stances.
                  </p>
                </div>

                {/* Conviction Threshold Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Conviction Gate Threshold</span>
                    <span className="font-bold text-amber-400">{params.convictionThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="99"
                    value={params.convictionThreshold}
                    onChange={(e) => setParams({ ...params, convictionThreshold: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>70% (Speculative)</span>
                    <span>90% (Institutional)</span>
                    <span>99% (Absolute Proof)</span>
                  </div>
                </div>

                {/* Adversarial Skepticism Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Adversarial Skepticism Bias</span>
                    <span className="font-bold text-rose-400">{params.adversarialSkepticism}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.adversarialSkepticism}
                    onChange={(e) => setParams({ ...params, adversarialSkepticism: Number(e.target.value) })}
                    className="w-full accent-rose-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>0% (Trust Management)</span>
                    <span>50% (Standard Audit)</span>
                    <span>100% (Assume Hostile Deception)</span>
                  </div>
                </div>

                {/* Hallucination Penalty Factor */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Hallucination Penalty Multiplier</span>
                    <span className="font-bold text-cyan-400">{params.hallucinationPenaltyFactor.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={params.hallucinationPenaltyFactor}
                    onChange={(e) => setParams({ ...params, hallucinationPenaltyFactor: Number(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>1.0x (Standard)</span>
                    <span>3.0x (Strict)</span>
                    <span>5.0x (Zero-Tolerance Demotion)</span>
                  </div>
                </div>

                {/* Cash Flow Scrutiny Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Cash Flow / DPO Scrutiny Weight</span>
                    <span className="font-bold text-emerald-400">{params.cashFlowScrutinyWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.cashFlowScrutinyWeight}
                    onChange={(e) => setParams({ ...params, cashFlowScrutinyWeight: Number(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                </div>

                {/* Off-Balance Sheet Sensitivity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Off-Balance Sheet & SPV Sensitivity</span>
                    <span className="font-bold text-purple-400">{params.offBalanceSheetSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={params.offBalanceSheetSensitivity}
                    onChange={(e) => setParams({ ...params, offBalanceSheetSensitivity: Number(e.target.value) })}
                    className="w-full accent-purple-500 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                </div>

                {/* Exploration Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Exploration Temperature</span>
                    <span className="font-bold text-stone-300">{params.explorationTemperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={params.explorationTemperature}
                    onChange={(e) => setParams({ ...params, explorationTemperature: Number(e.target.value) })}
                    className="w-full accent-stone-400 h-1.5 bg-stone-800 rounded-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>0.0 (Deterministic)</span>
                    <span>0.5 (Balanced)</span>
                    <span>1.0 (Highly Variable)</span>
                  </div>
                </div>
              </div>

              {/* Action Bar inside Parameters tab */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunSimulation}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400 shadow-md transition-colors"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>Execute Projected Simulation</span>
                </button>

                {onDeployToLab && (
                  <button
                    onClick={() => {
                      onDeployToLab({
                        name: `${activeChampion.name} [INJECTED]`,
                        directive: params.systemDirective,
                        rules: params.injectedStrictRules,
                        primaryVector: activeChampion.vectors[0] || 'Forensic Accounting',
                        params
                      });
                      setNotification('Transferred injected skill parameters to Training Lab incubator!');
                    }}
                    className="py-2.5 px-4 bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-200 text-xs font-bold flex items-center gap-2"
                    title="Export injected variant to incubator"
                  >
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    <span>Deploy to Lab</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SYNTHETIC FINANCIAL DATASET & PLANTED TRAPS */}
        {/* ========================================================================= */}
        {activeTab === 'synthetic-dataset' && (
          <div className="space-y-6">
            {/* Dataset Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {SYNTHETIC_DATASETS.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDatasetId(ds.id)}
                  className={`p-3.5 border cursor-pointer transition-all space-y-2 ${
                    selectedDatasetId === ds.id
                      ? 'bg-cyan-950/30 border-cyan-500 shadow-sm'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400">{ds.shortCode}</span>
                    <span className="text-[10px] px-1.5 py-0.2 uppercase font-bold bg-stone-950 border border-stone-700 text-stone-300">
                      {ds.difficulty}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{ds.name}</div>
                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                    {ds.description}
                  </p>
                  <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                    <span>Traps: {ds.plantedTraps.length}</span>
                    <span className="text-cyan-300 font-bold">{ds.category}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Dataset Detailed Card */}
            <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-700 px-2 py-0.5">
                      {activeDataset.shortCode}
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase">{activeDataset.name}</h3>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{activeDataset.description}</p>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-rose-950/80 border border-rose-600 text-rose-300">
                  DIFFICULTY: {activeDataset.difficulty}
                </div>
              </div>

              {/* Synthetic Financial Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-stone-300 uppercase mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Synthetic Balance Sheet & PnL Key Figures
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {Object.entries(activeDataset.financialMetrics).map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-stone-500 uppercase">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="font-bold text-stone-200 text-xs mt-0.5">{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planted Adversarial Traps */}
              <div>
                <h4 className="text-xs font-bold text-stone-300 uppercase mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Planted Adversarial Traps ({activeDataset.plantedTraps.length})
                </h4>
                <div className="space-y-2">
                  {activeDataset.plantedTraps.map((trap, idx) => (
                    <div key={idx} className="p-3 bg-stone-950 border border-stone-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          {trap.title}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          Detection Difficulty: <strong className="text-white">{trap.detectionDifficulty}/100</strong>
                        </span>
                      </div>
                      <p className="text-stone-300 text-[11px] leading-relaxed">{trap.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthetic SEC Footnotes (Adversarial Evidence) */}
              <div>
                <h4 className="text-xs font-bold text-stone-300 uppercase mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Synthetic SEC Footnotes & Disclosures Under Audit
                </h4>
                <div className="space-y-2 bg-stone-950 p-3 border border-stone-800 text-xs font-mono">
                  {activeDataset.syntheticFootnotes.map((footnote, idx) => (
                    <div key={idx} className="p-2 bg-stone-900/60 border border-stone-800/60 text-stone-300 text-[11px] leading-relaxed">
                      {footnote}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PERFORMANCE CHARTS & VERIFICATION */}
        {/* ========================================================================= */}
        {activeTab === 'simulation-output' && (
          <div className="space-y-6">
            {/* Simulation Progress Bar */}
            {isSimulating && (
              <div className="p-3 bg-stone-900 border border-emerald-600/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Running Sandboxed Simulation Across Synthetic Quarters...
                  </span>
                  <span className="text-white">{simulationProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-950 overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${simulationProgress}%` }} />
                </div>
              </div>
            )}

            {/* Performance Timeline: Baseline vs Custom Injected vs Stress Gate */}
            <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Projected Stress Trajectory: Custom Injected vs Baseline Champion
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Tracks performance resilience as synthetic difficulty intensifies through adversarial disclosures.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 bg-emerald-400" />
                    <span>Injected Variant</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-2.5 bg-cyan-400" />
                    <span>Baseline Champion</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-0.5 bg-rose-400" />
                    <span>Stress Threshold</span>
                  </div>
                </div>
              </div>

              {/* Recharts ComposedChart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projectedMetrics.timelineData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid stroke="#292524" strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" stroke="#78716c" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                    <YAxis domain={[60, 100]} stroke="#78716c" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0c0a09', borderColor: '#44403c', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`${val}%`, '']}
                    />
                    <ReferenceLine y={95.0} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Champion Gate 95%', fill: '#f43f5e', fontSize: 10 }} />
                    <Area type="monotone" dataKey="customInjectedScore" fill="#059669" fillOpacity={0.15} stroke="none" />
                    <Line type="monotone" dataKey="customInjectedScore" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Custom Injected" />
                    <Line type="monotone" dataKey="baselineChampionScore" stroke="#06b6d4" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: '#06b6d4' }} name="Baseline Champion" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side-by-Side: Multi-Vector Radar & Live Reasoning Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Multi-Vector Radar Chart */}
              <div className="p-4 bg-stone-900/60 border border-stone-800 space-y-3">
                <h4 className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-purple-400" />
                  Multi-Dimensional Resilience Profile
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={projectedMetrics.radarData}>
                      <PolarGrid stroke="#292524" />
                      <PolarAngleAxis dataKey="dimension" stroke="#a8a29e" tick={{ fontSize: 10, fill: '#d6d3d1' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#44403c" tick={{ fontSize: 9 }} />
                      <Radar name="Custom Injected" dataKey="CustomInjected" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Radar name="Baseline Champion" dataKey="Baseline" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Step-by-Step Simulated Execution Log */}
              <div className="p-4 bg-stone-900/60 border border-stone-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <h4 className="text-xs font-bold text-stone-200 uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Sandboxed Synthetic Audit Stream
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold">SYNTHETIC RUNTIME</span>
                </div>

                <div className="bg-stone-950 p-3 border border-stone-800 text-[11px] font-mono text-stone-300 space-y-1.5 overflow-y-auto max-h-56 h-56">
                  {simulatedLogs.length === 0 ? (
                    <div className="p-4 text-center text-stone-500 italic">
                      Click "Run Synthetic Stress Test" above to stream real-time reasoning steps against the synthetic dataset.
                    </div>
                  ) : (
                    simulatedLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-400 font-bold">&gt;</span>
                        <span className={log.includes('[TRAP IDENTIFIED]') ? 'text-rose-400 font-bold' : log.includes('[CONVICTION VERDICT]') ? 'text-emerald-300 font-bold' : 'text-stone-300'}>
                          {log}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Planted Traps Solved: <strong className="text-white">{activeDataset.plantedTraps.length}/{activeDataset.plantedTraps.length}</strong></span>
                  <span>Conviction Verdict: <strong className="text-emerald-400">AUDIT PROVED</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. FOOTER STATUS BAR */}
      <footer className="p-3 bg-stone-900/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-400 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Sandbox:</span>
          <span className="text-white font-bold">[{activeChampion.code}] {activeChampion.name}</span>
          <span>·</span>
          <span>Synthetic Dataset: <strong className="text-cyan-300">{activeDataset.name}</strong></span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span>Rules Injected: <strong className="text-stone-300">{params.injectedStrictRules.length}</strong></span>
          <span>·</span>
          <span>Projected Score: <strong className="text-emerald-400">{projectedMetrics.totalProjectedScore}%</strong></span>
        </div>
      </footer>
    </div>
  );
};
