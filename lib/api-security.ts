import { NextResponse } from "next/server";
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

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${requestIp(request)}`;
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
    );
  }

  current.count += 1;

  if (rateBuckets.size > 5_000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }

  return null;
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
