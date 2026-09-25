# Компоненты: какие семантические токены использует каждый

Состав базового набора и принципы — `docs/decisions/0006-baseline-component-set.md`. Живая документация с примерами — Storybook (Docs каждого компонента).

Требование ADR-0002: компонент ссылается только на роли токенов, не на значения. Fallback в `var()` — системные цвета CSS (`ButtonFace`, `ButtonText`, `Highlight`…) или `none`, чтобы компонент оставался читаемым вне `[data-theme]`.

## Button (`packages/ui/src/components/Button/Button.vue`)

| Что | Токены |
|---|---|
| Primary: default / hover / pressed / disabled / loading | `surface-accent-{default,hover,pressed,disabled,loading}-{bg,border,shadow,backdrop}`, `color-text-on-accent` |
| Secondary: то же | `surface-neutral-{default,hover,pressed,disabled,loading}-{bg,border,shadow,backdrop}`, `color-text-primary` |
| Disabled-лейбл | `color-text-disabled` |
| Focus | `color-state-focus`, `stroke-2` (внутренний бордер surface) |
| Форма, размер, отступы | `radius-full`, `size-48`, `space-2`, `space-4`, `space-px` (снизу, оптическая компенсация), `stroke-1` |
| Pressed (Liquid Glass: scale на пружине + блик из точки касания `surface-*-pressed-highlight`, слой `::after`) | `scale-pressed`, `duration-press` + `easing-spring-press` (нажатие), `duration-release` + `easing-spring-release` (отпускание); при `prefers-reduced-motion` — без scale |
| Типографика | `type-label-m-*` (16/20 Medium — не сверено с Figma) |
| Иконки (слоты `#start`/`#end`) | `size-20`, `stroke-icon`, цвет — `currentColor` |
| Спиннер | `size-20`, `stroke-2`, `opacity-30`, `duration-spinner`, `duration-spinner-reduced` |
| Переходы | `duration-normal` (отключаются при `prefers-reduced-motion`) |

Структура: корень задаёт layout и hit area, материал рисуется слоем `::before` (как `surface` в Figma). Состояние подменяет приватные `--_bg/--_border/--_shadow/--_backdrop`, слой только их читает.

Варианты: `primary`, `secondary`, `ghost` (без плашки в покое, `surface-ghost-*` — тулбары, «закрыть», третьестепенные действия).

Поведение:
- Событие `click` объявлено (`defineEmits`) и не вызывается в disabled/loading.
- `as="button"` (по умолчанию) рендерит `type="button"`; переопределяется атрибутом `type`.
- `disabled`/`loading` → нативный `disabled`; `loading` → `aria-busy="true"`, спиннер `aria-hidden`, лейбл скрыт визуально (остаётся доступным именем).
- `as="a"` + `disabled`/`loading` → `aria-disabled="true"`, клик гасится в capture-фазе; ссылка остаётся в tab-порядке.
- Иконки — слоты `#start`/`#end`, библиотека кита Lucide (`@lucide/vue`); Button к ней не привязан. В loading иконки скрыты.
- Focus — только нативный `:focus-visible`, без пропа.

**Размеры (`size`):** `s` — `size-40` (на тач-экране, `pointer: coarse`, — `size-44`), `space-3`, `type-label-s-*`, иконка `size-16` (компактный: тулбары, плотные экраны — не по умолчанию); `m` — `size-48`, `space-4`, `type-label-m-*`, иконка `size-20` (по умолчанию, тач); `l` — `size-56`, `space-6`, `type-label-l-*`, иконка `size-24` (CTA). IconButton — квадрат высоты кнопки.

## Spinner (`packages/ui/src/components/Spinner/Spinner.vue`)

Figma `spiner`. Декоративный (`aria-hidden`): загрузку сообщает контрол через `aria-busy`. Используется в Button и Field.

| Что | Токены |
|---|---|
| Размер, штрих | `size-20`, `stroke-2`, `radius-full`; цвет — `currentColor` с `opacity-30` |
| Оборот | `duration-spinner`, при `prefers-reduced-motion` — `duration-spinner-reduced` |

