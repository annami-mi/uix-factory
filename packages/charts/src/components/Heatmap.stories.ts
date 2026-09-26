import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { HOURS, sessionsByHour, WEEKDAYS } from "../stories/data";
import ChartCard from "./ChartCard.vue";
import Heatmap from "./Heatmap.vue";

const meta = {
  title: "Charts/Heatmap",
  component: Heatmap,
  parameters: {
    docs: {
      description: {
        component: [
          "Величина на сетке двух измерений. Последовательная шкала одного оттенка (7 классов, `color/chart/sequential/*`, в тёмной схеме якорь перевёрнут), зазор 2px, легенда шкалы со значениями концов.",
          "",
          "- Ячейка квадратная, от ширины (≤ size/40); подписи колонок прореживаются на узком экране.",
          "- Появление — волной по диагонали; смена данных — цвет перетекает.",
          "- Клавиатура: Tab, стрелки по двум осям, Home/End по строке. Табличный двойник — в ChartCard.",
        ].join("\n"),
      },
    },
  },
  args: {
    rows: WEEKDAYS,
    columns: HOURS,
    values: sessionsByHour,
    rowLabel: "День",
    valueLabel: "Сессии",
    valueFormat: { maximumFractionDigits: 0 },
  },
  argTypes: { rows: { control: false }, columns: { control: false }, values: { control: false }, valueFormat: { control: false } },
  render: (args) => ({
    components: { Heatmap, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Активность по часам" description="Сессии, август 2026">
        <Heatmap v-bind="args" />
      </ChartCard>
    `,
  }),
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const plot = await canvas.findByRole("group", { name: /Активность по часам/ });
    plot.focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    await waitFor(() => expect(canvas.getByText(/^Вт, 23: Сессии \d+/)).toBeInTheDocument());
  },
};

export const TableView: Story = {
  name: "Table view",
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Показать таблицей" }));
    const table = await canvas.findByRole("table", { name: "Активность по часам" });
    await expect(table.querySelectorAll("tbody tr")).toHaveLength(7);
  },
};

const m = themeMatrix(Default);
export const GlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const GlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const NeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const NeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const BentoLight = { ...m.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
