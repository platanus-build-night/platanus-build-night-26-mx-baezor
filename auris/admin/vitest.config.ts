import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate config for tests so the running dev server (vite.config.ts) is left
// untouched. Vitest prefers this file over vite.config.ts (no merge).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./test/setup.ts",
  },
});