## FormField (`packages/ui/src/components/FormField/FormField.vue`)

Подпись + подсказка/ошибка вокруг любого контрола (Input, дальше Select, Textarea). Отдаёт в слот `id`, `describedBy`, `invalid` — контрол ставит их на себя.

| Что | Токены |
|---|---|
| Подпись | `type-label-xs-*`, `color-text-secondary`; ошибка — `color-text-danger` |
| Подсказка / ошибка | `type-body-xs-*`, `color-text-tertiary`; ошибка — `color-text-danger`; disabled — `color-text-disabled` |
| Отступы | `space-2` |

Ошибка заменяет подсказку (в Figma error красит тот же hint). Без `label` контролу нужен `aria-label`. Слот `#aside` — справа от подсказки (счётчик символов Textarea), `type-body-xs-*`, `color-text-tertiary`, цифры моноширинные.

## Field (`packages/ui/src/components/Field/Field.vue`)

Капсула поля — общая основа Input и Select. Контрол внутри — любой элемент с `data-field-control`; клик по капсуле мимо контрола переводит фокус в него.

| Что | Токены |
|---|---|
| Материал по состояниям | `surface-field-{default,hover,focused,error,disabled}-{bg,border,backdrop}` |
| Focus | `:focus-within` → плашка `surface-field-focused-bg` + кольцо `surface-field-focused-ring` (`stroke-2`); во всех текущих стилистиках кольцо прозрачное |
| Размер, отступы | `size-48`, `space-4`, `space-3`, `radius-full`, `stroke-1` |
| Иконки | `size-24`, `stroke-icon`, `color-icon-secondary` / `color-icon-disabled` |
| Текст | `color-text-primary`; loading — `color-text-secondary`; disabled — `color-text-disabled` |
| Переходы | `duration-fast` |

Состояния: hover/focused — CSS, error/disabled/loading — пропсы. Loading показывает Spinner вместо правого слота. `flush` — контрол занимает всю капсулу и сам задаёт отступы (Select: кликабельно всё поле). `multiline` — для Textarea: скругление `radius-6` вместо капсулы, выравнивание по верху, отступ `space-3` сверху и снизу.

## Input (`packages/ui/src/components/Input/Input.vue`)

FormField + Field + нативный `<input>`. `v-model`, `label`, `hint`, `error`, `placeholder`, `type`, `disabled`, `loading`, `clearable`; слоты `#start` / `#end`; событие `clear`.

| Что | Токены |
|---|---|
| Текст | `type-body-m-*` (16px — без зума в iOS Safari) |
| Placeholder | `color-text-tertiary`; disabled — `color-text-disabled` |
| Курсор | `color-accent-default` |
| Кнопка очистки | иконка `size-20` в `size-24`, зона касания `size-44`, фокус — `color-state-focus` |

Поведение:
- Атрибуты (`name`, `autocomplete`, `inputmode`, `required`, `aria-*`) — на `<input>`, `class`/`style` — на корень.
- `error` → `aria-invalid="true"`, текст ошибки связан через `aria-describedby`.
- `loading` → `readonly`, `aria-busy="true"`, спиннер.
- `clearable` → кнопка «Очистить», когда есть текст (не в disabled/loading); после очистки фокус возвращается в поле.
- Автозаполнение браузера не заливает стекло фоном.

## Select (`packages/ui/src/components/Select/Select.vue`)

FormField + Field (`flush`) + триггер. `v-model`, `options: SelectOption[]` (`value`, `label`, `disabled?`), `label`, `hint`, `error`, `placeholder`, `disabled`, `loading`, `name`, `required`, `presentation`; слот `#start`.

Раскрытие — по ширине экрана (`presentation="auto"`), или явно:

| Режим | Когда | Как |
|---|---|---|
| `popover` | ширина ≥ `breakpoint/m` (768px) | всплывашка у поля — Reka UI Select (listbox, typeahead, стрелки) |
| `sheet` | уже `breakpoint/m` | шторка снизу — Sheet + Reka Listbox |

