// Простой конвертер DTCG-подобного JSON в CSS custom properties.
// Без внешних зависимостей (Style Dictionary — «ПОЗЖЕ», см. исследование).
// Правило именования переменных: путь через "/" в токене -> путь через "-" в CSS var.
// Ссылки: "{a.b}" (целиком или внутри строки). Прозрачность от ссылки — $extensions["uix.alpha"],
// аналог composed-color в Figma (алиас + alpha), см. docs/tokens.md.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIR = join(__dirname, "..", "source");
const DEFAULT_DIST_DIR = join(__dirname, "..", "dist");

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/** Строит плоскую карту "a.b.c" -> узел токена (для резолва {a.b.c} ссылок) */
function flattenForRefs(node, prefix, out) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) {
      out[path] = value;
    } else if (value && typeof value === "object") {
      flattenForRefs(value, path, out);
    }
  }
  return out;
}

/** #rgb/#rrggbb/#rrggbbaa + множитель альфы -> #rrggbbaa (как composed-color в Figma: алиас + alpha) */
function withAlpha(hex, alpha) {
  if (typeof alpha !== "number" || alpha < 0 || alpha > 1) {
    throw new Error(`uix.alpha должен быть числом 0..1, получено: ${JSON.stringify(alpha)}`);
  }
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`uix.alpha применим только к hex-цвету, получено: ${hex}`);
  const base = m[2] ? parseInt(m[2], 16) / 255 : 1;
  const a = Math.round(base * alpha * 255);
  return `#${m[1].toLowerCase()}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}

/** Значение токена с учётом ссылок и модификатора $extensions["uix.alpha"] */
function resolveToken(token, refMap, seen = new Set()) {
  let value = resolveValue(token.$value, refMap, seen);
  const alpha = token.$extensions?.["uix.alpha"];
  if (alpha !== undefined) value = withAlpha(value, alpha);
  return value;
}

function lookup(path, refMap, seen) {
  if (seen.has(path)) throw new Error(`Циклическая ссылка токена: {${path}}`);
  const token = refMap[path];
  if (token === undefined) throw new Error(`Не найдена ссылка токена: {${path}}`);
  return resolveToken(token, refMap, new Set([...seen, path]));
}

/**
 * "{a.b}" целиком -> значение токена (может быть объектом, напр. typography);
 * ссылки внутри строки ("0 6px 20px {color.accent.shadow}") -> подстановка.
 */
function resolveValue(value, refMap, seen = new Set()) {
  if (typeof value !== "string") return value;
  const whole = value.match(/^\{([\w.-]+)\}$/);
  if (whole) return lookup(whole[1], refMap, seen);
  return value.replace(/\{([\w.-]+)\}/g, (_, path) => String(lookup(path, refMap, seen)));
}

/** Обходит дерево токенов, вызывая emit(cssVarPath, cssValue) для каждого листа */
function walkTokens(node, pathParts, refMap, emit) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const nextPath = [...pathParts, key];
    if (value && typeof value === "object" && "$value" in value) {
      const resolved = resolveToken(value, refMap);
      if (value.$type === "typography" && resolved && typeof resolved === "object") {
        const field = (v) => String(resolveValue(v, refMap));
        // Шрифт — ссылкой на переменную роли (--font-family-sans/display): стилистика или инструмент
        // сравнения подменяют шрифт одной переменной, не переписывая каждый текстовый стиль
        const familyRef = typeof resolved.fontFamily === "string" && resolved.fontFamily.match(/^\{font\.family\.([\w-]+)\}$/);
        const family = familyRef ? `var(--font-family-${familyRef[1]})` : field(resolved.fontFamily);
        emit([...nextPath, "font-family"].join("-"), family, value, nextPath);
        // Вес роли display — тоже переменной: шрифтовая пара задаёт свой (Manrope/Nunito — 800)
        const weightRef = typeof resolved.fontWeight === "string" && resolved.fontWeight.match(/^\{font\.weight\.(display)\}$/);
        const weight = weightRef ? `var(--font-weight-${weightRef[1]})` : field(resolved.fontWeight);
        emit([...nextPath, "font-weight"].join("-"), weight, value, nextPath);
        emit([...nextPath, "font-size"].join("-"), field(resolved.fontSize), value, nextPath);
        emit([...nextPath, "line-height"].join("-"), field(resolved.lineHeight), value, nextPath);
      } else {
        emit(nextPath.join("-"), resolved, value, nextPath);
      }
    } else if (value && typeof value === "object") {
      walkTokens(value, nextPath, refMap, emit);
    }
  }
}

function tokensToCssBlock(selector, tree, refMap) {
  const lines = [];
  walkTokens(tree, [], refMap, (name, value) => {
    lines.push(`  --${name}: ${value};`);
  });
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

/** Плоский список токенов с итоговыми значениями — для документации (Storybook Foundations) */
function tokensToEntries(tree, refMap) {
  const entries = [];
  walkTokens(tree, [], refMap, (name, value, token, path) => {
    entries.push({
      name,
      path: path.join("/"),
      type: token.$type ?? null,
      value: String(value),
      ...(token.$description ? { description: token.$description } : {}),
    });
  });
  return entries;
}

/** Схемы, которые обязана определить каждая стилистика. Первая — по умолчанию без prefers-color-scheme */
const SCHEMES = ["light", "dark"];

function cssBlock(selector, scheme, tree, refMap) {
  const lines = [`  color-scheme: ${scheme};`];
  // (для псевдонима схемы сюда приходит схема-источник: bento-contrast dark → color-scheme: light)
  walkTokens(tree, [], refMap, (name, value) => {
    lines.push(`  --${name}: ${value};`);
  });
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

/**
 * CSS одной стилистики: две оси — data-theme (стилистика) и data-scheme (light/dark).
 * Без data-scheme схема следует системной настройке (prefers-color-scheme).
 */
function themeCss(theme, schemeTrees, refsByScheme, colorSchemes = { light: "light", dark: "dark" }) {
  const t = `[data-theme="${theme}"]`;
  const auto = `${t}:not([data-scheme])`;
  const indent = (css) => css.replace(/^/gm, "  ").replace(/^  $/gm, "");
  return [
    `/* ${theme}: light — явно или по умолчанию */`,
    cssBlock(`${t}[data-scheme="light"],\n${auto}`, "light", schemeTrees.light, refsByScheme.light),
    `/* ${theme}: dark — явно */`,
    cssBlock(`${t}[data-scheme="dark"]`, colorSchemes.dark, schemeTrees.dark, refsByScheme.dark),
    `/* ${theme}: dark — по системной настройке, если data-scheme не задан */`,
    `@media (prefers-color-scheme: dark) {\n${indent(cssBlock(auto, colorSchemes.dark, schemeTrees.dark, refsByScheme.dark))}}\n`,
  ].join("\n");
}

/**
 * Собирает dist из source. Возвращает список стилистик.
 * Вынесено в функцию, чтобы тест мог собрать токены во временную папку.
 */
export function buildTokens({ sourceDir = DEFAULT_SOURCE_DIR, distDir = DEFAULT_DIST_DIR, log = console.log } = {}) {
  mkdirSync(distDir, { recursive: true });
  // Удаляем CSS прошлых сборок, чтобы не оставались переименованные/удалённые темы
  for (const f of readdirSync(distDir)) if (f.endsWith(".css")) rmSync(join(distDir, f));

  // --- primitive.json -> dist/base.css (:root, тема-независимо) ---
  const primitive = loadJson(join(sourceDir, "primitive.json"));
  const primitiveRefs = flattenForRefs(primitive, "", {});
  writeFileSync(join(distDir, "base.css"), tokensToCssBlock(":root", primitive, primitiveRefs));
  const docs = { primitives: tokensToEntries(primitive, primitiveRefs), themes: {} };
  log("✓ dist/base.css");

  // --- source/themes/<стилистика>/<схема>.json -> dist/<стилистика>.css ---
  const themesDir = join(sourceDir, "themes");
  const themeNames = readdirSync(themesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const theme of themeNames) {
    const trees = {};
    const refs = {};
    const colorSchemes = {};
    docs.themes[theme] = {};
    for (const scheme of SCHEMES) {
      const file = join(themesDir, theme, `${scheme}.json`);
      if (!existsSync(file)) throw new Error(`Стилистика «${theme}» без схемы ${scheme}: нет ${file}`);
      trees[scheme] = loadJson(file);
      colorSchemes[scheme] = scheme;
      // Псевдоним схемы (исключение из ADR-0005, напр. bento-contrast пока только светлая):
      // берём токены схемы-источника и её color-scheme
      const alias = trees[scheme].$extensions?.["uix.scheme-alias"];
      if (alias) {
        if (!trees[alias]) throw new Error(`«${theme}/${scheme}»: псевдоним на «${alias}», которая ещё не загружена`);
        trees[scheme] = trees[alias];
        colorSchemes[scheme] = colorSchemes[alias];
      }
      // Тема может ссылаться и на примитивы, и на собственные токены
      refs[scheme] = { ...primitiveRefs, ...flattenForRefs(trees[scheme], "", {}) };
      docs.themes[theme][scheme] = tokensToEntries(trees[scheme], refs[scheme]);
    }
    writeFileSync(join(distDir, `${theme}.css`), themeCss(theme, trees, refs, colorSchemes));
    log(`✓ dist/${theme}.css (${SCHEMES.join(", ")})`);
  }

  // --- index.css: удобный вход, подключает base + все темы ---
  const indexCss =
    [
      '@import "./base.css";',
      ...(existsSync(join(sourceDir, "accent-presets.json")) ? ['@import "./accent-presets.css";'] : []),
      ...themeNames.map((n) => `@import "./${n}.css";`),
    ].join("\n") + "\n";
  writeFileSync(join(distDir, "index.css"), indexCss);
  log("✓ dist/index.css");

  // --- themes.ts: списки стилистик и схем для приложений и Storybook (не хардкодить в потребителях) ---
  const themesTs =
    "// Сгенерировано scripts/build.mjs — не редактировать вручную.\n" +
    "/** Стилистики: data-theme на <html> */\n" +
    `export const themes = ${JSON.stringify(themeNames)} as const;\n` +
    "export type ThemeName = (typeof themes)[number];\n" +
    "/** Схемы: data-scheme на <html>; без атрибута — по prefers-color-scheme */\n" +
    `export const schemes = ${JSON.stringify(SCHEMES)} as const;\n` +
    "export type SchemeName = (typeof schemes)[number];\n";
  writeFileSync(join(distDir, "themes.ts"), themesTs);
  log("✓ dist/themes.ts");

  // --- constants.ts: брейкпоинты числами — для matchMedia в JS (в @media нельзя var(), ADR-0002) ---
  const breakpoints = Object.fromEntries(
    Object.entries(primitive.breakpoint ?? {})
      .filter(([k]) => !k.startsWith("$"))
      .map(([k, t]) => [k, parseFloat(resolveToken(t, primitiveRefs))]),
  );
  const constantsTs =
    "// Сгенерировано scripts/build.mjs — не редактировать вручную.\n" +
    "/** Брейкпоинты в px (primitive breakpoint/*). Для matchMedia: `(width >= ${breakpoints.m}px)` */\n" +
    `export const breakpoints = ${JSON.stringify(breakpoints)} as const;\n`;
  writeFileSync(join(distDir, "constants.ts"), constantsTs);
  log("✓ dist/constants.ts");

  // --- accentPresets.ts: акцент-пресеты проекта (LookRecipe.accentColor, ADR-0008) — не часть темы ---
  const presetsPath = join(sourceDir, "accent-presets.json");
  const accent = existsSync(presetsPath) ? JSON.parse(readFileSync(presetsPath, "utf-8")) : null;
  if (accent) {
    const presets = Object.fromEntries(
      Object.entries(accent.presets)
        .filter(([k]) => !k.startsWith("$"))
        .map(([name, p]) => [name, { accent: p.accent.$value, onAccent: p["on-accent"].$value }]),
    );
    docs.accentPresets = { plate: accent.plate.$value, presets };
    const presetsTs =
      "// Сгенерировано scripts/build.mjs из source/accent-presets.json — не редактировать вручную.\n" +
      "/** Акцент-пресеты для LookRecipe.accentColor: акцент и цвет содержимого на нём (чип на тёмной плашке). */\n" +
      `export const accentPresets = ${JSON.stringify(presets, null, 2)} as const;\n` +
      "export type AccentPresetName = keyof typeof accentPresets;\n" +
      "export type AccentPreset = { accent: string; onAccent: string };\n" +
      "/** Тёмная плашка подачи чипа (inverted-карточка bento-contrast) — пока темы bento-contrast нет */\n" +
      `export const accentPlate = ${JSON.stringify(accent.plate.$value)};\n`;
    writeFileSync(join(distDir, "accentPresets.ts"), presetsTs);
    log("✓ dist/accentPresets.ts");

    // spotlight — цвет-хайлайт проекта (LookRecipe.accentColor): по умолчанию первый пресет,
    // data-accent="<пресет>" на <html> выбирает другой; свой цвет — переменные --color-spotlight* инлайн
    const [first] = Object.keys(presets);
    const block = (sel, p) => `${sel} {\n  --color-spotlight: ${p.accent};\n  --color-on-spotlight: ${p.onAccent};\n}\n`;
    const presetsCss =
      "/* Сгенерировано scripts/build.mjs из source/accent-presets.json — не редактировать вручную. */\n" +
      block(":root", presets[first]) +
      Object.entries(presets)
        .map(([name, p]) => block(`:root[data-accent="${name}"]`, p))
        .join("");
    writeFileSync(join(distDir, "accent-presets.css"), presetsCss);
    log("✓ dist/accent-presets.css");
  }

  // --- tokens.json: итоговые значения для документации ---
  writeFileSync(join(distDir, "tokens.json"), JSON.stringify(docs, null, 2) + "\n");
  log("✓ dist/tokens.json");

  log(`Готово. Стилистики: ${themeNames.join(", ")}; схемы: ${SCHEMES.join(", ")}`);
  return themeNames;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildTokens();
}
