/**
 * HTTP surface for the evolution engine.
 *
 * GET  /api/evolution/state           full snapshot for first paint
 * GET  /api/evolution/stream          SSE: live events + periodic state pushes
 * GET  /api/evolution/skills/:id      one skill with fitness and gate detail
 * GET  /api/evolution/heatmap         per-(skill, scenario) performance grid
 * GET  /api/evolution/audit           champion lineage audits + stats
 * GET  /api/evolution/cognition       measured per-skill execution telemetry
 * GET  /api/evolution/mutations       mutation-type effectiveness
 * GET  /api/evolution/conflicts       detected contradictions between skills
 * GET  /api/evolution/scenarios       the train/holdout split
 * GET  /api/evolution/lineage-graph   ancestry graph across the population
 * GET  /api/evolution/skills/:id/lineage  real lineage for any skill
 * POST /api/evolution/benchmark       { skillId } → 202 { jobId }
 * POST /api/evolution/swarm           { scenarioId, skillIds ≤ 8 } → 202 { jobId }
 * GET  /api/evolution/jobs/:id        job status and result
 *
 * Every POST requires an operator: true loopback, a bearer EVOLUTION_API_TOKEN,
 * or EVOLUTION_ALLOW_REMOTE=true. GETs are open.
 * POST /api/evolution/control         { action: start | pause | tick }
 * POST /api/evolution/seed            { vectors: [...] }
 * POST /api/evolution/remix           { parentAId, parentBId }
 */

import type { Express, Request, Response } from 'express';
import type { EvolutionEngine } from './engine.ts';
import type { EvolutionEvent } from './store.ts';
import type { VectorCategory } from '../../src/types/skills.ts';
import { ALL_VECTORS } from './genome.ts';
import { InsufficientBudgetError } from './runs.ts';
import { requireOperator, rateLimit, resetAllRateLimits } from '../lib/security.ts';
import crypto from 'crypto';

/** Max skills in one swarm run. Each is two model calls, all concurrent. */
const MAX_SWARM_ENTRANTS = 8;

interface Job {
  id: string;
  kind: 'benchmark' | 'swarm';
  status: 'running' | 'done' | 'failed';
  createdAt: number;
  finishedAt?: number;
  result?: unknown;
  error?: string;
  /** HTTP status the error maps to, so a budget refusal stays a 429. */
  errorStatus?: number;
}

