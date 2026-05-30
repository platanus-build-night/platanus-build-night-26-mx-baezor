import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Auris admin — plain Vite + React + TS settings app.
// Dev server defaults to :5173 (matches ADMIN_ORIGIN the engine allows via CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
