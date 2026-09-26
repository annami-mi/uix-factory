# Что поправить в Figma

Правки макета, чтобы Figma совпадала с кодом. Код — источник истины (ADR-0003); здесь то, что нужно перенести обратно вручную. Отмечать `[x]` по мере правки и обновлять выгрузку (`packages/tokens/source/figma-export/`). Значения — в `packages/tokens/source/`, вид — в Storybook.

Файл: "Untitled", fileKey `QCBbAcSPGMcK3IYk9ay6tE`.

## Типографика

- [ ] **Шкала текста — размеры буквами `xs · s · m · l`, `m` — основной.** Figma → код: `body/lg` 16/24 → `body/m`; `body/md` 14/20 → `body/s`; `body/sm` 12/16 → `body/xs`; `label/md` 14/16 → `label/s`; `label/sm` 12/16 → `label/xs`; `heading/lg · md · sm` → `heading/l · m · s`. Добавить `body/l` 18/28, `label/l` 18/24 и `label/m` 16/20 Medium.
- [ ] **Стиль `hero`** — плавный 32 → 64, SemiBold, межстрочный 1.1 — для первого экрана.
- [ ] **Шрифтовые роли** `display` (заголовки, крупные числа, кнопки) и `sans` (текст); шрифтовые пары проекта — `docs/tokens.md`.

## Button и IconButton

- [ ] **Лейбл** — `label/m` 16/20 Medium вместо `label/md` 14/16; нижний отступ +1px (оптическая компенсация, `space/px`).
- [ ] **Размеры** `s` 40 (`label/s`, иконка 16), `m` 48, `l` 56 (`label/l`, иконка 24).
- [ ] **Pressed (Liquid Glass)** — вместо «роста» 48→56 и затемнения:
  - размеры как у default, в прототипе — smart animate со spring, масштаб 1.08;
  - primary: фон `#0A84FF` @ 90%, inner shadow white @ 14% (0 1 4), drop shadow `#007AFF` @ 40% (0 8 28) и black @ 22% (0 12 32), blur 24;
  - secondary: фон white @ 16%, inner shadow white @ 20% (0 1 0), drop shadow black @ 25% (0 12 32), blur 24;
  - блик — радиальный градиент из точки касания: primary `#5AC8FF` @ 35%, secondary white @ 16%.
- [ ] **Кромки стекла** — `accent/glass-border` dark 0.10 / 0.14 / 0.07 (default / hover / pressed), light 0.18 / 0.24 / 0.14; secondary dark `#ffffff17`, light `#ffffff66` (hover `#ffffff80`, pressed `#ffffff99`).
- [ ] **Вариант ghost** — без плашки в покое, плашка при наведении (`surface/ghost/*`).
- [ ] **Иконки** — Lucide, линия 1.5 (`stroke/icon`); слоты `send` слева/справа; отступ иконка–лейбл `space/2` (8) вместо 10.
- [ ] **IconButton** — круг 48 (размеры `s`/`l` как у Button), иконка 24; варианты primary/secondary/ghost; переименовать `state=state11`.
- [ ] **Motion-переменные** (для прототипов): `duration/press` 300, `duration/release` 650, `scale/pressed` 1.08.

## Поля

- [ ] **Input: текст 16px** (`body/m`) — iOS Safari зумит страницу при фокусе на поле с текстом меньше 16px.
- [ ] **Input: loading** — поле только для чтения, значение `text/secondary` (не `text/disabled`: поле активно, значение должно читаться).
- [ ] **Select: раскрытый список** — десктоп: стеклянная всплывашка (радиус 24, опции-капсулы 44, галочка цвета акцента); мобильный: шторка снизу (Sheet).
- [ ] **Бордер поля** — `glass-border/subtle` (white @ 8%) почти не виден; WCAG 1.4.11 хочет ≥ 3:1 для границы поля. Решить на уровне стилистики.

## Цвет и тон

