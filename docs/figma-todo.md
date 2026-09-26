# Что поправить в Figma

Список правок макета, чтобы Figma совпадала с кодом. Код — источник истины (ADR-0003); здесь то, что нужно перенести обратно вручную. Отмечать `[x]` по мере правки и обновлять выгрузку (`packages/tokens/source/figma-export/<дата>.json`).

Файл: "Untitled", fileKey `QCBbAcSPGMcK3IYk9ay6tE`. Составлено по выгрузке 2026-09-24.

## Решения из кода, которых нет в макете

- [ ] **Текстовый стиль `label/lg`** — Golos Text Medium 16/20 (`font/size/16`, `font/line-height/20`). Используется в Button.
- [ ] **Button: лейбл** — перевести варианты `button` с `label/md` на `label/lg`.
- [ ] **Button: нижний отступ +1px** — оптическая компенсация лейбла (в коде `space/px`).
- [ ] **Button: pressed (Liquid Glass)** — вместо «роста» 48→56 и затемнения:
  - размеры как у default (48, padding 16), в прототипе — smart animate со spring, масштаб 1.08;
  - primary: фон `#0A84FF` @ 90%, бордер white @ 24%, inner shadow white @ 14% (0 1 4), drop shadow `#007AFF` @ 40% (0 8 28) и black @ 22% (0 12 32), blur 24;
  - secondary: фон white @ 16%, бордер white @ 30%, inner shadow white @ 20% (0 1 0), drop shadow black @ 25% (0 12 32), blur 24;
  - блик — радиальный градиент из точки касания: primary `#5AC8FF` @ 35%, secondary white @ 16%.
- [ ] **Иконки в Button** — библиотека Lucide; включить слоты `send` слева/справа как пример. Сверить толщину линии иконок с Lucide (по умолчанию 2px).
- [ ] **Отступ иконка–лейбл** — в `content` gap 10 → `space/2` (8), 10 нет в шкале.
- [ ] **Motion-переменные** (по желанию, для прототипов): `duration/press` 300, `duration/release` 650, `scale/pressed` 1.08.

- [x] **Field/Input: фокус** — решено оставить как в макете: без обводки, фокус виден по более светлой плашке (`surface/hover`) и курсору цвета акцента. Кольцо — токен `surface/field/focused/ring`, в glass прозрачное.
- [ ] **Input: текст 16px** — в коде `body/lg` (16/24) вместо `body/md` (14/20): iOS Safari зумит страницу при фокусе на поле с текстом < 16px. Перевести `field content` на `body/lg`.
- [ ] **Input: loading = только чтение** — в коде поле в loading не редактируется (`readonly`). Текст значения — `text/secondary`, а не `text/disabled` как в макете: поле активно, значение должно читаться (axe). Подтвердить и поправить макет.
- [ ] **Иконки** — в коде Lucide с толщиной линии 1.5 (`stroke/icon`) вместо 2; `Search`/`X` в поле в контейнере 24×24. Сверить с Hicon в макете.

## Контраст (a11y, решения 2026-09-24)

- [ ] **`color/text/tertiary` 0.4 → 0.55** — на фоне стилистики 0.4 даёт 3.6:1 (hint не проходит axe, нужно ≥ 4.5); 0.55 проходит и на фоне, и на карточке (подписи осей графиков). В коде уже 0.55.
- [ ] **`color/text/danger`** — для текста ошибки (подпись, hint) в коде `#FF5A5D` (4.9:1); `status/danger` `#FF373B` даёт 4.3:1. Завести в Figma `text/danger` = `#FF5A5D` (сейчас там red @ 0.4) и привязать к error-подписи и hint.
- [ ] **Бордер поля — контраст** — `color/glass-border/subtle` (white @ 8%) почти не виден; WCAG 1.4.11 хочет ≥ 3:1 для границы поля (частично компенсирует заливка). Решить на уровне стилистики.

- [ ] **Select: раскрытый список** — в макете только поле с шевроном (state=opened). В коде: на десктопе — всплывашка (стеклянная панель: материал `effect/glass/strong`, радиус 24, опции-капсулы 44, галочка цвета акцента), на мобильном — шторка снизу (Sheet). Нарисовать оба варианта.
- [ ] **Sheet** — новый компонент (шторка снизу: ручка, заголовок `heading/sm`, радиус 32 сверху, затемнение). Нарисовать.

