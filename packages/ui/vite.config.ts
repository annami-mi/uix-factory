import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Общая Vite-конфигурация: её подхватывают Storybook (@storybook/vue3-vite) и Vitest (vitest.config.ts)
export default defineConfig({
  plugins: [vue()],
});
