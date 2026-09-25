# Roadmap v0.1

Обновлено: 2026-09-24. Оценки — ориентиры, не обязательства.

| # | Шаг | Результат | Статус | Оценка |
|---|---|---|---|---|
| 1 | Аудит Figma (Button, Field/Input/Select) + тариф | `docs/audit.md` | ✅ сделано | 2–4 ч |
| 2 | ADR-0001 структура/стек, ADR-0002 стилизация, ADR-0003 токены/Figma-процесс | 3 ADR приняты | ✅ сделано | 1–2 ч |
| 3 | Скелет monorepo, `CLAUDE.md`, lint/typecheck/vitest, Storybook (`@storybook/vue3-vite`) + theme-switcher (globals/toolbar, `data-theme`) | Пустая, но проверяемая основа; Button/Field как первые истории с переключением темы | ✅ сделано (Button; Field — шаг 8) | 3–4 ч |
| 4 | Таксономия токенов → DTCG JSON → CSS, две темы (Жидкое стекло + вторая контрастная) | `packages/tokens`, `docs/tokens.md` | ✅ сделано (+ `docs/figma-todo.md`; 2 стилистики × 2 схемы, ADR-0005) | 4–6 ч |
| 5 | Base CSS, типографические роли (`type/*`), fluid-шкала, layout-примитивы (`Container`, `Stack`, `Grid`, `Section`) | Foundations в коде, mobile-first | ✅ сделано: Container, Stack, Grid, Section, Heading, Text, Divider; `type/hero`; раскладка без media query | 3–4 ч |
| 6 | Storybook: полная матрица компонент × тема × состояние; дефолтный viewport мобильный | Постоянный инструмент фабрики | ✅ оформлено (autodocs, Foundations из токенов, истории-тесты в Vitest + axe) | входит в 3+7 |
| 7 | Button / IconButton / Icon по Figma + `docs/figma-code.md` | Первый компонент — эталон правил | ✅ Button, IconButton (иконки — Lucide, отдельный Icon не понадобился) | 3–4 ч |
| 8 | FormField, Input, Textarea, Checkbox, Select | Формы, mobile touch targets | ✅ FormField, Field, Input, Select (+ Sheet), Textarea, Checkbox | 4–6 ч |
| 9 | Бриф и концепция эталонного лендинга (Concept Sprint Lite на себе) | Concept Approved | ⬜ | 2–3 ч |
| 10 | Header + Drawer (мобильное меню), Footer, Hero ×2 | Первый экран, mobile сначала | ⬜ | 5–7 ч |
| 11 | Остальные секции + LeadForm с server route (Nuxt) | Полная страница | ⬜ | 6–8 ч |
| 12 | Playwright (скриншоты 360/768/1440, axe), QA, тест смены темы, деплой | Опубликованный срез с доказательствами | ⬜ | 4–6 ч |
| 13 | Ретро: time log, `docs/sections.md`, обновление roadmap, решение по config-driven и третьему hero | Фабрика v0.1 | ⬜ | 1–2 ч |

Итого ориентир: ~40–60 ч, калибруется по факту после шага 3–4.

## Базовый набор (ADR-0006, 2026-09-24)

Сверх плана по решению владельца собран базовый набор для лендингов → сайтов → магазина → SaaS: Link, RadioGroup, Switch, Card, Badge, Avatar, Skeleton, Accordion, Tabs, Dialog, Tooltip, DropdownMenu, Toast, Alert, Breadcrumbs, Pagination, NumberField (+ ghost-кнопка). Отложено до реального экрана: Combobox с поиском, календарь DatePicker, секции лендинга (шаги 10–11).

## Графики и SaaS (ADR-0007, 2026-09-24)

Пакет `@uix/charts`: ChartCard, LineChart, BarChart, DonutChart, Sparkline, StatTile, Meter, Heatmap (+ легенда, подсказка, табличный двойник); в `@uix/ui` — DataTable и PeriodSelect. Пример сборки — история «Charts/Dashboard». Плитки выбора: RadioGroup/CheckboxGroup `variant="tiles"`. Дальше по реальным экранам SaaS: разброс, воронка, серверная сортировка/пагинация DataTable.

Следующий шаг — 9: бриф и концепция эталонного лендинга, затем сборка страницы из набора.

## Открытые вопросы, не блокирующие старт шага 3

- Расположение и формат glass-кода (если существует отдельно от Figma) — добавить в аудит при получении.
- Хардкод ли focus-border у Field (см. `docs/audit.md`) — проверить перед переносом состояния в токены.
- Вторая стилистика — токен-first в Storybook, без полной отрисовки в Figma (см. ADR-0003); конкретную палитру/характер выбрать на шаге 4.
