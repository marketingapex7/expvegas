import { afterEach, beforeEach, expect, test, vi } from "vitest";

const limitMock = vi.fn();

// Both Upstash clients are replaced so the distributed path can be exercised
// without a network call or real credentials.
vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow(limit: number, window: string) {
      return { kind: "sliding", limit, window };
    }
    limit(identifier: string) {
      return limitMock(identifier);
    }
  },
}));

const { rateLimit } = await import("@/lib/api-security");

function requestFrom(ip: string) {
  return new Request("https://experiencevegas.com/api/planner", {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

/** Distinct per test so the module-level in-memory Map cannot leak between them. */
let scopeCounter = 0;
function uniqueScope() {
  scopeCounter += 1;
  return `test-scope-${scopeCounter}`;
}

beforeEach(() => {
  limitMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test("without Upstash credentials the in-memory limiter still enforces a budget", async () => {
  const scope = uniqueScope();
  const request = requestFrom("203.0.113.10");

  expect(await rateLimit(request, scope, 2, 60_000)).toBeNull();
  expect(await rateLimit(request, scope, 2, 60_000)).toBeNull();

  const blocked = await rateLimit(request, scope, 2, 60_000);
  expect(blocked?.status).toBe(429);
  expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
  expect(blocked?.headers.get("Cache-Control")).toBe("no-store");
  // The fallback must never reach for Redis.
  expect(limitMock).not.toHaveBeenCalled();
});

test("each scope and each caller gets its own budget", async () => {
  const first = uniqueScope();
  const second = uniqueScope();
  const caller = requestFrom("203.0.113.20");

  expect(await rateLimit(caller, first, 1, 60_000)).toBeNull();
  expect((await rateLimit(caller, first, 1, 60_000))?.status).toBe(429);

  // A different endpoint is unaffected by the exhausted one.
  expect(await rateLimit(caller, second, 1, 60_000)).toBeNull();
  // So is a different caller on the original endpoint.
  expect(await rateLimit(requestFrom("203.0.113.21"), first, 1, 60_000)).toBeNull();
});

test("the in-memory budget resets once its window passes", async () => {
  vi.useFakeTimers();
  const scope = uniqueScope();
  const request = requestFrom("203.0.113.30");

  expect(await rateLimit(request, scope, 1, 60_000)).toBeNull();
  expect((await rateLimit(request, scope, 1, 60_000))?.status).toBe(429);

  vi.advanceTimersByTime(60_001);
  expect(await rateLimit(request, scope, 1, 60_000)).toBeNull();
});

test("configured credentials route counting through Upstash", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  limitMock.mockResolvedValue({ success: true, reset: Date.now() + 30_000 });

  expect(await rateLimit(requestFrom("203.0.113.40"), uniqueScope(), 5, 60_000)).toBeNull();
  // Counting is keyed on the client IP, not the whole forwarded chain.
  expect(limitMock).toHaveBeenCalledWith("203.0.113.40");
});

test("an over-budget Upstash verdict becomes a 429 with a Retry-After", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  limitMock.mockResolvedValue({ success: false, reset: Date.now() + 30_000 });

  const blocked = await rateLimit(requestFrom("203.0.113.50"), uniqueScope(), 5, 60_000);
  expect(blocked?.status).toBe(429);
  expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThanOrEqual(29);
  expect(Number(blocked?.headers.get("Retry-After"))).toBeLessThanOrEqual(31);
});

test("an unreachable limiter fails open rather than taking the API down", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
  limitMock.mockRejectedValue(new Error("ECONNREFUSED"));
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});

  // Availability is chosen over enforcement here on purpose; the failure is
  // logged so it cannot pass unnoticed.
  expect(await rateLimit(requestFrom("203.0.113.60"), uniqueScope(), 5, 60_000)).toBeNull();
  expect(logged).toHaveBeenCalled();
  logged.mockRestore();
});

test("falling back in production is announced instead of degrading quietly", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const warned = vi.spyOn(console, "warn").mockImplementation(() => {});

  await rateLimit(requestFrom("203.0.113.70"), uniqueScope(), 5, 60_000);

  expect(warned).toHaveBeenCalledWith(expect.stringContaining("under-enforces"));
  warned.mockRestore();
});

test("a caller with no forwarded address still shares a single bucket", async () => {
  const scope = uniqueScope();
  const anonymous = () => new Request("https://experiencevegas.com/api/planner");

  expect(await rateLimit(anonymous(), scope, 1, 60_000)).toBeNull();
  // Unknown callers must not each get a fresh budget, or the limit is bypassed
  // simply by omitting the header.
  expect((await rateLimit(anonymous(), scope, 1, 60_000))?.status).toBe(429);
});
