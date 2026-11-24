import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({ test: { testTimeout: 60000, include: ["tests/**/*.test.ts"] }, resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } } });
