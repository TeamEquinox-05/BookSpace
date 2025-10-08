import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [
          ['@babel/preset-react', {
            runtime: 'automatic'
          }]
        ]
      }
    }),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
