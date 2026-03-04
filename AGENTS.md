# Calk.kz — Калькуляторы для Казахстана

## Стек
- **Frontend**: React 18 + TypeScript + Vite
- **Стили**: Tailwind CSS 3
- **i18n**: i18next (ru, kk)
- **Роутинг**: react-router-dom v7
- **Данные**: Supabase
- **Графики**: recharts
- **Экспорт**: jsPDF, xlsx, html2canvas

## Хостинг

> ⚠️ Сайт размещён на **shared hosting (Apache, Plesk)**, а **не** на Netlify/Vercel.

- Путь на сервере: `~/calk.kz/`
- Деплой: собранная папка `dist/` загружается на сервер по FTP/SSH
- `netlify.toml` — **не используется** в продакшене, оставлен для справки

## Сборка и деплой

```bash
# Полная сборка с пре-рендерингом (для продакшена)
npm run build:prerender

# Простая сборка без пре-рендера (для тестирования)
npm run build
```

### Пре-рендер (`build:prerender`)
Скрипт `scripts/prerender.mjs` после сборки запускает Vite preview и обходит все маршруты,
создавая статические HTML-файлы для каждой страницы. На выходе в `dist/` появляются папки:
- `calculator/` — страницы калькуляторов
- `category/` — страницы категорий
- `legal/` — юридические страницы
- `embed/` — embeddable-версии калькуляторов
- `__kk/` — казахская версия всех страниц

### Деплой на хостинг
1. `npm run build:prerender`
2. Загрузить содержимое `dist/` на хостинг (в `~/calk.kz/`)
3. **Убедиться что `.htaccess` загружен** (скрытый файл, FTP-клиенты могут пропустить)

## Обработка 404
- `.htaccess` содержит `ErrorDocument 404 /index.html` — Apache отдаёт SPA вместо серверной 404
- `public/404.html` — JS-фоллбэк (редирект на главную с сохранением пути)
- `src/components/NotFoundPage.tsx` — React-компонент красивой 404 страницы
- React Router catch-all route `path="*"` в `App.tsx`

## Важные файлы
| Файл | Назначение |
|------|-----------|
| `public/.htaccess` | Apache: SPA-роутинг, кэширование, GZIP |
| `public/404.html` | JS-фоллбэк для 404 |
| `netlify.toml` | Конфиг Netlify (НЕ используется) |
| `scripts/prerender.mjs` | Скрипт пре-рендеринга |
| `src/components/NotFoundPage.tsx` | React 404 страница |
