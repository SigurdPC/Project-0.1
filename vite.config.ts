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
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    hmr: {
      clientPort: 80,
      host: 'operational.log'
    },
    allowedHosts: ['operational.log', 'localhost']
  },
  preview: {
    host: '0.0.0.0',
    port: 80
  }
})
