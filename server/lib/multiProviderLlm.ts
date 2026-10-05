/**
 * Universal Multi-Provider LLM Gateway.
 * Supports Google Gemini, Anthropic Claude, OpenAI, DeepSeek, and Groq.
 */

import { GoogleGenAI } from "@google/genai";
import { extractJsonBlocks } from "./jsonExtractor.ts";

export type LlmProviderId = 'gemini' | 'claude' | 'openai' | 'deepseek' | 'groq' | 'custom';

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
  apiBaseUrl?: string;
  iconType: string;
}

export interface UniversalCallOptions {
  provider?: LlmProviderId;
  model?: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  responseMimeType?: string;
  signal?: AbortSignal;
}

export interface UniversalCallTelemetry {
  latencyMs: number;
  promptTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  provider: LlmProviderId;
  model: string;
}

export interface UniversalCallResult {
  text: string;
  telemetry: UniversalCallTelemetry;
}

// Model registry for all providers
export const PROVIDER_CATALOG: ProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'High-speed reasoning, multimodal analysis & native tool calling',
    envKeyName: 'GEMINI_API_KEY',
    isConfigured: false, // populated dynamically
    defaultModel: 'gemini-3.8-flash',
    iconType: 'gemini',
    models: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Flagship Fast)', contextWindow: '1M tokens', recommendedRole: 'all' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Complex Reasoning)', contextWindow: '2M tokens', recommendedRole: 'architect' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra Low Latency)', contextWindow: '1M tokens', recommendedRole: 'executor' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Specialist Runner)', contextWindow: '1M tokens', recommendedRole: 'judge' }
    ]
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    tagline: 'Industry-leading forensic reasoning, coding precision & nuanced logic',
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
    tagline: 'Ultra-low latency LPU inference for high-speed agent cycles',
    envKeyName: 'GROQ_API_KEY',
    isConfigured: false,
    defaultModel: 'llama-3.3-70b-versatile',
    iconType: 'groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', contextWindow: '128K tokens', recommendedRole: 'all' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', contextWindow: '128K tokens', recommendedRole: 'judge' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Fast MoE)', contextWindow: '32K tokens', recommendedRole: 'executor' }
    ]
  }
];

