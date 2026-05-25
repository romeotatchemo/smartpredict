import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { vitePluginObfuscate } from "./vite-plugin-obfuscate.js";

// https://vite.dev/config/
export default defineConfig({
  worker: {
    format: 'es'
  },
  plugins: [
    react(),
    visualizer({
      filename: "bundle-analysis.html",
      open: true,
    }),
    vitePluginObfuscate(),
  ],
});
