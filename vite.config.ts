import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/evil-invaders-phaser4/" : "/",
  build: { outDir: "dist", emptyOutDir: true },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: {
    open: true,
    // Allow connections from ngrok custom domain
    hmr: {
      host: 'localhost'
    },
    allowedHosts: [
      'd.codemonkey.games',
      'localhost',
      '127.0.0.1',
      '.ngrok.io',
      '.ngrok-free.app'
    ],
    // Listen on all addresses
    host: true,
    strictPort: true,
    port: 5173
  }
}));
