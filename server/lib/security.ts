/**
 * Request-boundary security.
 *
 * Written in response to an audit that found, in the inherited TICKR code:
 *
 *   - /api/upload_artifact wrote `req.query.name` straight into path.join, so
 *     `?name=../../server.ts` overwrote source files with request-body content.
 *     With the server bound to 0.0.0.0, that was remote code execution on next
 *     restart for anyone on the network.
 *   - `ticker` from the request body flowed unchecked into three write paths.
 *   - /latest_log served process.cwd() statically: all source, the evolution
 *     state, and everything inside .git (serve-static's dotfile check only looks
 *     at the final path segment, so .git/config is served even though .env is not).
 *
 * The helpers here close those and add the guards the evolution operator
 * endpoints were missing.
 */

import path from 'path';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Path containment
// ---------------------------------------------------------------------------

export class UnsafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafePathError';
  }
}

/**
 * Join a user-supplied filename onto a base directory, refusing anything that
 * could land outside it.
 *
 * Belt and braces: the name is rejected if it contains a separator or a dot-dot
 * segment, AND the resolved path is checked to sit inside the base. Either check
 * alone has historically been bypassed by some encoding or platform quirk.
 */
export function safeJoin(baseDir: string, name: unknown, allowedExtensions?: string[]): string {
  if (typeof name !== 'string' || name.length === 0 || name.length > 200) {
    throw new UnsafePathError('Filename must be a non-empty string under 200 characters.');
  }
  if (/[\/\\\0]/.test(name) || name === '.' || name === '..' || name.startsWith('.')) {
    throw new UnsafePathError('Filename may not contain path separators or start with a dot.');
  }
  if (allowedExtensions) {
    const ext = path.extname(name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new UnsafePathError(`File type ${ext || '(none)'} is not allowed.`);
    }
  }

  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, name);
  if (resolved !== path.join(base, path.basename(resolved)) || path.dirname(resolved) !== base) {
    throw new UnsafePathError('Resolved path escapes the target directory.');
  }
  return resolved;
}

/**
 * A ticker symbol, as used in log filenames. Letters, digits, dots and hyphens
 * cover real exchange symbols (BRK.B, RDS-A); anything else is rejected rather
 * than sanitised, so a malformed value fails loudly instead of being quietly
 * rewritten into a different filename.
 */
export function parseTicker(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(t) ? t : null;
}

// ---------------------------------------------------------------------------
// Operator guard
// ---------------------------------------------------------------------------

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * True only for a request that genuinely originates on this machine.
 *
 * A reverse proxy on the same host makes every request look like loopback, so
 * any forwarding header disqualifies it. Otherwise putting nginx in front would
 * silently open the operator endpoints to the internet.
 */
export function isTrueLoopback(req: Request): boolean {
  const remote = req.socket.remoteAddress ?? '';
  if (!LOOPBACK.has(remote)) return false;
  const forwarded =
    req.headers['x-forwarded-for'] || req.headers['forwarded'] || req.headers['x-real-ip'];
  return !forwarded;
}

function tokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch; compare lengths without leaking
  // the expected length through an early return's timing.
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Guard for endpoints that spend model budget or change engine state.
 *
 * Allowed when any of these hold:
 *   - the request is true loopback (local development needs no setup)
 *   - it carries `Authorization: Bearer <EVOLUTION_API_TOKEN>`
 *   - EVOLUTION_ALLOW_REMOTE=true (you have put your own auth in front)
 *
 * Everything else gets 401. Reads stay open; this only guards actions.
 */
export function requireOperator(req: Request, res: Response, next: NextFunction): void {
  if (process.env.EVOLUTION_ALLOW_REMOTE === 'true') return next();
  if (isTrueLoopback(req)) return next();

  const expected = process.env.EVOLUTION_API_TOKEN;
  const header = req.headers.authorization ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (expected && expected.length >= 16 && presented && tokenMatches(presented, expected)) {
    return next();
  }

  res.status(401).json({
    error: expected
      ? 'Operator token required for this action.'
      : 'This action is restricted to localhost. Set EVOLUTION_API_TOKEN (16+ characters) to allow remote operators.',
    tokenConfigured: !!expected,
  });
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const allRateLimitHits = new Map<string, Map<string, { count: number; resetAt: number }>>();

/** Reset all rate limit counters (useful in preview/development). */
export function resetAllRateLimits(): void {
  for (const bucket of allRateLimitHits.values()) {
    bucket.clear();
  }
}

/**
 * Fixed-window, in-memory rate limiter keyed by client address.
 *
 * Automatically inspects X-Forwarded-For behind cloud proxies (e.g. Cloud Run, preview).
 * In development or preview environments, limits are scaled to prevent blocking
 * interactive user exploration.
 */
export function rateLimit(opts: { windowMs: number; max: number; name: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  allRateLimitHits.set(opts.name, hits);

  // Sweep expired windows so the map cannot grow with every address ever seen.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, opts.windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // In preview/dev environments or when EVOLUTION_ALLOW_REMOTE is enabled,
    // apply a generous ceiling so interactive testing is smooth.
    const isPreviewOrDev =
      process.env.NODE_ENV !== 'production' ||
      process.env.EVOLUTION_ALLOW_REMOTE === 'true' ||
      req.hostname?.includes('run.app') ||
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1';

    const effectiveMax = isPreviewOrDev ? Math.max(opts.max * 10, 300) : opts.max;

    // Prefer client IP from X-Forwarded-For if behind a proxy
    const forwardedHeader = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedHeader)
      ? forwardedHeader[0]
      : typeof forwardedHeader === 'string'
      ? forwardedHeader.split(',')[0].trim()
      : null;

    const key = forwardedIp || req.ip || req.socket.remoteAddress || 'client';

    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count++;

    res.setHeader('RateLimit-Limit', String(effectiveMax));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, effectiveMax - entry.count)));

    if (entry.count > effectiveMax) {
      const retrySecs = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySecs));
      res.status(429).json({
        error: `Rate limit exceeded for ${opts.name}. Try again in ${retrySecs}s.`,
        retryAfter: retrySecs,
        name: opts.name,
      });
      return;
    }
    next();
  };
}

