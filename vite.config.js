import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Allow connections from ngrok custom domain
    allowedHosts: [
      'd.codemonkey.games',
      'localhost',
      '127.0.0.1',
      '.ngrok.io',  // Also allow standard ngrok domains
      '.ngrok-free.app'  // Allow new ngrok domains
    ],
    
    // Additional server options for better ngrok compatibility
    host: true,  // Listen on all addresses
    strictPort: true,  // Use exactly port 5173
    port: 5173
  },
  
  // Ensure proper base URL for assets when tunneling
  base: './',
  
  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});