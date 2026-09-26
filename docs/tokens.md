# Токены

Источник истины — код (`packages/tokens/source/`), см. ADR-0003. Figma — авторская поверхность флагманской стилистики; сверка — по выгрузке `source/figma-export/<дата>.json`. Что поправить в Figma — `docs/figma-todo.md`.

## Слои и оси

| Слой | Файл | CSS | Кто ссылается |
|---|---|---|---|
| Примитивы | `source/primitive.json` | `:root` (`dist/base.css`) | темы; компоненты — только для размеров, отступов, типографики, моушна |
| Роли стилистики | `source/themes/<стилистика>/<схема>.json` → `color/*` | `[data-theme][data-scheme]` | `surface/*` и компоненты |
| Материал компонентов | `source/themes/<стилистика>/<схема>.json` → `surface/*` | `[data-theme][data-scheme]` | компоненты |
| Параметры проекта | `source/accent-presets.json`, `@uix/ui/font-pairs/*.css` | `[data-accent]`, `[data-font-pair]` | компоненты через роли `color/spotlight`, `font/*/display` |

**Оси (ADR-0005):** стилистика `data-theme` (`glass`, `neutral`, `bento-contrast`) × схема `data-scheme` (`light`, `dark`; без атрибута — по `prefers-color-scheme`). Каждая стилистика определяет обе схемы; `bento-contrast` пока только светлая — её `dark.json` объявляет псевдоним `"uix.scheme-alias": "light"`, сборка выдаёт светлые токены с `color-scheme: light` (исключение из ADR-0005).

Компонент не ссылается на `color/palette/*` или `color/mono/*` напрямую — только на роль. Новая стилистика или схема — новые файлы тем, без правок компонентов (тест: все комбинации определяют одинаковый набор переменных).

## Примитивы (`primitive.json`)

Шкалы 1:1 с Figma collection `primitives`, имена совпадают (`space/4` → `--space-4`).

- `color/mono/*`, `color/palette/*` — исходные цвета, только для ссылок из тем. Без чистых чёрного и белого в тексте и фонах: `mono/ink` #202227 (графит), `mono/snow` #f1f1f4 (чистые цвета — только в тенях и бликах стекла).
- `space/*` (0–24 → 0–96px), `size/*` (12–64), `breakpoint/m` (768px; в JS — `breakpoints` из `@uix/tokens`, т.к. в `@media` нельзя `var()`), `radius/*` (0–8, `full`, `sheet`), `stroke/*` (0–3), `opacity/*` (0–100 → 0–1).
- `blur/*` — **имя = радиус в Figma, значение = CSS**: радиус Figma ≈ 2× CSS `blur()`, поэтому `blur/24` = `12px`. Использовать как `blur({blur.24})`.
- `duration/*` — `instant/fast/normal/slow/slower` из Figma.
- `type/<role>/<size>` — текстовые стили как composite, в CSS — `--type-<role>-<size>-{font-family,font-weight,font-size,line-height}`. Размеры буквами, `m` — по умолчанию: `body/l` 18/28 (лид), `body/m` 16/24 (основной), `body/s` 14/20 (вторичный, таблицы), `body/xs` 12/16; `label/l` 18/24, `label/m` 16/20 (кнопки), `label/s` 14/16, `label/xs` 12/16; `heading/l · m · s`, `display`, `hero` (плавный 32 → 64px), `caption` 11/14. Основной текст не мельче 16px (размер браузера по умолчанию, iOS не зумит поле ввода).
- **Шрифтовые роли:** `font/family/sans` — текст; `font/family/display` и `font/weight/display` — заголовки, крупные числа (StatTile, центр доната) и кнопки. По умолчанию — Golos Text. Текстовые стили ссылаются на роль переменной (`var(--font-family-display)`, `var(--font-weight-display)`), поэтому шрифтовая пара или стилистика меняют шрифт одной переменной.
- Раскладка: `size/container/{s,m,l}`, `size/grid-item/{s,m,l}`, `layout/gutter` (16 → 40, `clamp`), `layout/section` (48 → 96). Моушн: `scale/pressed` (1.08), `scale/pressed-surface` (0.98), `scale/popover-enter` (0.96), `duration/toast` (5 с). `z-index/popover`, `radius/sheet`, `stroke/icon` (1.5px — толщина линии иконок Lucide).

**Только в коде** (помечены в `$description`): `space/px`, `stroke/icon`, `scale/pressed`, `duration/{press,release,spinner,spinner-reduced}`, `easing/spring-*`, `blur/80`, `type/body/l`, `type/label/l`, `font/*/display`. В Figma не переносятся автоматически — см. `docs/figma-todo.md`.

## Роли стилистики (`color/*`)

