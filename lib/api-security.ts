import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a few minutes and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)), "Cache-Control": "no-store" },
    },
  );
}

/**
 * Process-local counting. Correct on a single long-lived server, but on
 * serverless each instance keeps its own Map and a cold start empties it, so
 * the real ceiling is the limit times however many instances are warm. It stays
 * as the fallback for local development, tests, and CI, where no Redis exists
 * and a single process makes it accurate.
 */
function rateLimitInMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return tooManyRequests(Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;

  if (rateBuckets.size > 5_000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }

  return null;
}

let cachedRedis: Redis | null = null;
let warnedAboutFallback = false;
const limiters = new Map<string, Ratelimit>();

function upstashRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    // Falling back in production is the under-enforcing case this module exists
    // to fix, so say so once per instance rather than degrading quietly.
    if (process.env.NODE_ENV === "production" && !warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        "UPSTASH_REDIS_REST_URL/TOKEN are unset: rate limiting is per-instance only and under-enforces across serverless instances.",
      );
    }
    return null;
  }

  // The REST client is stateless, so one instance is reused across requests
  // rather than opening a connection per call.
  cachedRedis ??= new Redis({ url, token });
  return cachedRedis;
}

function limiterFor(redis: Redis, scope: string, limit: number, windowMs: number) {
  // One limiter per scope and window. Each endpoint keeps its own budget, which
  // is why the limits live here rather than as edge firewall rules.
  const key = `${scope}:${limit}:${windowMs}`;
  const existing = limiters.get(key);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    // Sliding window, so a burst straddling a boundary cannot spend two
    // budgets the way a fixed window allows.
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: `expvegas:ratelimit:${scope}`,
  });
  limiters.set(key, limiter);
  return limiter;
}

/**
 * Returns a 429 response when the caller is over budget, or null to proceed.
 *
 * Shared counting through Upstash whenever UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, otherwise process-local counting.
 *
 * Redis failures fail open: an unreachable limiter must not take the API down
 * with it. That is a deliberate availability-over-enforcement trade, and it is
 * why the edge firewall is still worth adding in front for coarse protection.
 */
export async function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const identifier = requestIp(request);
  const redis = upstashRedis();
  if (!redis) return rateLimitInMemory(`${scope}:${identifier}`, limit, windowMs);

  try {
    const result = await limiterFor(redis, scope, limit, windowMs).limit(identifier);
    if (result.success) return null;
    return tooManyRequests(Math.ceil((result.reset - Date.now()) / 1000));
  } catch (error) {
    console.error("Distributed rate limit unavailable; allowing the request", error);
    return null;
  }
}

export async function readValidatedJson<T>(request: Request, schema: z.ZodType<T>, maxBytes: number): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new ApiRequestError("Request body is too large.", 413);

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new ApiRequestError("Request body is too large.", 413);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiRequestError("Request body must be valid JSON.", 400);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiRequestError("Some submitted fields are invalid.", 400, parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiRequestError) {
    return NextResponse.json({ error: error.message, fields: error.details }, { status: error.status });
  }

  return NextResponse.json({ error: "The request could not be processed." }, { status: 400 });
}

export function validShareToken(token: string) {
  return /^[a-f0-9]{36}$/i.test(token);
}
