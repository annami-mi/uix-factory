import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// Unit-тесты расчётов графиков (шкалы, формат, пружина). Истории графиков тестируются
// в Storybook пакета @uix/ui (vitest --project storybook) — вместе с axe во всех схемах.
export default defineConfig({
  plugins: [vue()],
  test: {
    name: "charts",
    environment: "happy-dom",
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
  },
});
