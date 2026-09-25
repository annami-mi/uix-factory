# Токены

Источник истины — код (`packages/tokens/source/`), см. ADR-0003. Figma — авторская поверхность флагманской стилистики; сверка — по выгрузке `source/figma-export/<дата>.json`. Что поправить в Figma — `docs/figma-todo.md`.

## Слои

| Слой | Файл | CSS | Кто ссылается |
|---|---|---|---|
| Примитивы | `source/primitive.json` | `:root` (`dist/base.css`) | темы; компоненты — только для размеров, отступов, типографики, моушна |
| Семантика стилистики | `source/themes/<стилистика>/<схема>.json` → `color/*` | `[data-theme][data-scheme]` | `surface/*` и компоненты |
| Материал компонентов | `source/themes/<стилистика>/<схема>.json` → `surface/*` | `[data-theme][data-scheme]` | компоненты |

**Две оси (ADR-0005):** стилистика `data-theme` (`glass`, `neutral`) × схема `data-scheme` (`light`, `dark`; без атрибута — по `prefers-color-scheme`). Каждая стилистика обязана иметь обе схемы.

Компонент никогда не ссылается на `color/palette/*` или `color/mono/*` напрямую — только на роль. Поэтому новая стилистика или схема = новые файлы тем, без правок компонентов.

## Примитивы (`primitive.json`)

Шкалы 1:1 с Figma collection `primitives`, имена совпадают (`space/4` → `--space-4`).

- `color/mono/*`, `color/palette/*` — исходные цвета. Только для ссылок из тем.
- `space/*` (0–24 → 0–96px), `size/*` (12–64), `breakpoint/md` (768px, только в коде; в JS — `breakpoints` из `@uix/tokens`, т.к. в `@media` нельзя `var()`), `radius/*` (0–8, `full`, `sheet`), `stroke/*` (0–3), `opacity/*` (0–100 → 0–1).
- `blur/*` — **имя = радиус в Figma, значение = CSS**: радиус Figma ≈ 2× CSS `blur()`, поэтому `blur/24` = `12px`. Использовать как `blur({blur.24})`.
- `duration/*` — `instant/fast/normal/slow/slower` из Figma.
- `font/family/sans`, `font/weight/{regular,medium,semibold}`, `font/size/*`, `font/line-height/*`.
- `type/<role>/<size>` — текстовые стили Figma как composite (`display`, `heading/*`, `body/*`, `label/*`, `caption`). В CSS раскладываются на `--type-<role>-<size>-{font-family,font-weight,font-size,line-height}`.

**Только в коде** (помечены в `$description`): `space/px`, `stroke/icon` (1.5px — толщина линии иконок Lucide), `scale/pressed`, `duration/{press,release,spinner,spinner-reduced}`, `easing/spring-*`, `type/label/lg`. В Figma не переносятся автоматически — см. `docs/figma-todo.md`.

## Семантика стилистики (`themes/<стилистика>/<схема>.json` → `color/*`)

Роли 1:1 с Figma collection `semantic`: `background`, `foreground`, `text`, `icon`, `border`, `surface`, `accent`, `status`, `state`.

**Алиас + прозрачность.** В Figma почти все роли — «composed color»: ссылка на другой цвет + alpha (`text/primary` = `foreground/default` @ 0.9). В коде так же:

```json
"primary": { "$type": "color", "$value": "{color.foreground.default}", "$extensions": { "uix.alpha": 0.9 } }
```

Сборка превращает это в `#rrggbbaa`. Смена `foreground` в теме пересчитывает всю лестницу текста/бордеров/поверхностей.

**Отличия от Figma по контрасту (a11y):** `text/tertiary` в glass — 0.55 вместо 0.4 (проходит и на карточке — подписи осей графиков); `text/danger` — непрозрачный цвет для текста ошибок (в Figma red @ 0.4). См. `docs/figma-todo.md`.

**Не переносятся, пока нет потребителя или роли:** `color/glass/*` и `color/glass-border/*` (дубли `surface/*` и `border/*`), `placeholder`. См. `docs/figma-todo.md`.

## Материал компонентов (`themes/<стилистика>/<схема>.json` → `surface/*`)

`surface/<role>/<state>/{bg, border, shadow, backdrop, highlight?}` — ADR-0002/0003.

- `role`: `page`, `accent`, `neutral` (Button), `field` (Field/Input/Select), `popover` (панели Select, Sheet, Dialog, меню, подсказки, уведомления), `option` (опции списка и пункты меню), `scrim` (затемнение под модальной панелью), `control` (флажок, радио: `default`, `hover`, `checked`, `error`, `disabled` — обводка пустого ≥ 3:1 к фону), `switch` (трек и бегунок), `ghost` (кнопка без плашки в покое), `card`, `skeleton`, `segmented` (Tabs). `state`: `default`, `hover`, `pressed`, `disabled`, `loading`; у `field` — `default`, `hover`, `focused`, `error`, `disabled`.
- Значения собираются из ролей `color/*`, в том числе внутри строк: `"0 6px 20px {color.accent.shadow}"`.
- То, что в Figma не привязано к переменным (чёрные drop shadow, внутренний блик, blur r20), остаётся литералом с `$description`.
- `surface/field/focused/ring` — кольцо фокуса поля; `transparent` = фокус только плашкой (сейчас во всех стилистиках).
- Плоская тема подставляет `none`/`transparent` — компонент не меняется (проверяется тестом: все темы определяют одинаковый набор переменных).

### Pressed — по правилам кода, не по макету

