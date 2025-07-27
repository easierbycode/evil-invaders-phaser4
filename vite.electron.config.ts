import { defineConfig } from 'vite'
import { spawn } from 'child_process'

export default defineConfig({
  plugins: [
    {
      name: 'electron-starter',
      configureServer(server) {
        server.httpServer.on('listening', () => {
          const electronApp = spawn('electron', ['.'], {
            cwd: process.cwd(),
            stdio: 'inherit',
          })

          electronApp.on('close', () => {
            server.close()
            process.exit()
          })
        })
      },
    },
  ],
  build: {
    outDir: 'dist',
  },
  // optimizeDeps: {
  //   exclude: ['electron'],
  // },
})
