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
    host: true, // Allow access from network
    allowedHosts: [
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:10000', // Backend server runs on port 10000
        changeOrigin: true,
        secure: false,
        ws: true // Enable WebSocket proxying if needed
      },
      '/uploads': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false
      }
    },
  },
})