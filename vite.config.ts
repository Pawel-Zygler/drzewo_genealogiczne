import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/drzewo_genealogiczne/', // GitHub Pages repo name
  server: {
    port: 8006,
  }
})
