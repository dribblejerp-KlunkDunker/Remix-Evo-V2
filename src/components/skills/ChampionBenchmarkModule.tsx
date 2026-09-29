import React, { useState, useMemo } from 'react';
import { AgentSkill } from '../../types/skills';
import {
  HISTORICAL_STRESS_SCENARIOS,
  StressTestScenario,
  ChampionBenchmarkReport,
  ScenarioBenchmarkResult,
  executeChampionBenchmark
} from '../../data/stressBenchmarkData';
import {
  Trophy,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  RotateCcw,
  Zap,
  Clock,
  Download,
  Filter,
  Eye,
  X,
  FileText,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ChampionBenchmarkModuleProps {
  skills: AgentSkill[];
  initialSelectedSkillId?: string;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  onRemixSkill?: (skill: AgentSkill) => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
}

export const ChampionBenchmarkModule: React.FC<ChampionBenchmarkModuleProps> = ({
  skills,
  initialSelectedSkillId,
  isOpenAsOverlay = false,
  onCloseOverlay,
  onRemixSkill,
  onInspectSkill,
  className = ''
}) => {
  // Extract all Champion skills
  const championSkills = useMemo(() => {
    const champs = skills.filter((s) => s.stage === 'champion');
    // If no champions exist, fallback to highest benchmark skills
    return champs.length > 0 ? champs : skills.slice(0, 4);
  }, [skills]);

  // Selected Champion Skill
  const [selectedSkillId, setSelectedSkillId] = useState<string>(() => {
    if (initialSelectedSkillId && championSkills.some((c) => c.id === initialSelectedSkillId)) {
      return initialSelectedSkillId;
    }
    return championSkills[0]?.id || skills[0]?.id || '';
  });

  const selectedSkill = useMemo(() => {
    return championSkills.find((s) => s.id === selectedSkillId) || championSkills[0] || skills[0];
  }, [championSkills, selectedSkillId, skills]);

  // Scenario Multi-selection
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(
    HISTORICAL_STRESS_SCENARIOS.map((s) => s.id)
  );

  // Benchmarking State
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [currentRunningScenarioName, setCurrentRunningScenarioName] = useState<string>('');
  const [activeReport, setActiveReport] = useState<ChampionBenchmarkReport | null>(() => {
    if (selectedSkill) {
      return executeChampionBenchmark(selectedSkill, HISTORICAL_STRESS_SCENARIOS.map((s) => s.id));
    }
    return null;
  });

  // Selected scenario result inside report for deep inspection
  const [inspectedScenarioResult, setInspectedScenarioResult] = useState<ScenarioBenchmarkResult | null>(null);
  const [isExportSuccess, setIsExportSuccess] = useState(false);

  // Toggle scenario selection
  const handleToggleScenario = (id: string) => {
    setSelectedScenarioIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((s) => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllScenarios = () => {
    setSelectedScenarioIds(HISTORICAL_STRESS_SCENARIOS.map((s) => s.id));
  };

  // Run Benchmark execution simulation with step animation
  const handleExecuteBenchmark = async () => {
    if (!selectedSkill) return;
    setIsRunningBenchmark(true);
    setProgressStep(0);

    const chosenScenarios = HISTORICAL_STRESS_SCENARIOS.filter((s) => selectedScenarioIds.includes(s.id));

    for (let i = 0; i < chosenScenarios.length; i++) {
      setCurrentRunningScenarioName(chosenScenarios[i].shortName);
      setProgressStep(i + 1);
      await new Promise((r) => setTimeout(r, 450));
    }

    const report = executeChampionBenchmark(selectedSkill, selectedScenarioIds);
    setActiveReport(report);
    setInspectedScenarioResult(report.scenarioResults[0] || null);
    setIsRunningBenchmark(false);
    setProgressStep(0);
    setCurrentRunningScenarioName('');
  };

  // Export JSON Report
  const handleExportReport = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Champion-Benchmark-${activeReport.championSkillCode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportSuccess(true);
    setTimeout(() => setIsExportSuccess(false), 3000);
  };

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner */}
      <div className="bg-stone-900/60 border border-stone-800/90 p-5 backdrop-blur-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Trophy className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Champion Skill Benchmark
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-950 border border-amber-600/70 text-amber-300 font-bold">
                Stress-Test Arena
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-bold">
                Gate: ≥ 95.0%
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-3xl">
              Subject field-tested Champion agent skills to catastrophic historical market dislocations (2008 Lehman repo freeze, 2023 SVB run, 2024 Yen flash crash, Dot-com synthetic swaps). Generates an audited, deterministic quantitative stress resilience report.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeReport && (
              <button
                onClick={handleExportReport}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-mono transition-colors cursor-pointer"
                title="Export Quantitative Audit Report as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportSuccess ? 'Exported!' : 'Export Report'}</span>
              </button>
            )}

            {isOpenAsOverlay && onCloseOverlay && (
              <button
                onClick={onCloseOverlay}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Close Benchmark Arena"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Champion Skill Selector Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="uppercase font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Select Target Champion Skill to Stress-Test:
            </span>
            <span className="text-[11px] text-stone-500">
              {championSkills.length} Field-Certified Champions Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {championSkills.map((champ) => {
              const isSelected = champ.id === selectedSkill?.id;
              return (
                <button
                  key={champ.id}
                  onClick={() => {
                    setSelectedSkillId(champ.id);
                    // automatically generate initial report for this champion
                    const report = executeChampionBenchmark(champ, selectedScenarioIds);
                    setActiveReport(report);
                    setInspectedScenarioResult(report.scenarioResults[0] || null);
                  }}
                  className={`p-3 text-left border transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-stone-900 border-amber-400 shadow-md ring-1 ring-amber-500/40 text-white'
                      : 'bg-stone-950/80 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase truncate">
                      {champ.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {champ.benchmarkScore}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate mb-1">
                    {champ.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-900 pt-1">
                    <span>Gen-{champ.generation}</span>
                    <span className="text-emerald-400">0.0% Hallucination</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Scenario Configurator & Execution Trigger */}
      <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-stone-300 font-bold uppercase text-xs flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Historical Market Stress-Test Scenarios ({selectedScenarioIds.length}/{HISTORICAL_STRESS_SCENARIOS.length} Selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllScenarios}
              className="text-[11px] text-stone-400 hover:text-white transition-colors underline cursor-pointer"
            >
              Select All Scenarios
            </button>
          </div>
        </div>

        {/* Scenario Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {HISTORICAL_STRESS_SCENARIOS.map((scen) => {
            const isChecked = selectedScenarioIds.includes(scen.id);
            return (
              <div
                key={scen.id}
                onClick={() => handleToggleScenario(scen.id)}
                className={`p-3 border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isChecked
                    ? 'bg-stone-900/90 border-stone-600 text-stone-200'
                    : 'bg-stone-950 border-stone-900 text-stone-500 opacity-60 hover:opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase bg-stone-950 border border-stone-800 text-amber-300">
                      {scen.era}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                        scen.severity === 'Catastrophic'
                          ? 'bg-rose-950 border-rose-600/70 text-rose-300'
                          : scen.severity === 'Extreme'
                          ? 'bg-amber-950 border-amber-600/70 text-amber-300'
                          : 'bg-blue-950 border-blue-600/70 text-blue-300'
                      }`}
                    >
                      {scen.severity}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs mb-1 line-clamp-1">
                    {scen.shortName}
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans line-clamp-2 mb-2">
                    {scen.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-stone-800/80">
                  <span className="truncate max-w-[170px] text-stone-400">{scen.marketShockParameters.volatilitySpike}</span>
                  <div className={`w-3.5 h-3.5 border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-400 text-stone-950' : 'border-stone-700'}`}>
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Run Execution Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-900">
          <div className="text-xs text-stone-400">
            Selected Champion: <strong className="text-white">{selectedSkill?.name}</strong> ({selectedSkill?.code}) · Benchmark Base:{' '}
            <strong className="text-emerald-400">{selectedSkill?.benchmarkScore}%</strong>
          </div>

          <button
            onClick={handleExecuteBenchmark}
            disabled={isRunningBenchmark || selectedScenarioIds.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Play className={`w-4 h-4 fill-current ${isRunningBenchmark ? 'animate-spin' : ''}`} />
            <span>
              {isRunningBenchmark
                ? `Running Stress Test [${progressStep}/${selectedScenarioIds.length}] (${currentRunningScenarioName})...`
                : `Run Stress-Test Benchmark (${selectedScenarioIds.length} Scenarios)`}
            </span>
          </button>
        </div>
      </div>

      {/* 3. QUANTITATIVE PERFORMANCE REPORT */}
      {activeReport && (
        <div className="space-y-6">
          {/* Executive Scorecard */}
          <div className="bg-stone-950 border border-stone-800 p-5 space-y-4 font-mono text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 border ${
                    activeReport.overallVerdict === 'SUPER_CHAMPION_CERTIFIED' || activeReport.overallVerdict === 'CHAMPION_RETAINED'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <Trophy className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Quantitative Performance Report: {activeReport.championSkillName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                        activeReport.overallVerdict === 'SUPER_CHAMPION_CERTIFIED'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : activeReport.overallVerdict === 'CHAMPION_RETAINED'
                          ? 'bg-teal-950 border-teal-500 text-teal-300'
                          : 'bg-rose-950 border-rose-500 text-rose-300'
                      }`}
                    >
                      {activeReport.overallVerdict.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-stone-400 text-xs mt-0.5">
                    Code: <strong className="text-white">{activeReport.championSkillCode}</strong> · Gen-{activeReport.generation} · Tested At: {new Date(activeReport.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Tail Risk Defense Grade Badge */}
              <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 px-3.5 py-2">
                <div className="text-right">
                  <div className="text-[10px] text-stone-500 uppercase">Tail Risk Defense</div>
                  <div className="text-xs text-stone-300">Grade Rating</div>
                </div>
                <div className="text-2xl font-black text-amber-400 px-2 py-0.5 bg-stone-950 border border-amber-500/30">
                  {activeReport.tailRiskDefenseGrade}
                </div>
              </div>
            </div>

            {/* Performance Metric Quad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-900/60 border border-stone-800 space-y-1">
                <div className="text-stone-500 text-[10px] uppercase">Composite Stress Score</div>
                <div className="text-2xl font-bold text-emerald-400">{activeReport.compositeScore}%</div>
                <div className="text-[10px] text-stone-400">Threshold Gate: 95.0%</div>
              </div>

              <div className="p-3 bg-stone-900/60 border border-stone-800 space-y-1">
                <div className="text-stone-500 text-[10px] uppercase">Scenario Pass Rate</div>
                <div className="text-2xl font-bold text-white">
                  {activeReport.passRate}%
                </div>
                <div className="text-[10px] text-stone-400">
                  {activeReport.scenariosPassedCount} of {activeReport.scenariosRunCount} Scenarios Passed
                </div>
              </div>

              <div className="p-3 bg-stone-900/60 border border-stone-800 space-y-1">
                <div className="text-stone-500 text-[10px] uppercase">Mean Rule Compliance</div>
                <div className="text-2xl font-bold text-teal-300">{activeReport.meanRuleCompliance}%</div>
                <div className="text-[10px] text-stone-400">Zero Invariant Drift</div>
              </div>

              <div className="p-3 bg-stone-900/60 border border-stone-800 space-y-1">
                <div className="text-stone-500 text-[10px] uppercase">Stress Resistance Index</div>
                <div className="text-2xl font-bold text-amber-400">{activeReport.stressResistanceIndex}/100</div>
                <div className="text-[10px] text-stone-400">Avg Latency: {activeReport.meanLatencyMs}ms</div>
              </div>
            </div>

            {/* Strengths & Vulnerabilities Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-stone-900/40 border border-emerald-900/40 space-y-1.5 font-sans">
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Demonstrated Core Strengths Under Shock:</span>
                </div>
                <ul className="text-xs text-stone-300 space-y-1">
                  {activeReport.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-stone-900/40 border border-amber-900/40 space-y-1.5 font-sans">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exposed Edge Vulnerabilities & Recommended Mutation:</span>
                </div>
                <ul className="text-xs text-stone-300 space-y-1">
                  {activeReport.vulnerabilitiesExposed.map((vuln, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">⚠</span>
                      <span>{vuln}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-1.5 text-purple-300 font-mono text-[11px] pt-1">
                    <span className="text-purple-400 shrink-0">🧬</span>
                    <span>{activeReport.recommendedMutations[0]}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Scenario Breakdown Table */}
          <div className="bg-stone-950 border border-stone-800 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-stone-300 uppercase font-bold text-xs">
                Stress Scenario Performance Breakdown ({activeReport.scenarioResults.length} Tests)
              </span>
              <span className="text-stone-500 text-[11px]">Click row to inspect live reasoning logs & quantitative adjustments</span>
            </div>

            <div className="overflow-x-auto border border-stone-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                    <th className="p-3">Stress Scenario</th>
                    <th className="p-3 text-right">Score</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Rule Compliance</th>
                    <th className="p-3 text-right">Adversarial Detection</th>
                    <th className="p-3 text-right">Latency</th>
                    <th className="p-3 text-center">Verdict</th>
                    <th className="p-3 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 bg-stone-950">
                  {activeReport.scenarioResults.map((result) => {
                    const isSelected = inspectedScenarioResult?.scenarioId === result.scenarioId;
                    return (
                      <tr
                        key={result.scenarioId}
                        onClick={() => setInspectedScenarioResult(result)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-stone-800/80' : 'hover:bg-stone-900/50'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-white truncate max-w-[280px]">
                            {result.scenarioName}
                          </div>
                          <div className="text-[10px] text-stone-500">{result.scenarioId}</div>
                        </td>

                        <td className="p-3 text-right font-bold text-white text-sm">
                          <span className={result.passed ? 'text-emerald-400' : 'text-rose-400'}>
                            {result.score}%
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border ${
                              result.passed
                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-600 text-rose-300'
                            }`}
                          >
                            {result.passed ? 'PASSED GATE' : 'BREACHED'}
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono text-stone-300">
                          {result.ruleComplianceRate}%
                        </td>

                        <td className="p-3 text-right font-mono text-stone-300">
                          {result.adversarialDetectionScore}%
                        </td>

                        <td className="p-3 text-right font-mono text-stone-400">
                          {result.latencyMs}ms
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] uppercase font-bold ${
                              result.verdict === 'IMPERVIOUS'
                                ? 'text-emerald-400'
                                : result.verdict === 'RESILIENT'
                                ? 'text-teal-300'
                                : 'text-amber-400'
                            }`}
                          >
                            {result.verdict}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedScenarioResult(result);
                            }}
                            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-mono border border-stone-700 transition-colors"
                          >
                            Logs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspected Scenario Deep-Dive Drawer */}
          {inspectedScenarioResult && (
            <div className="bg-stone-900/40 border border-stone-800 p-5 space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Audit Trace & Invariant Proofs: {inspectedScenarioResult.scenarioName}
                  </h4>
                </div>
                <div className="text-xs text-stone-400">
                  Scenario Score: <strong className="text-emerald-400">{inspectedScenarioResult.score}%</strong> · Rule Compliance:{' '}
                  <strong className="text-white">{inspectedScenarioResult.ruleComplianceRate}%</strong>
                </div>
              </div>

              {/* Reasoning Trace Steps */}
              <div className="space-y-2">
                <div className="text-[10px] text-stone-400 uppercase font-bold">
                  Autonomous Reconciliatory Deduction Trace:
                </div>
                <div className="space-y-1 bg-stone-950 p-3 border border-stone-800">
                  {inspectedScenarioResult.stressTestOutput.reasoningTrace.map((step, idx) => (
                    <div key={idx} className="text-stone-300 text-[11px] font-mono flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">{`>`}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantitative Adjustments & Extracted Footnotes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5 font-sans">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                    Forensic Balance Sheet Re-Calculations:
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(inspectedScenarioResult.stressTestOutput.quantitativeAdjustments).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between border-b border-stone-900 pb-1 text-stone-300">
                        <span className="text-stone-400">{k}:</span>
                        <strong className="text-white">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5 font-sans">
                  <div className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                    Extracted Disclosures & Signals:
                  </div>
                  <ul className="text-xs text-stone-300 space-y-1 font-mono">
                    {inspectedScenarioResult.stressTestOutput.extractedFootnotesOrSignals.map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-purple-400 shrink-0">•</span>
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 text-[11px] text-stone-400 font-mono">
                    Mitigation: <span className="text-emerald-300">{inspectedScenarioResult.stressTestOutput.mitigationStrategy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isOpenAsOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-stone-950 border border-stone-700/80 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-stone-200 font-sans relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
