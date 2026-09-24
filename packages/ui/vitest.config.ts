import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

const storybookDir = fileURLToPath(new URL("./.storybook", import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          // Логика и поведение компонентов (@vue/test-utils)
          extends: true,
          test: {
            name: "ui",
            environment: "happy-dom",
            include: ["src/**/*.test.ts"],
          },
        },
        {
          // Каждая история — тест: рендер в Chromium, play-функция, axe (a11y.test = "error")
          extends: true,
          plugins: [storybookTest({ configDir: storybookDir })],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
            },
            setupFiles: [`${storybookDir}/vitest.setup.ts`],
          },
        },
      ],
    },
  }),
);