- [ ] **Без чистых чёрного/белого** — завести `mono/ink` #202227 и `mono/snow` #f1f1f4; `foreground` glass light → ink, glass dark → snow; фон glass dark `#141417`; neutral: текст `#202227` / `#e8e8ec`, фон dark `#161619`; затемнения — ink.
- [ ] **Текст** — glass dark: secondary 0.62, tertiary 0.55, `text/on-accent` — сплошной snow; glass light: secondary 0.74, tertiary 0.68. `text/danger` — непрозрачный `#FF5A5D` (в макете red @ 0.4 — мало контраста), привязать к error-подписи и hint.
- [ ] **Разделители** — роль `color/divider` (foreground 6%) для линий аккордеона, меню, таблиц и сетки графиков.
- [ ] **Стекло всплывающих панелей** — заливка `#232325` @ 68% (dark) / white @ 66% (light), blur r80 + насыщение 180%.
- [ ] **Ссылки** — `text/link` (`#5EB0FF` на тёмном стекле: акцент как текст не проходит контраст), подчёркивание.

## Нарисовать (есть в коде, нет в макете)

- [ ] **Формы:** Textarea (материал поля, скругление 24, счётчик символов), Checkbox и CheckboxGroup, RadioGroup (в том числе плитки `tiles`), Switch — роли `surface/control/*`, `surface/switch/*`.
- [ ] **Контент и оверлеи:** Card (+ инвертированная плашка `surface/inverted/*`), Badge (+ тон spotlight), Avatar, Skeleton, Accordion, Tabs (`surface/segmented/*`), Dialog (радиус 32), Sheet (ручка, радиус 32 сверху), Tooltip, DropdownMenu, Toast, Alert.
- [ ] **Навигация:** Breadcrumbs, Pagination, NumberField; AppShell, SidebarPanel, SidebarRail, мобильная таб-панель.
- [ ] **Данные:** DataTable (`surface/table/*`), Calendar и DatePicker (`surface/calendar/*`; всплывашка с пресетами и двумя месяцами, шторка с лентой месяцев), PeriodSelect.
- [ ] **Раскладка** — контейнеры 640/960/1200, поля 16 → 40, отступ секций 48 → 96.

## Стилистики и схемы

- [ ] **glass light и neutral dark** — в Figma нет (Starter без modes). При переходе на тариф с modes — завести mode `light`/`dark` для semantic-коллекции.
- [ ] **bento-contrast** (только светлая) — страница `#eff0f3`, белые карточки радиуса 32, акцент `#141417`, текст `#141417` / `#60626b` / `#63656c`, синий фокус; роли `surface/inverted/*`, `color/inverted/*`, `color/chart/highlight`, `surface/card/radius`; цвет-хайлайт — акцент-пресеты.

## Графики

- [ ] **Палитра графиков** — переменные `color/chart/series/1…8`, `sequential/1…7`, `status/*`, `grid`/`axis`/`muted`/`highlight`, `surface` по значениям из кода. Текущую `color/chart/*` на системных цветах iOS не использовать: не проходит проверку различимости при дальтонизме. Порядок слотов не менять.

## Чистка переменных

- [ ] **Удалить `placeholder`** — строковая переменная без роли.
- [ ] **Дубли `color/glass/*` и `color/surface/*`** — оставить `color/surface/*`.
- [ ] **Дубли `color/glass-border/*` и `color/border/*`** — оставить `color/border/*` (strong: 0.2 vs 0.24 — выбрать одно); `glass-border/subtle` в field привязать к `border/subtle`.
- [ ] **Бордер secondary** — white @ 18% без семантической роли; привязать или завести роль.
- [ ] **Фон стилистики** — `color/background/default` = чёрный, а у фрейма непривязанный градиент `#272727 → #252121`; привязать фрейм к переменной.
- [ ] **Field error / disabled** — бордер `#FF373B` @ 45%, фон white @ 2%, бордер white @ 6% не привязаны; завести роли или привязать.
- [ ] **Шеврон Select** — залит `#FAFAFA` без роли; привязать к `color/icon/secondary`.

## Эффекты и нейминг

- [ ] **Blur accent-кнопки default = 20** — вне шкалы `blur/*`; привязать к `blur/24` или добавить `blur/20`.
- [ ] **Тени Button не привязаны к стилям эффектов** — привязать к `effect/glass/*` или завести отдельные стили.
- [ ] **Drop shadow disabled primary `#0088FF` @ 3%** — не из палитры (`palette/blue` = `#007AFF`).
- [ ] **Порядок свойств в именах вариантов** — унифицировать (`type=…, size=…, state=…`).
