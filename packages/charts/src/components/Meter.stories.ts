import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { Card, Stack } from "@uix/ui";
import Meter from "./Meter.vue";

const meta = {
  title: "Charts/Meter",
  component: Meter,
  parameters: {
    docs: {
      description: {
        component:
          "Заполнение лимита, квоты, места (`role=\"meter\"`). У порогов `warning`/`critical` — статус иконкой и текстом, заливка — токен статуса графиков. Заливка растёт при появлении и перетекает при смене значения.",
      },
    },
  },
  args: { label: "Хранилище", value: 42, max: 100, valueFormat: (v: number) => `${v} ГБ`, warning: 0.8, critical: 0.95 },
  argTypes: { valueFormat: { control: false }, value: { control: { type: "range", min: 0, max: 100 } } },
  render: (args) => ({
    components: { Meter },
    setup: () => ({ args }),
    template: `<div style="max-inline-size: 360px"><Meter v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const meter = await canvas.findByRole("meter", { name: "Хранилище" });
    await expect(meter).toHaveAttribute("aria-valuetext", "42 ГБ из 100 ГБ");
  },
};

/** Все уровни: норма, предупреждение, исчерпан. */
export const Levels: Story = {
  render: () => ({
    components: { Meter, Card, Stack },
    template: `
      <Card style="max-inline-size: 400px">
        <Stack gap="5">
          <Meter label="Участники" :value="7" :max="10" />
          <Meter label="Запросы API" :value="86_400" :max="100_000" />
          <Meter label="Хранилище" :value="99" :max="100" :value-format="(v) => v + ' ГБ'" />
        </Stack>
      </Card>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("meter", { name: "Хранилище" })).toHaveAttribute(
      "aria-valuetext",
      "99 ГБ из 100 ГБ. Лимит исчерпан",
    );
  },
};

const m = themeMatrix(Levels);
export const LevelsGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const LevelsGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const LevelsNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const LevelsNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
