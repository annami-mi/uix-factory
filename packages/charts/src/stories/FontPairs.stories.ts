import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { Button, Grid, Heading, Stack, Text } from "@uix/ui";
import StatTile from "../components/StatTile.vue";
import { revenue } from "./data";

/*
 * Шрифтовые пары кита (@uix/ui/font-pairs/*, data-font-pair, LookRecipe.fontPair) — сравнение на одном контенте.
 */
const PAIRS: { key: string; title: string; display: string; sans: string; weight?: string; numeric?: string }[] = [
  { key: "unbounded-inter", title: "Unbounded + Inter", display: '"Unbounded", sans-serif', sans: '"Inter", sans-serif' },
  { key: "onest-golos", title: "Onest + Golos Text", display: '"Onest", sans-serif', sans: '"Golos Text", sans-serif' },
  { key: "rubik-inter", title: "Rubik + Inter", display: '"Rubik", sans-serif', sans: '"Inter", sans-serif' },
  { key: "manrope-inter", title: "Manrope ExtraBold + Inter", display: '"Manrope", sans-serif', sans: '"Inter", sans-serif', weight: "800" },
  { key: "montserrat-inter", title: "Montserrat ExtraBold + Inter", display: '"Montserrat", sans-serif', sans: '"Inter", sans-serif', weight: "800" },
  { key: "raleway-inter", title: "Raleway Bold + Inter", display: '"Raleway", sans-serif', sans: '"Inter", sans-serif', weight: "700", numeric: "lining-nums" },
];

/**
 * Локальная пара для колонки: текстовые стили ссылаются на var(--font-family-*) и вычисляются на :root,
 * поэтому в колонке их нужно объявить заново — иначе подмена роли не дойдёт до компонентов.
 */
const DISPLAY_ROLES = ["hero", "display", "heading-l", "heading-m", "heading-s"];
const SANS_ROLES = ["body-l", "body-m", "body-s", "body-xs", "label-l", "label-m", "label-s", "label-xs", "caption"];
const pairStyle = (p: (typeof PAIRS)[number]) =>
  Object.fromEntries([
    ["--font-family-display", p.display],
    ["--font-family-sans", p.sans],
    ["--font-weight-display", p.weight ?? "var(--font-weight-semibold)"],
    ...DISPLAY_ROLES.map((r) => [`--type-${r}-font-family`, "var(--font-family-display)"]),
    ...DISPLAY_ROLES.map((r) => [`--type-${r}-font-weight`, "var(--font-weight-display)"]),
    ...SANS_ROLES.map((r) => [`--type-${r}-font-family`, "var(--font-family-sans)"]),
    ["font-family", "var(--font-family-sans)"],
    ["font-variant-numeric", p.numeric ?? "normal"],
  ]);

const rub = { style: "currency", currency: "RUB", maximumFractionDigits: 0 } as const;

const SAMPLE = `
  <Stack gap="4">
    <Heading :level="2" size="display">Выручка за сентябрь</Heading>
    <Text tone="secondary">Съешь же ещё этих мягких французских булок, да выпей чаю — ёмкость 0123456789 ₽ %.</Text>
    <Grid min="s" gap="3">
      <StatTile label="Выручка" :value="6284300" :value-format="rub" :delta="0.124" delta-label="к августу" :trend="trend" />
      <StatTile label="Клиенты" :value="1482" :delta="0.057" delta-label="к августу" :series="3" />
    </Grid>
    <Stack direction="horizontal" gap="2">
      <Button size="l">Создать счёт</Button>
      <Button variant="secondary">Экспорт</Button>
    </Stack>
  </Stack>
`;

const meta = {
  title: "Foundations/Шрифтовые пары",
  parameters: {
    docs: {
      description: {
        component: [
          "Шесть шрифтовых пар кита. Роль `font.family.display` — заголовки, крупные числа (StatTile), кнопки; `font.family.sans` — остальной текст. Без пары — шрифт кита (Golos Text).",
          "",
          "- **Подключение в проекте:** `import \"@uix/ui/font-pairs/<пара>.css\"` после `@uix/ui/styles.css` и `data-font-pair=\"<пара>\"` на `<html>` (на уровне сборки — `LookRecipe.fontPair`, ADR-0008). Грузятся только шрифты своей пары.",
          "- «Текущая пара» — переключатель **Шрифты** в тулбаре (как Тема и Схема); «Все пары рядом» — три колонки.",
          "- Кириллица проверена по таблицам глифов всех трёх пар: весь алфавит, ё/Ё, «», —, №, ₽.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Пара из тулбара «Шрифты» — видно на цифрах, заголовках и кнопках. */
export const CurrentPair: Story = {
  name: "Текущая пара (тулбар)",
  render: () => ({
    components: { Button, Grid, Heading, Stack, StatTile, Text },
    setup: () => ({ rub, trend: revenue.map((d) => d.revenue) }),
    template: SAMPLE,
  }),
};

/** Три пары рядом: одинаковый контент, разные шрифты. */
export const SideBySide: Story = {
  name: "Все пары рядом",
  parameters: { layout: "padded" },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
  render: () => ({
    components: { Button, Grid, Heading, Stack, StatTile, Text },
    setup: () => ({ PAIRS, pairStyle, rub, trend: revenue.map((d) => d.revenue) }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: var(--space-8)">
        <section v-for="p in PAIRS" :key="p.key" :style="pairStyle(p)" :data-pair="p.key">
          <Text size="s" tone="tertiary" style="margin-block-end: var(--space-3)">{{ p.title }}</Text>
          ${SAMPLE}
        </section>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Колонка unbounded-inter действительно на Unbounded: подмена роли дошла до заголовка
    const heading = canvasElement.querySelector('[data-pair="unbounded-inter"] h2')!;
    await expect(getComputedStyle(heading).fontFamily).toContain("Unbounded");
  },
};
