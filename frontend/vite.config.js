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
      '7143f8d8db88.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok hosts
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:10000', // Backend server runs on port 10000
        changeOrigin: true,
        secure: false,
        ws: true // Enable WebSocket proxying if needed
      }
    },
  },
})