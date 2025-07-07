import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.svg'],
  optimizeDeps: {
    include: ['@tabler/icons-react']
  },
  server: {
    fs: {
      strict: false
    }
  }
})
