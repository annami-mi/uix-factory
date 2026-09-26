import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { accentPlate, accentPresets, type AccentPresetName } from "@uix/tokens";
import Badge from "../components/Badge/Badge.vue";
import Card from "../components/Card/Card.vue";
import Heading from "../components/Heading/Heading.vue";
import Text from "../components/Text/Text.vue";

/*
 * Демо акцент-пресетов (docs/claude-code-prompt-bento-contrast.md, Б). Тёмная плашка — обычная Card
 * с переопределёнными переменными прямо в истории: вариант Card «inverted» и сама тема bento-contrast —
 * отдельная задача. Пресет в проекте применяется через LookRecipe.accentColor (ADR-0008 §2).
 */
const names = Object.keys(accentPresets) as AccentPresetName[];

const plateStyle = (name: AccentPresetName) => ({
  "--surface-card-bg": accentPlate,
  "--surface-card-border": "transparent",
  "--surface-card-shadow": "none",
  "--surface-card-backdrop": "none",
  "--color-text-primary": "var(--color-mono-snow)",
  "--color-text-secondary": "color-mix(in srgb, var(--color-mono-snow) 72%, transparent)",
  "--color-badge-accent-bg": accentPresets[name].accent,
  "--color-badge-accent-fg": accentPresets[name].onAccent,
});

const TILE = `
  <Card :style="plateStyle(name)" :data-preset="name">
    <div style="display: grid; gap: var(--space-2)">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-2)">
        <Text size="s" tone="secondary">Баланс портфеля</Text>
        <Badge tone="accent">+12,4 %</Badge>
      </div>
      <Heading :level="3" size="display">1 284 300 ₽</Heading>
      <Text size="xs" tone="secondary">{{ name }} · {{ presets[name].accent }} / {{ presets[name].onAccent }}</Text>
    </div>
  </Card>
`;

const meta = {
  title: "Foundations/Акцент-пресеты",
  parameters: {
    docs: {
      description: {
        component: [
          "Шесть пресетов `{ accent, onAccent }` для `LookRecipe.accentColor` (ADR-0008): чип-хайлайт на тёмной плашке стилистики bento-contrast. Исходник — `packages/tokens/source/accent-presets.json`, в коде — `accentPresets` из `@uix/tokens`.",
          "",
          "- Контраст проверен тестом токенов: подпись на чипе ≥ 4.5:1, чип на плашке ≥ 3:1.",
          "- Подпись на чипе — тёмная или белая, какая даёт ≥ 4.5:1: белая у electric-blue и lavender, тёмная у остальных.",
        ].join("\n"),
      },
    },
  },
  args: { preset: "volt-lime" as AccentPresetName },
  argTypes: { preset: { control: "select", options: names } },
} satisfies Meta<{ preset: AccentPresetName }>;

export default meta;
/** История без компонента: тип аргументов задан явно (из meta Storybook его не выводит) */
type Story = StoryObj<{ preset: AccentPresetName }>;

/** Одна плашка — пресет из контрола. */
export const Preset: Story = {
  render: (args) => ({
    components: { Badge, Card, Heading, Text },
    setup: () => ({ name: args.preset, plateStyle, presets: accentPresets }),
    template: `<div style="max-inline-size: 360px">${TILE}</div>`,
  }),
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector(".ui-badge")!;
    await expect(getComputedStyle(chip).backgroundColor).toBe("rgb(229, 254, 84)");
  },
};

/** Все шесть рядом — контраст проверяет axe (и тест токенов). */
export const All: Story = {
  name: "Все пресеты",
  render: () => ({
    components: { Badge, Card, Heading, Text },
    setup: () => ({ names, plateStyle, presets: accentPresets }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-grid-item-l)), 1fr)); gap: var(--space-3)">
        <template v-for="name in names" :key="name">${TILE}</template>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-preset]")).toHaveLength(6);
  },
};
