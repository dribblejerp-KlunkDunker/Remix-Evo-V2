import React, { useState } from 'react';
import {
  Cpu,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  RefreshCw,
  Sliders,
  Check,
  Play,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  Globe
} from 'lucide-react';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { LlmProviderId } from '../types/provider';

interface ProviderModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChanged?: (provider: LlmProviderId, model: string) => void;
}

export const ProviderModelModal: React.FC<ProviderModelModalProps> = ({
  isOpen,
  onClose,
  onProviderChanged
}) => {
  const {
    providers,
    activeProvider,
    activeModel,
    selectProvider,
    selectModel,
    testConnection,
    testResult,
    isTesting,
    refreshProviders,
    executorModel,
    judgeModel,
    architectModel,
    setExecutorModel,
    setJudgeModel,
    setArchitectModel
  } = useProviderConfig();

  const [activeTab, setActiveTab] = useState<'providers' | 'roles'>('providers');

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === activeProvider) || providers[0];

  const handleSelectProvider = (providerId: LlmProviderId, modelId?: string) => {
    selectProvider(providerId, modelId);
    if (onProviderChanged) {
      const p = providers.find((pr) => pr.id === providerId);
      onProviderChanged(providerId, modelId || p?.defaultModel || 'gemini-3.8-flash');
    }
  };

  const handleSelectModel = (modelId: string) => {
    selectModel(modelId);
    if (onProviderChanged) {
      onProviderChanged(activeProvider, modelId);
    }
  };

  const getProviderIconColor = (id: LlmProviderId) => {
    switch (id) {
      case 'gemini': return 'text-purple-400 bg-purple-950/80 border-purple-500/50';
      case 'claude': return 'text-amber-400 bg-amber-950/80 border-amber-500/50';
      case 'openai': return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50';
      case 'deepseek': return 'text-blue-400 bg-blue-950/80 border-blue-500/50';
      case 'groq': return 'text-orange-400 bg-orange-950/80 border-orange-500/50';
      default: return 'text-stone-300 bg-stone-800 border-stone-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-stone-800 border border-stone-700 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AI Model & Provider Gateway</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                  Multi-LLM Matrix
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans">
                Wire up and toggle between Claude, Gemini, OpenAI, DeepSeek, and Groq for research, evolution, and SEC analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshProviders()}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
              title="Refresh provider status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switchers: Providers vs Role Assignment */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-5 gap-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'providers'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Active Provider & Models</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Multi-Model Role Assignment</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'providers' ? (
            <div className="space-y-6">
              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-stone-400 font-bold uppercase tracking-wider">
                  Select Active Model Provider
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {providers.map((p) => {
                    const isSelected = p.id === activeProvider;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProvider(p.id)}
                        className={`p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-stone-800/90 border-purple-500 shadow-md ring-2 ring-purple-500/40'
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getProviderIconColor(p.id)}`}>
                              {p.name.split(' ')[0]}
                            </span>
                            {p.isConfigured ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" title="Configured via Environment" />
                            ) : (
                              <span className="text-[9px] font-mono text-stone-500">Env ready</span>
                            )}
                          </div>

                          <div className="text-sm font-bold text-white pt-1">{p.name}</div>
                          <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">
                            {p.tagline}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                          <span>{p.models.length} Models</span>
                          {isSelected && <span className="text-purple-400 font-bold">Active</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Models available for selected provider */}
              <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Available Models for {currentProvider.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    Active: <strong className="text-purple-300">{activeModel}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentProvider.models.map((m) => {
                    const isSelected = activeModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectModel(m.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                            : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white">{m.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                          <span>Context: {m.contextWindow}</span>
                          {m.supportsThinking && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                              Reasoning
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Connection Test Console */}
              <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Test Live Connectivity & Latency
                    </span>
                  </div>

                  <button
                    onClick={() => testConnection()}
                    disabled={isTesting}
                    className="px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing {activeModel}...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Test {currentProvider.name}</span>
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded border text-xs font-mono space-y-2 ${
                      testResult.success
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                        : 'bg-red-950/30 border-red-800/60 text-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        {testResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Connection Verified: {testResult.telemetry?.provider.toUpperCase()} ({testResult.telemetry?.model})</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span>Connection Failed</span>
                          </>
                        )}
                      </div>
                      {testResult.telemetry && (
                        <span className="text-stone-400 font-mono text-[11px]">
                          Latency: {testResult.telemetry.latencyMs}ms · Tokens: {testResult.telemetry.totalTokens || 'N/A'}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-stone-300 font-sans">
                      {testResult.success ? testResult.text : testResult.error}
                    </p>
                  </div>
                )}
              </div>

              {/* Environment Variable Setup Help */}
              <div className="p-4 rounded-lg bg-stone-950/60 border border-stone-800 space-y-2 text-xs font-mono text-stone-400">
                <div className="text-stone-300 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Configuring API Keys for Claude, OpenAI, and other Providers:</span>
                </div>
                <p className="font-sans leading-relaxed text-[11px]">
                  Keys are securely loaded by the backend from environment variables or the AI Studio <strong>Settings &gt; Secrets</strong> panel. No client-side key entry is required.
                </p>
                <div className="p-2.5 rounded bg-black/60 border border-stone-800/80 font-mono text-[10px] space-y-1 text-stone-300">
                  <div>ANTHROPIC_API_KEY=your_claude_key_here</div>
                  <div>GEMINI_API_KEY=your_gemini_key_here</div>
                  <div>OPENAI_API_KEY=your_openai_key_here</div>
                  <div>DEEPSEEK_API_KEY=your_deepseek_key_here</div>
                  <div>GROQ_API_KEY=your_groq_key_here</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-mono">Specialized Model Roles</h3>
                <p className="text-xs text-stone-400 font-sans">
                  Assign different AI models to distinct stages of the evolution engine to avoid single-model blind spots.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Executor Role */}
                <div className="p-4 rounded-lg bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Executor Model</div>
                      <div className="text-[10px] text-stone-400 font-sans">Runs skill reasoning against scenarios</div>
                    </div>
                  </div>

                  <select
                    value={executorModel}
                    onChange={(e) => setExecutorModel(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-xs font-mono text-stone-200 p-2 rounded focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast specialist execution)</option>
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (General fast execution)</option>
                    <option value="claude:claude-3-5-haiku-20241022">Claude 3.5 Haiku (High-speed triage)</option>
                    <option value="claude:claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Forensic reasoning)</option>
                    <option value="openai:gpt-4o-mini">OpenAI GPT-4o Mini (Cost-efficient)</option>
                    <option value="groq:llama-3.3-70b-versatile">Groq Llama 3.3 70B (Ultra-low latency)</option>
                  </select>
                </div>

                {/* Judge Role */}
                <div className="p-4 rounded-lg bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Judge & Arbiter</div>
                      <div className="text-[10px] text-stone-400 font-sans">Independently grades outputs and rule adherence</div>
                    </div>
                  </div>

                  <select
                    value={judgeModel}
                    onChange={(e) => setJudgeModel(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-xs font-mono text-stone-200 p-2 rounded focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Balanced grading)</option>
                    <option value="claude:claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Deep forensic judge)</option>
                    <option value="claude:claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Rule verification)</option>
                    <option value="openai:o3-mini">OpenAI o3-mini (STEM & logic arbitration)</option>
                    <option value="deepseek:deepseek-reasoner">DeepSeek R1 (Chain-of-thought verification)</option>
                  </select>
                </div>

                {/* Architect Role */}
                <div className="p-4 rounded-lg bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Genome Architect</div>
                      <div className="text-[10px] text-stone-400 font-sans">Writes mutations, recombines ideas, generates skills</div>
                    </div>
                  </div>

                  <select
                    value={architectModel}
                    onChange={(e) => setArchitectModel(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-xs font-mono text-stone-200 p-2 rounded focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (High-throughput mutation)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex architecture)</option>
                    <option value="claude:claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Advanced code mutation)</option>
                    <option value="claude:claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Precise invariant writing)</option>
                    <option value="openai:gpt-4o">OpenAI GPT-4o (Cross-domain recombination)</option>
                    <option value="deepseek:deepseek-chat">DeepSeek V3 (Mathematical genome structure)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs font-mono">
          <div className="text-stone-400">
            Active: <span className="text-white font-bold">{currentProvider.name}</span> · <span className="text-purple-300">{activeModel}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