- [ ] **Textarea** — нет в макете. В коде: материал поля (`surface/field/*`), скругление 24 вместо капсулы, рост по содержимому, счётчик символов справа от подсказки. Нарисовать.
- [ ] **Checkbox** — нет в макете. В коде: квадрат 24, скругление 8, пустой — плашка с обводкой (≥ 3:1 к фону), отмеченный — акцент + галочка, частично — черта. Нарисовать и завести переменные `surface/control/*`.

## Базовый набор (ADR-0006) — нарисовать

Все компоненты ниже в коде уже есть (токен-первые); значения — в `packages/tokens/source/themes/glass/dark.json`, вид — в Storybook.

- [ ] **Button: вариант ghost** — без плашки в покое, плашка `surface/hover` при наведении (`surface/ghost/*`).
- [ ] **IconButton** — ряд в Figma есть; сверить с кодом (круг 48, иконка 24, варианты primary/secondary/ghost) и переименовать `state=state11`.
- [ ] **Link** — цвет `text/link` (`#5EB0FF` на тёмном стекле: акцент как текст не проходит контраст), подчёркивание.
- [ ] **RadioGroup, Switch** — пара к Checkbox (`surface/control/*`, `surface/switch/*`).
- [ ] **Переименовать шкалу текста (2026-09-25): размеры буквами `xs · s · m · l`, `m` — основной.** Figma → код: `body/lg` 16/24 → `body/m`; `body/md` 14/20 → `body/s`; `body/sm` 12/16 → `body/xs`; `label/md` 14/16 → `label/s`; `label/sm` 12/16 → `label/xs`; `heading/lg · md · sm` → `heading/l · m · s`. Добавить `body/l` 18/28 и `label/l` 18/24; `label/m` = 16/20 Medium (в Figma label/lg нет). Размеры кнопок — `s · m · l`, контейнеры и сетка — `size/container/s · m · l`, `size/grid-item/s · m · l`.
- [ ] **Типографика** — стиль `hero` (плавный 32 → 64, SemiBold, межстрочный 1.1) для первого экрана.
- [ ] **Card, Badge, Avatar, Skeleton** — `surface/card/*` (материал `effect/glass/default`), `color/badge/*`, `surface/skeleton/*`.
- [ ] **Accordion, Tabs** — FAQ; сегментированный контрол (`surface/segmented/*`).
- [ ] **Dialog, Tooltip, DropdownMenu, Toast, Alert** — окно (радиус 32), подсказка, меню, уведомление, сообщение в потоке.
- [ ] **Breadcrumbs, Pagination, NumberField** — навигация каталога, степпер количества.
- [ ] **Раскладка** — сетка страницы: контейнеры 640/960/1200, поля 16 → 40, отступ секций 48 → 96.

## Схемы (ADR-0005)

- [ ] **Светлая схема стекла и тёмная neutral** — в Figma нет (Starter без modes); в коде токен-first: `glass/light` (белое стекло, акцент `#0060CC` — iOS-синий `#007AFF` на светлом даёт белому лейблу 4.0:1), `neutral/dark`. При переходе на тариф с modes — завести mode `light`/`dark` для semantic-коллекции.

## Чистка переменных

- [ ] **Удалить `placeholder`** — строковая переменная без роли.
- [ ] **`color/text/danger`** — сейчас red @ 40%: для текста слишком низкий контраст. Сделать непрозрачным (= `color/status/danger`) или удалить.
- [ ] **Дубли `color/glass/*` и `color/surface/*`** (subtle 0.03, default 0.06 совпадают) — оставить одно семейство (`color/surface/*`).
- [ ] **Дубли `color/glass-border/*` и `color/border/*`** — оставить `color/border/*` (strong: 0.2 vs 0.24 — выбрать одно).
- [ ] **Бордер secondary** — в компоненте white @ 18% (как `accent/glass-border`), семантической роли с 0.18 нет. Привязать к `color/border/default` (0.14) или завести роль.
- [ ] **Фон стилистики** — `color/background/default` = чёрный, а у фрейма непривязанный градиент `#272727 → #252121`. Решить, что из них фон, и привязать фрейм к переменной (в коде сейчас градиент).

