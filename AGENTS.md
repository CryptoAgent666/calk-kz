# Calk.kz — Калькуляторы для Казахстана

## Стек
- **Frontend**: React 18 + TypeScript + Vite
- **Стили**: Tailwind CSS 3
- **i18n**: i18next (ru, kk)
- **Роутинг**: react-router-dom v7
- **Данные**: Supabase
- **Графики**: recharts
- **Экспорт**: jsPDF, xlsx, html2canvas

## Репозиторий
- **GitHub**: [CryptoAgent666/calk-kz](https://github.com/CryptoAgent666/calk-kz) (private)
- **Ветка**: `main`

## Хостинг

> ⚠️ Сайт на **shared hosting (Plesk, nginx + Apache)**, хостер: `cloud-7.hoster.kz`

- Путь на сервере: `~/calk.kz/`
- IP: `89.35.125.22`, системный пользователь: `vtaksi_kz`
- **nginx** проксирует к **Apache** (режим прокси включен)
- `.htaccess` обрабатывается Apache — именно он обеспечивает SPA-роутинг и 404
- `error_docs/` — общая на все домены аккаунта, **не менять!**
- `netlify.toml` — **не используется** в продакшене

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
3. ⚠️ **Обязательно загрузить `.htaccess`** — это скрытый файл!
   - В Finder: `Cmd+Shift+.` чтобы показать скрытые файлы
   - В FTP-клиенте: включить отображение скрытых файлов
   - Без `.htaccess` сервер будет показывать дефолтную 404 вместо нашей

### Как работает 404
1. Пользователь заходит на несуществующий URL
2. nginx проксирует запрос в Apache
3. Apache через `.htaccess` (`ErrorDocument 404 /404.html`) отдаёт красивую 404 страницу
4. `404.html` — полностью standalone, с inline CSS, без зависимости от JS-бандлов

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