До монтирования (SSR) — всегда popover, режим уточняется на клиенте (`useMediaQuery`).

| Что | Токены |
|---|---|
| Поле | как у Field; значение — `type-body-m-*`, плейсхолдер — `color-text-tertiary` |
| Шеврон | `size-20`, `color-icon-secondary`; открыт — поворот 180° (`duration-normal`) |
| Панель | `surface-popover-{bg,border,shadow,backdrop}`, `radius-6`, `space-1`, `z-index-popover` |
| Появление | `scale-popover-enter` → 1 на пружине `duration-press` + `easing-spring-press` |
| Опция | `size-44`, `space-4`, `radius-full`, `type-body-m-*`; подсветка — `surface-option-highlighted-bg`; выбранная — галочка `color-accent-default`; отключённая — `color-text-disabled` |

Поведение:
- Вся капсула — триггер; подпись связана с ним (`for`), ошибка — `aria-invalid` + `aria-describedby`.
- `loading` → спиннер вместо шеврона, выбор заблокирован, `aria-busy`.
- В шторке выбор закрывает её и возвращает фокус на поле; список назван по подписи поля.
- `name` → значение уходит в форму (в popover — через Reka, в sheet — скрытый input).

Storybook: истории «Popover · open» и «Sheet · open» (открытая панель + axe по `<body>`) исключены из Docs (`!autodocs`). На Docs-странице они вызывали бесконечный цикл перерисовки в таблице Controls самого Storybook (`TextareaAutosize` ↔ `selectionchange`) и страница зависала; в режиме отдельной истории и в тестах работают. Точный триггер внутри Storybook не локализован — при появлении похожего зависания Docs начинать с исключения open-историй.

## Sheet (`packages/ui/src/components/Sheet/Sheet.vue`)

Шторка снизу на Reka UI Dialog. `v-model:open`, `title` (видимый заголовок и имя диалога), слот по умолчанию.

| Что | Токены |
|---|---|
| Материал | `surface-popover-{bg,border,shadow,backdrop}`, верхние углы `radius-sheet` |
| Затемнение | `surface-scrim-{bg,backdrop}` |
| Ручка, заголовок | `size-36` × `space-1`, `color-border-strong`; `type-heading-s-*` |
| Анимация | выезд снизу `duration-release` + `easing-spring-press`; при reduced motion — только проявление |
| Отступы | `space-2`, `space-4`; снизу — `env(safe-area-inset-bottom)` |

Поведение (Reka Dialog): фокус внутри, Esc и тап по затемнению закрывают, фокус возвращается на элемент, открывший шторку, скролл страницы заблокирован. Смахивания вниз пока нет.

Пропсы: `description` (описание диалога), `closable` (кнопка «Закрыть» в шапке), `initialFocus` (`first` — первый элемент, как у Select; `container` — сама шторка, как у Dialog). Слот `#footer` — действия, закреплены внизу.

## Textarea (`packages/ui/src/components/Textarea/Textarea.vue`)

FormField + Field (`multiline`) + `<textarea>`. `v-model`, `label`, `hint`, `error`, `placeholder`, `disabled`, `rows` (3), `autoResize` (да), `maxRows` (10), `maxlength`, `limitLabel`. В Figma нет — токен-первый.

| Что | Токены |
|---|---|
| Материал, фокус, ошибка, disabled | как у Field (`surface-field-*`), скругление `radius-6` |
| Текст | `type-body-m-*`, курсор `color-accent-default`, плейсхолдер `color-text-tertiary` |
| Высота | `rows` … `maxRows` × `type-body-m-line-height` |
| Счётчик | слот `#aside` FormField |

Поведение:
- `autoResize` — растёт по содержимому (`field-sizing: content`; где не поддержан, напр. Safari — пересчёт высоты на JS), выше `maxRows` — прокрутка. Без `autoResize` — фиксированная высота и ручной `resize: vertical`.
- `maxlength` — нативный предел + счётчик `N / max` (`aria-hidden`); скринридеру лимит сообщается через описание поля («Не больше N символов»).

