# UIX Factory

Кит Vue-компонентов для быстрой сборки коммерческих веб-продуктов: лендинги → сайты → магазины → SaaS. Компоненты пишутся один раз; визуальную индивидуальность продукта задаёт **стилистика** — набор значений токенов.

**Storybook:** https://annami-mi.github.io/uix-factory/

- Две стилистики — «Жидкое стекло» (`glass`, канон Liquid Glass) и плоская `neutral`, каждая в светлой и тёмной схеме (`data-theme` × `data-scheme`).
- Mobile-first: шторки на телефоне, всплывашки на десктопе, зоны касания ≥ 44px, раскладка без media query.
- Доступность как тест: каждая история Storybook — тест с axe во всех стилистиках и схемах; контраст токенов проверяется отдельно.

## Пакеты

| Пакет | Что внутри |
|---|---|
| `@uix/tokens` | DTCG JSON → CSS-переменные (`dist/*.css`), списки тем и брейкпоинтов для JS |
| `@uix/ui` | Vue 3 компоненты (Reka UI для сложного поведения), базовые стили, шрифт Golos Text |
| `@uix/charts` | Графики и KPI для SaaS: свои SVG-компоненты на Vue + математика d3, пружинная анимация, табличный двойник (ADR-0007) |

## Подключение

```ts
import "@uix/ui/styles.css"; // слои каскада, токены всех тем, шрифт
import { Button, Toaster } from "@uix/ui";
```

```html
<html data-theme="glass" data-scheme="dark">  <!-- без data-scheme — по настройке системы -->
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
- `docs/decisions/` — ADR (стек, стилизация, токены и Figma, стилистики × схемы, базовый набор)
- `docs/figma-code.md`, `docs/figma-todo.md` — связь с макетом Figma и что в нём поправить
- `docs/roadmap.md` — план
