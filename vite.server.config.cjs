const { resolve } = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    ssr: true,
    outDir: 'dist/server',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'server.ts'),
      name: 'server',
      fileName: 'server',
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['express', 'glob']
    }
  }
});
