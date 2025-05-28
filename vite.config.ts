import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 80,
    proxy: {
      '/api': {
        target: 'http://192.168.93.99:5000',
        changeOrigin: true
      }
    },
    hmr: {
      clientPort: 80,
      host: 'operational.log'
    },
    allowedHosts: ['operational.log', '192.168.93.99']
  },
  preview: {
    host: '0.0.0.0',
    port: 80
  }
})
