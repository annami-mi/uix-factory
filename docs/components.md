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
| Типографика | `type-label-lg-*` (16/20 Medium — не сверено с Figma) |
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
| Подпись | `type-label-sm-*`, `color-text-secondary`; ошибка — `color-text-danger` |
| Подсказка / ошибка | `type-body-sm-*`, `color-text-tertiary`; ошибка — `color-text-danger`; disabled — `color-text-disabled` |
| Отступы | `space-2` |

Ошибка заменяет подсказку (в Figma error красит тот же hint). Без `label` контролу нужен `aria-label`. Слот `#aside` — справа от подсказки (счётчик символов Textarea), `type-body-sm-*`, `color-text-tertiary`, цифры моноширинные.

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
| Текст | `type-body-lg-*` (16px — без зума в iOS Safari) |
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
| `popover` | ширина ≥ `breakpoint/md` (768px) | всплывашка у поля — Reka UI Select (listbox, typeahead, стрелки) |
| `sheet` | уже `breakpoint/md` | шторка снизу — Sheet + Reka Listbox |

До монтирования (SSR) — всегда popover, режим уточняется на клиенте (`useMediaQuery`).

| Что | Токены |
|---|---|
| Поле | как у Field; значение — `type-body-lg-*`, плейсхолдер — `color-text-tertiary` |
| Шеврон | `size-20`, `color-icon-secondary`; открыт — поворот 180° (`duration-normal`) |
| Панель | `surface-popover-{bg,border,shadow,backdrop}`, `radius-6`, `space-1`, `z-index-popover` |
| Появление | `scale-popover-enter` → 1 на пружине `duration-press` + `easing-spring-press` |
| Опция | `size-44`, `space-4`, `radius-full`, `type-body-lg-*`; подсветка — `surface-option-highlighted-bg`; выбранная — галочка `color-accent-default`; отключённая — `color-text-disabled` |

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
| Ручка, заголовок | `size-36` × `space-1`, `color-border-strong`; `type-heading-sm-*` |
| Анимация | выезд снизу `duration-release` + `easing-spring-press`; при reduced motion — только проявление |
| Отступы | `space-2`, `space-4`; снизу — `env(safe-area-inset-bottom)` |

Поведение (Reka Dialog): фокус внутри, Esc и тап по затемнению закрывают, фокус возвращается на элемент, открывший шторку, скролл страницы заблокирован. Смахивания вниз пока нет.

Пропсы: `description` (описание диалога), `closable` (кнопка «Закрыть» в шапке), `initialFocus` (`first` — первый элемент, как у Select; `container` — сама шторка, как у Dialog). Слот `#footer` — действия, закреплены внизу.

## Textarea (`packages/ui/src/components/Textarea/Textarea.vue`)

FormField + Field (`multiline`) + `<textarea>`. `v-model`, `label`, `hint`, `error`, `placeholder`, `disabled`, `rows` (3), `autoResize` (да), `maxRows` (10), `maxlength`, `limitLabel`. В Figma нет — токен-первый.

| Что | Токены |
|---|---|
| Материал, фокус, ошибка, disabled | как у Field (`surface-field-*`), скругление `radius-6` |
| Текст | `type-body-lg-*`, курсор `color-accent-default`, плейсхолдер `color-text-tertiary` |
| Высота | `rows` … `maxRows` × `type-body-lg-line-height` |
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
| Строка | зона касания `size-44`, отступ `space-3`; подпись `type-body-lg-*`, описание/ошибка `type-body-sm-*` |
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
Нативные радио в `<fieldset>`/`<legend>`; `options` (`value`, `label`, `description?`, `disabled?`), `hint`, `error`, `orientation`. Круг `size-24`, токены `surface-control-*` (как Checkbox), точка `space-2` на пружине, строка `size-44`.

### Switch
`<input type="checkbox" role="switch">`, трек `size-52` × `size-32` (`surface-switch-track-off` ≥ 3:1 к фону, `-track-on` — акцент), бегунок `size-24` (`surface-switch-thumb`, `-thumb-shadow`), при нажатии растягивается на `space-2`. Подпись слева, переключатель справа. Для согласий в формах — Checkbox.

### Container / Section / Stack / Grid / Divider
- **Container** — ширина `size-container-{sm,md,lg}` или `full`, поля `layout-gutter` (16 → 40px, `clamp`).
- **Section** — `padding-block: layout-section` (48 → 96px), Container внутри, `tone="subtle"` — плашка `color-surface-subtle`.
- **Stack** — flex с `gap` из шкалы `space-*` (проп — ключ шкалы, не пиксели).
- **Grid** — `auto-fit` с минимальной ячейкой `size-grid-item-{sm,md,lg}`; `columns` — максимум колонок. Без media query.
- **Divider** — `color-border-default`, `stroke-1`; по умолчанию декоративный, `semantic` → `role=separator`.

