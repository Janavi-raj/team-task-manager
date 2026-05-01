import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['scintillating-endurance-production-626e.up.railway.app'],
    host: true,
    port: 4173
  }
})