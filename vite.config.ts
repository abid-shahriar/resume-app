import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-term cacheable vendor chunks
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@base-ui|@floating-ui|motion|motion-dom|motion-utils|framer-motion|sonner)[\\/]/ },
            { name: 'dnd', test: /node_modules[\\/]@dnd-kit[\\/]/ },
          ],
        },
      },
    },
  },
})
