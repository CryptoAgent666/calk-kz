import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