## Checkbox (`packages/ui/src/components/Checkbox/Checkbox.vue`)

Нативный `<input type="checkbox">` (`appearance: none`). `v-model` (boolean), `label` или слот, `description`, `error`, `disabled`, `indeterminate`. В Figma нет — токен-первый.

| Что | Токены |
|---|---|
| Флажок | `size-24`, `radius-2`, обводка `stroke-2` |
| Пустой / hover / disabled | `surface-control-{default,hover,disabled}-{bg,border}` — обводка ≥ 3:1 к фону (WCAG 1.4.11) |
| Отмечен / частично | `surface-control-checked-{bg,border,mark}`; галочка / черта Lucide `size-20`, `stroke-3` |
| Ошибка | `surface-control-error-border`, текст `color-text-danger` |
| Строка | зона касания `size-44`, отступ `space-3`; подпись `type-body-m-*`, описание/ошибка `type-body-xs-*` |
| Фокус | `color-state-focus`, `stroke-2`, отступ `stroke-2` |
| Нажатие | `scale-pressed` на пружине (как Button); появление отметки — пружина `duration-press` |

Поведение:
- Имя флажка — только подпись (`<label for>`); описание вне `<label>`, связано с ошибкой через `aria-describedby`; ошибка ставит `aria-invalid`.
- `indeterminate` — DOM-свойство («выбрать всё», когда выбрана часть); скринридер читает «частично отмечен».
- `name`, `value`, `required` — на `<input>`, работает с обычной отправкой формы.

---

## Базовый набор (ADR-0006)

Все компоненты ниже — токен-первые (в Figma нет), каждый проверен axe во всех комбинациях стилистика × схема.

### IconButton
Button с модификатором `ui-button--icon`: круг `size-48`, иконка `size-24`; варианты `primary` / `secondary` / `ghost`. `label` обязателен — единственное доступное имя (и `title`).

### Link
`color-text-link` (≥ 4.5:1 в каждой схеме), подчёркивание `stroke-1` → `stroke-2` при наведении, отступ `space-1`. `as` — NuxtLink/RouterLink. `external` — новая вкладка, иконка ↗ и пояснение для скринридера.

### RadioGroup
`variant="tiles"` — плитки-плашки вместо кружков (см. ChoiceTile ниже).
Нативные радио в `<fieldset>`/`<legend>`; `options` (`value`, `label`, `description?`, `disabled?`), `hint`, `error`, `orientation`. Круг `size-24`, токены `surface-control-*` (как Checkbox), точка `space-2` на пружине, строка `size-44`.

### Switch
`<input type="checkbox" role="switch">`, трек `size-52` × `size-32` (`surface-switch-track-off` ≥ 3:1 к фону, `-track-on` — акцент), бегунок `size-24` (`surface-switch-thumb`, `-thumb-shadow`), при нажатии растягивается на `space-2`. Подпись слева, переключатель справа. Для согласий в формах — Checkbox.

### Container / Section / Stack / Grid / Divider
- **Container** — ширина `size-container-{s,m,l}` или `full`, поля `layout-gutter` (16 → 40px, `clamp`).
- **Section** — `padding-block: layout-section` (48 → 96px), Container внутри, `tone="subtle"` — плашка `color-surface-subtle`.
- **Stack** — flex с `gap` из шкалы `space-*` (проп — ключ шкалы, не пиксели).
- **Grid** — `auto-fit` с минимальной ячейкой `size-grid-item-{s,m,l}`; `columns` — максимум колонок. Без media query.
- **Divider** — `color-border-default`, `stroke-1`; по умолчанию декоративный, `semantic` → `role=separator`.

