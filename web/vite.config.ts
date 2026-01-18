import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'recharts'
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react'
            }
            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'radix-ui'
            }
            if (
              id.includes('vaul') ||
              id.includes('sonner') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'ui-vendor'
            }
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor'
            }
            if (id.includes('framer-motion') || id.includes('motion')) {
              return 'motion'
            }
            if (id.includes('zod') || id.includes('logtape')) {
              return 'utils-vendor'
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor'
            }
          }
        },
      },
    },
  },
})
