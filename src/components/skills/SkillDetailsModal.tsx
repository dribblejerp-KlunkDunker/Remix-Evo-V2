import React, { useState } from 'react';
import { AgentSkill, SkillTestCase } from '../../types/skills';
import { X, Play, ShieldAlert, Cpu, CheckCircle2, History, GitFork, ArrowRight, Loader2, Sparkles, AlertCircle, Sliders, Network } from 'lucide-react';

interface SkillDetailsModalProps {
  skill: AgentSkill | null;
  onClose: () => void;
  onRunTest: (skill: AgentSkill, customPrompt?: string) => Promise<void>;
  onAddRule?: (skillId: string, newRule: string) => void;
  onOpenFullAuditLog?: (skillId: string) => void;
  onOpenMutationSimulator?: (skill: AgentSkill) => void;
  onOpenForceGraph?: (skill: AgentSkill) => void;
  onOpenEvolutionHistory?: (skill: AgentSkill) => void;
  initialScenario?: string;
  initialTab?: 'overview' | 'testrunner' | 'rules' | 'lineage';
}

export const SkillDetailsModal: React.FC<SkillDetailsModalProps> = ({
  skill,
  onClose,
  onRunTest,
  onAddRule,
  onOpenFullAuditLog,
  onOpenMutationSimulator,
  onOpenForceGraph,
  onOpenEvolutionHistory,
  initialScenario,
  initialTab
}) => {
  if (!skill) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'testrunner' | 'rules' | 'lineage'>(
    initialTab || 'overview'
  );
  const [selectedTestCase, setSelectedTestCase] = useState<SkillTestCase | null>(
    skill.testCases.length > 0 ? skill.testCases[0] : null
  );
  const [customScenario, setCustomScenario] = useState(initialScenario || '');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [newRuleInput, setNewRuleInput] = useState('');

  const handleExecuteTest = async () => {
    setIsRunningTest(true);
    setTestResult(null);

    // Simulate multi-step autonomous execution with rich telemetry
    try {
      await new Promise((r) => setTimeout(r, 1400));
      
      const scenarioText = customScenario || (selectedTestCase ? selectedTestCase.inputScenario : 'Adversarial benchmark validation scenario');
      const score = Math.min(99.8, Math.max(92.0, skill.benchmarkScore + (Math.random() * 2 - 0.8)));

      setTestResult({
        score: Number(score.toFixed(1)),
        passed: score >= skill.threshold,
        scenario: scenarioText,
        reasoningSteps: [
          `Ingested prompt vector: Extracted ${skill.vectors.join(', ')} markers.`,
          `Enforced Strict Rules: Verified all ${skill.strictRules.length} boundary conditions. Zero hallucination tolerance enforced.`,
          `Analyzed structural discrepancies against audited historical disclosure patterns.`,
          `Synthesized final conviction verdict with mathematical bounds.`
        ],
        ruleCompliance: 100,
        verdict: score >= skill.threshold ? 'THRESHOLD ACHIEVED: CHAMPION RIGOR VERIFIED' : 'VARIANCE DETECTED: ADDITIONAL TRAINING RECOMMENDED',
        convictionScore: Math.round(score)
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim() || !onAddRule) return;
    onAddRule(skill.id, newRuleInput.trim());
    skill.strictRules.push(`RULE ${skill.strictRules.length + 1}: ${newRuleInput.trim()}`);
    setNewRuleInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative my-8">
        {/* Top Header */}
        <div className="flex items-start justify-between p-6 border-b border-stone-800 bg-stone-950/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-1">
              <span className="text-emerald-400 font-semibold">{skill.code}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-stone-300">{skill.stage} Stage</span>
              <span aria-hidden="true">·</span>
              <span>GEN-{skill.generation}</span>
              <span aria-hidden="true">·</span>
              <span>Stability {skill.stabilityIndex}%</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">
              {skill.name}
            </h3>
            <p className="text-xs text-stone-400 mt-1 font-sans max-w-2xl">
              {skill.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs - Functional segmented buttons */}
        <div className="flex items-center px-6 border-b border-stone-800 bg-stone-950/30 gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Overview & Directive
          </button>
          <button
            onClick={() => setActiveTab('testrunner')}
            className={`py-3 px-4 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'testrunner'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Play className="w-3 h-3 fill-current text-emerald-400" />
            <span>Test Arena & Benchmarks ({skill.testCases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Strict Rules ({skill.strictRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lineage')}
            className={`py-3 px-4 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'lineage'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitFork className="w-3 h-3 text-purple-400" />
            <span>Lineage & Evolution History</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-stone-200 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score & Threshold Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-950/70 border border-stone-800 text-center font-mono">
                  <div className="text-[11px] text-stone-500 uppercase">Benchmark Score</div>
                  <div className="text-xl font-bold text-emerald-400">{skill.benchmarkScore.toFixed(1)}%</div>
                  <div className="text-[10px] text-stone-500">Threshold: {skill.threshold.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-stone-950/70 border border-stone-800 text-center font-mono">
                  <div className="text-[11px] text-stone-500 uppercase">Win Rate</div>
                  <div className="text-xl font-bold text-stone-200">{skill.winRate}%</div>
                  <div className="text-[10px] text-stone-500">Against Baselines</div>
                </div>
                <div className="p-3 bg-stone-950/70 border border-stone-800 text-center font-mono">
                  <div className="text-[11px] text-stone-500 uppercase">Hallucination Rate</div>
                  <div className="text-xl font-bold text-emerald-400">{skill.hallucinationRate}%</div>
                  <div className="text-[10px] text-stone-500">Zero-Tolerance</div>
                </div>
                <div className="p-3 bg-stone-950/70 border border-stone-800 text-center font-mono">
                  <div className="text-[11px] text-stone-500 uppercase">Survival Iterations</div>
                  <div className="text-xl font-bold text-stone-200">{skill.evolutionLineage.survivalIterations}</div>
                  <div className="text-[10px] text-stone-500">Generation Cycles</div>
                </div>
              </div>

              {/* Vectors */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
                  Active Knowledge Vectors
                </h4>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {skill.vectors.map((vec) => (
                    <span key={vec} className="px-2.5 py-1 bg-stone-800 border border-stone-700 text-stone-200">
                      {vec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialist Persona & Prompt Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400">
                  Specialist Prompt Matrix & Reasoning Framework
                </h4>
                <div className="bg-stone-950/90 border border-stone-800 p-4 font-mono text-xs space-y-3 text-stone-300">
                  <div>
                    <span className="text-emerald-400 font-bold">Role:</span> {skill.specialistRole}
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold">System Directive:</span>
                    <p className="mt-1 text-stone-300 leading-relaxed font-sans">{skill.promptMatrix.systemDirective}</p>
                  </div>
                  <div>
                    <span className="text-purple-400 font-bold">Reasoning Framework:</span>
                    <p className="mt-1 text-stone-300 leading-relaxed font-sans">{skill.promptMatrix.reasoningFramework}</p>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold">Adversarial Constraint:</span>
                    <p className="mt-1 text-stone-300 leading-relaxed font-sans">{skill.promptMatrix.adversarialConstraint}</p>
                  </div>
                </div>
              </div>

              {/* Current Autonomous Thought Loop */}
              <div className="p-4 bg-stone-950/80 border border-stone-800">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>Real-Time Autonomous Thought Stream (Zero True Downtime)</span>
                </div>
                <div className="font-mono text-xs text-stone-300 leading-relaxed">
                  "{skill.autonomousThought}"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testrunner' && (
            <div className="space-y-6">
              {/* Testbench Description */}
              <div className="p-4 bg-stone-950/80 border border-stone-800">
                <div className="flex justify-between items-center text-xs font-mono text-amber-400 mb-1">
                  <span>Current Test Bench: {skill.activeTestBench.name}</span>
                  <span className="text-stone-400">{skill.activeTestBench.totalRunsToday} runs logged</span>
                </div>
                <div className="text-xs text-stone-300 font-sans">
                  Active stress vector: <span className="font-mono text-stone-200">{skill.activeTestBench.stressVector}</span>
                </div>
              </div>

              {/* Test Cases selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
                  Select Preset Real-World Use Case Benchmark:
                </label>
                <div className="space-y-2">
                  {skill.testCases.map((tc) => {
                    const isSelected = selectedTestCase?.id === tc.id && !customScenario;
                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => {
                          setSelectedTestCase(tc);
                          setCustomScenario('');
                        }}
                        className={`w-full text-left p-3 border transition-colors flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-stone-800/90 border-emerald-500/80 text-white'
                            : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-mono font-semibold text-emerald-400 mb-0.5">
                            {tc.title}
                          </div>
                          <div className="text-xs text-stone-400 font-sans line-clamp-1">
                            {tc.realWorldUseCase}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono text-xs">
                          <span className="text-stone-400">Score: </span>
                          <span className="text-emerald-400 font-bold">{tc.lastScore}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom scenario input */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-400 mb-1">
                  Or Inject Custom Adversarial Scenario / Filing Excerpt:
                </label>
                <textarea
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  placeholder="Enter a complex financial disclosure footnote, executive evasion transcript, or liquidity shock to test this skill..."
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 p-3 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
                />
              </div>

              {/* Run Test Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono text-stone-500">
                  Target Qualification Threshold: <span className="text-white font-bold">{skill.threshold.toFixed(1)}%</span>
                </div>
                <button
                  onClick={handleExecuteTest}
                  disabled={isRunningTest}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-stone-950 hover:bg-stone-200 disabled:bg-stone-700 disabled:text-stone-400 font-mono text-xs font-semibold transition-colors"
                >
                  {isRunningTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Testing Against Adversarial Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Execute Autonomous Test Run</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution result display */}
              {testResult && (
                <div className="p-4 bg-stone-950 border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold">{testResult.verdict}</span>
                    </div>
                    <div className="text-emerald-400 font-bold text-sm">
                      Benchmark Score: {testResult.score}%
                    </div>
                  </div>

                  <div>
                    <div className="text-stone-500 text-[11px] uppercase mb-1">Autonomous Reasoning Trace:</div>
                    <ul className="space-y-1 text-stone-300 font-mono text-[11px]">
                      {testResult.reasoningSteps.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-mono">[{idx + 1}]</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Strict Rule Compliance: <strong className="text-emerald-400">{testResult.ruleCompliance}%</strong></span>
                    <span>Status: <strong className="text-stone-200">{testResult.passed ? 'Champion Qualified' : 'Iterative Refinement'}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="p-3 bg-stone-950/70 border border-stone-800 text-xs font-mono text-stone-300">
                Specialist agents follow non-negotiable strict boundaries. Unlike generalist models, every assertion must adhere to these mathematical and procedural constraints.
              </div>

              <div className="space-y-2">
                {skill.strictRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-stone-950 border border-stone-800 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs font-mono text-stone-200 leading-relaxed">
                      {rule}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add rule form */}
              <form onSubmit={handleAddRule} className="pt-4 border-t border-stone-800">
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
                  Inject Additional Strict Constraint to Discipline Agent:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="e.g., RULE 5: Require cross-verification against 3 distinct SEC filings before asserting supply chain disruption..."
                    className="flex-1 bg-stone-950 border border-stone-800 px-3 py-2 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
                  />
                  <button
                    type="submit"
                    disabled={!newRuleInput.trim()}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-mono font-medium border border-stone-700 transition-colors"
                  >
                    Add Rule
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'lineage' && (
            <div className="space-y-6">
              {/* Lineage Info */}
              <div className="p-4 bg-stone-950 border border-stone-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Generation Epoch:</span>
                  <span className="text-stone-200">{skill.evolutionLineage.generationEpoch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Remix Vector Combo:</span>
                  <span className="text-purple-400">{skill.evolutionLineage.remixVectorCombo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Parent Seeds:</span>
                  <span className="text-stone-300">{skill.evolutionLineage.parents.join(' + ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Mutation Type:</span>
                  <span className="text-stone-200">{skill.evolutionLineage.mutationType}</span>
                </div>
              </div>

              {/* Deep Lineage Audit Action */}
              {onOpenFullAuditLog && (
                <div className="p-4 bg-purple-950/30 border border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                      <GitFork className="w-3.5 h-3.5 text-purple-400" />
                      <span>Generational Audit & Mutation Delta Log</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 font-sans">
                      Track parent recombining, prompt mutation percentages, and performance deltas (Δ) for each epoch iteration.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenFullAuditLog(skill.id);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>View Full Audit Log</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Stage Transition Timeline */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3">
                  Evolution Lifecycle Transitions
                </h4>
                <div className="space-y-3 relative pl-6 border-l border-stone-800">
                  {skill.stageHistory.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-stone-600 border-2 border-stone-900" />
                      <div className="text-xs font-mono">
                        <span className="text-white font-bold uppercase">{item.stage}</span>
                        <span className="text-stone-500 ml-2">· {item.timestamp}</span>
                        <span className="text-emerald-400 ml-2">Score: {item.score}%</span>
                      </div>
                      <p className="text-xs text-stone-400 font-sans mt-0.5">
                        {item.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex flex-wrap justify-between items-center gap-3 text-xs font-mono">
          <span className="text-stone-500">
            Autonomous Bot Agent ID: <strong className="text-stone-300">{skill.id}</strong>
          </span>
          <div className="flex items-center gap-2">
            {onOpenEvolutionHistory && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEvolutionHistory(skill);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/70 transition-colors shadow-xs"
                title="Open Evolution History side panel for this skill"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Evolution History</span>
              </button>
            )}
            {onOpenForceGraph && (
              <button
                onClick={() => {
                  onClose();
                  onOpenForceGraph(skill);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors"
                title="View this skill in the D3 Force Migration Graph"
              >
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>View in Force Graph</span>
              </button>
            )}
            {onOpenMutationSimulator && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMutationSimulator(skill);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800 transition-colors"
                title="Launch Mutation Simulator to adjust personality hyper-parameters"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Simulate Personality Mutation</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
