import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: ".",
  build: { outDir: "dist" },
  server: {
    proxy: {
      "/api": { target: `http://localhost:${process.env.VITE_NERVE_PORT ?? 3001}`, changeOrigin: true },
      "/events": { target: `http://localhost:${process.env.VITE_NERVE_PORT ?? 3001}`, changeOrigin: true },
    },
  },
});