### Heading / Text
- **Heading** — `level` (h1…h6) и `size` (`hero` / `display` / `lg` / `md` / `sm` → `type-*`) независимы; `hero` — плавный 32 → 64px (`type-hero`, `font-line-height-tight`); `text-wrap: balance`.
- **Text** — `size` (`lg`/`md`/`sm`/`caption`), `tone` (`primary`/`secondary`/`tertiary`/`danger`), `as`.

### Card
Материал `surface-card-{bg,border,shadow,backdrop}`, `radius-6`, `padding` `md` (`space-4`) / `lg` (`space-6`) / `none`. Кликабельная (`as="a" | "button"` / NuxtLink) — `surface-card-hover-bg`, `scale-pressed-surface` на пружине, кольцо фокуса.

### Badge
`color-badge-{neutral,accent,success,warning,danger}-{bg,fg}` (текст ≥ 4.5:1 на плашке — тест токенов), `size-24`, `space-2`, `radius-full`, `type-label-sm-*`, ширина по содержимому; иконка — слот `#start` (`size-16`).

### Avatar
Фото или инициалы (если фото нет или не загрузилось), `size-{32,40,48}`, `color-surface-hover` + `color-text-secondary`. `name` — доступное имя; `decorative` — скрыт, если имя написано рядом.

### Skeleton
`surface-skeleton-{bg,shine}`, блик за `duration-spinner`, без блика при reduced motion. Формы `text` (строки высотой в body/lg) / `rect` / `circle`. Декоративный — `aria-busy` ставит контейнер.

### Accordion
Reka Accordion; `items` (`value`, `title`, `content?`, `disabled?`), `type` single/multiple, `headingLevel`; строка `size-56`, заголовок `type-heading-sm-*`, текст `color-text-secondary`, раскрытие по высоте на пружине, разделители `color-border-default`. Разметка содержимого — слот с именем `value`.

### Tabs
Reka Tabs; сегментированный контрол `surface-segmented-{track,indicator,indicator-border,indicator-shadow}`, плашка активной вкладки перетекает на пружине (`duration-release` + `easing-spring-release`). Вкладка `size-40`, `type-label-md-*`; `stretch` — поровну на всю ширину; иначе — горизонтальная прокрутка. Панель — слот с именем `value`.

### Dialog
`presentation` auto / dialog / sheet (по `breakpoint/md`, SSR — dialog). Окно: `surface-popover-*`, `radius-8`, ширина `size-container-{sm,md}` в пределах полей, `z-index-popover`, затемнение `surface-scrim-*`, появление `scale-popover-enter` на пружине. Шторка — Sheet (`closable`, `initialFocus="container"`). Фокус при открытии — на окно (скринридер читает заголовок, без кольца на «Закрыть»), при закрытии — обратно на кнопку.

### Tooltip
Reka Tooltip: наведение и фокус с клавиатуры, Esc, `aria-describedby`; задержка `duration-slower`, отступ `space-2`; материал `surface-popover-*`, `radius-3`, `type-body-md-*`. На сенсорных экранах не показывается — ничего важного.

### DropdownMenu
Reka DropdownMenu: `items` — действия (`value`, `label`, `icon?`, `danger?`, `disabled?`), `separator`, `label`; событие `select(value)`. Панель и пункты — как у Select (`surface-popover-*`, `surface-option-highlighted-bg`), опасное действие — `color-text-danger`.

### Toast
`<Toaster />` один раз в layout + `useToast().toast({ title, description, tone, action })`. Reka Toast: `danger` — объявляется сразу, остальные — вежливо; таймер `duration-toast` замирает при наведении/фокусе; F8; смахивание вправо. Внизу по центру, ширина узкого контейнера, safe-area; `surface-popover-*`, `radius-6`. `action` требует `altText`.

### Alert
Тонированная плашка `color-badge-<tone>-bg` (info → accent), иконка `color-badge-<tone>-fg`, заголовок `type-label-lg-*`, текст `color-text-secondary` (оба ≥ 4.5:1 на плашке — тест токенов). `live` → `role=alert` (danger/warning) или `status`; `dismissible` → событие `dismiss`; действия — слот `#actions`.

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
