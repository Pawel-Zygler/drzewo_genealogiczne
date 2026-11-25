import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run build:artifact` builds one self-contained page for a Claude artifact
  // (see scripts/build-artifact.mjs); everything else is the GitHub Pages build.
  const artifact = mode === 'artifact';
  return {
    plugins: [react()],
    base: artifact ? './' : '/drzewo_genealogiczne/', // GitHub Pages repo name
    server: {
      port: 8006,
    },
    build: artifact
      ? {
          outDir: 'dist-artifact',
          assetsInlineLimit: 100_000_000,
          cssCodeSplit: false,
          modulePreload: false,
          rollupOptions: { output: { inlineDynamicImports: true } },
        }
      : undefined,
  }
})
