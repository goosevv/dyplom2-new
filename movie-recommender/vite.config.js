import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Проксируем все /api-запросы на Flask (порт 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/recommend/user/favorites': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/favorites': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ratings': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/recommend': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
