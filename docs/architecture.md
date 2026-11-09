# Архитектура

Модульный монолит: один клиент (React SPA) и одно API (NestJS) с модулями по разделам ТЗ.

```
frontend (React + TS + Vite)  --REST/JSON-->  backend (NestJS)  -->  PostgreSQL (+PostGIS)
                              --WebSocket-->  чат                    S3: фото вещей
```

## Структура frontend (по слоям, зависимости только сверху вниз)
```
src/
  app/        точка входа, роутер, провайдеры
  pages/      страницы (home, map, deals, points, eco, help, profile)
  widgets/    крупные блоки интерфейса (Header, позже Footer)
  entities/   сущности предметной области (item, point, user): типы, API, карточка
  shared/     UI-кит, иконки, стили, утилиты
```
Правило: страница собирается из виджетов и сущностей; `shared` ничего не знает о проекте.

## Модули backend (план)
auth, users, items, points (пункты), deals (чат и сделки), loyalty (баллы), eco, articles, organizer, admin.
Роли: user, volunteer, organizer, admin (RBAC).

## Данные
Пока вещи берутся из `entities/item/api.ts` (моки). Заменить на `fetch('/api/items')`
достаточно внутри этого файла, страницы менять не придётся.
