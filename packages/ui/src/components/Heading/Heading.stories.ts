import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Divider from "../Divider/Divider.vue";
import Text from "../Text/Text.vue";
import Heading from "./Heading.vue";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  parameters: {
    docs: {
      description: {
        component: [
          "Заголовок. **Уровень** (`level` → h1…h6, структура для скринридера) и **размер** (`size` → стиль `type/*`) независимы.",
          "",
          "- `hero` — первый экран, плавно 32 → 64px; `display`, `lg`, `md`, `sm` — стили Figma.",
          "- По умолчанию размер — по уровню: h1 → display, h2 → lg, h3 → md, h4–h6 → sm.",
          "- Длинные заголовки переносятся сбалансированно (`text-wrap: balance`).",
        ].join("\n"),
      },
    },
  },
  args: { level: 2 },
  argTypes: {
    level: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    size: { control: "inline-radio", options: [undefined, "hero", "display", "lg", "md", "sm"] },
    default: { control: false },
  },
  render: (args) => ({
    components: { Heading },
    setup: () => ({ args }),
    template: '<Heading v-bind="args">Свежие продукты с доставкой за 30 минут</Heading>',
  }),
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toBeVisible();
  },
};

/** Шкала заголовков и текста — на фоне страницы. */
export const Scale: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { Heading, Text, Divider },
    template: `
      <div style="display: grid; gap: var(--space-4)">
        <Heading :level="1" size="hero">Hero — первый экран</Heading>
        <Heading :level="2" size="display">Display 32/38</Heading>
        <Heading :level="2">Heading lg 24/30</Heading>
        <Heading :level="3">Heading md 20/26</Heading>
        <Heading :level="4">Heading sm 16/22</Heading>
        <Divider />
        <Text>Body lg 16/24 — основной текст на мобильном.</Text>
        <Text size="md" tone="secondary">Body md 14/20, secondary — пояснения.</Text>
        <Text size="sm" tone="tertiary">Body sm 12/16, tertiary — мета-информация.</Text>
        <Text size="caption" tone="tertiary">Caption 11/14</Text>
        <Text size="sm" tone="danger">Danger — текст ошибки</Text>
      </div>
    `,
  }),
};

const m = themeMatrix(Scale);
export const ScaleGlassDark = m.glassDark;
export const ScaleGlassLight = m.glassLight;
export const ScaleNeutralLight = m.neutralLight;
export const ScaleNeutralDark = m.neutralDark;
