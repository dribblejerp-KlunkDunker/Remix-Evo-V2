import "dotenv/config";
import express from "express";
// vite is loaded on demand in the dev branch below. A top-level import made the
// production server require the entire build toolchain just to start.
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

import { createInteraction, streamInteraction } from "./server/lib/agentClient.ts";
import { createInteraction as createInteractionPerseus, streamInteraction as streamInteractionPerseus } from "./server/lib/agentClientPerseus.ts";
import { multiProviderLlm } from "./server/lib/multiProviderLlm.ts";
import { EvolutionEngine } from "./server/evolution/engine.ts";
import { safeJoin, parseTicker, rateLimit, UnsafePathError } from "./server/lib/security.ts";
import { registerEvolutionRoutes } from "./server/evolution/routes.ts";

function loadAgentFiles(dir: string, basePath: string): Array<{type: string, content: string, target: string}> {
  let files: Array<{type: string, content: string, target: string}> = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const targetPath = path.posix.join(basePath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(loadAgentFiles(fullPath, targetPath));
    } else {
      files.push({
        type: "inline",
        content: fs.readFileSync(fullPath, "utf-8"),
        target: targetPath
      });
    }
  }
  return files;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 50mb on every JSON route invited memory exhaustion on endpoints that take a
  // ticker and a sentence. The one route that legitimately takes large bodies
  // (artifact upload) sets its own raw limit.
  app.use(express.json({ limit: '256kb' }));
  app.set('trust proxy', true);

  const spendLimit = rateLimit({ windowMs: 60_000, max: 120, name: 'model-backed endpoints' });
  const uploadLimit = rateLimit({ windowMs: 60_000, max: 120, name: 'uploads' });

  app.post("/api/tts", spendLimit, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'x-goog-api-client': 'applet-tickr/1.0.0'
          }
        }
      });
      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: text,
        response_modalities: ['audio'],
        generation_config: {
          speech_config: [
            {
              speaker: "Speaker 1",
              language: "en-us",
              voice: "kore"
            },
            {
              speaker: "Speaker 2",
              language: "en-us",
              voice: "aoede"
            }
          ]
        }
      });

      let audioBuffer = null;
      let mimeType = "audio/wav";

      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const audioContent = step.content?.find(c => c.type === 'audio');
          if (audioContent && audioContent.data) {
            const pcmBuffer = Buffer.from(audioContent.data, 'base64');
            
            // If it's raw PCM, wrap it in a WAV header so browsers can play it
            if (audioContent.mime_type === 'audio/l16' || !audioContent.mime_type) {
              const sampleRate = 24000;
              const numChannels = 1;
              const wavHeader = Buffer.alloc(44);
              wavHeader.write("RIFF", 0);
              wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
              wavHeader.write("WAVE", 8);
              wavHeader.write("fmt ", 12);
              wavHeader.writeUInt32LE(16, 16);
              wavHeader.writeUInt16LE(1, 20);
              wavHeader.writeUInt16LE(numChannels, 22);
              wavHeader.writeUInt32LE(sampleRate, 24);
              wavHeader.writeUInt32LE(sampleRate * numChannels * 2, 28);
              wavHeader.writeUInt16LE(numChannels * 2, 32);
              wavHeader.writeUInt16LE(16, 34);
              wavHeader.write("data", 36);
              wavHeader.writeUInt32LE(pcmBuffer.length, 40);
              
              audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
              mimeType = "audio/wav";
            } else {
              audioBuffer = pcmBuffer;
              mimeType = audioContent.mime_type;
            }
          }
        }
      }

      if (audioBuffer) {
        res.setHeader("Content-Type", mimeType);
        res.send(audioBuffer);
      } else {
        res.status(500).json({ error: "Failed to generate audio content" });
      }
    } catch (error: any) {
      console.error("[TTS] Error:", error);
      res.status(500).json({ error: error.message || "TTS Generation failed" });
    }
  });

  app.get("/api/providers", (req, res) => {
    res.json({
      providers: multiProviderLlm.getProvidersList(),
      activeProvider: process.env.ACTIVE_LLM_PROVIDER || 'gemini',
      activeModel: process.env.ACTIVE_LLM_MODEL || 'gemini-3.8-flash'
    });
  });

  app.post("/api/models/test", spendLimit, async (req, res) => {
    try {
      const { provider, model, prompt } = req.body;
      const result = await multiProviderLlm.generateText({
        provider,
        model,
        prompt: prompt || 'Verify model operational readiness in 1 concise sentence.',
        maxTokens: 120
      });
      res.json({
        success: true,
        text: result.text,
        telemetry: result.telemetry
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Model test failed' });
    }
  });

  app.get("/api/download/deb", (req, res) => {
    const candidatePaths = [
      path.join(process.cwd(), 'remix-evo_0.2.0_amd64.deb'),
      path.join(process.cwd(), 'dist', 'remix-evo_0.2.0_amd64.deb'),
      path.join('/app/applet', 'remix-evo_0.2.0_amd64.deb'),
    ];
    const foundPath = candidatePaths.find((p) => fs.existsSync(p));
    if (foundPath) {
      res.download(foundPath, 'remix-evo_0.2.0_amd64.deb');
    } else {
      res.status(404).json({ error: 'Debian package not found. Run npm run build:chromebook first.' });
    }
  });

  app.get("/api/download/desktop-bundle", (req, res) => {
    const zipPath = path.join(process.cwd(), 'dist', 'remix-evo-desktop.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'remix-evo-desktop.zip');
    } else {
      res.status(404).json({ error: 'Desktop bundle not found.' });
    }
  });


  app.post("/api/upload_artifact", uploadLimit, express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
    try {
        const localArtifactsDir = path.join(process.cwd(), 'workspace', 'artifacts');
        // Previously `path.join(dir, req.query.name)` — `?name=../../server.ts`
        // overwrote source files. safeJoin refuses separators, dot-segments and
        // anything resolving outside the artifacts directory.
        const target = safeJoin(
          localArtifactsDir,
          req.query.name ?? 'podcast_briefing.wav',
          ['.wav', '.mp3', '.ogg', '.json', '.txt', '.md', '.png', '.jpg', '.pdf'],
        );
        if (!fs.existsSync(localArtifactsDir)) {
            fs.mkdirSync(localArtifactsDir, { recursive: true });
        }
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: "Empty upload." });
        }
        fs.writeFileSync(target, req.body);
        console.log(`[upload] Saved ${path.basename(target)} (${req.body.length} bytes)`);
        res.json({ success: true });
    } catch (e) {
        if (e instanceof UnsafePathError) {
            return res.status(400).json({ error: e.message });
        }
        console.error("[upload] Error:", e);
        res.status(500).json({ error: "Upload failed." });
    }
  });

  app.get("/api/download_jsonl", (req, res) => {
    const ticker = parseTicker(req.query.ticker);
    if (!ticker) {
      return res.status(400).send("Missing or invalid ticker");
    }
    
    const runLogsDir = path.join(process.cwd(), 'run_logs');
    if (!fs.existsSync(runLogsDir)) {
      return res.status(404).send("No logs found");
    }
    
    const files = fs.readdirSync(runLogsDir)
      .filter(f => f.startsWith(`run_log_${ticker}_`) && f.endsWith('.jsonl'))
      .sort((a, b) => {
        // extract timestamp
        const aMatch = a.match(/_(\d+)\.jsonl$/);
        const bMatch = b.match(/_(\d+)\.jsonl$/);
        if (aMatch && bMatch) {
          return parseInt(bMatch[1]) - parseInt(aMatch[1]);
        }
        return 0;
      });
      
    if (files.length === 0) {
      return res.status(404).send("No JSONL log found for ticker");
    }
    
    const latestFile = path.join(runLogsDir, files[0]);
    res.download(latestFile);
  });

  app.post("/api/analyze", spendLimit, async (req, res) => {
    try {
      const { instruction, origin, model } = req.body;
      // `ticker` is interpolated into three filenames below. Unvalidated, a
      // value like "../../x" wrote log files outside run_logs.
      const ticker = parseTicker(req.body?.ticker);
      if (!ticker) {
        return res.status(400).json({ error: "Missing or invalid ticker. Use letters, digits, dots or hyphens (max 12)." });
      }

      console.log(`[analyze] Starting analysis for ${ticker} using model ${model || 'default'}`);
      
      const agentFiles = loadAgentFiles(path.join(process.cwd(), "agent"), "/.agents");
      
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const publicUrl = origin || `${protocol}://${host}`;

      let finalInstruction = instruction ? `${instruction}` : `Find and analyze recent SEC filings and public stock documents for ${ticker}. Make sure that you are looking for the most up to date documents of the existing quarter or the quarter before (if documents have not been out yet for the existing quarter, look for the last quarter).`;

      const dynamicSchema = `{
  "verdict": {
    "summary": "...",
    "conviction_score": 85,
    "key_takeaways": ["...", "..."]
  },
  "deep_insights": [
    {
      "category": "Risk Assessment",
      "title": "...",
      "description": "...",
      "impact_score": 8
    }
  ],
  "findings": [
    {
      "documentType": "Form 10-K",
      "keyInsights": ["...", "..."],
      "date": "2023-12-31",
      "sourceUrl": "..."
    }
  ],
  "financial_charts": {
    "stock_price_4m": [
      { "date": "Oct '24", "price": 150.5 }
    ],
    "financial_performance_4q": [
      { "quarter": "Q1 2025", "revenue": 10.5, "net_income": 2.1, "distributions": 0.5 }
    ]
  }
}`;;

      const prompt = `Perform a comprehensive document analysis on ${ticker}. ${finalInstruction}\n\nCRITICAL INSTRUCTIONS FOR QUANTITATIVE DATA (CHARTS):\nFor stock_price_4m and financial_performance_4q, you MUST use standard open web searches (e.g. Yahoo Finance, Google Finance, MarketWatch) WITHOUT the filetype:pdf restriction to get accurate historical prices, distributions, revenue, and net income. Do NOT rely solely on SEC PDFs for this quantitative data.\nFor stock_price_4m, provide exactly 4 data points representing the past 4 months of stock prices. For each month, give the closing price on the last trading day of the month. Order the array chronologically from the oldest month to the newest month (left to right).\nFor financial_performance_4q, if the ticker is a regular stock, provide net income and revenue for the past four completed quarters. If it is an ETF, provide quarterly distributions (dividends/yield per share) for the past four completed quarters. Ensure the array is chronologically ordered from oldest quarter to newest (left to right).\n\nCRITICAL INSTRUCTIONS FOR QUALITATIVE DATA (INSIGHTS & SUMMARIES):\nFor the Executive Summary, Key Takeaways, and Deep Insights, you MUST leverage BOTH the findings extracted from the PDF SEC filings AND insights from broader open web searches to create a comprehensive analysis.\n\nCRITICAL: You MUST output the final synthesis report as a raw JSON object wrapped in \`\`\`json ... \`\`\` markdown block in your final text response. The JSON must match the following schema EXACTLY. **HEAVILY PENALIZED:** Do NOT rename keys. Do NOT add extra root-level keys like "macro_risk_analysis". Make sure to populate the "findings" array with exactly the keys "documentType", "keyInsights", "date", and "sourceUrl". For stock_price_4m, use exactly the keys "date" and "price". The "deep_insights" array MUST use exactly the keys "category", "title", "description", and "impact_score":\n${dynamicSchema}\nDo not include multiple sub-agents, just do the analysis yourself based on the retrieved documents and searches.`;

      const provider = req.body?.provider;
      const isNonGemini = provider === 'claude' || provider === 'openai' || provider === 'deepseek' || provider === 'groq' ||
        (model && (model.includes('claude') || model.includes('gpt') || model.startsWith('o3') || model.includes('deepseek') || model.includes('llama')));

      if (isNonGemini) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const activeProvider = provider || (model?.includes('claude') ? 'claude' : model?.includes('gpt') ? 'openai' : model?.includes('deepseek') ? 'deepseek' : 'groq');
        const activeModel = model || (activeProvider === 'claude' ? 'claude-3-7-sonnet-20250219' : activeProvider === 'openai' ? 'gpt-4o' : 'deepseek-chat');

        const startTime = Date.now();
        const runId = Date.now();
        const runLogsDir = path.join(process.cwd(), 'run_logs');
        if (!fs.existsSync(runLogsDir)) {
          fs.mkdirSync(runLogsDir, { recursive: true });
        }
        const jsonlLogPath = path.join(runLogsDir, `run_log_${ticker}_${runId}.jsonl`);

        res.write(`data: ${JSON.stringify({ type: 'thinking', text: `[${activeProvider.toUpperCase()} (${activeModel})] Initializing SEC synthesis pipeline for ${ticker}...\n` })}\n\n`);

        let accumulated = '';
        let totalTokens = 0;

        try {
          const telemetry = await multiProviderLlm.streamText(
            {
              provider: activeProvider,
              model: activeModel,
              prompt,
              system: 'You are an elite financial research analyst specializing in SEC filings, forensic accounting, quantitative modeling, and risk factors.',
              temperature: 0.4
            },
            (chunk) => {
              accumulated += chunk;
              res.write(`data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`);
            }
          );
          totalTokens = telemetry.totalTokens || Math.round(accumulated.length / 4);
        } catch (streamErr: any) {
          console.error(`[analyze] ${activeProvider} error:`, streamErr);
          res.write(`data: ${JSON.stringify({ type: 'error', message: streamErr.message })}\n\n`);
          res.end();
          return;
        }

        const completeEvt = { type: 'complete', interaction: { usage: { total_tokens: totalTokens } } };
        res.write(`data: ${JSON.stringify(completeEvt)}\n\n`);

        try {
          fs.writeFileSync(jsonlLogPath, JSON.stringify(completeEvt) + '\n', 'utf-8');
        } catch {}

        const totalDurationSecs = (Date.now() - startTime) / 1000;
        res.write(`data: ${JSON.stringify({
          type: 'final_stats',
          duration: totalDurationSecs,
          tokens: totalTokens,
          jsonlLogUrl: '/run_logs/' + `run_log_${ticker}_${runId}.jsonl`
        })}\n\n`);

        res.end();
        return;
      }

      let response;
      if (model === 'perseus') {
        response = await createInteractionPerseus({
          prompt,
          inlineSources: agentFiles,
          tools: [{ type: "google_search" }]
        });
      } else {
        response = await createInteraction({
          prompt,
          inlineSources: agentFiles,
          tools: [{ type: "google_search" }]
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[analyze] createInteraction failed: ${response.status} ${errorText}`);
        return res.status(500).json({ error: "Failed to start agent interaction." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      
      const startTime = Date.now();
      const runLogsDir = path.join(process.cwd(), 'run_logs');
      if (!fs.existsSync(runLogsDir)) {
          fs.mkdirSync(runLogsDir, { recursive: true });
      }

      const runId = Date.now();
      const jsonlLogPath = path.join(runLogsDir, `run_log_${ticker}_${runId}.jsonl`);
      
      let debugLog = `--- Analysis Run for ${ticker} at ${new Date().toISOString()} ---\n\n`;
      const toolExecutions = {};
      let totalTokens = 0;
          
      const stream = model === 'perseus' ? streamInteractionPerseus(response) : streamInteraction(response);
      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        
        if (event.type === 'complete' && event.interaction) {
            const usage = (event.interaction.usage || event.interaction.usage_metadata) as any;
            if (usage) {
                totalTokens = usage.total_tokens || usage.totalTokenCount || usage.total_token_count || 0;
            }
        }
        
        try {
          fs.appendFileSync(jsonlLogPath, JSON.stringify(event) + '\n', 'utf-8');
        } catch (e) {
          console.error("Failed to write to JSONL log", e);
        }
            
        if (event.type === 'tool_call') {
          const callId = event.callId || `unknown_${Math.random()}`;
          toolExecutions[callId] = {
            name: event.name || 'code_execution_call',
            args: event.arguments,
            startTime: Date.now()
          };
          debugLog += `[${new Date().toISOString()}] [TOOL CALL START] ${event.name || 'code_execution_call'}\n`;
          debugLog += `Call ID: ${callId}\n`;
          debugLog += `Arguments: ${JSON.stringify(event.arguments, null, 2)}\n\n`;
        } else if (event.type === 'tool_result') {
          const callId = event.callId || 'unknown';
          const execution = toolExecutions[callId];
          const duration = execution ? ((Date.now() - execution.startTime) / 1000).toFixed(2) + 's' : 'unknown';
          if (execution) {
            execution.duration = duration;
            execution.result = event.result;
          }
          debugLog += `[${new Date().toISOString()}] [TOOL RESULT END] ${event.name || 'command'}\n`;
          debugLog += `Call ID: ${callId}\n`;
          debugLog += `Duration: ${duration}\n`;
          debugLog += `Result: ${event.result ? String(event.result).substring(0, 500) : ''}...\n\n`;
        } else if (event.type === 'text') {
          debugLog += `[TEXT OUTPUT]\n${event.text}\n\n`;
        } else if (event.type === 'error') {
          debugLog += `[ERROR]\n${event.message}\n\n`;
        }

        if (event.type === 'done' || event.type === 'complete' || event.type === 'error') {
            break;
        }
      }
          
      const totalDurationSecs = ((Date.now() - startTime) / 1000);
      const totalDuration = totalDurationSecs.toFixed(2) + 's';
      
      // Send final reliable stats to client
      res.write(`data: ${JSON.stringify({ type: 'final_stats', duration: totalDurationSecs, tokens: totalTokens, jsonlLogUrl: '/run_logs/' + `run_log_${ticker}_${runId}.jsonl` })}\n\n`);

      let summaryLog = `========================================================\n`;
      summaryLog += `                 RUN SUMMARY FOR ${ticker.toUpperCase()}\n`;
      summaryLog += `                 Total Duration: ${totalDuration}\n`;
      summaryLog += `========================================================\n\n`;
      summaryLog += `1. SUB-AGENT EXECUTIONS:\n`;
      summaryLog += `--------------------------------------------------------\n`;
      
      let allWorked = true;
      Object.values(toolExecutions).forEach((exec: any, idx) => {
          const status = exec.result ? 'Completed' : 'Failed/Timeout';
          if (!exec.result || String(exec.result).includes('error') || String(exec.result).includes('traceback')) allWorked = false;
          summaryLog += `Agent Step ${idx + 1}: ${exec.name}\n`;
          summaryLog += `Status: ${status}\n`;
          summaryLog += `Duration: ${exec.duration || 'unknown'}\n`;
          summaryLog += `Arguments: ${JSON.stringify(exec.args)}\n`;
          const resultStr = exec.result ? String(exec.result) : '';
          summaryLog += `Output Preview: ${resultStr ? resultStr.substring(0, 200).replace(/\n/g, ' ') + '...' : 'None'}\n`;
          summaryLog += `--------------------------------------------------------\n`;
      });
      
      summaryLog += `\n2. OVERALL AGENT STATUS: ${allWorked ? 'SUCCESS' : 'WITH ERRORS'}\n`;
      summaryLog += `\n3. GENERATED MEDIA ARTIFACTS:\n`;
      summaryLog += `Audio Briefing Link: /artifacts/podcast_briefing.wav\n`;
      summaryLog += `\n========================================================\n\n`;
      summaryLog += `RAW EXECUTION LOGS:\n\n`;

      try {
        const logFileName = `run_log_${ticker}_${Date.now()}.txt`;
        const finalLog = summaryLog + debugLog;
        fs.writeFileSync(path.join(runLogsDir, logFileName), finalLog, 'utf-8');
        // Maintain backwards compatibility with the old txt file
        fs.writeFileSync(path.join(process.cwd(), `sub_agents_debug_${ticker}.txt`), finalLog, 'utf-8');
      } catch (e) {
        console.error("Failed to write debug log", e);
      }
          
      res.end();
    } catch (err: any) {
      console.error("[analyze] Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Analyze failed" });
      }
    }
  });

  // --- Evolution engine --------------------------------------------------
  // Registered before the SPA catch-all so /api/evolution/* is not swallowed by
  // the index.html fallback. A missing GEMINI_API_KEY is not fatal: the rest of
  // the server still runs and the dashboard falls back to its seed data.
  let evolutionEngine: EvolutionEngine | null = null;
  try {
    evolutionEngine = new EvolutionEngine();
    registerEvolutionRoutes(app, evolutionEngine);
    await evolutionEngine.init();
    console.log("[evolution] engine ready");
  } catch (err: any) {
    console.warn(`[evolution] engine unavailable: ${err?.message ?? err}`);
    app.use('/api/evolution', (_req, res) => {
      res.status(503).json({ error: "Evolution engine is not available on this server." });
    });
  }

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    try {
      await evolutionEngine?.shutdown();
    } catch (err) {
      console.error("[evolution] shutdown failed", err);
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
  app.use('/artifacts', express.static(path.join(process.cwd(), 'workspace', 'artifacts')));
  app.use('/run_logs', express.static(path.join(process.cwd(), 'run_logs')));
  // Was `express.static(process.cwd())`: it served every source file, the
  // evolution state, and the contents of .git. The only file the app writes to
  // the working directory is sub_agents_debug_<TICKER>.txt, so serve exactly that.
  app.get('/latest_log/:ticker', (req, res) => {
    const ticker = parseTicker(req.params.ticker);
    if (!ticker) return res.status(400).send('Invalid ticker');
    const file = path.join(process.cwd(), `sub_agents_debug_${ticker}.txt`);
    if (!fs.existsSync(file)) return res.status(404).send('No debug log for that ticker');
    res.type('text/plain').sendFile(file);
  });

  if (process.env.NODE_ENV !== "production" || !indexHtmlExists) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("Server listen error:", err);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
