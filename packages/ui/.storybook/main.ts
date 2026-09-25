import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/vue3-vite",
    // Документация пропсов/слотов из TS-типов и JSDoc компонента
    options: { docgen: "vue-component-meta" },
  },
  // Истории графиков (@uix/charts) — в том же Storybook: общий деплой и те же тесты axe по схемам
  stories: ["../src/**/*.mdx", "../src/**/*.stories.ts", "../../charts/src/**/*.mdx", "../../charts/src/**/*.stories.ts"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    // Истории — это тесты: play-функции + axe прогоняются в Vitest (браузер, Playwright)
    "@storybook/addon-vitest",
    // Официальный аддон Storybook: форсирует :hover/:active/:focus-visible,
    // чтобы матрица состояний была видна целиком без ручного наведения.
    "storybook-addon-pseudo-states",
  ],
};

export default config;