### Heading / Text
- **Heading** — `level` (h1…h6) и `size` (`hero` / `display` / `l` / `m` / `s` → `type-*`) независимы; `hero` — плавный 32 → 64px (`type-hero`, `font-line-height-tight`); `text-wrap: balance`.
- **Text** — `size` (`l`/`m`/`s`/`caption`), `tone` (`primary`/`secondary`/`tertiary`/`danger`), `as`.

### Card
Материал `surface-card-{bg,border,shadow,backdrop}`, `radius-6`, `padding` `m` (`space-4`) / `l` (`space-6`) / `none`. Кликабельная (`as="a" | "button"` / NuxtLink) — `surface-card-hover-bg`, `scale-pressed-surface` на пружине, кольцо фокуса.

### Badge
`color-badge-{neutral,accent,success,warning,danger}-{bg,fg}` (текст ≥ 4.5:1 на плашке — тест токенов), `size-24`, `space-2`, `radius-full`, `type-label-xs-*`, ширина по содержимому; иконка — слот `#start` (`size-16`).

### Avatar
Фото или инициалы (если фото нет или не загрузилось), `size-{32,40,48}`, `color-surface-hover` + `color-text-secondary`. `name` — доступное имя; `decorative` — скрыт, если имя написано рядом.

### Skeleton
`surface-skeleton-{bg,shine}`, блик за `duration-spinner`, без блика при reduced motion. Формы `text` (строки высотой в body/m) / `rect` / `circle`. Декоративный — `aria-busy` ставит контейнер.

### Accordion
Reka Accordion; `items` (`value`, `title`, `content?`, `disabled?`), `type` single/multiple, `headingLevel`; строка `size-56`, заголовок `type-heading-s-*`, текст `color-text-secondary`, раскрытие по высоте на пружине, разделители `color-border-default`. Разметка содержимого — слот с именем `value`.

### Tabs
Reka Tabs; сегментированный контрол `surface-segmented-{track,indicator,indicator-border,indicator-shadow}`, плашка активной вкладки перетекает на пружине (`duration-release` + `easing-spring-release`). Вкладка `size-40`, `type-label-s-*`; `stretch` — поровну на всю ширину; иначе — горизонтальная прокрутка. Панель — слот с именем `value`.

### Dialog
`presentation` auto / dialog / sheet (по `breakpoint/m`, SSR — dialog). Окно: `surface-popover-*`, `radius-8`, ширина `size-container-{sm,md}` в пределах полей, `z-index-popover`, затемнение `surface-scrim-*`, появление `scale-popover-enter` на пружине. Шторка — Sheet (`closable`, `initialFocus="container"`). Фокус при открытии — на окно (скринридер читает заголовок, без кольца на «Закрыть»), при закрытии — обратно на кнопку.

### Tooltip
Reka Tooltip: наведение и фокус с клавиатуры, Esc, `aria-describedby`; задержка `duration-slower`, отступ `space-2`; материал `surface-popover-*`, `radius-3`, `type-body-s-*`. На сенсорных экранах не показывается — ничего важного.

### DropdownMenu
Reka DropdownMenu: `items` — действия (`value`, `label`, `icon?`, `danger?`, `disabled?`), `separator`, `label`; событие `select(value)`. Панель и пункты — как у Select (`surface-popover-*`, `surface-option-highlighted-bg`), опасное действие — `color-text-danger`.

### Toast
`<Toaster />` один раз в layout + `useToast().toast({ title, description, tone, action })`. Reka Toast: `danger` — объявляется сразу, остальные — вежливо; таймер `duration-toast` замирает при наведении/фокусе; F8; смахивание вправо. Внизу по центру, ширина узкого контейнера, safe-area; `surface-popover-*`, `radius-6`. `action` требует `altText`.

### Alert
Тонированная плашка `color-badge-<tone>-bg` (info → accent), иконка `color-badge-<tone>-fg`, заголовок `type-label-m-*`, текст `color-text-secondary` (оба ≥ 4.5:1 на плашке — тест токенов). `live` → `role=alert` (danger/warning) или `status`; `dismissible` → событие `dismiss`; действия — слот `#actions`.

