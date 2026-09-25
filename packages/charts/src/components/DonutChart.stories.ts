import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { Button, Stack } from "@uix/ui";
import { sources } from "../stories/data";
import ChartCard from "./ChartCard.vue";
import DonutChart from "./DonutChart.vue";

const meta = {
  title: "Charts/DonutChart",
  component: DonutChart,
  parameters: {
    docs: {
      description: {
        component: [
          "Доля от целого «одним взглядом». Методика ADR-0007: **не больше 6 сегментов** — хвост сворачивается в «Другое»; по убыванию; тонкое кольцо (толщина — size/chart/bar), зазор 2px. Близкие значения сравнивать — BarChart.",
          "",
          "- В центре — итог; наведение, касание или стрелки — выбранная доля в центре, остальные приглушены.",
          "- Легенда — прямые подписи: цвет, название, доля, значение. Табличный двойник — в ChartCard.",
          "- Появление — сегменты заметаются по кругу; смена данных — перетекают на пружине.",
          "- В узком контейнере легенда под кольцом, в широком — справа.",
        ].join("\n"),
      },
    },
  },
  args: {
    data: sources,
    x: "source",
    value: "visits",
    xLabel: "Источник",
    valueLabel: "Визиты",
    valueFormat: { maximumFractionDigits: 0 },
    maxSegments: 6,
    height: "md",
  },
  argTypes: {
    height: { control: "inline-radio", options: ["sm", "md", "lg"] },
    maxSegments: { control: { type: "range", min: 2, max: 6 } },
    data: { control: false },
    valueFormat: { control: false },
  },
  render: (args) => ({
    components: { DonutChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Источники трафика" description="Визиты за август">
        <DonutChart v-bind="args" />
      </ChartCard>
    `,
  }),
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 8 источников → 5 крупных + «Другое». Клавиатура — доли по очереди, в центре — выбранная. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ui-donut__segment")).toHaveLength(6));
    await expect(canvas.getByText("Другое")).toBeInTheDocument();
    const plot = canvas.getByRole("group", { name: /Источники трафика/ });
    plot.focus();
    await waitFor(() => expect(canvas.getByText(/^Поиск: 48 200, 45,\d %/)).toBeInTheDocument());
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(canvas.getByText(/^Другое: 4 700/)).toBeInTheDocument());
  },
};

export const TableView: Story = {
  name: "Table view",
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Показать таблицей" }));
    const table = await canvas.findByRole("table", { name: "Источники трафика" });
    await expect(table.querySelectorAll("tbody tr")).toHaveLength(6);
  },
};

/** Смена периода — сегменты перетекают. */
export const DataSwitch: Story = {
  name: "Data switch (animated)",
  render: (args) => ({
    components: { DonutChart, ChartCard, Button, Stack },
    setup: () => {
      const july = sources.map((s, i) => ({ ...s, visits: Math.round(s.visits * (1 + ((i % 3) - 1) * 0.35)) }));
      const month = ref<"jul" | "aug">("aug");
      return { args, month, july, sources };
    },
    template: `
      <Stack gap="4">
        <Stack direction="horizontal" gap="2">
          <Button :variant="month === 'jul' ? 'primary' : 'secondary'" @click="month = 'jul'">Июль</Button>
          <Button :variant="month === 'aug' ? 'primary' : 'secondary'" @click="month = 'aug'">Август</Button>
        </Stack>
        <ChartCard title="Источники трафика" :description="month === 'jul' ? 'Визиты за июль' : 'Визиты за август'">
          <DonutChart v-bind="args" :data="month === 'jul' ? july : sources" />
        </ChartCard>
      </Stack>
    `,
  }),
};

export const Empty: Story = {
  args: { data: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Нет данных за этот период")).toBeVisible();
  },
};

const m = themeMatrix(Default);
export const GlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const GlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const NeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const NeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
