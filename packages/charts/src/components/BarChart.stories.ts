import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { Button, Stack } from "@uix/ui";
import { monthly, topPages } from "../stories/data";
import BarChart from "./BarChart.vue";
import ChartCard from "./ChartCard.vue";

const rubK = (v: number) => `${new Intl.NumberFormat("ru-RU").format(v)} тыс. ₽`;
const channels = [
  { key: "web", label: "Сайт" },
  { key: "mobile", label: "Приложение" },
  { key: "partners", label: "Партнёры" },
];

const meta = {
  title: "Charts/BarChart",
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component: [
          "Сравнение величин по категориям. Методика ADR-0007: столбец ≤ 24px, остальное — воздух; конец скруглён 4px, у базовой линии — прямой угол; между соседними столбцами и сегментами стека — зазор 2px в цвет фона (без обводок).",
          "",
          "- **Анимация:** столбцы вырастают волной; смена данных и скрытие серии — перетекание на пружине (сегменты стека оседают).",
          "- **Наведение / касание** — подложка категории и подсказка по всем сериям (у стека — итог).",
          "- **Клавиатура:** Tab на график, стрелки, Home/End; значения читает живой регион.",
          "- `orientation=\"horizontal\"` — длинные подписи и рейтинги: высота растёт по числу строк, подписи обрезаются многоточием (полные — в подсказке и таблице).",
          "- Одна серия — один цвет у всех столбцов (не градиент по величине).",
        ].join("\n"),
      },
    },
  },
  args: {
    data: monthly,
    x: "month",
    series: [{ key: "web", label: "Сайт" }],
    xLabel: "Месяц",
    valueFormat: rubK,
    orientation: "vertical",
    stacked: false,
    height: "md",
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    height: { control: "inline-radio", options: ["sm", "md", "lg"] },
    data: { control: false },
    series: { control: false },
    valueFormat: { control: false },
    axisFormat: { control: false },
    xFormat: { control: false },
  },
  render: (args) => ({
    components: { BarChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Выручка сайта" description="2026, тыс. ₽ по месяцам">
        <BarChart v-bind="args" />
      </ChartCard>
    `,
  }),
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Одна серия: один цвет, без легенды. Клавиатура — по категориям. */
export const Single: Story = {
  play: async ({ canvas, canvasElement }) => {
    const plot = await canvas.findByRole("group", { name: /Выручка сайта/ });
    await expect(canvas.queryByRole("list")).toBeNull();
    await waitFor(() => expect(canvasElement.querySelectorAll(".ui-bar-chart__bar")).toHaveLength(12));
    plot.focus();
    await waitFor(() => expect(canvas.getByText(/^Янв: Сайт/)).toBeInTheDocument());
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(canvas.getByText(/^Дек: Сайт/)).toBeInTheDocument());
  },
};

/** Группа: серии рядом, зазор 2px, легенда-переключатель. */
export const Grouped: Story = {
  args: { series: channels },
  render: (args) => ({
    components: { BarChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Выручка по каналам" description="2026, тыс. ₽">
        <BarChart v-bind="args" />
      </ChartCard>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ui-bar-chart__bar")).toHaveLength(36));
    await userEvent.click(await canvas.findByRole("button", { name: "Приложение" }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".ui-bar-chart__bar")).toHaveLength(24));
  },
};

/** Стек: часть целого, итог — в подсказке и таблице; скрытая серия сжимается, верхние оседают. */
export const Stacked: Story = {
  args: { series: channels, stacked: true },
  render: Grouped.render,
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Показать таблицей" }));
    const table = await canvas.findByRole("table", { name: "Выручка по каналам" });
    await expect(table.querySelectorAll("thead th")).toHaveLength(5); // месяц, 3 канала, итог
  },
};

/** Выделение одной серии в группе: остальные — серым контекстом. */
export const Emphasis: Story = {
  args: { series: channels, emphasis: "mobile" },
  render: Grouped.render,
};

/** Горизонтальные полосы: рейтинг с длинными подписями; высота — по числу строк. */
export const Horizontal: Story = {
  args: {
    data: topPages,
    x: "page",
    xLabel: "Страница",
    series: [{ key: "views", label: "Просмотры" }],
    orientation: "horizontal",
    valueFormat: { maximumFractionDigits: 0 },
  },
  render: (args) => ({
    components: { BarChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Популярные страницы" description="Просмотры за август">
        <BarChart v-bind="args" />
      </ChartCard>
    `,
  }),
  play: async ({ canvas }) => {
    const plot = await canvas.findByRole("group", { name: /Популярные страницы/ });
    plot.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByText(/^\/: Просмотры/)).toBeInTheDocument());
  },
};

/** Смена данных: столбцы перетекают на пружине, шкала — вслед. */
export const DataSwitch: Story = {
  name: "Data switch (animated)",
  args: { series: channels, stacked: true },
  render: (args) => ({
    components: { BarChart, ChartCard, Button, Stack },
    setup: () => {
      const half = ref<"h1" | "h2">("h1");
      const data = () => (half.value === "h1" ? monthly.slice(0, 6) : monthly.slice(6));
      return { args, half, data };
    },
    template: `
      <Stack gap="4">
        <Stack direction="horizontal" gap="2">
          <Button :variant="half === 'h1' ? 'primary' : 'secondary'" @click="half = 'h1'">I полугодие</Button>
          <Button :variant="half === 'h2' ? 'primary' : 'secondary'" @click="half = 'h2'">II полугодие</Button>
        </Stack>
        <ChartCard title="Выручка по каналам" :description="half === 'h1' ? 'Январь — июнь' : 'Июль — декабрь'">
          <BarChart v-bind="args" :data="data()" />
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

const m = themeMatrix(Stacked);
export const StackedGlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const StackedGlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const StackedNeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const StackedNeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
