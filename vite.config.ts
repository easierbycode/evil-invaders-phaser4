// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * BUILD_TARGET
 *   - web      → build for GitHub Pages (dist, absolute base)
 *   - cordova  → build for Cordova (cordova/www, relative base)
 * Default: web
 */
export default defineConfig(({ mode }) => {
  const target = process.env.BUILD_TARGET ?? "web"; // "web" | "cordova"
  const isProd = mode === "production";

  return {
    // GH Pages requires the repo-subpath; Cordova (file://) needs a relative base.
    base: target === "web" && isProd ? "/evil-invaders-phaser4/" : "./",

    build: {
      outDir: target === "cordova" ? "cordova/www" : "dist",
      emptyOutDir: true,
      assetsInlineLimit: 102_400, // inline small images/GIFs as data URIs
      // assetsDir: "assets" // (default) hashed Vite assets also go here
    },

    // Copy your repository-root /assets (including /assets/asset-pack.json) to the output
    plugins: [
      viteStaticCopy({
        targets: [
          { src: "assets/**/*", dest: "assets" } // → dist/assets/** or cordova/www/assets/**
        ]
      })
    ],

    resolve: {
      alias: { "@": resolve(__dirname, "src") }
    },

    server: {
      open: true,
      hmr: { host: "localhost" },
      allowedHosts: [
        "d.codemonkey.games",
        "localhost",
        "127.0.0.1",
        ".ngrok.io",
        ".ngrok-free.app"
      ],
      host: true,
      strictPort: true,
      port: 5173
    }
  };
});