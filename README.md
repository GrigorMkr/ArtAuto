# АртАвто — сайт на TypeScript

Полный стек:
- `web/` — React + TypeScript + Vite + Redux Toolkit + React Router + Axios
- `server/` — Node + Express + TypeScript + JSON-хранилище (без native SQLite)

Бизнес-логика: каталог KR/CN → upsert лотов → расчёт цены (курс, расходы, брокер, доставка, услуги, таможня, утиль) → заявка → БД (+ Telegram при наличии токена).

## Быстрый запуск

### 1. API

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

API: http://127.0.0.1:4000/api/health

### 2. Сайт

```bash
cd web
npm install
npm run dev
```

Сайт: http://127.0.0.1:5173  
Vite проксирует `/api` на backend.

## Страницы

- `/` — главная
- `/catalog` — каталог и фильтры
- `/cars/:slug` — карточка авто + галерея фото + заявка
- `/calculator` — калькулятор
- `/contacts` — контакты
- `/cabinet` — личный кабинет
- `/admin` — админ-панель (синхронизация, авто, заявки, фото Китая)
- `/privacy` — политика конфиденциальности

## Админ

При старте API создаётся аккаунт:

- **Email:** `admin@artauto.ru`
- **Пароль:** `Admin123!`
- **URL:** http://127.0.0.1:5173/admin

В админке: полный sync каталога, скрытие лотов, заявки, кнопка «Загрузить фото Китая» (прогрев кэша через `/api/img`).

## Данные каталога

Каталог заполняется только с живых источников.

- **Корея:** публичный API Encar — `npm run import:encar -- 1200` (все марки: корейские + импорт)
- **Китай / Dongchedi:** `npm run import:china -- 500` (мультифото из H5 detail API)
- **Полная синхронизация 1000+:** `npm run import:sync` (Encar 1200 + Dongchedi 500)
- **Ежедневно:** при запуске API планировщик обновляет каталог раз в 24 часа; если машин меньше 1000 — подгружает сразу при старте.

Статус импорта и sync — только для админа (`/admin` или API с токеном).

## GitHub Pages

Фронтенд деплоится в GitHub Pages: https://grigormkr.github.io/ArtAuto/

Каталог и калькулятор на Pages работают только если API доступен отдельно (локально `server/` на `:4000` или свой хостинг). Для полного сайта запускайте `server` + `web` локально.