export class MultiProviderLlmGateway {
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    this.refreshClients();
  }

  public refreshClients() {
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
            'x-goog-api-client': 'remix-multi-provider/1.0.0'
          }
        }
      });
    } else {
      this.geminiClient = null;
    }
  }

  /**
   * Returns list of all available providers and their configuration status
   */
  public getProvidersList(): ProviderDescriptor[] {
    return PROVIDER_CATALOG.map((p) => {
      let isConfigured = false;
      if (p.id === 'gemini') isConfigured = !!process.env.GEMINI_API_KEY;
      else if (p.id === 'claude') isConfigured = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
      else if (p.id === 'openai') isConfigured = !!process.env.OPENAI_API_KEY;
      else if (p.id === 'deepseek') isConfigured = !!process.env.DEEPSEEK_API_KEY;
      else if (p.id === 'groq') isConfigured = !!process.env.GROQ_API_KEY;

      return {
        ...p,
        isConfigured
      };
    });
  }

  /**
   * Resolves the target provider and model from options
   */
  public resolveProviderAndModel(opts: UniversalCallOptions): { provider: LlmProviderId; model: string } {
    let provider = opts.provider;
    let model = opts.model;

    // Check if model string is formatted as "provider:model" (e.g. "claude:claude-3-7-sonnet-20250219")
    if (model && model.includes(':')) {
      const parts = model.split(':');
      provider = parts[0] as LlmProviderId;
      model = parts.slice(1).join(':');
    }

    if (!provider) {
      if (model?.toLowerCase().includes('claude')) provider = 'claude';
      else if (model?.toLowerCase().includes('gpt') || model?.toLowerCase().startsWith('o3')) provider = 'openai';
      else if (model?.toLowerCase().includes('deepseek')) provider = 'deepseek';
      else if (model?.toLowerCase().includes('llama') || model?.toLowerCase().includes('mixtral')) provider = 'groq';
      else provider = (process.env.DEFAULT_LLM_PROVIDER as LlmProviderId) || 'gemini';
    }

    if (!model) {
      const matched = PROVIDER_CATALOG.find((p) => p.id === provider);
      model = matched?.defaultModel || 'gemini-3.8-flash';
    }

    return { provider, model };
  }

  /**
   * Executes a text generation call across any supported provider
   */
  public async generateText(opts: UniversalCallOptions): Promise<UniversalCallResult> {
    const { provider, model } = this.resolveProviderAndModel(opts);
    const startTime = Date.now();

    switch (provider) {
      case 'gemini':
        return this.callGemini(model, opts, startTime);
      case 'claude':
        return this.callClaude(model, opts, startTime);
      case 'openai':
        return this.callOpenAI(model, opts, startTime);
      case 'deepseek':
        return this.callDeepSeek(model, opts, startTime);
      case 'groq':
        return this.callGroq(model, opts, startTime);
      default:
        throw new Error(`Unsupported LLM provider: "${provider}"`);
    }
  }

  /**
   * Executes a structured JSON call across any supported provider
   */
  public async generateJson<T>(opts: UniversalCallOptions): Promise<{ data: T; telemetry: UniversalCallTelemetry }> {
    const jsonPrompt = `${opts.prompt}\n\nCRITICAL: Return ONLY a valid, raw JSON object. Do not wrap in markdown quotes or preamble.`;
    const res = await this.generateText({
      ...opts,
      prompt: jsonPrompt,
      responseMimeType: 'application/json'
    });

    const parsed = coerceJson<T>(res.text);
    if (!parsed) {
      throw new Error(`Provider "${opts.provider || 'default'}" output could not be parsed as JSON: ${res.text.slice(0, 200)}`);
    }

    return {
      data: parsed,
      telemetry: res.telemetry
    };
  }

  /**
   * Streams text output across any supported provider
   */
  public async streamText(
    opts: UniversalCallOptions,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    const { provider, model } = this.resolveProviderAndModel(opts);
    const startTime = Date.now();

    switch (provider) {
      case 'gemini':
        return this.streamGemini(model, opts, startTime, onChunk);
      case 'claude':
        return this.streamClaude(model, opts, startTime, onChunk);
      case 'openai':
        return this.streamOpenAI(model, opts, startTime, onChunk);
      case 'deepseek':
        return this.streamDeepSeek(model, opts, startTime, onChunk);
      case 'groq':
        return this.streamGroq(model, opts, startTime, onChunk);
      default:
        throw new Error(`Unsupported LLM provider: "${provider}"`);
    }
  }

  // --- Provider Implementations ---

  private async callGemini(model: string, opts: UniversalCallOptions, startTime: number): Promise<UniversalCallResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Please check your environment variables.");
    }
    if (!this.geminiClient) this.refreshClients();

    const response = await this.geminiClient!.models.generateContent({
      model,
      contents: opts.prompt,
      config: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 4096,
        ...(opts.system ? { systemInstruction: opts.system } : {}),
        ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {})
      }
    });

    const text = response.text || '';
    const usage = response.usageMetadata;

    return {
      text,
      telemetry: {
        latencyMs: Date.now() - startTime,
        promptTokens: usage?.promptTokenCount ?? null,
        outputTokens: usage?.candidatesTokenCount ?? null,
        totalTokens: usage?.totalTokenCount ?? null,
        provider: 'gemini',
        model
      }
    };
  }

  private async streamGemini(
    model: string,
    opts: UniversalCallOptions,
    startTime: number,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    if (!this.geminiClient) this.refreshClients();

    const stream = await this.geminiClient!.models.generateContentStream({
      model,
      contents: opts.prompt,
      config: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 4096,
        ...(opts.system ? { systemInstruction: opts.system } : {})
      }
    });

    let totalTokens = 0;
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) onChunk(text);
      if (chunk.usageMetadata?.totalTokenCount) {
        totalTokens = chunk.usageMetadata.totalTokenCount;
      }
    }

    return {
      latencyMs: Date.now() - startTime,
      promptTokens: null,
      outputTokens: null,
      totalTokens: totalTokens || null,
      provider: 'gemini',
      model
    };
  }

  private async callClaude(model: string, opts: UniversalCallOptions, startTime: number): Promise<UniversalCallResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured on the server. Please define ANTHROPIC_API_KEY in your environment.");
    }

    const payload: any = {
      model,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      messages: [{ role: 'user', content: opts.prompt }]
    };
    if (opts.system) payload.system = opts.system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: opts.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic Claude API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const usage = data.usage;

    return {
      text,
      telemetry: {
        latencyMs: Date.now() - startTime,
        promptTokens: usage?.input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
        totalTokens: usage ? (usage.input_tokens || 0) + (usage.output_tokens || 0) : null,
        provider: 'claude',
        model
      }
    };
  }

  private async streamClaude(
    model: string,
    opts: UniversalCallOptions,
    startTime: number,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured on the server. Please define ANTHROPIC_API_KEY in your environment.");
    }

    const payload: any = {
      model,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      stream: true,
      messages: [{ role: 'user', content: opts.prompt }]
    };
    if (opts.system) payload.system = opts.system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: opts.signal
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(`Anthropic Claude streaming error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              onChunk(event.delta.text);
            } else if (event.type === 'message_delta' && event.usage) {
              totalTokens += event.usage.output_tokens || 0;
            }
          } catch {
            // ignore partial SSE lines
          }
        }
      }
    }

    return {
      latencyMs: Date.now() - startTime,
      promptTokens: null,
      outputTokens: totalTokens || null,
      totalTokens: totalTokens || null,
      provider: 'claude',
      model
    };
  }

  private async callOpenAI(model: string, opts: UniversalCallOptions, startTime: number): Promise<UniversalCallResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server. Please define OPENAI_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const payload: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.7
    };
    if (opts.responseMimeType === 'application/json') {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: opts.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
      text,
      telemetry: {
        latencyMs: Date.now() - startTime,
        promptTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        provider: 'openai',
        model
      }
    };
  }

  private async streamOpenAI(
    model: string,
    opts: UniversalCallOptions,
    startTime: number,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server. Please define OPENAI_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const payload: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: true
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: opts.signal
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(`OpenAI streaming error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      latencyMs: Date.now() - startTime,
      promptTokens: null,
      outputTokens: null,
      totalTokens: null,
      provider: 'openai',
      model
    };
  }

  private async callDeepSeek(model: string, opts: UniversalCallOptions, startTime: number): Promise<UniversalCallResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured on the server. Please define DEEPSEEK_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7
      }),
      signal: opts.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
      text,
      telemetry: {
        latencyMs: Date.now() - startTime,
        promptTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        provider: 'deepseek',
        model
      }
    };
  }

  private async streamDeepSeek(
    model: string,
    opts: UniversalCallOptions,
    startTime: number,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured on the server. Please define DEEPSEEK_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        stream: true
      }),
      signal: opts.signal
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(`DeepSeek streaming error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      latencyMs: Date.now() - startTime,
      promptTokens: null,
      outputTokens: null,
      totalTokens: null,
      provider: 'deepseek',
      model
    };
  }

  private async callGroq(model: string, opts: UniversalCallOptions, startTime: number): Promise<UniversalCallResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured on the server. Please define GROQ_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7
      }),
      signal: opts.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
      text,
      telemetry: {
        latencyMs: Date.now() - startTime,
        promptTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        provider: 'groq',
        model
      }
    };
  }

  private async streamGroq(
    model: string,
    opts: UniversalCallOptions,
    startTime: number,
    onChunk: (chunk: string) => void
  ): Promise<UniversalCallTelemetry> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured on the server. Please define GROQ_API_KEY in your environment.");
    }

    const messages: any[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.prompt });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        stream: true
      }),
      signal: opts.signal
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(`Groq streaming error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      latencyMs: Date.now() - startTime,
      promptTokens: null,
      outputTokens: null,
      totalTokens: null,
      provider: 'groq',
      model
    };
  }
}

/** Helper to extract JSON from strings */
export function coerceJson<T>(text: string): T | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  const blocks = extractJsonBlocks(trimmed);
  if (blocks.length > 0) return blocks[0] as T;

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    } catch {
      /* give up */
    }
  }
  return null;
}

// Global singleton instance
export const multiProviderLlm = new MultiProviderLlmGateway();
