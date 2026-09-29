import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

// Unit tests for pure logic only (no React rendering, no Next runtime).
// Per-file opt-in to jsdom via `// @vitest-environment jsdom` docblocks.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(root, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