Канон Liquid Glass (решения 2026-09-24):

- **Масштаб:** вся кнопка `scale: var(--scale-pressed)` (1.08) на пружине — нажатие `duration/press` + `easing/spring-press` (ζ 0.8), отпускание `duration/release` + `easing/spring-release` (ζ 0.5, лёгкий отскок). Размеры и layout не меняются. При `prefers-reduced-motion` — без масштаба.
- **Материал:** стекло светлеет, а не темнеет: ярче фон и кромка, сильнее цветное свечение, мягче тёмная тень. Цветное стекло светится своим цветом, не белеет.
- **Блик:** `surface/<role>/pressed/highlight` — радиальный свет из точки касания (вспышка `duration/fast`, затухание `duration/release`). В плоской теме — `transparent`.

Семантические `color/accent/pressed`, `glass-border-pressed`, `shadow-pressed` остаются 1:1 с Figma (loading использует два последних); Liquid-значения живут только в `surface/*/pressed`.

## Прочие роли и примитивы базового набора (ADR-0006)

- `color/text/link` — цвет ссылок (≥ 4.5:1 на фоне и плашках; на тёмных схемах светлее акцента).
- `color/badge/<tone>/{bg,fg}` — тонированные плашки Badge и Alert (`neutral`, `accent`, `success`, `warning`, `danger`).
- Раскладка: `size/container/{sm,md,lg}`, `size/grid-item/{sm,md,lg}`, `layout/gutter` (16 → 40, `clamp`), `layout/section` (48 → 96), `breakpoint/md` (768, только для JS).
- Типографика: `type/hero` — плавный 32 → 64px, `font/line-height/tight` (1.1).
- Моушн: `scale/pressed-surface` (0.98, нажатие карточки), `scale/popover-enter` (0.96, появление панелей), `duration/toast` (5 с).
- `z-index/popover`, `radius/sheet`, `stroke/icon` (1.5px).

## Графики (ADR-0007)

Палитра графиков — **токен-first**: фирменная палитра Figma (системные цвета iOS) не проходит валидатор методики (жёлтый вне диапазона светлоты, зелёный/розовый сливаются при дейтеранопии). Эталонная палитра проверена на фонах карточек всех четырёх схем.

- `color/chart/surface` — непрозрачный цвет карточки: кольца точек и зазоры 2px между столбцами/ячейками «вырезают» фон, липкая шапка DataTable.
- `color/chart/series/1…8` — категориальные слоты в **фиксированном порядке** (порядок — механизм различимости при дальтонизме); в тёмной схеме — свои ступени тех же оттенков. Девятого цвета нет: хвост — в «Другое» (`muted`).
- `color/chart/sequential/1…7` — одна синяя шкала для величины (тепловая карта); в тёмной схеме якорь перевёрнут (мало — темнее, ближе к фону).
- `color/chart/status/{good,warning,serious,critical}` — только для состояния (Meter), всегда с иконкой и текстом; не для серий.
- `color/chart/{grid,axis,muted}` — сетка, базовая линия/перекрестье, контекстные серии при выделении — от `foreground` с альфой.
- Примитивы: `size/chart/{sm,md,lg}` (высоты 160/240/320), `size/chart/tick` (72 — мин. шаг делений X), `size/chart/bar` (24 — макс. толщина столбца), `spring/data/{damping,frequency}` (0.86 / 11 — пружина значений, почти без перелёта).

## Тест контраста токенов

`packages/tokens/test/contrast.test.ts` проверяет в каждой комбинации стилистика × схема ключевые пары ролей: текст (primary/secondary/tertiary/danger/link) на фоне страницы и на плашках (поле, карточка, панель, Badge/Alert, сегменты Tabs) ≥ 4.5:1 (в т.ч. `text/tertiary` на карточке — подписи осей); границы и заливки контролов (флажок, переключатель, фокус) ≥ 3:1; первые слоты серий графиков на карточке — ≥ 3:1 (слот 2 — 2.8, компенсируется легендой и таблицей). Полупрозрачные цвета смешиваются с худшим для текста местом фона. Новую роль, на которой лежит текст, — добавить в список пар.

## Сборка

`pnpm build:tokens` (или `node packages/tokens/scripts/build.mjs`; запускается и на `pnpm install`):

- `dist/base.css`, `dist/<стилистика>.css` (light, dark и авто по `prefers-color-scheme`, с `color-scheme`), `dist/index.css` (все вместе), `dist/themes.ts` (`themes`, `schemes` для приложений и Storybook), `dist/tokens.json` (итоговые значения для документации).
- Ссылки `{a.b}` — целиком или внутри строки; цикл или несуществующая ссылка — ошибка сборки.
- `$extensions["uix.alpha"]` — число 0..1, только для hex-цвета.

Тесты (`packages/tokens/test/build.test.ts`): обе схемы у каждой стилистики, авто-схема по `prefers-color-scheme`, нет неразрешённых ссылок/`NaN`, одинаковый набор переменных во всех комбинациях стилистика × схема, alpha и ссылки внутри строк.

## Добавить новую стилистику

1. Скопировать папку `themes/neutral/` в `themes/<имя>/` (`light.json` и `dark.json`), поменять значения (роли не трогать).
2. `pnpm build:tokens` — стилистика появится в toolbar Storybook автоматически.
3. Добавить матрицы `combo("<имя>", "light" | "dark")` в истории компонентов — axe проверит контраст в обеих схемах (текст ≥ 4.5:1, фокус ≥ 3:1 к фону компонента).