### Breadcrumbs
`<nav aria-label>` + `<ol>`, текущая — `aria-current="page"` без ссылки, разделители `ChevronRight` декоративные; ссылки `color-text-secondary` → `primary` при наведении; `linkAs` — NuxtLink.

### Pagination
Reka Pagination (первая/последняя + «…»); кнопки `size-44`, текущая — `surface-accent-default-bg` + `color-text-on-accent`, `aria-current="page"`; на узком экране без соседних страниц. `hrefFor(page)` — страницы-ссылки для индексируемого каталога. Подписи по-русски (`pageLabel` «Страница {n}» вместо Reka «Page N»).

### NumberField
Reka NumberField (spinbutton, ↑/↓, min/max/step, `formatOptions`, `locale`) внутри FormField + Field (`flush`); кнопки − / + — ghost `size-48`, недоступны у предела; значение по центру, цифры моноширинные.

### Утилиты
- `useMediaQuery(query)` — реактивное совпадение, до монтирования `false` (SSR).
- `useToast()` — очередь уведомлений для `<Toaster />`.
- `tokenNumber(name, fallback)` — число из CSS-токена для библиотек, которым нужны числа (задержки, отступы Reka).

## Графики и SaaS (ADR-0007)

Пакет `@uix/charts` (`packages/charts`): свои SVG-компоненты на Vue, из d3 — только математика. Цвета — токены `color/chart/*` (см. `docs/tokens.md`), числа для SVG — `chartMetrics()` через `tokenNumber`. У каждого графика: табличный двойник (ChartCard → «Показать таблицей»), клавиатура + живой регион, пустое состояние, reduced motion; истории с матрицей 4 схем (axe).

### ChartCard
`Card as="figure"` + figcaption (`Heading` уровня `headingLevel`, по умолчанию 3), слот `#actions`, переключатель «График / Таблица» (IconButton ghost). `loading` — прежний рендер `opacity-50` + `aria-busy`, без скелетона. Передаёт графику контекст (вид, заголовок).

### ChartLegend / ChartTooltip / ChartTable
Легенда — кнопки `aria-pressed` (последнюю видимую серию скрыть нельзя), образец — линия или прямоугольник. Подсказка — материал `surface/popover/*`, значение `type/label/s`, подпись `color-text-secondary`, `aria-hidden` (дублирует живой регион). Таблица — region с `tabindex`, подпись = заголовок графика, числа вправо, `tabular-nums`.

### LineChart
Линия `stroke/2`, конечные точки `space/1` с кольцом `color-chart-surface`, подложка `opacity/10`, сетка `color-chart-grid`, подписи осей `type/caption` + `color-text-tertiary`. Появление — прорисовка (clip), смена данных — пружина значений и шкалы. `emphasis` — остальные серии `color-chart-muted`.

### BarChart
Вертикальный/горизонтальный, группа/стек. Столбец ≤ `size/chart/bar`, конец скруглён `radius/1`, зазор `stroke/2`; появление волной по категориям. Подложка категории — `color-chart-grid`. Горизонтальный — высота по числу строк, подписи обрезаются многоточием.

### DonutChart
Доля от целого: ≤ 6 сегментов (хвост → «Другое», `color-chart-muted`), по убыванию; кольцо толщиной `size/chart/bar`, зазор `stroke/2`, скругление `radius/1`. Центр — итог (`type/heading/m`) или выбранная доля; остальные сегменты `opacity/30`. Легенда — прямые подписи на subgrid (доля `color-text-secondary`, значение `tabular-nums`), не шире `size/grid-item/l`; в контейнере ≥ `size/container/s` — справа от кольца. Появление — заметание, смена данных — пружина.

