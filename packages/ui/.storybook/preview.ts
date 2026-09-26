import type { Decorator, Preview } from "@storybook/vue3-vite";
import { addons } from "storybook/preview-api";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { accentPresets, schemes, themes, type SchemeName, type ThemeName } from "@uix/tokens";
import { baseRules } from "./a11y";
import { uixTheme } from "./theme";
import "../src/styles/layers.css";
// Шрифтовые пары (data-font-pair, LookRecipe.fontPair) — в Storybook все три, в проекте — только своя
import "../src/styles/font-pairs/unbounded-inter.css";
import "../src/styles/font-pairs/onest-golos.css";
import "../src/styles/font-pairs/rubik-inter.css";
import "../src/styles/font-pairs/manrope-inter.css";
import "../src/styles/font-pairs/montserrat-inter.css";
import "../src/styles/font-pairs/raleway-inter.css";

/**
 * Две оси (ADR-0005): стилистика — data-theme, схема — data-scheme на <html>.
 * Тот же механизм, что в Nuxt/Vue-приложениях; списки берутся из сборки токенов.
 * Слушаем globals напрямую, а не только в декораторе: MDX-страницы Foundations без историй
 * тоже должны реагировать на тему.
 */
const applyTheme = (globals: Record<string, unknown>) => {
  const root = document.documentElement;
  if (themes.includes(globals.theme as ThemeName)) root.dataset.theme = globals.theme as string;
  if (schemes.includes(globals.scheme as SchemeName)) root.dataset.scheme = globals.scheme as string;
  else delete root.dataset.scheme; // «system» — по prefers-color-scheme
  // Шрифтовая пара (data-font-pair); «kit» — шрифт кита, без атрибута
  if (globals.fontPair && globals.fontPair !== "kit") root.dataset.fontPair = globals.fontPair as string;
  else delete root.dataset.fontPair;
  // Цвет-хайлайт проекта (data-accent, LookRecipe.accentColor); без атрибута — первый пресет
  if (globals.accent && globals.accent in accentPresets) root.dataset.accent = globals.accent as string;
  else delete root.dataset.accent;
};
const channel = addons.getChannel();
channel.on(SET_GLOBALS, ({ globals }) => applyTheme(globals));
channel.on(GLOBALS_UPDATED, ({ globals }) => applyTheme(globals));

/**
 * В режиме Docs страница документации — светлая/тёмная оболочка Storybook, а не фон темы.
 * Оборачиваем историю в фон стилистики, иначе стекло рисуется на чужом фоне.
 */
const withTheme: Decorator = (story, context) => {
  applyTheme(context.globals);
  if (context.viewMode === "docs") {
    return {
      components: { story },
      template: '<div class="uix-docs-canvas"><story /></div>',
    };
  }
  return { components: { story }, template: "<story />" };
};

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Стилистика (data-theme)",
      toolbar: {
        title: "Тема",
        icon: "paintbrush",
        items: [...themes],
        dynamicTitle: true,
      },
    },
    fontPair: {
      description: "Шрифтовая пара (data-font-pair): display — заголовки, числа, кнопки; sans — текст",
      toolbar: {
        title: "Шрифты",
        icon: "type",
        items: [
          { value: "kit", title: "Кит: Golos Text" },
          { value: "unbounded-inter", title: "Unbounded + Inter" },
          { value: "onest-golos", title: "Onest + Golos Text" },
          { value: "rubik-inter", title: "Rubik + Inter" },
          { value: "manrope-inter", title: "Manrope ExtraBold + Inter" },
          { value: "montserrat-inter", title: "Montserrat ExtraBold + Inter" },
          { value: "raleway-inter", title: "Raleway Bold + Inter" },
        ],
        dynamicTitle: true,
      },
    },
    accent: {
      description: "Цвет-хайлайт проекта (data-accent): чипы и выделение встроенных графиков",
      toolbar: {
        title: "Акцент",
        icon: "circle",
        items: Object.keys(accentPresets).map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
    scheme: {
      description: "Схема (data-scheme)",
      toolbar: {
        title: "Схема",
        icon: "contrast",
        items: [
          ...schemes.map((value) => ({ value, title: value === "light" ? "Светлая" : "Тёмная" })),
          { value: "system", title: "Как в системе" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: themes.includes("glass" as ThemeName) ? "glass" : themes[0],
    scheme: "dark",
    fontPair: "kit",
    accent: "volt-lime",
    // Mobile-first: превью по умолчанию открывается на 390px (CLAUDE.md)
    viewport: { value: "mobile390", isRotated: false },
  },
  parameters: {
    layout: "padded",
    // Фон страницы задаёт тема (--surface-page-bg), а не аддон backgrounds
    backgrounds: { disable: true },
    viewport: {
      options: {
        mobile360: { name: "Mobile 360", styles: { width: "360px", height: "780px" }, type: "mobile" },
        mobile390: { name: "Mobile 390", styles: { width: "390px", height: "844px" }, type: "mobile" },
        tablet768: { name: "Tablet 768", styles: { width: "768px", height: "1024px" }, type: "tablet" },
        desktop1440: { name: "Desktop 1440", styles: { width: "1440px", height: "900px" }, type: "desktop" },
      },
    },
    controls: { expanded: true, sort: "requiredFirst" },
    docs: { theme: uixTheme, toc: true },
    a11y: {
      // axe-нарушения валят тест истории (addon-vitest), а не только подсвечиваются в панели
      test: "error",
      config: { rules: baseRules },
    },
    options: {
      storySort: {
        order: ["Введение", "Foundations", ["Цвета", "Типографика", "Отступы и размеры", "Моушн"], "Layout", "Typography", "Components", "Patterns", "Charts", "Стилистики"],
      },
    },
  },
};

export default preview;