export function registerEvolutionRoutes(app: Express, engine: EvolutionEngine): void {
  const controlLimit = rateLimit({ windowMs: 60_000, max: 120, name: 'evolution control' });
  const runLimit = rateLimit({ windowMs: 60_000, max: 60, name: 'benchmark and swarm runs' });

  /**
   * Benchmark and swarm runs take minutes. Holding an HTTP request open that long
   * fails behind most proxies (Cloud Run and nginx both default near 60-300s) and
   * leaves the client unable to tell a slow run from a dead one. They now return
   * 202 with a job id; the result is fetched from /jobs/:id and announced on SSE.
   */
  const jobs = new Map<string, Job>();
  const pruneJobs = () => {
    const cutoff = Date.now() - 30 * 60_000;
    for (const [id, job] of jobs) if (job.finishedAt && job.finishedAt < cutoff) jobs.delete(id);
  };

  const startJob = (kind: Job['kind'], work: () => Promise<unknown>): Job => {
    pruneJobs();
    const job: Job = { id: crypto.randomUUID(), kind, status: 'running', createdAt: Date.now() };
    jobs.set(job.id, job);
    void work()
      .then((result) => {
        job.status = 'done';
        job.result = result;
      })
      .catch((err) => {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
        job.errorStatus = err instanceof InsufficientBudgetError ? 429 : 500;
      })
      .finally(() => {
        job.finishedAt = Date.now();
        engine.emit('job', { id: job.id, kind: job.kind, status: job.status });
      });
    return job;
  };

  app.get('/api/evolution/jobs/:id', (req: Request, res: Response) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found or expired.' });
    res.json(job);
  });
  app.get('/api/evolution/state', (_req: Request, res: Response) => {
    res.json({
      skills: engine.getSkills(),
      stats: engine.getStats(),
      events: engine.getEvents(60),
      status: engine.status(),
      config: publicConfig(engine),
    });
  });

  app.get('/api/evolution/heatmap', (_req: Request, res: Response) => {
    res.json(engine.getHeatmap());
  });

  app.get('/api/evolution/audit', (_req: Request, res: Response) => {
    res.json(engine.getAudits());
  });

  app.get('/api/evolution/cognition', (_req: Request, res: Response) => {
    res.json({ profiles: engine.getCognitiveProfiles() });
  });

  app.get('/api/evolution/mutations', (_req: Request, res: Response) => {
    res.json({ outcomes: engine.getMutationOutcomes() });
  });

  app.get('/api/evolution/conflicts', (_req: Request, res: Response) => {
    res.json({ conflicts: engine.getConflicts() });
  });

  app.get('/api/evolution/scenarios', (_req: Request, res: Response) => {
    res.json(engine.getScenarios());
  });

  app.get('/api/evolution/skills/:id', (req: Request, res: Response) => {
    const skill = engine.getSkills(true).find((s) => s.id === req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });
    res.json({
      skill,
      fitness: engine.getFitness(skill.id),
      promotionGate: engine.getPromotionGate(skill.id),
    });
  });

  app.post('/api/evolution/control', requireOperator, controlLimit, async (req: Request, res: Response) => {
    const { action } = req.body ?? {};
    try {
      switch (action) {
        case 'start':
          engine.start();
          break;
        case 'pause':
          engine.pause();
          break;
        case 'tick':
          // Fire and forget: a tick can take a minute, far longer than the
          // request should stay open. Progress arrives over SSE.
          void engine.tick();
          break;
        case 'reset':
          resetAllRateLimits();
          engine.resetBudget();
          break;
        default:
          return res.status(400).json({ error: `Unknown action "${action}". Use start, pause, tick, or reset.` });
      }
      res.json({ ok: true, status: engine.status() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/evolution/reset-limits', requireOperator, (_req: Request, res: Response) => {
    resetAllRateLimits();
    engine.resetBudget();
    res.json({ ok: true, status: engine.status() });
  });

  app.post('/api/evolution/seed', requireOperator, controlLimit, async (req: Request, res: Response) => {
    const requested: unknown = req.body?.vectors;
    const vectors = Array.isArray(requested)
      ? (requested.filter((v): v is VectorCategory => (ALL_VECTORS as string[]).includes(v)) as VectorCategory[])
      : [];
    if (vectors.length === 0) {
      return res.status(400).json({ error: `vectors must contain at least one of: ${ALL_VECTORS.join(', ')}` });
    }
    try {
      res.json({ skill: await engine.seedSkill(vectors) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/evolution/remix', requireOperator, controlLimit, async (req: Request, res: Response) => {
    const { parentAId, parentBId } = req.body ?? {};
    if (!parentAId || !parentBId) {
      return res.status(400).json({ error: 'parentAId and parentBId are required.' });
    }
    try {
      res.json({ skill: await engine.remix(parentAId, parentBId) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/evolution/lineage-graph', (_req: Request, res: Response) => {
    res.json(engine.getLineageGraph());
  });

  app.get('/api/evolution/skills/:id/lineage', (req: Request, res: Response) => {
    const lineage = engine.getSkillLineage(req.params.id);
    if (!lineage) return res.status(404).json({ error: 'Skill not found.' });
    res.json({ lineage });
  });

  app.post('/api/evolution/benchmark', requireOperator, runLimit, (req: Request, res: Response) => {
    const { skillId } = req.body ?? {};
    if (typeof skillId !== 'string' || !skillId) return res.status(400).json({ error: 'skillId is required.' });
    if (!engine.getSkills(true).some((s) => s.id === skillId)) {
      return res.status(404).json({ error: 'Skill not found.' });
    }
    const job = startJob('benchmark', () => engine.benchmark(skillId));
    res.status(202).json({ jobId: job.id });
  });

  app.post('/api/evolution/swarm', requireOperator, runLimit, (req: Request, res: Response) => {
    const { scenarioId, skillIds } = req.body ?? {};
    if (typeof scenarioId !== 'string' || !Array.isArray(skillIds) || skillIds.length < 2) {
      return res.status(400).json({ error: 'scenarioId and at least two skillIds are required.' });
    }
    if (skillIds.length > MAX_SWARM_ENTRANTS) {
      return res.status(400).json({
        error: `A swarm run takes at most ${MAX_SWARM_ENTRANTS} skills (${skillIds.length} given). Each entrant costs two model calls.`,
      });
    }
    if (!skillIds.every((id: unknown) => typeof id === 'string')) {
      return res.status(400).json({ error: 'skillIds must be strings.' });
    }
    const job = startJob('swarm', () => engine.swarm(scenarioId, skillIds));
    res.status(202).json({ jobId: job.id });
  });

  app.get('/api/evolution/stream', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const send = (type: string, data: unknown) => {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('state', {
      skills: engine.getSkills(),
      stats: engine.getStats(),
      events: engine.getEvents(60),
      status: engine.status(),
    });

    const onEvent = (event: EvolutionEvent) => {
      send('activity', event);
      // Stage transitions change the whole board, so push fresh state with them
      // rather than making the client reconcile a partial update.
      if (
        event.type === 'champion_promoted' ||
        event.type === 'champion_demoted' ||
        event.type === 'skill_retired' ||
        event.type === 'idea_generated' ||
        event.type === 'crossover' ||
        event.type === 'tick_complete'
      ) {
        send('state', { skills: engine.getSkills(), stats: engine.getStats(), status: engine.status() });
      }
    };
    engine.on('event', onEvent);
    const onJob = (job: unknown) => send('job', job);
    engine.on('job', onJob);

    // Proxies drop idle connections; a comment frame keeps the pipe warm.
    const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 20_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      engine.off('event', onEvent);
      engine.off('job', onJob);
      res.end();
    });
  });
}

/** Only the knobs the UI needs. Model names and budget internals stay server-side. */
function publicConfig(engine: EvolutionEngine) {
  const cfg = engine.getConfig();
  return {
    championThreshold: cfg.championThreshold,
    promotionMinHoldoutRuns: cfg.promotionMinHoldoutRuns,
    promotionMinDistinctScenarios: cfg.promotionMinDistinctScenarios,
    promotionMaxStdDev: cfg.promotionMaxStdDev,
    promotionMaxHallucinationRate: cfg.promotionMaxHallucinationRate,
    maxPopulation: cfg.maxPopulation,
    tickIntervalMs: cfg.tickIntervalMs,
  };
}
