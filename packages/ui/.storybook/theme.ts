import { create } from "storybook/theming";
import tokens from "@uix/tokens/tokens.json";

/** Значение токена по имени CSS-переменной — оформление Storybook берёт цвета из токенов кита */
const primitive = (name: string) => {
  const token = tokens.primitives.find((t) => t.name === name);
  if (!token) throw new Error(`Токен не найден: ${name}`);
  return token.value;
};
const glass = (name: string) => {
  const token = tokens.themes.glass.dark.find((t) => t.name === name);
  if (!token) throw new Error(`Токен не найден: ${name}`);
  return token.value;
};

/**
 * Тёмное оформление Storybook под флагманскую стилистику «Жидкое стекло».
 * Цвета интерфейса — из токенов; фоны панелей (#1c1c1e / #252121) — оформление самого Storybook,
 * не часть кита (#252121 — конец градиента surface/page/bg glass).
 */
export const uixTheme = create({
  base: "dark",
  brandTitle: "UIX Factory",
  brandTarget: "_self",
  fontBase: primitive("font-family-sans"),
  fontCode: "ui-monospace, SFMono-Regular, Menlo, monospace",
  colorPrimary: primitive("color-palette-blue"),
  colorSecondary: primitive("color-palette-blue"),
  appBg: "#1c1c1e",
  appContentBg: "#252121",
  appPreviewBg: "#252121",
  appBorderColor: glass("color-border-default"),
  appBorderRadius: parseInt(primitive("radius-3")),
  textColor: glass("color-text-primary"),
  textMutedColor: glass("color-text-secondary"),
  barBg: "#1c1c1e",
  barTextColor: glass("color-text-secondary"),
  barSelectedColor: primitive("color-palette-blue"),
  inputBg: glass("color-surface-default"),
  inputBorder: glass("color-border-default"),
  inputTextColor: glass("color-text-primary"),
  inputBorderRadius: parseInt(primitive("radius-2")),
});
