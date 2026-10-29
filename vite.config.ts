import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    '@tanstack/react-query',
    '@tanstack/react-router',
    '@radix-ui/react-dialog',
    '@radix-ui/react-slot',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'use-sync-external-store',
  ],
},
})
