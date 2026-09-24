import tokens from "@uix/tokens/tokens.json";

export type TokenEntry = (typeof tokens.primitives)[number];

export const primitives: TokenEntry[] = tokens.primitives;
/** { glass: { light: [...], dark: [...] }, neutral: {...} } */
export const themeEntries: Record<string, Record<string, TokenEntry[]>> = tokens.themes;

/** Токены одной шкалы примитивов: prefix "space" → space/0, space/px, space/1… */
export const scale = (prefix: string) =>
  primitives.filter((t) => t.path.split("/")[0] === prefix && t.path.split("/").length === 2);

/** Семантические цвета темы, сгруппированные по роли: color/text/* → { title: "text", colors: {…} } */
export const colorGroups = (entries: TokenEntry[]) => {
  const groups = new Map<string, Record<string, string>>();
  for (const t of entries) {
    const [root, role, ...rest] = t.path.split("/");
    if (root !== "color" || t.type !== "color") continue;
    const colors = groups.get(role) ?? {};
    colors[rest.join("/") || role] = t.value;
    groups.set(role, colors);
  }
  return [...groups].map(([title, colors]) => ({ title, colors }));
};

/** Палитра примитивов: color/mono/*, color/palette/* */
export const paletteGroups = () => colorGroups(primitives);

/** Текстовые стили: type/label/lg → { name: "label/lg", css: "type-label-lg" } */
export const typeStyles = () =>
  [...new Set(primitives.filter((t) => t.path.startsWith("type/")).map((t) => t.path))].map((path) => ({
    name: path.replace(/^type\//, ""),
    css: path.replaceAll("/", "-"),
    size: primitives.find((t) => t.name === `${path.replaceAll("/", "-")}-font-size`)?.value,
    lineHeight: primitives.find((t) => t.name === `${path.replaceAll("/", "-")}-line-height`)?.value,
    weight: primitives.find((t) => t.name === `${path.replaceAll("/", "-")}-font-weight`)?.value,
    description: primitives.find((t) => t.path === path)?.description,
  }));
