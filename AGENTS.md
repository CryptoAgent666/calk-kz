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
- IP сервера и системный пользователь хранятся в `.env.deploy` (вне git)
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
- при ошибках пререндера build завершается с ошибкой, отчёт пишется в `dist/prerender-errors.json`

> Для продакшена на shared hosting использовать именно `npm run build:prerender`.
> `npm run build` оставлять только для локальной проверки и smoke-тестов.

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
3. Apache через `.htaccess` (`ErrorDocument 404 /index.html`) отдаёт SPA-входную страницу
4. React Router (catch-all route) рендерит `NotFoundPage` и выставляет `noindex`

## Обработка 404
- `.htaccess` содержит `ErrorDocument 404 /index.html` — Apache отдаёт SPA вместо серверной 404
- `public/404.html` — standalone fallback-страница (может использоваться в аварийных сценариях)
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
| `src/i18n/locales/{ru,kk}/legal.json` → `updates.groups[0].items` | **Страница «Обновления»** (/legal/updates/) |
| `UPDATES-PAGE-RULES.md` | ⚠️ Правила работы со страницей «Обновления» — что писать и что НЕ писать |
| `CHANGELOG.md` | Полный технический changelog (для разработчиков) |

## ⚠️ Правило: страница «Обновления» (`/legal/updates/`)

**Подробная инструкция:** [`UPDATES-PAGE-RULES.md`](./UPDATES-PAGE-RULES.md) — читать перед любым деплоем.

**Короткая сводка:**

Страница `/legal/updates/` — витрина для пользователей. Пишем туда **СТРОГО ТОЛЬКО** при изменениях одного из 3-х типов:

| Тип | Пример |
|---|---|
| 1. **Новый калькулятор** | Добавлен «Калькулятор ЕНТ» |
| 2. **Обновление формул** | НДС 12% → 16%, курсы НБРК, цены КМГ |
| 3. **Новый функционал** | Экспорт PDF, тёмная тема, сравнение |

**НЕ пишем** на эту страницу: баги, опечатки, дубли, SEO/schema/security/performance, реклама, переводы, маршрутизация, build/deploy. Всё это → только в [`CHANGELOG.md`](./CHANGELOG.md).

**Эвристика:** «После деплоя пользователь увидит ли новую возможность или заметную пользу?» Если нет → на страницу не пишем (это нормально, страница обновляется только при реальных функциональных изменениях).

**Файлы:** `src/i18n/locales/ru/legal.json` + `src/i18n/locales/kk/legal.json` — оба сразу, новая запись СВЕРХУ списка `updates.groups[0].items`.

**Полные правила** (формат, эвристика принятия решения, примеры хороших/плохих записей, грань между «обновление формулы» vs «исправление бага в формуле», FAQ) → см. [`UPDATES-PAGE-RULES.md`](./UPDATES-PAGE-RULES.md).
