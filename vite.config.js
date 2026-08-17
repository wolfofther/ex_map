import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Capacitor(안드로이드 WebView) 호환을 위해 상대경로 base 사용
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
