import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    hmr: {
      protocol: 'ws',
      host: '10.204.37.128',
      port: 5174,
    },
  },
})
