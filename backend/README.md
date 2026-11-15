# Backend «Добрый Шкаф»

NestJS + PostgreSQL + Prisma. Сейчас реализован модуль **auth** (регистрация, вход, обновление и завершение сессии, роли).

## Требования
- Node.js 20+
- PostgreSQL 14+ (локально или облачный, например Neon/Supabase). Docker пока не нужен.

## Запуск
```bash
cd backend
npm install
cp .env.example .env        # заполните DATABASE_URL и JWT_ACCESS_SECRET (подсказка внутри файла)
npm run db:migrate          # создаст таблицы (при первом запуске спросит имя миграции, например init)
npm run start:dev           # http://localhost:3000/api
```
Фронтенд (`cd frontend && npm run dev`) обращается к `/api/...` через прокси Vite, поэтому cookie работают без настройки CORS.

## API (префикс `/api`)
| Метод и путь | Доступ | Что делает |
|---|---|---|
| `POST /auth/register` | открыт | `{ name, email, password, role? }` → `{ user, accessToken }` + cookie |
| `POST /auth/login` | открыт | `{ email, password, remember? }` → `{ user, accessToken }` + cookie |
| `POST /auth/refresh` | cookie | выдаёт новый access-токен и новый refresh-cookie |
| `POST /auth/logout` | открыт | гасит refresh-токен, очищает cookie (204) |
| `GET /auth/me` | Bearer | `{ user }` текущего пользователя |

Ошибки: `400` — не прошла валидация (`message` — список строк), `401` — неверные данные или сессия истекла,
`409` — почта занята (`{ message, field: "email" }`), `429` — слишком много запросов.
`role` при регистрации: `user` (по умолчанию), `volunteer`, `organizer`. Роль `admin` выдаётся только вручную в БД.

Проверка из терминала:
```bash
curl -i -c jar.txt -H "Content-Type: application/json" \
  -d '{"name":"Анна Соколова","email":"anna@example.ru","password":"qwerty123"}' \
  http://localhost:3000/api/auth/register
curl -b jar.txt -X POST http://localhost:3000/api/auth/refresh
```

## Как устроена безопасность
- **Пароли** — argon2id, в БД только хеш. При несуществующей почте проверка идёт против хеша-пустышки, чтобы время ответа не выдавало, есть ли аккаунт.
- **Access-токен** — JWT (HS256), 15 минут, клиент держит его в памяти и шлёт в `Authorization: Bearer`. В нём `sub` и `role`.
- **Refresh-токен** — случайная строка в httpOnly-cookie (`path=/api/auth`, `SameSite=Lax`, `Secure` в production). В БД лежит только SHA-256-хеш.
- **Ротация**: каждый refresh выдаёт новый токен, старый гасится. Повторное использование погашенного токена (позже 10 секунд) гасит все сессии пользователя.
- **«Запомнить меня»**: с галочкой cookie живёт `REFRESH_TTL_DAYS` дней, без — до закрытия браузера (на сервере максимум сутки).
- **Защищено всё по умолчанию**: глобальные guard'ы требуют токен везде, кроме маршрутов с `@Public()`. Для ролей — `@Roles('organizer', 'admin')`.
- **Лимиты**: 60 запросов в минуту с IP на всё, 5 в минуту на регистрацию и вход.
- Входные данные валидируются, лишние поля отклоняются (нельзя передать `role: "admin"` или `points`).

## Как подключён фронтенд
- `frontend/src/shared/api/http.ts` — клиент: `fetch('/api/...', { credentials: 'include' })`, access-токен хранится в памяти.
- `frontend/src/entities/user/api.ts` — `register`, `login`, `refresh`, `logout`.
- `AuthProvider` при загрузке страницы вызывает `POST /api/auth/refresh`: успех — пользователь вошёл, 401 — гость.
- Параллельные вызовы `refresh` объединены в один запрос (две вкладки, StrictMode, несколько запросов с 401).
- Ошибка `409` содержит `field: "email"` — форма подсвечивает это поле.

## Вещи (items)
Схема БД, DTO и автоматы состояний — `docs/data-model.md`. Чтобы применить схему:
```bash
cd backend && npm install
npx prisma migrate dev --create-only --name items
# вставьте в конец созданного migration.sql содержимое prisma/sql/items_constraints.sql
npm run db:migrate
npm run db:seed        # категории, коэффициенты, тестовый город
```

| Метод и путь | Доступ | Что делает |
|---|---|---|
| `GET /categories` | открыт | категории; `requiresWeight: true` — вес вещей обязателен |
| `GET /districts` | открыт | города и районы |
| `POST /uploads` | вход | загрузка фото (`multipart/form-data`, поле `file`; JPEG/PNG/WebP до 5 МБ) → `{ key, url }` |
| `GET /items` | открыт | каталог опубликованных вещей: `q, categoryId, condition, transferFormat, districtId, source, publishedAfter, sort, page, limit` |
| `GET /items/mine` | вход | мои объявления во всех статусах |
| `GET /items/:id` | открыт | карточка; с токеном в ответе есть `viewer` (можно ли написать автору, есть ли уже диалог) |
| `POST /items` | вход | создать объявление (`photoKeys` — ключи из `/uploads`, от 1 до 5) |
| `PATCH /items/:id` | автор / admin | изменить поля |
| `POST /items/:id/visibility` | автор | `{ "hidden": true }` — скрыть, `false` — вернуть в каталог |
| `DELETE /items/:id` | автор / admin | удалить (мягко: запись остаётся для истории) |

Ошибки проверки приходят с `field` (например `weightKg`, `photoKeys`), чтобы форма подсветила нужное поле.
Скрытые и отклонённые объявления видит только автор и администратор. По вещи с незавершённой сделкой нельзя менять категорию, количество и вес, а также удалять её.

Проверка из терминала (токен — из ответа `/auth/login`):
```bash
curl http://localhost:3000/api/categories
curl -H "Authorization: Bearer $TOKEN" -F "file=@photo.jpg" http://localhost:3000/api/uploads
curl -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Детская куртка","description":"Куртка на рост 110, чистая","categoryId":1,"condition":"good","transferFormat":"gift","districtId":1,"photoKeys":["<key>"]}' \
  http://localhost:3000/api/items
curl "http://localhost:3000/api/items?q=куртка"
```

## Структура
```
prisma/schema.prisma        модели User и RefreshToken
src/config/env.ts           проверка .env при старте
src/prisma/                 подключение к БД
src/users/                  доступ к пользователям
src/items/ src/catalog/ src/uploads/   вещи, справочники, загрузка фото
src/auth/                   контроллер, сервисы, DTO, guard'ы, декораторы
```

## Что не сделано
Автотесты, подтверждение почты, восстановление пароля, управление сессиями («выйти на всех устройствах» есть внутри `TokensService.revokeAll`, но без маршрута).