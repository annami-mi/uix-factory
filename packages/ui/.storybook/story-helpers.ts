/**
 * Помощники для историй.
 *
 * `themeMatrix(story)` — та же история во всех комбинациях стилистика × схема (ADR-0005; bento-contrast — только light):
 * каждая — отдельный тест, поэтому axe проверяет контраст в каждой (тест-раннер не переключает тулбар).
 * Людям они не нужны — есть тулбар. Спрятать из сайдбара и Docs можно только литеральными тегами
 * в самом экспорте: индекс Storybook читает CSF статически и не видит теги из вызова функции.
 * Тег `test` остаётся — Vitest их гоняет.
 * Экспорты в CSF должны быть статическими, поэтому результат раскладывается вручную:
 *
 *   const m = themeMatrix(StateMatrix);
 *   export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] }; …
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Globals в Storybook — Record<string, any>
type AnyStory = { name?: string; tags?: string[]; globals?: Record<string, any> };

export function themeMatrix<S extends AnyStory>(story: S) {
  const make = (theme: string, scheme: string): S => ({
    ...story,
    name: `${story.name ?? "Story"} · ${theme} ${scheme}`,
    tags: [...(story.tags ?? []), "!autodocs"],
    globals: { ...(story.globals ?? {}), theme, scheme },
  });
  return {
    glassDark: make("glass", "dark"),
    glassLight: make("glass", "light"),
    neutralLight: make("neutral", "light"),
    neutralDark: make("neutral", "dark"),
    // bento-contrast — только светлая (тёмная схема — псевдоним светлой, ADR-0005 исключение)
    bentoLight: make("bento-contrast", "light"),
  };
}
