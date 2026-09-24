# Figma ↔ код: маппинг компонентов

Ручная синхронизация (Figma Starter — без Code Connect, см. ADR-0003). Обновлять при каждом перенесённом компоненте.

Figma-файл: "Untitled", fileKey `QCBbAcSPGMcK3IYk9ay6tE`.

| Figma-компонент (node-id) | Vue-компонент | Файл | Статус |
|---|---|---|---|
| Button (127:566) | `Button` | `packages/ui/src/components/Button/Button.vue` | done |
| spiner (127:566) | `Spinner` | `packages/ui/src/components/Spinner/Spinner.vue` | done |
| field (Inputs 149:723, set 150:963) | `Field` | `packages/ui/src/components/Field/Field.vue` | done |
| input (Inputs 149:723, set 150:1395) | `FormField` + `Input` | `packages/ui/src/components/FormField/FormField.vue`, `Input/Input.vue` | done |
| select (Inputs 149:723, set 150:2006) | `Select` (FormField + Field + Reka UI) | `packages/ui/src/components/Select/Select.vue` | done (раскрытый список — токен-first) |
| — (нет в макете) | `Sheet` | `packages/ui/src/components/Sheet/Sheet.vue` | done, токен-первый |
| — (нет в макете) | `Textarea` | `packages/ui/src/components/Textarea/Textarea.vue` | done, токен-первый |
| — (нет в макете) | `Checkbox` | `packages/ui/src/components/Checkbox/Checkbox.vue` | done, токен-первый |
| IconButton (127:566) | `IconButton` | `packages/ui/src/components/IconButton/IconButton.vue` | done (Button + модификатор; сверить с макетом) |
| — (нет в макете) | базовый набор ADR-0006: Link, RadioGroup, Switch, Container, Stack, Grid, Section, Heading, Text, Divider, Card, Badge, Avatar, Skeleton, Accordion, Tabs, Dialog, Tooltip, DropdownMenu, Toast, Alert, Breadcrumbs, Pagination, NumberField | `packages/ui/src/components/*` | done, токен-первые — список «нарисовать» в `docs/figma-todo.md` |

## Как снимались значения

Figma MCP на Starter упирается в лимит вызовов, поэтому Button 2026-09-24 снят через plugin API в консоли открытого файла (только чтение): fill/stroke/effects/размеры/привязанные переменные каждого варианта `button` и `spiner`.

## Button: что перенесено 1:1

- Структура: корень + слой `surface` (в коде `::before`).
- Все тени (inner + 1–2 drop), бордеры и фоны каждого состояния, включая отдельные disabled/loading у primary и secondary.
- Focused — внутренний бордер `stroke/2` цвета `state/focus`, без внешнего отступа.
- Loading — только спиннер 20×20, штрих `stroke/2`, белый 30%; лейбл скрыт визуально, но остаётся для скринридера.
- Фон стилистики — заливка Frame 29 (`#272727 → #252121`).

## Расхождения и допущения

- **Лейбл — `type/label/lg` (решение 2026-09-24),** в макете `label/md`. Стиля `label/lg` в Figma нет (выгрузка 2026-09-24) — добавить в Figma как 16/20 Medium.
- **Иконки — Lucide (решение 2026-09-24).** Слоты `#start`/`#end` = скрытые слоты `send` в Figma (20×20). Толщина линии Lucide по умолчанию 2px; с толщиной иконок в макете не сверено.
- **Отступ иконка–лейбл:** в Figma у `content` gap 10px (не привязан к переменной); в коде `space/2` = 8px, т.к. 10 нет в шкале.

- **Pressed — осознанное отличие от макета, канон Liquid Glass (решения 2026-09-24):** в Figma поверхность растёт 48→56 и темнеет. В коде размеры не меняются: вся кнопка делает `scale` 1.08 на пружине (нажатие ζ 0.8 / 300ms, отпускание ζ 0.5 / 650ms), стекло **светлеет** (ярче фон и кромка, сильнее цветное свечение, мягче тёмная тень), а из точки касания растекается блик (`surface/<role>/pressed/highlight`, вспышка 100ms, затухание 650ms). В light-neutral блик `transparent`. Макет pressed стоит обновить под это поведение.

- **Blur:** Figma BACKGROUND_BLUR r20/r24 → CSS `blur(10px)`/`blur(12px)` (радиус в Figma ≈ 2× CSS). Сверить глазами на пёстром фоне.
- **Спиннер:** в Figma дуга-вектор с 4 фазами smart animate (4 × 400ms); в коде — CSS-кольцо с одной прозрачной стороной (≈270°), оборот 1600ms.
- **Переходы между состояниями** в Figma не заданы; в коде `duration/normal` (200ms).
- **Контраст фокуса на primary (glass):** `#007aff` бордер на `#007affbf` фоне — заметен слабо. Перенесено как в макете; стоит решить в Figma (предложение: светлый бордер фокуса).
- **IconButton** из того же фрейма не перенесён (шаг 7 roadmap). Вариант `state=state11` переименовать в Figma до переноса (см. audit.md).

## Сверка с выгрузкой переменных (2026-09-24)

Снимок: `packages/tokens/source/figma-export/2026-09-24.json`. Семантические цвета `color/*` в коде — 1:1 с Figma (алиас + alpha), см. `docs/tokens.md`. Всё, что в макете надо поправить, — в `docs/figma-todo.md`.
