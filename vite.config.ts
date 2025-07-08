import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  base:
    mode === "production" && process.env.GITHUB_ACTIONS
      ? "/evil-invaders-phaser4/" // ← replace with your repo name
      : "/",
  build: { outDir: "dist", emptyOutDir: true },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: { open: true }
}));