Роли 1:1 с Figma collection `semantic`: `background`, `foreground`, `text`, `icon`, `border`, `divider`, `surface`, `accent`, `status`, `state`, `badge`, `chart`, `inverted`.

**Алиас + прозрачность.** В Figma почти все роли — «composed color»: ссылка на другой цвет + alpha. В коде так же:

```json
"primary": { "$type": "color", "$value": "{color.foreground.default}", "$extensions": { "uix.alpha": 0.9 } }
```

Сборка превращает это в `#rrggbbaa`. Смена `foreground` в теме пересчитывает всю лестницу текста, бордеров и поверхностей.

- **Текст:** вторичный заметно тише основного, третичный — у нижней границы 4.5:1 (в том числе на плашках: поле, поле с ошибкой, бейджи). `text/on-accent` — сплошной цвет (альфа на цветной кнопке роняет контраст). `text/link` ≥ 4.5:1 на фоне и плашках.
- `divider` — вспомогательные линии (аккордеон, Divider, меню, строки таблиц, сетка графиков), 6% тона; `border/*` — только рамки контролов.
- `badge/<tone>/{bg,fg}` — тонированные плашки Badge и Alert.
- `inverted/{text-primary,text-secondary,text-tertiary,muted,success,danger}` — содержимое инвертированной плашки (`Card tone="inverted"`).
- **Отличия от Figma по контрасту (a11y):** `text/tertiary` плотнее, `text/danger` — непрозрачный цвет для текста ошибок. См. `docs/figma-todo.md`.
- **Не переносятся, пока нет потребителя:** `color/glass/*` и `color/glass-border/*` (дубли `surface/*` и `border/*`), `placeholder`.

## Материал компонентов (`surface/*`)

`surface/<role>/<state>/{bg, border, shadow, backdrop, highlight?}` — ADR-0002/0003.

- `role`: `page`, `accent` и `neutral` (Button), `ghost`, `field` (Field/Input/Select), `popover` (Select, Sheet, Dialog, меню, подсказки, Toast), `option`, `scrim`, `control` (флажок, радио), `switch`, `card` (+ `radius`), `inverted` (инвертированная плашка), `skeleton`, `segmented` (Tabs), `table` (DataTable), `calendar` (Calendar). `state`: `default`, `hover`, `pressed`, `disabled`, `loading`; у `field` — `default`, `hover`, `focused`, `error`, `disabled`.
- Значения собираются из ролей `color/*`, в том числе внутри строк: `"0 6px 20px {color.accent.shadow}"`. То, что в Figma не привязано к переменным, — литерал с `$description`.
- Плоская тема подставляет `none`/`transparent` — компонент не меняется.
- **Всплывающие панели** (`popover`) — «толстое» стекло: полупрозрачная заливка, `blur({blur.80}) saturate(180%)`; подложка угадывается цветом, но не читается.
- **Таблица** (`table`): липкая шапка почти в цвет страницы, наведение — 3–4% тона, выбранная строка — лёгкий оттенок акцента; без «зебры». **Календарь** (`calendar/{range,preview}`) — полоса диапазона оттенком акцента.
- `field/focused/ring` — кольцо фокуса поля; `transparent` = фокус виден по плашке.

### Pressed — по правилам кода (канон Liquid Glass)

- **Масштаб:** вся кнопка `scale: var(--scale-pressed)` на пружине — нажатие `duration/press` + `easing/spring-press` (ζ 0.8), отпускание `duration/release` + `easing/spring-release` (ζ 0.5). Размеры и раскладка не меняются; при `prefers-reduced-motion` — без масштаба.
- **Материал:** стекло светлеет, а не темнеет; цветное стекло светится своим цветом. Кромки стекла — еле заметный блик, не обводка.
- **Блик:** `surface/<role>/pressed/highlight` — радиальный свет из точки касания. В плоских темах — `transparent`.

Семантические `color/accent/pressed`, `glass-border-pressed`, `shadow-pressed` — 1:1 с Figma; значения Liquid Glass живут только в `surface/*/pressed`.

## Стилистики

- **glass** — Liquid Glass, флагман из Figma: полупрозрачные плашки с кромкой и тенью, blur. Уместна в маркетинговом и декоративном контексте (ADR-0008 §1.3).
- **neutral** — плоская: полупрозрачные плашки без бордеров, blur и теней.
- **bento-contrast** (ADR-0008, паспорт — `docs/reference-library.md`) — светлая bento-сетка: страница `#eff0f3`, белые карточки без рамки и тени, `surface/card/radius` = 32px; акцент чёрный `#141417` (главные кнопки, выбранное, отмеченное), фокус и ссылки — синие; инвертированные плашки чёрные; выделение встроенных графиков — чёрное на белом, spotlight на чёрном.

