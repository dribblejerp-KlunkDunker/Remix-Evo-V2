import React, { useState, useMemo } from 'react';
import { AgentSkill } from '../../types/skills';
import {
  SkillConflictPair,
  SwarmQualityMetrics,
  ArbitrationStrategy
} from '../../types/skillConflicts';
import {
  ARBITRATION_PRESETS,
  calculateSwarmQualityMetrics
} from '../../data/skillConflictData';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Scale,
  Sparkles,
  RefreshCw,
  Sliders,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';

export interface SkillConflictAlertsProps {
  skills: AgentSkill[];
  conflicts: SkillConflictPair[];
  onUpdateConflicts: (updated: SkillConflictPair[]) => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  focusedConflictId?: string;
  className?: string;
}

export const SkillConflictAlerts: React.FC<SkillConflictAlertsProps> = ({
  skills,
  conflicts,
  onUpdateConflicts,
  onInspectSkill,
  isOpenAsOverlay = false,
  onCloseOverlay,
  focusedConflictId,
  className = ''
}) => {
  const championSkills = useMemo(() => skills.filter((s) => s.stage === 'champion'), [skills]);
  const metrics: SwarmQualityMetrics = useMemo(
    () => calculateSwarmQualityMetrics(conflicts, championSkills.length),
    [conflicts, championSkills.length]
  );

  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'ARBITRATED'>('ALL');
  const [selectedConflictId, setSelectedConflictId] = useState<string>(
    focusedConflictId || conflicts[0]?.id || ''
  );
  const [isArbitrating, setIsArbitrating] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ArbitrationStrategy>('PRECEDENCE_HIERARCHY');
  const [customArbitrationRule, setCustomArbitrationRule] = useState<string>('');
  const [isSimulatingReconciliation, setIsSimulatingReconciliation] = useState<string | null>(null);
  const [reconciliationStep, setReconciliationStep] = useState<number>(0);

  const activeConflicts = useMemo(() => conflicts.filter((c) => c.status === 'ACTIVE_FLAGGED'), [conflicts]);
  const filteredConflicts = useMemo(() => {
    if (filterMode === 'ACTIVE') return conflicts.filter((c) => c.status === 'ACTIVE_FLAGGED');
    if (filterMode === 'ARBITRATED') return conflicts.filter((c) => c.status === 'ARBITRATED');
    return conflicts;
  }, [conflicts, filterMode]);

  const selectedConflict = useMemo(
    () => conflicts.find((c) => c.id === selectedConflictId) || filteredConflicts[0] || conflicts[0],
    [conflicts, selectedConflictId, filteredConflicts]
  );

  // Initialize arbitration draft
  const handleOpenArbitration = (conflict: SkillConflictPair) => {
    setIsArbitrating(conflict.id);
    const preset = ARBITRATION_PRESETS[conflict.id];
    if (preset) {
      setSelectedStrategy(preset.strategy);
      setCustomArbitrationRule(preset.rule);
    } else {
      setSelectedStrategy('SYNTHETIC_INVARIANT_RULE');
      setCustomArbitrationRule(
        `INVARIANT RULE: Harmonize ${conflict.skillACode} and ${conflict.skillBCode} by prioritizing GAAP audit proofs on historical balance sheets, then feeding reconciled metrics into dynamic game simulations.`
      );
    }
  };

  // Execute arbitration
  const handleApplyArbitration = (conflictId: string) => {
    const preset = ARBITRATION_PRESETS[conflictId];
    const updated = conflicts.map((c) => {
      if (c.id === conflictId) {
        return {
          ...c,
          status: 'ARBITRATED' as const,
          arbitrationResolution: {
            resolvedAt: 'Just now',
            arbitrationStrategy: selectedStrategy,
            resolutionRule: customArbitrationRule || preset?.rule || 'Invariant reconciliation rule applied.',
            arbitrationRationale: preset?.rationale || 'Synthesized multi-agent arbitration rule harmonizing conflicting directives.',
            resultingConsensusVerdict: preset?.consensusVerdict || 'HARMONIZED: Multi-agent consensus achieved (0% Contradiction)',
            reconciliationAuditScore: 99.4
          }
        };
      }
      return c;
    });

    onUpdateConflicts(updated);
    setIsArbitrating(null);
  };

  // Re-open/revert arbitration
  const handleReopenConflict = (conflictId: string) => {
    const updated = conflicts.map((c) => {
      if (c.id === conflictId) {
        const copy = { ...c, status: 'ACTIVE_FLAGGED' as const };
        delete copy.arbitrationResolution;
        return copy;
      }
      return c;
    });
    onUpdateConflicts(updated);
  };

  // Run live reconciliation simulation
  const handleRunReconciliationSimulation = async (conflictId: string) => {
    setIsSimulatingReconciliation(conflictId);
    setReconciliationStep(1);
    await new Promise((r) => setTimeout(r, 600));
    setReconciliationStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setReconciliationStep(3);
    await new Promise((r) => setTimeout(r, 500));
    setIsSimulatingReconciliation(null);
    setReconciliationStep(0);
  };

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner & Quality Risk Gauge */}
      <div className="bg-stone-900/70 border border-stone-800 p-5 relative overflow-hidden backdrop-blur-xs">
        <div className="absolute top-0 right-0 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="p-1.5 bg-rose-950 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Champion Skill Conflict Alert System
              </h2>
              {activeConflicts.length > 0 ? (
                <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-rose-950/90 border border-rose-600 text-rose-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  {activeConflicts.length} Active Contradiction{activeConflicts.length > 1 ? 's' : ''} Flagged
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Champion Contradictions Arbitrated
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-3xl">
              Monitors pairwise Champion agent skills for contradictory axioms, valuation criteria, and polar-opposite output recommendations. Unchecked skill conflicts degrade output reliability and cause decision paralysis in autonomous agent workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOpenAsOverlay && onCloseOverlay && (
              <button
                onClick={onCloseOverlay}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Close Alert Center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* System Cohesion & Quality Risk Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1 font-mono">
            <div className="text-stone-500 text-[10px] uppercase">Swarm Cohesion Score</div>
            <div
              className={`text-2xl font-bold ${
                metrics.cohesionScore >= 95
                  ? 'text-emerald-400'
                  : metrics.cohesionScore >= 85
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.cohesionScore}%
            </div>
            <div className="text-[10px] text-stone-400">
              {metrics.cohesionScore >= 95 ? 'Zero Invariant Drift' : 'Adversarial Collision Risk'}
            </div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1 font-mono">
            <div className="text-stone-500 text-[10px] uppercase">Contradiction Status</div>
            <div
              className={`text-2xl font-bold ${
                metrics.contradictionRiskLevel === 'SAFE'
                  ? 'text-emerald-400'
                  : metrics.contradictionRiskLevel === 'GUARDED'
                  ? 'text-teal-400'
                  : metrics.contradictionRiskLevel === 'ELEVATED'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.contradictionRiskLevel}
            </div>
            <div className="text-[10px] text-stone-400">
              {metrics.activeConflictCount} Active / {conflicts.length} Total Monitored
            </div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1 font-mono">
            <div className="text-stone-500 text-[10px] uppercase">Arbitrated Invariants</div>
            <div className="text-2xl font-bold text-teal-300">
              {metrics.arbitratedConflictCount} / {conflicts.length}
            </div>
            <div className="text-[10px] text-stone-400">Precedence Rules Injected</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1 font-mono">
            <div className="text-stone-500 text-[10px] uppercase">Harmonization Gate</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase border ${
                  metrics.qualityGatePassed
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}
              >
                {metrics.qualityGatePassed ? 'GATE VERIFIED' : 'GATE BLOCKED'}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Avg Arbitration: {metrics.meanHarmonizationLatencyMs}ms
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar & Conflicts List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs uppercase font-bold text-stone-200">
              Pairwise Champion Conflict Audits ({filteredConflicts.length})
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 transition-all border cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              All ({conflicts.length})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-2.5 py-1 transition-all border cursor-pointer ${
                filterMode === 'ACTIVE'
                  ? 'bg-rose-950/80 text-rose-200 border-rose-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Active Flags ({activeConflicts.length})
            </button>
            <button
              onClick={() => setFilterMode('ARBITRATED')}
              className={`px-2.5 py-1 transition-all border cursor-pointer ${
                filterMode === 'ARBITRATED'
                  ? 'bg-teal-950/80 text-teal-200 border-teal-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Arbitrated ({metrics.arbitratedConflictCount})
            </button>
          </div>
        </div>

        {/* Conflict Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {filteredConflicts.map((item) => {
            const isSelected = item.id === selectedConflict?.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedConflictId(item.id)}
                className={`p-4 border transition-all cursor-pointer font-mono flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-900/90 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-950 border-rose-600 text-rose-300'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-950 border-amber-600 text-amber-300'
                          : 'bg-blue-950 border-blue-600 text-blue-300'
                      }`}
                    >
                      {item.severity} SEVERITY
                    </span>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                        item.status === 'ACTIVE_FLAGGED'
                          ? 'bg-rose-950/50 border-rose-800 text-rose-400'
                          : 'bg-teal-950/50 border-teal-800 text-teal-300'
                      }`}
                    >
                      {item.status === 'ACTIVE_FLAGGED' ? 'Active Alert' : 'Arbitrated'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mb-1.5 line-clamp-1">
                    {item.conflictDomain}
                  </div>

                  {/* Skills Pairing Indicator */}
                  <div className="flex items-center gap-2 text-[11px] text-stone-300 my-2 bg-stone-900/80 p-2 border border-stone-800/80">
                    <span className="text-amber-400 font-bold truncate max-w-[110px]">{item.skillACode}</span>
                    <span className="text-rose-400 font-bold shrink-0">⚡ vs ⚡</span>
                    <span className="text-teal-400 font-bold truncate max-w-[110px]">{item.skillBCode}</span>
                  </div>

                  <p className="text-[11px] text-stone-400 font-sans line-clamp-2 mt-1">
                    {item.analysisOutputClash.contradictionSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-3 border-t border-stone-900 mt-3">
                  <span>Detected {item.detectedAt}</span>
                  <span className="text-stone-300 hover:text-white font-bold flex items-center gap-1">
                    Inspect Clash <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Dive Contradiction Inspector */}
      {selectedConflict && (
        <div className="bg-stone-950 border border-stone-800 p-5 space-y-6 font-mono">
          {/* Detailed Clash Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] px-2 py-0.5 uppercase font-bold border ${
                    selectedConflict.severity === 'CRITICAL'
                      ? 'bg-rose-950 border-rose-600 text-rose-300'
                      : 'bg-amber-950 border-amber-600 text-amber-300'
                  }`}
                >
                  {selectedConflict.severity} CONTRADICTION
                </span>
                <span className="text-xs text-stone-400">ID: {selectedConflict.id}</span>
                <span className="text-xs text-stone-500">· Detected {selectedConflict.detectedAt}</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Contradiction Profile: {selectedConflict.conflictDomain}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {selectedConflict.status === 'ACTIVE_FLAGGED' ? (
                <button
                  onClick={() => handleOpenArbitration(selectedConflict)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Arbitrate & Inject Invariant</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunReconciliationSimulation(selectedConflict.id)}
                    disabled={isSimulatingReconciliation !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-950 hover:bg-teal-900 border border-teal-600 text-teal-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingReconciliation ? 'animate-spin' : ''}`} />
                    <span>Run Verification Proof</span>
                  </button>

                  <button
                    onClick={() => handleReopenConflict(selectedConflict.id)}
                    className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    Re-open
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Real-World Stress Scenario Context */}
          <div className="bg-stone-900/60 border border-stone-800 p-4 space-y-1.5">
            <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Real-World Benchmark Collision Scenario:</span>
            </div>
            <div className="text-xs font-bold text-white">
              {selectedConflict.stressScenario.title}
            </div>
            <p className="text-xs text-stone-300 font-sans leading-relaxed">
              {selectedConflict.stressScenario.description}
            </p>
            <div className="text-[11px] text-stone-400 bg-stone-950 p-2 border border-stone-800/80 mt-1 font-mono">
              Context: {selectedConflict.stressScenario.inputContext}
            </div>
          </div>

          {/* Side-by-Side Contradictory Analysis Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skill A Box */}
            <div className="bg-stone-900/40 border border-amber-900/40 p-4 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-bold">Champion Skill A</div>
                  <div className="text-xs font-bold text-white">{selectedConflict.skillAName}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 bg-stone-900 text-stone-300 font-bold border border-stone-700">
                    {selectedConflict.skillACode}
                  </span>
                  {onInspectSkill && (
                    <button
                      onClick={() => {
                        const s = skills.find((x) => x.id === selectedConflict.skillAId);
                        if (s) onInspectSkill(s);
                      }}
                      className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white"
                      title="Inspect Skill A"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Directives & Rule */}
              <div className="space-y-1 text-xs">
                <div className="text-[10px] text-stone-400 uppercase">Operational Directive:</div>
                <div className="text-stone-300 font-sans text-xs bg-stone-950/80 p-2.5 border border-stone-800">
                  {selectedConflict.contradictoryDirectives.skillADirective}
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-1">
                  Enforces: {selectedConflict.contradictoryDirectives.skillARule}
                </div>
              </div>

              {/* Output Verdict */}
              <div className="p-3 bg-stone-950 border border-rose-900/50 space-y-1">
                <div className="text-[10px] text-rose-400 uppercase font-bold">Output Verdict:</div>
                <div className="text-sm font-bold text-rose-300">
                  {selectedConflict.analysisOutputClash.skillAConclusion.verdict}
                </div>
                <div className="text-xs text-stone-300 font-sans">
                  {selectedConflict.analysisOutputClash.skillAConclusion.actionableRecommendation}
                </div>
                <div className="text-[11px] font-mono text-rose-400 font-bold pt-1 border-t border-stone-900">
                  {selectedConflict.analysisOutputClash.skillAConclusion.quantitativeMetric}
                </div>
              </div>
            </div>

            {/* Skill B Box */}
            <div className="bg-stone-900/40 border border-teal-900/40 p-4 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                <div>
                  <div className="text-[10px] text-teal-400 uppercase font-bold">Champion Skill B</div>
                  <div className="text-xs font-bold text-white">{selectedConflict.skillBName}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 bg-stone-900 text-stone-300 font-bold border border-stone-700">
                    {selectedConflict.skillBCode}
                  </span>
                  {onInspectSkill && (
                    <button
                      onClick={() => {
                        const s = skills.find((x) => x.id === selectedConflict.skillBId);
                        if (s) onInspectSkill(s);
                      }}
                      className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white"
                      title="Inspect Skill B"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Directives & Rule */}
              <div className="space-y-1 text-xs">
                <div className="text-[10px] text-stone-400 uppercase">Operational Directive:</div>
                <div className="text-stone-300 font-sans text-xs bg-stone-950/80 p-2.5 border border-stone-800">
                  {selectedConflict.contradictoryDirectives.skillBDirective}
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-1">
                  Enforces: {selectedConflict.contradictoryDirectives.skillBRule}
                </div>
              </div>

              {/* Output Verdict */}
              <div className="p-3 bg-stone-950 border border-emerald-900/50 space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Output Verdict:</div>
                <div className="text-sm font-bold text-emerald-300">
                  {selectedConflict.analysisOutputClash.skillBConclusion.verdict}
                </div>
                <div className="text-xs text-stone-300 font-sans">
                  {selectedConflict.analysisOutputClash.skillBConclusion.actionableRecommendation}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-bold pt-1 border-t border-stone-900">
                  {selectedConflict.analysisOutputClash.skillBConclusion.quantitativeMetric}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Impact Warning Box */}
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 space-y-1 text-xs font-sans">
            <div className="text-[10px] font-mono text-rose-400 uppercase font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Agent Quality Degradation Risk:</span>
            </div>
            <p className="text-stone-300 text-xs">
              {selectedConflict.analysisOutputClash.qualityImpactRisk}
            </p>
          </div>

          {/* 4. Arbitration Panel or Status */}
          {selectedConflict.status === 'ARBITRATED' && selectedConflict.arbitrationResolution && (
            <div className="p-4 bg-teal-950/20 border border-teal-800/70 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-teal-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-teal-300 uppercase">
                    Active Arbitration Protocol (Strategy: {selectedConflict.arbitrationResolution.arbitrationStrategy.replace(/_/g, ' ')})
                  </span>
                </div>
                <span className="text-[10px] text-stone-400">
                  Resolved {selectedConflict.arbitrationResolution.resolvedAt} · Audit Proof: {selectedConflict.arbitrationResolution.reconciliationAuditScore}%
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-stone-400 uppercase font-bold">Injected Synthetic Invariant Rule:</div>
                <div className="bg-stone-950 p-3 border border-stone-800 text-stone-200 text-xs font-mono leading-relaxed">
                  {selectedConflict.arbitrationResolution.resolutionRule}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-500 text-[10px] uppercase block">Arbitration Rationale:</span>
                  <span className="text-stone-300 font-sans">{selectedConflict.arbitrationResolution.arbitrationRationale}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase block">Harmonized Swarm Consensus:</span>
                  <span className="text-emerald-400 font-bold">{selectedConflict.arbitrationResolution.resultingConsensusVerdict}</span>
                </div>
              </div>

              {isSimulatingReconciliation === selectedConflict.id && (
                <div className="p-3 bg-stone-950 border border-teal-600/70 space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-xs text-teal-300 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Multi-Agent Reconciliation Verification Proof... Step {reconciliationStep}/3</span>
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {reconciliationStep === 1 && `> Passing ${selectedConflict.skillACode} output through arbitration invariant filters...`}
                    {reconciliationStep === 2 && `> Passing ${selectedConflict.skillBCode} output through arbitration invariant filters...`}
                    {reconciliationStep === 3 && `> Cross-verifying mathematical parity: 0.0% Contradiction Variance. Proof Verified!`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arbitration Workbench Modal/Drawer */}
          {isArbitrating === selectedConflict.id && (
            <div className="p-5 bg-stone-900 border-2 border-amber-500 space-y-4 font-mono shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white uppercase">
                    Arbitrate & Harmonize: {selectedConflict.skillACode} ⚡ {selectedConflict.skillBCode}
                  </span>
                </div>
                <button
                  onClick={() => setIsArbitrating(null)}
                  className="text-stone-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              {/* Strategy Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-300 uppercase font-bold block">
                  Select Arbitration Strategy:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'PRECEDENCE_HIERARCHY', label: 'Precedence Hierarchy', desc: 'Rank skills by domain primacy' },
                      { id: 'SYNTHETIC_INVARIANT_RULE', label: 'Synthetic Rule', desc: 'Synthesize harmonized conditional rule' },
                      { id: 'CONDITIONAL_ROUTING', label: 'Conditional Routing', desc: 'Route questions by query taxonomy' },
                      { id: 'RECONCILIATION_PROOF', label: 'Reconciliation Proof', desc: 'Enforce mathematical duality' }
                    ] as const
                  ).map((strat) => (
                    <button
                      key={strat.id}
                      type="button"
                      onClick={() => {
                        setSelectedStrategy(strat.id);
                        const preset = ARBITRATION_PRESETS[selectedConflict.id];
                        if (preset && preset.strategy === strat.id) {
                          setCustomArbitrationRule(preset.rule);
                        }
                      }}
                      className={`p-2.5 text-left border transition-all cursor-pointer font-mono ${
                        selectedStrategy === strat.id
                          ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{strat.label}</div>
                      <div className="text-[10px] text-stone-500 font-sans mt-0.5">{strat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Invariant Rule Text Editor */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-300 uppercase font-bold flex items-center justify-between">
                  <span>Synthesized Arbitration Rule:</span>
                  <span className="text-[10px] text-stone-500 font-normal">Injected into Swarm Prompt Matrix</span>
                </label>
                <textarea
                  value={customArbitrationRule}
                  onChange={(e) => setCustomArbitrationRule(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-100 p-3 text-xs font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  onClick={() => setIsArbitrating(null)}
                  className="px-3 py-1.5 text-stone-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyArbitration(selectedConflict.id)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Apply & Seal Arbitration
                </button>
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
        <div className="bg-stone-950 border border-stone-700 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-stone-200 font-sans relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
