export type LlmProviderId = 'gemini' | 'claude' | 'openai' | 'deepseek' | 'groq';

export interface ProviderModelInfo {
  id: string;
  name: string;
  contextWindow: string;
  recommendedRole: 'executor' | 'judge' | 'architect' | 'research' | 'all';
  supportsThinking?: boolean;
}

export interface ProviderDescriptor {
  id: LlmProviderId;
  name: string;
  tagline: string;
  envKeyName: string;
  isConfigured: boolean;
  defaultModel: string;
  models: ProviderModelInfo[];
  iconType: string;
}

export interface ProviderStatusResponse {
  providers: ProviderDescriptor[];
  activeProvider: LlmProviderId;
  activeModel: string;
}

export interface ModelTestResult {
  success: boolean;
  text?: string;
  error?: string;
  telemetry?: {
    latencyMs: number;
    promptTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    provider: string;
    model: string;
  };
}