## Параметры проекта (LookRecipe, ADR-0008)

**Цвет-хайлайт (`accentColor`).** `source/accent-presets.json` → `dist/accentPresets.ts` (`accentPresets`, `accentPlate`) и `dist/accent-presets.css`: `--color-spotlight` / `--color-on-spotlight`, по умолчанию `volt-lime`, другой — `data-accent="<пресет>"` на `<html>`. Пресеты: `volt-lime`, `electric-blue`, `lavender`, `coral-signal`, `signal-green`, `magenta-pop` — пары `{ accent, onAccent }`; подпись белая у `electric-blue` и `lavender`, у остальных тёмная. Тест: подпись на чипе ≥ 4.5:1, чип на тёмной плашке ≥ 3:1. Применяется в Badge `tone="spotlight"`, активном пункте SidebarPanel, выделении графиков на инвертированной плашке.

**Шрифтовая пара (`fontPair`).** `@uix/ui/font-pairs/<пара>.css` (после `@uix/ui/styles.css`) + `data-font-pair="<пара>"` на `<html>`; грузятся только шрифты своей пары. Пары: `unbounded-inter`, `onest-golos`, `rubik-inter`, `manrope-inter` и `montserrat-inter` (заголовки и числа ExtraBold), `raleway-inter` (Bold, ровные цифры `lining-nums`). Кириллица каждой пары проверена по таблицам глифов (алфавит, ё/Ё, «», —, №, ₽).

## Графики (ADR-0007)

Палитра графиков — токен-first: палитра Figma (системные цвета iOS) не проходит проверку различимости при дальтонизме. Эталонная палитра проверена на фонах карточек всех схем.

- `color/chart/surface` — непрозрачный цвет карточки: кольца точек и зазоры 2px «вырезают» фон.
- `color/chart/series/1…8` — категориальные слоты в **фиксированном порядке** (порядок — механизм различимости); в тёмной схеме — свои ступени тех же оттенков. Девятого цвета нет: хвост — в «Другое» (`muted`).
- `color/chart/sequential/1…7` — одна синяя шкала величины; в тёмной схеме якорь перевёрнут.
- `color/chart/status/{good,warning,serious,critical}` — только для состояния (Meter), с иконкой и текстом.
- `color/chart/{grid,axis,muted}` — сетка, базовая линия, контекстные серии; `color/chart/highlight` — выделенная метка встроенного графика.
- Примитивы: `size/chart/{s,m,l}` (160/240/320), `size/chart/tick` (72), `size/chart/bar` (24), `spring/data/{damping,frequency}` (0.86 / 11).

## Тест контраста

`packages/tokens/test/contrast.test.ts` проверяет в каждой комбинации стилистика × схема ключевые пары: текст (primary/secondary/tertiary/danger/link, текст инвертированной плашки) на фоне страницы и на плашках (поле, поле с ошибкой, карточка, панель, Badge/Alert, сегменты Tabs, календарь) ≥ 4.5:1; границы и заливки контролов, фокус, выделение графика ≥ 3:1; первые слоты серий на карточке ≥ 3:1 (слот 2 — 2.8, компенсируется легендой и таблицей); акцент-пресеты. Полупрозрачные цвета смешиваются с худшим для текста местом фона. Новую роль, на которой лежит текст, — добавить в список пар.

## Сборка

`pnpm build:tokens` (или `node packages/tokens/scripts/build.mjs`; запускается и на `pnpm install`):

- `dist/base.css`, `dist/<стилистика>.css` (light, dark и авто по `prefers-color-scheme`, с `color-scheme`), `dist/accent-presets.css`, `dist/index.css` (всё вместе), `dist/themes.ts`, `dist/constants.ts`, `dist/accentPresets.ts`, `dist/tokens.json` (итоговые значения для документации).
- Ссылки `{a.b}` — целиком или внутри строки; цикл или несуществующая ссылка — ошибка сборки. `$extensions["uix.alpha"]` — число 0..1, только для hex-цвета; `"uix.scheme-alias"` — схема-псевдоним.

Тесты (`packages/tokens/test/build.test.ts`): обе схемы у каждой стилистики, авто-схема, нет неразрешённых ссылок, одинаковый набор переменных во всех комбинациях, alpha и ссылки внутри строк.

## Добавить новую стилистику

1. Скопировать `themes/neutral/` в `themes/<имя>/` (`light.json`, `dark.json`), поменять значения (роли не трогать).
2. `pnpm build:tokens` — стилистика появится в тулбаре Storybook.
3. Добавить комбинацию в `themeMatrix` (`packages/ui/.storybook/story-helpers.ts`) и экспорт матриц в истории — axe проверит контраст каждого компонента.
