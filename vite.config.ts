import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * BUILD_TARGET=web      → gh-pages build to ./dist with absolute base
 * BUILD_TARGET=cordova  → Cordova build to ./cordova/www with *relative* base
 *
 * Default is web.
 */
export default defineConfig(({ mode }) => {
  const target = process.env.BUILD_TARGET ?? 'web';      // web | cordova
  const isProd = mode === 'production';

  return {
    // Absolute path for GitHub Pages, relative for Cordova APK
    base: target === 'web' && isProd ? '/evil-invaders-phaser4/' : './',

    build: {
      outDir: target === 'cordova' ? 'cordova/www' : 'dist',
      emptyOutDir: true,

      // Anything ≤100 kB is inlined as data-URI (covers your loading GIFs/PNGs)
      assetsInlineLimit: 102_400
    },

    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },

    server: {
      open: true,
      hmr: { host: 'localhost' },
      allowedHosts: [
        'd.codemonkey.games',
        'localhost',
        '127.0.0.1',
        '.ngrok.io',
        '.ngrok-free.app'
      ],
      host: true,
      strictPort: true,
      port: 5173
    }
  };
});