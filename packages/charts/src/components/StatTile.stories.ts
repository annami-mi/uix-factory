import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { Button, Grid, Stack } from "@uix/ui";
import { revenue, traffic } from "../stories/data";
import StatTile from "./StatTile.vue";

const rub = { style: "currency", currency: "RUB", maximumFractionDigits: 0 } as const;

const meta = {
  title: "Charts/StatTile",
  component: StatTile,
  parameters: {
    docs: {
      description: {
        component: [
          "Плитка KPI: «число и есть график». Значение — пропорциональные цифры, при появлении и смене — счётчик на пружине (скринридер читает итог).",
          "",
          "- **Дельта** знает, хорошо ли «вверх» (`upIsGood`): рост оттока — плохо. Смысл — иконкой и текстом, не только цветом.",
          "- **Ряд KPI** — `Grid min=\"sm\"` из `@uix/ui`: 1–2 колонки на телефоне, 4 на десктопе, без медиа-запросов.",
          "- `loading` — прежнее значение приглушено, без скелетона.",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Выручка",
    value: 6_284_300,
    valueFormat: rub,
    delta: 0.124,
    deltaLabel: "к июлю",
    upIsGood: true,
    trend: revenue.map((d) => d.revenue),
    loading: false,
  },
  argTypes: { valueFormat: { control: false }, trend: { control: false } },
  render: (args) => ({
    components: { StatTile },
    setup: () => ({ args }),
    template: `<div style="max-inline-size: 320px"><StatTile v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/\+12,4\s?% к июлю — хорошо/)).toBeInTheDocument();
  },
};

/** Рост — плохо: отток вырос, дельта красная со стрелкой вверх. */
export const UpIsBad: Story = {
  name: "Up is bad (churn)",
  args: {
    label: "Отток",
    value: 0.042,
    valueFormat: { style: "percent", maximumFractionDigits: 1 },
    delta: 0.08,
    upIsGood: false,
    trend: undefined,
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/— плохо$/)).toBeInTheDocument();
  },
};

/** Ряд KPI на Grid: смена периода — счётчики перетекают. */
export const KpiRow: Story = {
  name: "KPI row",
  render: () => ({
    components: { StatTile, Grid, Button, Stack },
    setup: () => {
      const week = ref(false);
      const sum = (key: "organic" | "ads") => traffic.slice(week.value ? -7 : 0).reduce((s, d) => s + d[key], 0);
      return { week, sum, rub, revenue, traffic };
    },
    template: `
      <Stack gap="4">
        <Stack direction="horizontal" gap="2">
          <Button :variant="week ? 'secondary' : 'primary'" @click="week = false">30 дней</Button>
          <Button :variant="week ? 'primary' : 'secondary'" @click="week = true">7 дней</Button>
        </Stack>
        <Grid min="sm" :columns="4" gap="3">
          <StatTile label="Выручка" :value="week ? 1_512_900 : 6_284_300" :value-format="rub" :delta="week ? 0.031 : 0.124" delta-label="к прошлому периоду" :trend="revenue.slice(week ? -7 : 0).map(d => d.revenue)" />
          <StatTile label="Визиты из поиска" :value="sum('organic')" :delta="week ? -0.018 : 0.057" delta-label="к прошлому периоду" :series="3" :trend="traffic.slice(week ? -7 : 0).map(d => d.organic)" />
          <StatTile label="Конверсия" :value="week ? 0.036 : 0.034" :value-format="{ style: 'percent', maximumFractionDigits: 1 }" :delta="0" delta-label="к прошлому периоду" />
          <StatTile label="Отток" :value="week ? 0.047 : 0.042" :value-format="{ style: 'percent', maximumFractionDigits: 1 }" :delta="week ? 0.12 : 0.08" delta-label="к прошлому периоду" :up-is-good="false" />
        </Grid>
      </Stack>
    `,
  }),
};

const m = themeMatrix(KpiRow);
export const KpiGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const KpiGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const KpiNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const KpiNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
