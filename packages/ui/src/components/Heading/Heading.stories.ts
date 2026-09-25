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
          "- `hero` — первый экран, плавно 32 → 64px; `display`, `l`, `m`, `s` — стили Figma.",
          "- По умолчанию размер — по уровню: h1 → display, h2 → l, h3 → m, h4–h6 → s.",
          "- Длинные заголовки переносятся сбалансированно (`text-wrap: balance`).",
        ].join("\n"),
      },
    },
  },
  args: { level: 2 },
  argTypes: {
    level: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    size: { control: "inline-radio", options: [undefined, "hero", "display", "l", "m", "s"] },
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
        <Heading :level="2">Heading l 24/30</Heading>
        <Heading :level="3">Heading m 20/26</Heading>
        <Heading :level="4">Heading s 16/22</Heading>
        <Divider />
        <Text size="l">Body l 18/28 — лид, вводный абзац.</Text>
        <Text>Body m 16/24 — основной текст.</Text>
        <Text size="s" tone="secondary">Body s 14/20, secondary — пояснения, таблицы.</Text>
        <Text size="xs" tone="tertiary">Body xs 12/16, tertiary — мета-информация.</Text>
        <Text size="caption" tone="tertiary">Caption 11/14</Text>
        <Text size="xs" tone="danger">Danger — текст ошибки</Text>
      </div>
    `,
  }),
};

const m = themeMatrix(Scale);
export const ScaleGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const ScaleGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const ScaleNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const ScaleNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
