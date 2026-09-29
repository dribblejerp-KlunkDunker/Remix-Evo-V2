import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  HEATMAP_DATA,
  SCENARIO_DEFINITIONS,
  SPECIALIST_TYPES
} from '../../data/heatmapData';
import { ScenarioHeatmapPoint, ScenarioDefinition } from '../../types/skills';
import {
  Activity,
  Flame,
  Trophy,
  Filter,
  BarChart3,
  Grid,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface AgentScenarioHeatmapProps {
  onSelectSpecialist?: (specialistName: string) => void;
  onRunScenarioTest?: (point: ScenarioHeatmapPoint) => void;
}

export const AgentScenarioHeatmap: React.FC<AgentScenarioHeatmapProps> = ({
  onSelectSpecialist,
  onRunScenarioTest
}) => {
  const [selectedPoint, setSelectedPoint] = useState<ScenarioHeatmapPoint | null>(HEATMAP_DATA[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'matrix' | 'barchart'>('matrix');
  const [selectedScenarioForBar, setSelectedScenarioForBar] = useState<string>(SCENARIO_DEFINITIONS[0].id);

  // Extract scenario categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    SCENARIO_DEFINITIONS.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, []);

  // Filtered heatmap data
  const filteredData = useMemo(() => {
    return HEATMAP_DATA.filter((point) => {
      const matchesCategory =
        selectedCategory === 'all' || point.scenarioCategory === selectedCategory;
      const matchesScore = point.successRate >= filterMinScore;
      return matchesCategory && matchesScore;
    });
  }, [selectedCategory, filterMinScore]);

  // Map coordinates for Recharts ScatterChart Heatmap
  const specialistNames = useMemo(() => SPECIALIST_TYPES.map((s) => s.name), []);
  const scenarioNames = useMemo(
    () =>
      SCENARIO_DEFINITIONS.filter(
        (s) => selectedCategory === 'all' || s.category === selectedCategory
      ).map((s) => s.shortName),
    [selectedCategory]
  );

  const scatterChartData = useMemo(() => {
    return filteredData.map((d) => ({
      x: d.scenarioShort,
      y: d.specialistName,
      z: d.successRate,
      point: d
    }));
  }, [filteredData]);

  // Data for the scenario comparison BarChart view
  const barChartData = useMemo(() => {
    const pointsForScenario = HEATMAP_DATA.filter((d) => d.scenarioId === selectedScenarioForBar);
    return pointsForScenario
      .map((d) => ({
        specialist: d.specialistName,
        successRate: d.successRate,
        isChampion: d.successRate >= 95.0,
        runs: d.testRuns,
        point: d
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }, [selectedScenarioForBar]);

  // Color generator based on success rate
  const getColorForScore = (score: number) => {
    if (score >= 98.0) return '#10b981'; // emerald-500
    if (score >= 95.0) return '#34d399'; // emerald-400
    if (score >= 90.0) return '#38bdf8'; // sky-400
    if (score >= 85.0) return '#f59e0b'; // amber-500
    if (score >= 80.0) return '#fb923c'; // orange-400
    return '#f43f5e'; // rose-500
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 98.0) return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80';
    if (score >= 95.0) return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40';
    if (score >= 90.0) return 'bg-sky-950/40 text-sky-400 border-sky-500/40';
    if (score >= 85.0) return 'bg-amber-950/40 text-amber-400 border-amber-500/40';
    if (score >= 80.0) return 'bg-orange-950/40 text-orange-400 border-orange-500/40';
    return 'bg-rose-950/40 text-rose-400 border-rose-500/40';
  };

  // Custom cell renderer for Recharts ScatterChart Heatmap
  const CustomHeatmapCell = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || !payload.point) return null;

    const point: ScenarioHeatmapPoint = payload.point;
    const isSelected = selectedPoint?.specialistId === point.specialistId && selectedPoint?.scenarioId === point.scenarioId;
    const color = getColorForScore(point.successRate);

    // Render a high-density rectangular tile in Recharts
    const width = 64;
    const height = 34;

    return (
      <g
        onClick={() => setSelectedPoint(point)}
        style={{ cursor: 'pointer' }}
        className="transition-transform duration-150 hover:scale-105"
      >
        {/* Cell Background Rectangle */}
        <rect
          x={cx - width / 2}
          y={cy - height / 2}
          width={width}
          height={height}
          fill={color}
          fillOpacity={point.successRate >= 95 ? 0.35 : point.successRate >= 90 ? 0.22 : 0.15}
          stroke={isSelected ? '#ffffff' : color}
          strokeWidth={isSelected ? 2 : point.successRate >= 95 ? 1.5 : 0.8}
          rx={0}
        />

        {/* Champion star indicator */}
        {point.successRate >= 95.0 && (
          <circle
            cx={cx - width / 2 + 7}
            cy={cy - height / 2 + 7}
            r={2.5}
            fill="#34d399"
          />
        )}

        {/* Score Text */}
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fill={isSelected ? '#ffffff' : color}
          fontSize={11}
          fontWeight={point.successRate >= 95 ? '700' : '600'}
          fontFamily="ui-monospace, monospace"
        >
          {point.successRate.toFixed(1)}%
        </text>
      </g>
    );
  };

  return (
    <div className="bg-stone-900/90 border border-stone-800 p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Decorative ambient background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Top Header & Visual Layer Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono">
            <span className="p-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span className="text-emerald-400 font-semibold uppercase tracking-wider">
              Recharts Specialist Performance Layer
            </span>
            <span className="text-stone-600">/</span>
            <span className="text-stone-400">Multi-Vector Success Heatmap</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
            Specialist Success Rates Across Real-World Scenarios
          </h3>
          <p className="text-xs text-stone-400 font-sans mt-1 max-w-3xl leading-relaxed">
            Heatmap mapping which specialist agent types have the highest success rates when tested against real-world adversarial situations (e.g. disguised reverse factoring, earnings call deflection, cascading prime brokerage margin sweeps, and sub-tier supply chokepoints).
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 bg-stone-950 border border-stone-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2D Heatmap Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('barchart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'barchart'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Scenario Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-stone-950 border border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase">Matrix Peak Success</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">99.4%</div>
          <div className="text-[10px] text-stone-400 truncate">Extreme Value Statistician (FX Jump)</div>
        </div>

        <div className="p-3 bg-stone-950 border border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase">Champion Threshold Coverage</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">100% (7/7 Scenarios)</div>
          <div className="text-[10px] text-stone-400">At least 1 Champion per challenge</div>
        </div>

        <div className="p-3 bg-stone-950 border border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase">Average Champion Score</div>
          <div className="text-lg font-bold text-sky-400 mt-0.5">98.4%</div>
          <div className="text-[10px] text-stone-400">Against adversarial testbenches</div>
        </div>

        <div className="p-3 bg-stone-950 border border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase">Total Stress Test Runs</div>
          <div className="text-lg font-bold text-stone-200 mt-0.5">6,720 Runs</div>
          <div className="text-[10px] text-stone-400">0.0% Hallucination Tolerance</div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 bg-stone-950/80 border border-stone-800 text-xs font-mono">
        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-stone-500 text-[11px] uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-800 text-white border border-stone-600 font-semibold'
                : 'text-stone-400 hover:text-stone-200 border border-transparent'
            }`}
          >
            All Scenarios ({SCENARIO_DEFINITIONS.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-stone-800 text-white border border-stone-600 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Score legend */}
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <span className="text-stone-500">Success Rate:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500" />
            <span className="text-stone-300">≥98%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-400" />
            <span className="text-stone-300">≥95% (Champion)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-400" />
            <span className="text-stone-300">90-94%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500" />
            <span className="text-stone-300">85-89%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-500" />
            <span className="text-stone-300">&lt;85%</span>
          </div>
        </div>
      </div>

      {/* Main Visualization Display */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column (8 cols on lg) */}
        <div className="lg:col-span-8 bg-stone-950 p-4 border border-stone-800 min-h-[440px] flex flex-col justify-between">
          {viewMode === 'matrix' ? (
            <div className="w-full flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span>Y-Axis: Specialist Agent Type · X-Axis: Real-World Scenario</span>
                <span className="text-emerald-400 font-semibold">Click tile to inspect & test</span>
              </div>

              <div className="w-full h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 40, left: 140 }}
                  >
                    <XAxis
                      type="category"
                      dataKey="x"
                      name="Scenario"
                      stroke="#71717a"
                      fontSize={11}
                      fontFamily="ui-monospace, monospace"
                      interval={0}
                      tick={{ fill: '#a1a1aa' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      type="category"
                      dataKey="y"
                      name="Specialist"
                      stroke="#71717a"
                      fontSize={11}
                      fontFamily="ui-monospace, monospace"
                      interval={0}
                      tick={{ fill: '#d4d4d8' }}
                      width={130}
                    />
                    <ZAxis
                      type="number"
                      dataKey="z"
                      range={[100, 100]}
                      name="Success Rate"
                      unit="%"
                    />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload.point as ScenarioHeatmapPoint;
                          return (
                            <div className="bg-stone-900 border border-stone-700 p-3 shadow-2xl font-mono text-xs text-stone-200 space-y-1.5 max-w-xs">
                              <div className="font-bold text-white text-sm">
                                {data.specialistName}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                Scenario: <span className="text-stone-200">{data.scenarioName}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                                <span className="text-stone-400">Success Rate:</span>
                                <span className="font-bold text-emerald-400">
                                  {data.successRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-400">Adversarial Runs:</span>
                                <span className="text-stone-200">{data.testRuns} runs</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-400">Rule Compliance:</span>
                                <span className="text-emerald-400">{data.ruleCompliance}%</span>
                              </div>
                              <div className="pt-1 text-[10px] text-stone-400 font-sans italic border-t border-stone-800">
                                "{data.keyInsight}"
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={scatterChartData}
                      shape={<CustomHeatmapCell />}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            // BarChart Leaderboard for Selected Scenario
            <div className="w-full flex-1 flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div className="text-xs font-mono text-stone-400">
                  Select Scenario to Compare Agent Success Rates:
                </div>
                <select
                  value={selectedScenarioForBar}
                  onChange={(e) => setSelectedScenarioForBar(e.target.value)}
                  className="bg-stone-900 border border-stone-700 text-xs font-mono text-white p-1.5 focus:outline-none focus:border-stone-500"
                >
                  {SCENARIO_DEFINITIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 20, left: 140 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[70, 100]}
                      stroke="#71717a"
                      fontSize={11}
                      fontFamily="ui-monospace, monospace"
                      unit="%"
                    />
                    <YAxis
                      type="category"
                      dataKey="specialist"
                      stroke="#71717a"
                      fontSize={11}
                      fontFamily="ui-monospace, monospace"
                      width={130}
                      tick={{ fill: '#d4d4d8' }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-stone-900 border border-stone-700 p-3 shadow-xl font-mono text-xs">
                              <div className="text-white font-bold">{d.specialist}</div>
                              <div className="text-emerald-400 font-bold mt-1">
                                Success Rate: {d.successRate}%
                              </div>
                              <div className="text-stone-400 text-[11px]">
                                Total Runs: {d.runs}
                              </div>
                              <div className="text-stone-300 text-[11px] font-sans mt-1">
                                {d.point.keyInsight}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="successRate"
                      radius={[0, 2, 2, 0]}
                      onClick={(entry: any) => {
                        if (entry && entry.point) {
                          setSelectedPoint(entry.point);
                        }
                      }}
                    >
                      {barChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColorForScore(entry.successRate)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Selected Cell Deep-Dive Detail Panel (4 cols on lg) */}
        <div className="lg:col-span-4 bg-stone-950 p-5 border border-stone-800 flex flex-col justify-between space-y-4">
          {selectedPoint ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-1">
                  <span className="text-emerald-400 font-semibold">Specialist Detail</span>
                  <span>·</span>
                  <span>{selectedPoint.specialistVector}</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white">
                  {selectedPoint.specialistName}
                </h4>
                <div className="text-xs text-stone-400 font-sans mt-0.5">
                  vs. <strong className="text-stone-200">{selectedPoint.scenarioName}</strong>
                </div>
              </div>

              {/* Metric card */}
              <div className={`p-3.5 border ${getScoreBgClass(selectedPoint.successRate)} space-y-1`}>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase text-[10px] font-bold">Scenario Success Rate</span>
                  {selectedPoint.successRate >= 95.0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <Trophy className="w-3 h-3" /> Champion Qualified
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold font-mono">
                  {selectedPoint.successRate.toFixed(1)}%
                </div>
                <div className="text-[11px] opacity-80 font-mono">
                  Target Gate: ≥ 95.0% | Rule Compliance: {selectedPoint.ruleCompliance}%
                </div>
              </div>

              {/* Key Insight */}
              <div className="space-y-1 text-xs">
                <div className="font-mono text-stone-400 text-[11px] uppercase tracking-wider">
                  Empirical Forensic Insight:
                </div>
                <p className="text-stone-300 font-sans leading-relaxed p-3 bg-stone-900/60 border border-stone-800/80">
                  {selectedPoint.keyInsight}
                </p>
              </div>

              {/* Scenario Context */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="text-[11px] text-stone-400 uppercase">Scenario Parameters</div>
                <div className="p-2.5 bg-stone-900/40 border border-stone-800 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Category:</span>
                    <span className="text-stone-300">{selectedPoint.scenarioCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Stress Test Runs:</span>
                    <span className="text-stone-300">{selectedPoint.testRuns} runs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Hallucination Variance:</span>
                    <span className="text-emerald-400">0.0% (Zero-Tolerance)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {onRunScenarioTest && (
                  <button
                    onClick={() => onRunScenarioTest(selectedPoint)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-stone-200 text-stone-950 text-xs font-mono font-bold transition-colors shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Run Live Scenario Challenge</span>
                  </button>
                )}

                {onSelectSpecialist && (
                  <button
                    onClick={() => onSelectSpecialist(selectedPoint.specialistName)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono border border-stone-700 transition-colors"
                  >
                    <span>View Specialist in Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-stone-500 text-center py-20 font-mono text-xs">
              Select any cell in the heatmap matrix to inspect specialist performance metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
