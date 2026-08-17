import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests cover the pure planning, scoring, and normalization logic, which
// needs no DOM and no dev server. They live apart from e2e/ so Playwright's
// testDir never picks them up and they never pay for a browser launch.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    environment: "node",
  },
});
