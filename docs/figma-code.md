# Figma ↔ код: маппинг компонентов

Ручная синхронизация (Figma Starter — без Code Connect, см. ADR-0003). Обновлять при каждом перенесённом компоненте. Значения из макета снимаются через plugin API в консоли открытого файла (только чтение): Figma MCP на Starter упирается в лимит вызовов.

Figma-файл: "Untitled", fileKey `QCBbAcSPGMcK3IYk9ay6tE`. Выгрузка переменных — `packages/tokens/source/figma-export/`.

| Figma-компонент (node-id) | Vue-компонент | Файл |
|---|---|---|
| Button (127:566) | `Button` | `packages/ui/src/components/Button/Button.vue` |
| IconButton (127:566) | `IconButton` (Button + модификатор) | `packages/ui/src/components/IconButton/IconButton.vue` |
| spiner (127:566) | `Spinner` | `packages/ui/src/components/Spinner/Spinner.vue` |
| field (Inputs 149:723, set 150:963) | `Field` | `packages/ui/src/components/Field/Field.vue` |
| input (Inputs 149:723, set 150:1395) | `FormField` + `Input` | `packages/ui/src/components/FormField/FormField.vue`, `Input/Input.vue` |
| select (Inputs 149:723, set 150:2006) | `Select` (раскрытый список — токен-first) | `packages/ui/src/components/Select/Select.vue` |

Остальные компоненты, паттерны (`packages/ui/src/patterns`) и графики (`packages/charts`) — **токен-first**, в макете их нет; что нарисовать — `docs/figma-todo.md`.

## Button: перенесено 1:1

- Структура: корень + слой `surface` (в коде `::before`).
- Тени (inner + 1–2 drop), бордеры и фоны каждого состояния, включая disabled/loading у primary и secondary.
- Focused — внутренний бордер `stroke/2` цвета `state/focus`, без внешнего отступа.
- Loading — только спиннер 20×20, штрих `stroke/2`; лейбл скрыт визуально, но остаётся для скринридера.
- Фон стилистики glass — заливка Frame 29 (`#272727 → #252121`).

## Расхождения с макетом

- **Лейбл — `type/label/m` 16/20 Medium**; в макете `label/md` 14/16. Соответствие имён шкалы — `docs/figma-todo.md`.
- **Размеры кнопки** `s` 40 / `m` 48 / `l` 56 — в макете только 48.
- **Иконки — Lucide**, слоты `#start`/`#end` = скрытые слоты `send` (20×20), линия `stroke/icon` 1.5px.
- **Отступ иконка–лейбл:** в Figma gap 10px (не привязан к переменной); в коде `space/2` = 8px — 10 нет в шкале.
- **Pressed — канон Liquid Glass:** в Figma поверхность растёт 48→56 и темнеет. В коде размеры не меняются: вся кнопка делает `scale` на пружине, стекло светлеет, из точки касания растекается блик (`surface/<role>/pressed/highlight`). Макет pressed стоит обновить под это поведение.
- **Кромки стекла** тише, чем в макете: блик, а не обводка.
- **Blur:** Figma BACKGROUND_BLUR r20/r24 → CSS `blur(10px)`/`blur(12px)` (радиус в Figma ≈ 2× CSS).
- **Спиннер:** в Figma дуга с 4 фазами smart animate (4 × 400ms); в коде — CSS-кольцо с одной прозрачной стороной (≈270°), оборот 1600ms.
- **Переходы между состояниями** в Figma не заданы; в коде `duration/normal` (200ms).
- **Контраст фокуса на primary (glass):** `#007aff` бордер на `#007affbf` фоне заметен слабо — перенесено как в макете, стоит решить в Figma (светлый бордер фокуса).
