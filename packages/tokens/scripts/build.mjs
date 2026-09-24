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
        emit([...nextPath, "font-family"].join("-"), field(resolved.fontFamily), value, nextPath);
        emit([...nextPath, "font-weight"].join("-"), field(resolved.fontWeight), value, nextPath);
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
  walkTokens(tree, [], refMap, (name, value) => {
    lines.push(`  --${name}: ${value};`);
  });
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

/**
 * CSS одной стилистики: две оси — data-theme (стилистика) и data-scheme (light/dark).
 * Без data-scheme схема следует системной настройке (prefers-color-scheme).
 */
function themeCss(theme, schemeTrees, refsByScheme) {
  const t = `[data-theme="${theme}"]`;
  const auto = `${t}:not([data-scheme])`;
  const indent = (css) => css.replace(/^/gm, "  ").replace(/^  $/gm, "");
  return [
    `/* ${theme}: light — явно или по умолчанию */`,
    cssBlock(`${t}[data-scheme="light"],\n${auto}`, "light", schemeTrees.light, refsByScheme.light),
    `/* ${theme}: dark — явно */`,
    cssBlock(`${t}[data-scheme="dark"]`, "dark", schemeTrees.dark, refsByScheme.dark),
    `/* ${theme}: dark — по системной настройке, если data-scheme не задан */`,
    `@media (prefers-color-scheme: dark) {\n${indent(cssBlock(auto, "dark", schemeTrees.dark, refsByScheme.dark))}}\n`,
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
    docs.themes[theme] = {};
    for (const scheme of SCHEMES) {
      const file = join(themesDir, theme, `${scheme}.json`);
      if (!existsSync(file)) throw new Error(`Стилистика «${theme}» без схемы ${scheme}: нет ${file}`);
      trees[scheme] = loadJson(file);
      // Тема может ссылаться и на примитивы, и на собственные токены
      refs[scheme] = { ...primitiveRefs, ...flattenForRefs(trees[scheme], "", {}) };
      docs.themes[theme][scheme] = tokensToEntries(trees[scheme], refs[scheme]);
    }
    writeFileSync(join(distDir, `${theme}.css`), themeCss(theme, trees, refs));
    log(`✓ dist/${theme}.css (${SCHEMES.join(", ")})`);
  }

  // --- index.css: удобный вход, подключает base + все темы ---
  const indexCss =
    ['@import "./base.css";', ...themeNames.map((n) => `@import "./${n}.css";`)].join("\n") + "\n";
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
    "/** Брейкпоинты в px (primitive breakpoint/*). Для matchMedia: `(width >= ${breakpoints.md}px)` */\n" +
    `export const breakpoints = ${JSON.stringify(breakpoints)} as const;\n`;
  writeFileSync(join(distDir, "constants.ts"), constantsTs);
  log("✓ dist/constants.ts");

  // --- tokens.json: итоговые значения для документации ---
  writeFileSync(join(distDir, "tokens.json"), JSON.stringify(docs, null, 2) + "\n");
  log("✓ dist/tokens.json");

  log(`Готово. Стилистики: ${themeNames.join(", ")}; схемы: ${SCHEMES.join(", ")}`);
  return themeNames;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildTokens();
}
