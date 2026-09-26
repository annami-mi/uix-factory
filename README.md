# UIX Factory

Кит Vue-компонентов для быстрой сборки коммерческих веб-продуктов: лендинги → сайты → магазины → SaaS. Компоненты пишутся один раз; визуальную индивидуальность продукта задаёт **стилистика** — набор значений токенов.

**Storybook:** https://annami-mi.github.io/uix-factory/

- Стилистики — «Жидкое стекло» (`glass`, канон Liquid Glass), плоская `neutral` и `bento-contrast` (светлая bento-сетка с чёрными плашками); светлая и тёмная схема (`data-theme` × `data-scheme`, у bento пока только светлая).
- Параметры проекта поверх стилистики: цвет-хайлайт (`data-accent`, 6 пресетов) и шрифтовая пара (`data-font-pair`, 6 пар с проверенной кириллицей).
- Mobile-first: шторки на телефоне, всплывашки на десктопе, зоны касания ≥ 44px, раскладка без media query.
- Доступность как тест: каждая история Storybook — тест с axe во всех стилистиках и схемах; контраст токенов проверяется отдельно.

## Пакеты

| Пакет | Что внутри |
|---|---|
| `@uix/tokens` | DTCG JSON → CSS-переменные (`dist/*.css`), списки тем и брейкпоинтов для JS |
| `@uix/ui` | Vue 3 компоненты (Reka UI для сложного поведения), паттерны каркаса приложения (AppShell, сайдбары), базовые стили, шрифт Golos Text и шрифтовые пары |
| `@uix/charts` | Графики и KPI для SaaS: свои SVG-компоненты на Vue + математика d3, пружинная анимация, табличный двойник (ADR-0007) |
| `mi-kit` | Всё вышеперечисленное одним пакетом для проектов: собранный JS, CSS со шрифтами, типы (`packages/kit`, ADR-0004) |

`@uix/*` — внутренние пакеты монорепо, раздаются исходниками. В проекты уходит `mi-kit`.

## Подключение

```sh
pnpm build:kit                              # собрать packages/kit/dist
cd packages/kit && pnpm pack                # → mi-kit-<версия>.tgz
npm i ../uix-factory/packages/kit/mi-kit-0.1.0.tgz  # в проекте: из архива (или из реестра, когда он будет)
```

```ts
import "mi-kit/styles.css"; // слои каскада, токены всех тем, шрифт — один раз в точке входа
import "mi-kit/font-pairs/rubik-inter.css"; // по желанию: шрифтовая пара проекта
import { Button, Toaster } from "mi-kit";
import { LineChart, StatTile } from "mi-kit/charts";
import { themes, accentPresets } from "mi-kit/tokens";
```

Нужен `vue` ^3.5 в проекте (peer-зависимость); Reka UI, Lucide и d3 ставятся вместе с китом. Стили кита лежат в `@layer` — CSS приложения без слоя их перебивает; свои сбросы и переопределения лучше класть в `@layer overrides`.

```html
<!-- без data-scheme — по настройке системы; data-accent и data-font-pair — по желанию -->
<html data-theme="bento-contrast" data-scheme="light" data-accent="volt-lime" data-font-pair="rubik-inter">
```

## Разработка

Нужны Node 22.12+ и corepack (`corepack enable` — pnpm нужной версии подтянется сам).

```sh
pnpm install          # установка + сборка токенов
pnpm storybook        # http://localhost:6006
pnpm test             # тесты токенов, компонентов и историй (нужен Chromium: pnpm --filter @uix/ui exec playwright install chromium)
pnpm lint && pnpm typecheck
```

## Документация

- `docs/tokens.md` — слои токенов, роли, тест контраста
- `docs/components.md` — компоненты и токены, которые они используют
- `docs/decisions/` — ADR (стек, стилизация, токены и Figma, стилистики × схемы, базовый набор, графики, каталог паттернов и Look Recipe)
- `docs/figma-code.md`, `docs/figma-todo.md` — связь с макетом Figma и что в нём поправить
- `docs/roadmap.md` — план
