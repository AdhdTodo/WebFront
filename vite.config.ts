import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
  server: {
    allowedHosts: ["yangtheory.site", "www.yangtheory.site"],
    port: 5173,
  },
  preview: {
    allowedHosts: ["yangtheory.site", "www.yangtheory.site"],
  },
});
