import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // → этот configure-функционал форвардит заголовки,
        //    в том числе Authorization
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const auth = req.headers.authorization
            if (auth) {
              proxyReq.setHeader('authorization', auth)
            }
          })
        }
      },
      // если у вас есть отдельный /auth-маршрут
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