- [ ] **Field error** — бордер `#FF373B` @ 45% не привязан (в коде `status/danger` + alpha 0.45). Привязать или завести роль.
- [ ] **Field disabled** — фон white @ 2% и бордер white @ 6% не привязаны. Завести роли или привязать к существующим.
- [ ] **Шеврон Select** — залит `#FAFAFA` (тот самый «White» без роли из аудита); привязать к `color/icon/secondary`.
- [ ] **`color/glass-border/subtle`** используется в field — после чистки дублей привязать к `color/border/subtle`.

## Тон (2026-09-25)

- [ ] **Без чистых чёрного/белого** — завести `mono/ink` #202227 и `mono/snow` #f1f1f4; `foreground` glass light → ink, glass dark → snow, фон glass dark #000 → #141417; neutral: текст #202227 / #e8e8ec, фон dark #161619; затемнения (scrim) — ink.
- [ ] **Иерархия текста** — glass light secondary 0.72 → 0.74, tertiary 0.6 → 0.66 (на графите нужна плотнее); glass dark secondary 0.6 → 0.62; `text/on-accent` glass dark — сплошной snow.
- [ ] **Кромки кнопок стекла ≈ вдвое тише** — `accent/glass-border` light 0.35/0.45/0.25 → 0.18/0.24/0.14, dark 0.18/0.24/0.12 → 0.10/0.14/0.07; secondary (neutral) light #fffc → #fff6 (hover #fff8, pressed #fff9), dark #fff2e → #fff17.
- [ ] **Таблица** — роли `surface/table/*` (шапка, наведение, выбор) — в Figma нет.
- [ ] **Разделители** — роль `color/divider` (foreground 6%) для линий аккордеона, меню, таблиц и сетки графиков; в Figma сейчас border/default (10–14%).
- [ ] **Стекло всплывашек** — `effect/glass/strong` для меню/списков: заливка #232325 @ 68% / #fff @ 66%, blur r80 (CSS 40px) + насыщение 180%; в Figma — 80% и r48.
- [ ] **Стилистика bento-contrast** (только светлая) — токен-first: страница `#eff0f3`, белые карточки радиуса 32, чёрный акцент `#141417`, текст `#141417` / `#60626b` / `#63656c`, синий фокус; роли `surface/inverted/*`, `color/inverted/*`, `color/chart/highlight`, `surface/card/radius`; spotlight — акцент-пресеты.
- [ ] **Календарь / DatePicker** — в Figma нет: роли `surface/calendar/range` и `preview`, раскладки (всплывашка с пресетами и двумя месяцами, шторка с лентой месяцев).
- [ ] **Button: размеры `sm` (40, label/sm, иконка 16) и `lg` (56, label/lg, иконка 24)** — в Figma только 48.

## Графики (ADR-0007, токен-first)

- [ ] **Палитра графиков** — завести в Figma переменные `color/chart/series/1…8`, `sequential/1…7`, `status/*`, `grid`/`axis`/`muted`, `surface` по значениям из кода (`packages/tokens/source/themes/*`). Текущую `color/chart/*` на системных цветах iOS не использовать: не проходит проверку различимости при дальтонизме. Порядок слотов не менять — он часть проверки.

## Эффекты

- [ ] **Blur accent-кнопки default = 20** — вне шкалы `blur/*` (12, 16, 24). Hover/pressed используют 24. Привязать к `blur/24` или добавить `blur/20`.
- [ ] **Тени Button не привязаны к стилям эффектов** — например, disabled secondary (inner 0.04, drop 0 4 12 @ 0.16) почти совпадает с `effect/glass/subtle` (0.06 / 0.2). Либо привязать, либо завести отдельные стили.
- [ ] **Цвет drop shadow disabled primary `#0088FF` @ 3%** — не из палитры (`palette/blue` = `#007AFF`).

## Нейминг (из аудита)

- [ ] **IconButton `state=state11`** — переименовать в реальное состояние.
- [ ] **Порядок свойств в именах вариантов** — унифицировать (`type=…, size=…, state=…`).