### Sparkline / StatTile / Meter / Heatmap
- **Sparkline** — `role="img"` с фразой «от … до …, минимум, максимум»; высота `size/40`.
- **StatTile** — Card: подпись `type/label/s`, значение `type/heading/l` (пропорциональные цифры, счётчик на пружине), дельта — иконка Lucide + текст `color-status-success/danger`, `upIsGood`. Ряд KPI — `Grid min="s"`.
- **Meter** — `role="meter"`, дорожка `color-chart-grid`, заливка `color-chart-series-1` / `status-warning` / `status-critical` + иконка и текст статуса.
- **Heatmap** — 7 классов `color-chart-sequential-*`, зазор `stroke/2`, ячейка ≤ `size/40` (строка не ниже строки подписи), легенда шкалы; стрелки по двум осям.

### CheckboxGroup (`@uix/ui`)
Пара к RadioGroup: `<fieldset>`/`<legend>`, v-model — массив `value` в порядке опций. `variant="list"` — Checkbox строками, `variant="tiles"` — плитки.

### ChoiceTile (внутренний, `@uix/ui`)
Плитка RadioGroup/CheckboxGroup `variant="tiles"`: `<label>` с визуально скрытым нативным input (имя — `aria-labelledby` на подпись, цена/пояснение — `aria-describedby`). Материал secondary-кнопки `surface/neutral/{default,hover,pressed,disabled}/*`, нажатие — `scale/pressed-surface` на пружине. Выбранная — кольцо `surface-control-checked-border` (слой `::after`, outline остаётся фокусу) + галочка `surface-control-checked-bg/mark` в углу; ошибка — `surface-control-error-border`. Сетка — `auto-fill` по `size/grid-item/s` (на телефоне две колонки).

### DataTable (`@uix/ui`)
Generic по строке. Mobile-first: в контейнере уже `size/container/s` строки — карточки `surface-card-bg`, шапка — чипы сортировки `surface-neutral-default-bg`; шире — таблица, липкая шапка `color-chart-surface`, разделители `color-border-subtle`, наведение `surface-ghost-hover-bg`, выбранная строка `surface-option-highlighted-bg`. `aria-sort`, Checkbox для выбора (частичное «выбрать всё»), слоты `#cell-<key>`.

Типографика: ячейки `type-body-m-*` (16px — основной текст, как везде), заголовки колонок и чипы сортировки `type-label-s-*` (14px). Табличный двойник графиков — так же.
### Calendar (`@uix/ui`)
Reka UI Calendar / RangeCalendar (одна разметка на оба режима): `mode` `single`/`range`, `layout` `paged` (месяцы рядом, `months` 1–2) / `scroll` (вертикальная лента месяцев со своей прокруткой — мобильный). Значения `YYYY-MM-DD`. Ячейка `size-44` (точный указатель, `paged` — `size-40`), число `type-body-m-*` + `tabular-nums`; выбранный день и края диапазона — `surface-accent-default-bg` + `color-text-on-accent`; полоса — `surface-calendar-range` (предпросмотр до второго клика — `surface-calendar-preview`), от центра краёв, у краёв недели — скругление; сегодня — точка `color-accent-default`; дни других месяцев скрыты; недоступные — `color-text-disabled`, `unavailable` — зачёркнуты. Событие `pending` — диапазон начат, но не завершён.

### DatePicker (`@uix/ui`)
FormField + Field-кнопка (иконка календаря, значение словами через `Intl.DateTimeFormat#formatRange`). Десктоп — Reka Popover (кнопка поля своя, Reka — якорь), материал `surface-popover-*` на обёртке панели: пресеты `presets` слева (`surface-option-highlighted-bg` при наведении, галочка у активного), справа Calendar на 2 месяца; выбор закрывает. Мобильный — Sheet: пресеты чипами (`surface-neutral-default-bg`, активный — акцент), Calendar `layout="scroll"`, период применяется «Готово» (черновик; недоступна, пока период не завершён), одна дата — сразу.

### PeriodSelect (`@uix/ui`)
Select пресетов (сегодня, 7/30/90 дней, с начала месяца, свой) + DatePicker для своего периода (не позже «сегодня»). Значение `{ preset, from, to }`; утилиты `resolvePeriod`, `previousPeriod`, `periodDays` (`utils/period.ts`, юнит-тесты).
