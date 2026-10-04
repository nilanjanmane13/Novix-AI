import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The face-detection library is lazy-loaded (only on the interview
    // screens), so the main bundle stays small. Silence the size hint for it.
    chunkSizeWarningLimit: 1800,
  },
  server: {
    port: 5173,
    proxy: {
      // Forwards /api/* to the Express backend during development.
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
