import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Дата сборки по Алматы (UTC+5) — для «Обновлено: …» и © в футере. Константа
// сборки, а не new Date() визита: статика пререндера и первый клиентский рендер
// обязаны совпасть в любой день (иначе 1-го числа — #425 на всех страницах).
const BUILD_DATE = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
          'i18n': ['i18next', 'react-i18next'],
          'export-tools': ['jspdf', 'jspdf-autotable', 'xlsx', 'file-saver'],
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
