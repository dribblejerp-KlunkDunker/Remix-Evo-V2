import { useState, useEffect, useCallback } from 'react';
import { LlmProviderId, ProviderDescriptor, ModelTestResult } from '../types/provider';

const FALLBACK_PROVIDERS: ProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'High-speed reasoning, multimodal analysis & native tool calling',
    envKeyName: 'GEMINI_API_KEY',
    isConfigured: true,
    defaultModel: 'gemini-3.8-flash',
    iconType: 'gemini',
    models: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Flagship Fast)', contextWindow: '1M tokens', recommendedRole: 'all' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Complex Reasoning)', contextWindow: '2M tokens', recommendedRole: 'architect' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra Low Latency)', contextWindow: '1M tokens', recommendedRole: 'executor' }
    ]
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    tagline: 'Forensic precision, rigorous reasoning & nuanced financial logic',
    envKeyName: 'ANTHROPIC_API_KEY',
    isConfigured: false,
    defaultModel: 'claude-3-7-sonnet-20250219',
    iconType: 'claude',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', contextWindow: '200K tokens', recommendedRole: 'all', supportsThinking: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Forensic Logic)', contextWindow: '200K tokens', recommendedRole: 'architect' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Blazing Fast Triage)', contextWindow: '200K tokens', recommendedRole: 'executor' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'Universal frontier models with broad tool support and structured outputs',
    envKeyName: 'OPENAI_API_KEY',
    isConfigured: false,
    defaultModel: 'gpt-4o',
    iconType: 'openai',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Frontier Intelligence)', contextWindow: '128K tokens', recommendedRole: 'all' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Optimized High-Speed)', contextWindow: '128K tokens', recommendedRole: 'executor' },
      { id: 'o3-mini', name: 'o3-mini (Advanced STEM & Reasoning)', contextWindow: '200K tokens', recommendedRole: 'judge', supportsThinking: true }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'Deep mathematical reasoning and high-efficiency open-weight models',
    envKeyName: 'DEEPSEEK_API_KEY',
    isConfigured: false,
    defaultModel: 'deepseek-chat',
    iconType: 'deepseek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (General Intelligence)', contextWindow: '64K tokens', recommendedRole: 'all' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Deep Chain-of-Thought Reasoning)', contextWindow: '64K tokens', recommendedRole: 'architect', supportsThinking: true }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    tagline: 'Ultra-low latency LPU inference for real-time agent execution',
    envKeyName: 'GROQ_API_KEY',
    isConfigured: false,
    defaultModel: 'llama-3.3-70b-versatile',
    iconType: 'groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', contextWindow: '128K tokens', recommendedRole: 'all' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', contextWindow: '128K tokens', recommendedRole: 'judge' }
    ]
  }
];

export function useProviderConfig() {
  const [providers, setProviders] = useState<ProviderDescriptor[]>(FALLBACK_PROVIDERS);
  const [activeProvider, setActiveProvider] = useState<LlmProviderId>(() => {
    return (localStorage.getItem('remix_active_provider') as LlmProviderId) || 'gemini';
  });
  const [activeModel, setActiveModel] = useState<string>(() => {
    return localStorage.getItem('remix_active_model') || 'gemini-3.8-flash';
  });
  
  // Role-specific model mapping
  const [executorModel, setExecutorModel] = useState<string>(() => {
    return localStorage.getItem('remix_role_executor') || 'gemini-3.6-flash';
  });
  const [judgeModel, setJudgeModel] = useState<string>(() => {
    return localStorage.getItem('remix_role_judge') || 'gemini-3.8-flash';
  });
  const [architectModel, setArchitectModel] = useState<string>(() => {
    return localStorage.getItem('remix_role_architect') || 'gemini-3.8-flash';
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<ModelTestResult | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Fetch status from server
  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.providers && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      }
    } catch {
      // Keep fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  const selectProvider = (providerId: LlmProviderId, modelId?: string) => {
    setActiveProvider(providerId);
    localStorage.setItem('remix_active_provider', providerId);

    const providerObj = providers.find((p) => p.id === providerId);
    const chosenModel = modelId || providerObj?.defaultModel || 'gemini-3.8-flash';
    setActiveModel(chosenModel);
    localStorage.setItem('remix_active_model', chosenModel);
  };

  const selectModel = (modelId: string) => {
    setActiveModel(modelId);
    localStorage.setItem('remix_active_model', modelId);

    // Auto-detect provider if model matches a specific pattern
    if (modelId.includes('claude')) {
      setActiveProvider('claude');
      localStorage.setItem('remix_active_provider', 'claude');
    } else if (modelId.includes('gpt') || modelId.startsWith('o3')) {
      setActiveProvider('openai');
      localStorage.setItem('remix_active_provider', 'openai');
    } else if (modelId.includes('deepseek')) {
      setActiveProvider('deepseek');
      localStorage.setItem('remix_active_provider', 'deepseek');
    } else if (modelId.includes('llama') || modelId.includes('mixtral')) {
      setActiveProvider('groq');
      localStorage.setItem('remix_active_provider', 'groq');
    } else if (modelId.includes('gemini')) {
      setActiveProvider('gemini');
      localStorage.setItem('remix_active_provider', 'gemini');
    }
  };

  const testConnection = async (targetProvider?: LlmProviderId, targetModel?: string) => {
    const p = targetProvider || activeProvider;
    const m = targetModel || activeModel;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: p,
          model: m,
          prompt: `Acknowledge operational readiness in 1 sentence. State provider: "${p}" and model: "${m}".`
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed'
        });
      } else {
        setTestResult({
          success: true,
          text: data.text,
          telemetry: data.telemetry
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const currentProviderObj = providers.find((p) => p.id === activeProvider) || providers[0];

  return {
    providers,
    activeProvider,
    activeModel,
    currentProviderObj,
    executorModel,
    judgeModel,
    architectModel,
    setExecutorModel: (m: string) => {
      setExecutorModel(m);
      localStorage.setItem('remix_role_executor', m);
    },
    setJudgeModel: (m: string) => {
      setJudgeModel(m);
      localStorage.setItem('remix_role_judge', m);
    },
    setArchitectModel: (m: string) => {
      setArchitectModel(m);
      localStorage.setItem('remix_role_architect', m);
    },
    selectProvider,
    selectModel,
    testConnection,
    testResult,
    isTesting,
    isLoading,
    refreshProviders
  };
}
