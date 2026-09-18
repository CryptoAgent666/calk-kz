import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Дата сборки по Алматы (UTC+5) — для «Обновлено: …» и © в футере. Константа
// сборки, а не new Date() визита: статика пререндера и первый клиентский рендер
// обязаны совпасть в любой день (иначе 1-го числа — #425 на всех страницах).
const BUILD_DATE = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);

// Без этих переменных сборка проходит, но бандл молча ломается: заглушки
// RevenueCat (покупки в приложениях), нет Supabase (конвертер валют падает).
// 18.09.2026 так ушёл бандл из worktree без .env. Проверяем только `vite build` —
// `npm run dev` и `vite preview` без .env работают. Значения не печатаем.
const REQUIRED_BUILD_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_RC_IOS_KEY',
  'VITE_RC_ANDROID_KEY',
];

function assertBuildEnv(mode: string) {
  if (process.env.SKIP_ENV_CHECK === '1') {
    console.warn('⚠️  SKIP_ENV_CHECK=1: сборка без проверки .env — такой dist не пропустят deploy-fast.sh/deploy.sh и publish:app.');
    return;
  }
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Пустое значение или заглушка («appl_XXXX…», «your-project-id…») = не задано.
  const missing = REQUIRED_BUILD_ENV.filter((name) => {
    const v = env[name]?.trim();
    return !v || /^(appl|goog)_XXXX|your-/.test(v);
  });
  if (missing.length === 0) return;
  throw new Error(
    [
      `Прод-сборка остановлена: не заданы (или заглушки) ${missing.join(', ')}.`,
      'Скопируйте ~/Projects/KZ-CALK/.env в этот каталог и пересоберите:',
      `  cp ~/Projects/KZ-CALK/.env ${process.cwd()}/.env`,
      'Собрать без ключей осознанно (не для выкладки): SKIP_ENV_CHECK=1.',
    ].join('\n'),
  );
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') assertBuildEnv(mode);
  return {
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
  };
});
