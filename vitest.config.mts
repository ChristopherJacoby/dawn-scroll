import { defineConfig } from "vitest/config";

// Resolve the "@/..." imports from tsconfig.json, as Next does.
export default defineConfig({ resolve: { tsconfigPaths: true } });
