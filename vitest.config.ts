import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // The DB tests build the full migration chain in PGlite (several seconds, slower under parallel load).
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
