import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/catalyst-api': {
        target: 'https://kspcrimeintelligenceplatform-60077159195.development.catalystserverless.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/catalyst-api/, '')
      },
      '/server': {
        target: 'https://kspcrimeintelligenceplatform-60077159195.development.catalystserverless.in',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
