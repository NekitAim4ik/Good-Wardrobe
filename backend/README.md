# Backend «Добрый Шкаф»

NestJS + PostgreSQL + Prisma. Сейчас реализован модуль **auth** (регистрация, вход, обновление и завершение сессии, роли).

## Требования
- Node.js 20+
- PostgreSQL 14+ (локально или облачный, например Neon/Supabase). 

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

## Структура
```
prisma/schema.prisma        модели User и RefreshToken
src/config/env.ts           проверка .env при старте
src/prisma/                 подключение к БД
src/users/                  доступ к пользователям
src/auth/                   контроллер, сервисы, DTO, guard'ы, декораторы
```

## Что не сделано
Автотесты, подтверждение почты, восстановление пароля, управление сессиями («выйти на всех устройствах» есть внутри `TokensService.revokeAll`, но без маршрута).
