import { afterEach, beforeEach, expect, test, vi } from "vitest";

const trackMock = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...args: unknown[]) => trackMock(...args) }));

const { trackProductEvent } = await import("@/lib/product-analytics");

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };

function fakeWindow() {
  const listeners: CustomEvent[] = [];
  const win = {
    dispatchEvent: (event: Event) => {
      listeners.push(event as CustomEvent);
      return true;
    },
  } as unknown as TestWindow;
  return { win, listeners };
}

beforeEach(() => {
  trackMock.mockReset();
  const { win } = fakeWindow();
  vi.stubGlobal("window", win);
  vi.stubGlobal("CustomEvent", class extends Event {
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      super(type);
      this.detail = init?.detail;
    }
  });
});

afterEach(() => vi.unstubAllGlobals());

test("an event reaches Vercel Analytics", () => {
  trackProductEvent("planner_generation_started", { partySize: 2, hasSavedPicks: true });
  expect(trackMock).toHaveBeenCalledWith("planner_generation_started", { partySize: 2, hasSavedPicks: true });
});

test("the dataLayer queue is created rather than assumed", () => {
  // The original module pushed with an optional chain into a dataLayer nothing
  // ever created, so every event this app fired was silently discarded.
  expect((globalThis.window as TestWindow).dataLayer).toBeUndefined();

  trackProductEvent("planner_generation_completed", { days: 3 });

  const queue = (globalThis.window as TestWindow).dataLayer;
  expect(queue).toHaveLength(1);
  expect(queue?.[0]).toEqual({ event: "planner_generation_completed", days: 3 });
});

test("undefined properties are dropped rather than sent", () => {
  // Vercel Analytics rejects undefined values and would drop the whole event,
  // not just the offending field.
  trackProductEvent("affiliate_click", { eventId: "absinthe", priceMin: undefined });
  expect(trackMock).toHaveBeenCalledWith("affiliate_click", { eventId: "absinthe" });
});

test("a failing collector never breaks the interaction that fired it", () => {
  trackMock.mockImplementation(() => {
    throw new Error("blocked by an ad blocker");
  });

  expect(() => trackProductEvent("planner_generation_failed")).not.toThrow();
  // The other sinks still receive it.
  expect((globalThis.window as TestWindow).dataLayer).toHaveLength(1);
});

test("nothing is attempted during server rendering", () => {
  vi.stubGlobal("window", undefined);
  expect(() => trackProductEvent("server_side")).not.toThrow();
  expect(trackMock).not.toHaveBeenCalled();
});
