import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { Card } from "@uix/ui";
import { revenue } from "../stories/data";
import Sparkline from "./Sparkline.vue";

const meta = {
  title: "Charts/Sparkline",
  component: Sparkline,
  parameters: {
    docs: {
      description: {
        component:
          "Форма тренда без осей — в KPI и строках таблиц. Цвет — слот серии, не статус (хорошо/плохо сообщает дельта с иконкой). Скринридер получает одну фразу: начало, конец, минимум, максимум.",
      },
    },
  },
  args: {
    data: revenue.map((d) => d.revenue),
    label: "Выручка за 30 дней",
    series: 1,
    area: true,
    valueFormat: { style: "currency", currency: "RUB", maximumFractionDigits: 0 },
  },
  argTypes: {
    series: { control: { type: "range", min: 1, max: 8 } },
    data: { control: false },
    valueFormat: { control: false },
  },
  render: (args) => ({
    components: { Sparkline },
    setup: () => ({ args }),
    template: `<div style="max-inline-size: 240px"><Sparkline v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("img", { name: /^Выручка за 30 дней: от .+ до .+, минимум .+, максимум/ })).toBeVisible();
  },
};

export const WithoutArea: Story = { args: { area: false, series: 3 } };

/** Мини-столбики (встроенный график bento): все приглушены, выделенный — chart/highlight; по умолчанию последний. */
export const Bars: Story = {
  args: { variant: "bars", data: revenue.slice(-12).map((d) => d.revenue), highlight: 8 },
  play: async ({ canvasElement }) => {
    const bars = canvasElement.querySelectorAll(".ui-sparkline__bar");
    await expect(bars).toHaveLength(12);
    await expect(bars[8]).toHaveAttribute("data-highlighted");
    await expect(canvasElement.querySelectorAll(".ui-sparkline__bar[data-highlighted]")).toHaveLength(1);
  },
};

/** На инвертированной плашке выделение — цвет-хайлайт проекта (spotlight), линия `accent` — тем же цветом. */
export const OnInverted: Story = {
  name: "On inverted card",
  render: (args) => ({
    components: { Card, Sparkline },
    setup: () => ({ args, bars: revenue.slice(-12).map((d) => d.revenue) }),
    template: `
      <div style="display: grid; gap: var(--space-3); max-inline-size: 280px">
        <Card tone="inverted"><Sparkline :data="bars" label="Выручка, 12 дней" variant="bars" /></Card>
        <Card tone="inverted"><Sparkline v-bind="args" accent /></Card>
      </div>
    `,
  }),
};
