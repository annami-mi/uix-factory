# Промпт для Claude Code — этап 3

Скопируй в Claude Code целиком. Проект уже лежит на диске в `/Users/annami/Documents/development/uix-factory` — запускай Claude Code прямо в этой папке, ничего распаковывать не нужно.

---

Ты работаешь в репозитории `uix-factory` — производственной системе для сборки коммерческих веб-продуктов (лендинги → сайты → магазины → SaaS) на Vue. Прежде чем что-либо писать, прочитай полностью:

1. `CLAUDE.md` — цель, стек, архитектурные правила, naming, требования к проверке.
2. `docs/decisions/0001-repo-structure-and-stack.md`
3. `docs/decisions/0002-styling-approach.md`
4. `docs/decisions/0003-tokens-source-of-truth-and-figma-workflow.md`
5. `docs/decisions/0004-distribution-and-per-style-packages.md` — как кит будет подключаться к клиентским проектам (`file:`/git-зависимость, сборка в дистрибутив с первого клиента) и почему сейчас НЕТ отдельных npm-пакетов на каждую стилистику (важно для пункта 3 ниже: тема переключается токенами, а не сменой пакета).
6. `docs/audit.md` — что именно взято из Figma и какие там найдены проблемы (особенно раздел про отсутствие focus-обводки у Input, неподтверждённые значения blur и раздел про frame 128:738 — glass nav-тайлы с пустыми переменными).
7. `docs/roadmap.md` — общий план, ты выполняешь шаг 3 (и начало шага 7).

## Что уже есть в репозитории (черновик, не эталон)

В `packages/tokens` и `packages/ui` уже лежит черновой скелет: source-токены (`packages/tokens/source/*.json`), скрипт сборки в CSS (`packages/tokens/scripts/build.mjs`, уже отрабатывает — можешь запустить `node scripts/build.mjs` внутри `packages/tokens` и свериться с `dist/*.css`), `packages/ui/src/styles/layers.css` и черновой `Button.vue`.

**Это черновик для проверки, а не готовый результат.** Проверь его на соответствие ADR и `CLAUDE.md` построчно, а не копируй бездумно. В частности:

- В `packages/tokens/source/themes/glass.json` два значения `backdrop` (blur 20px и 12px) помечены `$description: "НЕ ПОДТВЕРЖДЕНО"` — это подобранные на глаз числа, не значения из Figma (Figma не отдаёт effect-свойства через `get_variable_defs`, только bound-переменные). Не выдавай их за факт нигде в коде/комментариях.
- `light-neutral.json` — черновая вторая стилистика, токен-first, ещё не отсмотрена глазами в Storybook. Ожидается, что ты её докрутишь визуально на этом же шаге (см. ниже).
- Проверь, что структура токенов и CSS-переменных действительно соответствует правилу "компонент не знает, какая активна тема — только ссылается на роль с fallback" (см. `layers.css`, `Button.vue`: `var(--surface-accent-default-backdrop)` и т.п.).

## Задача этого шага

1. **Установить зависимости и поднять workspace.** `pnpm install` в корне. Если версии пакетов в `package.json` (`@storybook/vue3-vite@^8.4.0`, `storybook@^8.4.0`, `vite@^5.4.0`, `vue@^3.5.0`) конфликтуют с актуальными на момент установки — подними до совместимых актуальных мажоров сам, это не принципиальное архитектурное решение, а вопрос актуальности версий.

2. **Собрать пайплайн токенов.** Проверить `packages/tokens/scripts/build.mjs` — он должен генерировать `dist/base.css`, `dist/<theme>.css` для каждого файла в `source/themes/`, и `dist/index.css`. Добавь `typecheck`/минимальный тест, что сборка не падает и генерирует непустой CSS (Vitest, не вручную).

3. **Storybook (`@storybook/vue3-vite`) внутри `packages/ui`.**
   - Конфиг в `packages/ui/.storybook/` (сейчас пустая папка).
   - Переключение стилистики — **через глобальный `globals` + toolbar**, НЕ через сторонний addon для тем. Декоратор в `preview.ts` ставит атрибут `data-theme="glass"` / `data-theme="light-neutral"` на корневой элемент превью — это тот же механизм, который позднее будет управлять темой в реальных Nuxt/Vue-приложениях. Список тем бери из `packages/tokens/dist/*.css` (какие темы существуют), не хардкодь.
   - Подключи `layers.css` (а через него — токены) глобально в `preview.ts`.
   - Дефолтный viewport в Storybook — **мобильный (390px)**, не десктоп. Это сквозное требование проекта (mobile-first), см. `CLAUDE.md`.
   - Добавь `@storybook/addon-a11y`.

4. **Button.**
   - Проверь/доведи `Button.vue` до полного соответствия `docs/audit.md` (все состояния: default/hover/pressed/focused/disabled/loading, primary/secondary).
   - `Button.stories.ts` — матрица `variant × state`, чтобы в Storybook при переключении темы было видно все состояния сразу (Story per state или args-based controls — на твоё усмотрение, но must be visually comparable across states).
   - Ручная проверка чек-листом (это не факультатив, а критерий приёмки шага, см. `CLAUDE.md`):
     - Видимый `:focus-visible` outline на клавиатурной навигации (Tab), в обеих темах.
     - Работает `aria-busy`/`aria-disabled` корректно, disabled-кнопка не кликается.
     - `prefers-reduced-motion` уважается спиннером.
     - Переключение темы в Storybook НЕ требует правок `Button.vue` — если требует, это баг архитектуры токенов, чини в токенах, не патчем в компоненте.

5. **Вторая стилистика (light-neutral) — докрутить глазами.** Открой Button в Storybook в `data-theme="light-neutral"` и поправь `packages/tokens/source/themes/light-neutral.json`, если что-то выглядит случайным (это ожидаемая часть работы, не ошибка черновика — ADR-0003 прямо предполагает, что вторая тема донастраивается в Storybook, а не в Figma).

6. **Заведи `docs/figma-code.md`**, если его ещё нет: таблица `Figma-компонент (node-id) → Vue-компонент → файл → статус`. Первая строка — Button (127:566) → `Button.vue` → done.

## Жёсткие ограничения (из ADR, не нарушать без явного обсуждения)

- Никакого Tailwind внутри `packages/ui`. Только CSS custom properties + `<style scoped>` + `@layer` (`reset, tokens, base, components, sections, overrides` — порядок уже задан в `layers.css`, не меняй его самовольно).
- Container queries — для компонентов/секций, media queries — только на уровне page shell (сейчас page shell ещё нет, это следующий шаг, просто не заводи media queries в Button).
- Все media queries, которые всё же появятся — mobile-first (`min-width`), не наоборот.
- Не добавляй новый компонент/паттерн сверх Button на этом шаге — по правилу "абстракция после двух применений" следующие компоненты (Field/Input) идут отдельным шагом (7–8 в roadmap).
- Не трогай `packages/tokens/source/primitive.json` без необходимости — там уже зафиксирована типографика и spacing из Figma.
- Никаких magic numbers мимо токенов.

## Если что-то неоднозначно

Если наткнёшься на решение, которое меняет архитектуру (не реализацию, а именно решение из ADR) — останови работу и опиши проблему словами, не додумывай молча. Если это просто устаревшая версия пакета или мелкая техническая деталь — решай сам и опиши, что изменил.

## В конце

Дай короткий отчёт: что изменено, какие файлы, как проверить (`pnpm storybook` → что открыть → что покликать), какие ограничения остались, что дальше по `docs/roadmap.md`. Этот отчёт нужен для аналитической сессии — по нему сверят, не разошлось ли решение с ADR.
