import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})
