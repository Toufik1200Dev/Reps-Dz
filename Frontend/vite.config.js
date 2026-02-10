import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev: use local backend for full local testing (run backend with npm run dev in Backend/)
      // Set VITE_USE_REMOTE_API=true to proxy to deployed backend instead
      '/api': {
        target: process.env.VITE_USE_REMOTE_API === 'true' ? 'https://reps-dz.onrender.com' : 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
})
