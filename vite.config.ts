import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["yangtheory.site", "www.yangtheory.site"],
    port: 5173,
  },
  preview: {
    allowedHosts: ["yangtheory.site", "www.yangtheory.site"],
  },
});
