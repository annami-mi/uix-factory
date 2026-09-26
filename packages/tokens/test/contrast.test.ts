import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTokens } from "../scripts/build.mjs";

/**
 * Контраст ключевых пар ролей во всех комбинациях стилистика × схема (WCAG 1.4.3 / 1.4.11).
 * Полупрозрачные цвета смешиваются с фоном. Фон страницы — худшее место градиента для текста
 * (у glass/dark — самый светлый край, у glass/light — самый тёмный), у neutral — background/default.
 * axe в Storybook проверяет отрисованные компоненты; этот тест ловит ошибку раньше — в токенах.
 */
type Entry = { name: string; value: string };
let distDir: string;
let themes: Record<string, Record<string, Entry[]>>;
let accent: { plate: string; presets: Record<string, { accent: string; onAccent: string }> };

const PAGE: Record<string, string> = {
  // bento-contrast: dark — псевдоним light (исключение из ADR-0005)
  "bento-contrast/light": "#eff0f3",
  "bento-contrast/dark": "#eff0f3",
  "glass/dark": "#272727",
  "glass/light": "#e5e5ea",
  "neutral/dark": "#161619",
  "neutral/light": "#ffffff",
};

type RGBA = [number, number, number, number];
function parse(hex: string): RGBA {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`Не hex-цвет: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
}
function over(fg: string, bg: RGBA): RGBA {
  const [r, g, b, a] = parse(fg);
  return [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a), 1];
}
function lum([r, g, b]: RGBA) {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a: RGBA, b: RGBA) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), "uix-contrast-"));
  buildTokens({ distDir, log: () => {} });
  const docs = JSON.parse(readFileSync(join(distDir, "tokens.json"), "utf-8"));
  themes = docs.themes;
  accent = docs.accentPresets;
});
afterAll(() => rmSync(distDir, { recursive: true, force: true }));

/** [передний план, фон (или "page"), минимум]. Полупрозрачный фон сначала кладётся на страницу */
const PAIRS: [string, string, number][] = [
  ["color-text-primary", "page", 4.5],
  ["color-text-secondary", "page", 4.5],
  ["color-text-tertiary", "page", 4.5],
  ["color-text-danger", "page", 4.5],
  ["color-text-link", "page", 4.5],
  ["color-text-link", "color-surface-default", 4.5],
  ["color-text-primary", "surface-field-default-bg", 4.5],
  // Плейсхолдер и подсказка — третичный текст на плашке поля (обычной и с ошибкой)
  ["color-text-tertiary", "surface-field-default-bg", 4.5],
  ["color-text-tertiary", "surface-field-error-bg", 4.5],
  ["color-text-on-accent", "surface-accent-default-bg", 4.5],
  ["surface-control-default-border", "page", 3],
  ["surface-control-checked-bg", "page", 3],
  ["surface-control-checked-mark", "surface-control-checked-bg", 3],
  ["surface-switch-track-off", "page", 3],
  ["surface-switch-track-on", "page", 3],
  ["color-state-focus", "page", 3],
  // Инвертированная плашка (Card tone="inverted"): текст на ней
  ["color-inverted-text-primary", "surface-inverted-bg", 4.5],
  ["color-inverted-text-secondary", "surface-inverted-bg", 4.5],
  ["color-inverted-text-tertiary", "surface-inverted-bg", 4.5],
  ["color-inverted-muted", "surface-inverted-bg", 1.4],
  ["color-inverted-success", "surface-inverted-bg", 4.5],
  ["color-inverted-danger", "surface-inverted-bg", 4.5],
  // Выделенная метка встроенного графика на карточке — графика, ≥ 3:1
  ["color-chart-highlight", "surface-card-bg", 3],
  // Календарь: дни внутри выбранного диапазона и в предпросмотре
  ["color-text-primary", "surface-calendar-range", 4.5],
  ["color-text-primary", "surface-calendar-preview", 4.5],
  // Badge: текст на тонированной плашке
  ...(["neutral", "accent", "success", "warning", "danger"] as const).map(
    (tone) => [`color-badge-${tone}-fg`, `color-badge-${tone}-bg`, 4.5] as [string, string, number],
  ),
  // Tabs: активная вкладка на плашке индикатора, неактивная — на дорожке
  ["color-text-primary", "surface-segmented-indicator", 4.5],
  ["color-text-secondary", "surface-segmented-track", 4.5],
  ["color-text-primary", "surface-card-bg", 4.5],
  // Alert: заголовок и текст на тонированной плашке тона
  ...(["neutral", "accent", "success", "warning", "danger"] as const).flatMap((tone) => [
    ["color-text-primary", `color-badge-${tone}-bg`, 4.5] as [string, string, number],
    ["color-text-secondary", `color-badge-${tone}-bg`, 4.5] as [string, string, number],
  ]),
  // Dialog, Toast, Tooltip, меню: текст на материале панели
  ["color-text-primary", "surface-popover-bg", 4.5],
  ["color-text-secondary", "surface-popover-bg", 4.5],
  // Графики: подписи осей и значений на карточке, первые серии и статусы — различимы на карточке
  ["color-text-tertiary", "surface-card-bg", 4.5],
  ["color-chart-series-1", "surface-card-bg", 3],
  ["color-chart-series-2", "surface-card-bg", 2.8],
  ["color-text-secondary", "surface-card-bg", 4.5],
];

describe("контраст токенов", () => {
  for (const combo of Object.keys(PAGE)) {
    it(combo, () => {
      const [theme, scheme] = combo.split("/");
      const entries = themes[theme][scheme];
      const get = (name: string) => {
        const e = entries.find((t) => t.name === name);
        if (!e) throw new Error(`${combo}: нет токена ${name}`);
        return e.value;
      };
      const page = parse(PAGE[combo]);
      const failures: string[] = [];
      for (const [fg, bg, min] of PAIRS) {
        const bgRgba = bg === "page" ? page : over(get(bg), page);
        const value = ratio(over(get(fg), bgRgba), bgRgba);
        if (value < min) failures.push(`${fg} на ${bg}: ${value.toFixed(2)} < ${min}`);
      }
      expect(failures).toEqual([]);
    });
  }
});

/**
 * Акцент-пресеты (LookRecipe.accentColor): подпись на чипе — текст, ≥ 4.5:1; сам чип на тёмной плашке
 * bento-contrast — графический элемент, ≥ 3:1 (WCAG 1.4.11).
 */
describe("акцент-пресеты", () => {
  const check = (name: string) => {
    const p = accent.presets[name]!;
    const chip = parse(p.accent);
    return {
      label: ratio(parse(p.onAccent), chip),
      onPlate: ratio(chip, parse(accent.plate)),
    };
  };

  it("все шесть пресетов на месте", () => {
    expect(Object.keys(accent.presets)).toEqual([
      "volt-lime",
      "electric-blue",
      "lavender",
      "coral-signal",
      "signal-green",
      "magenta-pop",
    ]);
  });

  it("подпись ≥ 4.5:1, чип на плашке ≥ 3:1", () => {
    const failures: string[] = [];
    for (const name of Object.keys(accent.presets)) {
      const { label, onPlate } = check(name);
      if (label < 4.5) failures.push(`${name}: подпись ${label.toFixed(2)} < 4.5`);
      if (onPlate < 3) failures.push(`${name}: чип на плашке ${onPlate.toFixed(2)} < 3`);
    }
    expect(failures).toEqual([]);
  });
});
