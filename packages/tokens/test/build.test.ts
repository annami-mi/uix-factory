import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTokens } from "../scripts/build.mjs";

let distDir: string;
let themes: string[];

const SOURCE_THEMES = join(dirname(fileURLToPath(import.meta.url)), "../source/themes");
const read = (file: string) => readFileSync(join(distDir, file), "utf-8");
const varNames = (css: string) => [...css.matchAll(/--([\w-]+):/g)].map((m) => m[1]).sort();
const schemes = ["light", "dark"] as const;

/** Тело CSS-блока, чей селектор начинается с `selectorStart` */
const block = (css: string, selectorStart: string) => {
  const start = css.indexOf(selectorStart);
  if (start === -1) throw new Error(`Нет блока ${selectorStart}`);
  return css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
};
const schemeBlock = (theme: string, scheme: string) =>
  block(read(`${theme}.css`), `[data-theme="${theme}"][data-scheme="${scheme}"]`);

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), "uix-tokens-"));
  themes = buildTokens({ distDir, log: () => {} });
});

afterAll(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe("build tokens", () => {
  it("находит хотя бы две стилистики", () => {
    expect(themes.length).toBeGreaterThanOrEqual(2);
  });

  it("генерирует непустой base.css на :root", () => {
    const css = read("base.css");
    expect(css).toMatch(/^:root \{/);
    expect(varNames(css).length).toBeGreaterThan(0);
  });

  it("у каждой стилистики есть light и dark с color-scheme", () => {
    for (const theme of themes) {
      for (const scheme of schemes) {
        const body = schemeBlock(theme, scheme);
        // Схема-псевдоним (uix.scheme-alias, исключение из ADR-0005) наследует color-scheme источника
        const source = JSON.parse(readFileSync(join(SOURCE_THEMES, theme, `${scheme}.json`), "utf-8"));
        const alias = source.$extensions?.["uix.scheme-alias"];
        expect(body).toContain(`color-scheme: ${alias ?? scheme};`);
        expect(varNames(body).length).toBeGreaterThan(0);
      }
    }
  });

  it("без data-scheme: light по умолчанию, dark — по prefers-color-scheme", () => {
    for (const theme of themes) {
      const css = read(`${theme}.css`);
      const auto = `[data-theme="${theme}"]:not([data-scheme])`;
      // light-блок перечисляет и явный light, и авто-селектор
      expect(css).toContain(`[data-theme="${theme}"][data-scheme="light"],\n${auto} {`);
      const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
      const lines = (body: string) => body.split("\n").map((l) => l.trim()).filter(Boolean);
      expect(lines(block(media, auto))).toEqual(lines(schemeBlock(theme, "dark")));
    }
  });

  it("не оставляет неразрешённых ссылок и пустых значений", () => {
    for (const file of ["base.css", ...themes.map((t) => `${t}.css`)]) {
      const css = read(file);
      expect(css).not.toMatch(/\{[\w.-]+\}/);
      expect(css).not.toMatch(/:\s*(undefined)?;/);
      expect(css).not.toMatch(/NaN|\[object Object\]/);
    }
  });

  // Смена стилистики/схемы не должна требовать правок компонента (CLAUDE.md) —
  // значит каждая комбинация обязана определить один и тот же набор семантических переменных.
  it("все стилистики × схемы определяют одинаковый набор переменных", () => {
    const combos = themes.flatMap((t) => schemes.map((s) => ({ name: `${t}/${s}`, vars: varNames(schemeBlock(t, s)) })));
    for (const combo of combos.slice(1)) {
      expect({ name: combo.name, vars: combo.vars }).toEqual({ name: combo.name, vars: combos[0].vars });
    }
  });

  it("алиас + uix.alpha даёт hex с альфой (как composed-color в Figma)", () => {
    const glass = schemeBlock("glass", "dark");
    // foreground = white, text/secondary = foreground @ 0.6
    expect(glass).toContain("--color-text-secondary: #f1f1f49e;");
    // ссылка внутри строки: тень accent собрана из роли color/accent/shadow (blue @ 0.2)
    expect(glass).toMatch(/--surface-accent-default-shadow: [^;]*#007aff33/);
  });

  it("index.css подключает base и все темы", () => {
    const css = read("index.css");
    expect(css).toContain('@import "./base.css";');
    for (const theme of themes) {
      expect(css).toContain(`@import "./${theme}.css";`);
    }
  });

  it("themes.ts экспортирует стилистики и схемы", () => {
    const ts = read("themes.ts");
    expect(ts).toContain(`export const themes = ${JSON.stringify(themes)} as const;`);
    expect(ts).toContain(`export const schemes = ${JSON.stringify(schemes)} as const;`);
  });
});
