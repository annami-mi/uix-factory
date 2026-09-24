/**
 * Помощники для историй.
 *
 * `themeMatrix(story)` — та же история во всех комбинациях стилистика × схема (ADR-0005):
 * каждая — отдельный тест, поэтому axe проверяет контраст в каждой. В Docs не выводятся.
 * Экспорты в CSF должны быть статическими, поэтому результат раскладывается вручную:
 *
 *   const m = themeMatrix(StateMatrix);
 *   export const MatrixGlassDark = m.glassDark; …
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
  };
}
