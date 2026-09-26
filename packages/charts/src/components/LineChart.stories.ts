import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../ui/.storybook/story-helpers";
import { Button, Stack } from "@uix/ui";
import { revenue, traffic, days, wave } from "../stories/data";
import ChartCard from "./ChartCard.vue";
import LineChart from "./LineChart.vue";

const rub = { style: "currency", currency: "RUB", maximumFractionDigits: 0 } as const;

const meta = {
  title: "Charts/LineChart",
  component: LineChart,
  parameters: {
    docs: {
      description: {
        component: [
          "Тренд во времени. Методика ADR-0007: линия 2px, точки ≥ 8px с кольцом в цвет фона, сплошная тонкая сетка, **одна ось Y**, легенда при ≥ 2 сериях (кнопки скрыть/показать — цвета не перекрашиваются).",
          "",
          "- **Анимация:** линия прорисовывается при появлении; при смене данных значения и шкала перетекают на пружине.",
          "- **Перекрестье** прилипает к ближайшей дате, подсказка — все серии; на телефоне — вести пальцем.",
          "- **Клавиатура:** Tab на график, ←/→/Home/End; значения читает живой регион.",
          "- **Таблица:** кнопка в ChartCard — тот же набор данных строками.",
          "- `area` — подложка 10%; `emphasis` — выделить одну серию, остальные — серым.",
        ].join("\n"),
      },
    },
  },
  args: {
    data: revenue,
    x: "date",
    series: [{ key: "revenue", label: "Выручка" }],
    area: true,
    valueFormat: rub,
    height: "m",
    curve: "smooth",
  },
  argTypes: {
    height: { control: "inline-radio", options: ["s", "m", "l"] },
    curve: { control: "inline-radio", options: ["smooth", "linear"] },
    data: { control: false },
    series: { control: false },
    valueFormat: { control: false },
    axisFormat: { control: false },
    xFormat: { control: false },
  },
  render: (args) => ({
    components: { LineChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Выручка" description="Август 2026, по дням">
        <LineChart v-bind="args" />
      </ChartCard>
    `,
  }),
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Одна серия с подложкой: легенды нет — серию называет заголовок. */
export const Revenue: Story = {
  play: async ({ canvas }) => {
    const plot = await canvas.findByRole("group", { name: /Выручка/ });
    await expect(canvas.queryByRole("list")).toBeNull(); // одна серия — без легенды
    // Клавиатура: фокус ставит перекрестье на последнюю точку, ← — на предыдущую
    plot.focus();
    await waitFor(() => expect(canvas.getByText(/^30 авг\.: Выручка/)).toBeInTheDocument());
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(canvas.getByText(/^29 авг\.: Выручка/)).toBeInTheDocument());
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(canvas.getByText(/^1 авг\.: Выручка/)).toBeInTheDocument());
  },
};

/** Несколько серий: легенда — кнопки, скрытие серии не перекрашивает остальные. */
export const Traffic: Story = {
  args: {
    data: traffic,
    area: false,
    valueFormat: { maximumFractionDigits: 0 },
    series: [
      { key: "organic", label: "Поиск" },
      { key: "ads", label: "Реклама" },
      { key: "social", label: "Соцсети" },
      { key: "email", label: "Рассылка" },
    ],
  },
  render: (args) => ({
    components: { LineChart, ChartCard },
    setup: () => ({ args }),
    template: `
      <ChartCard title="Визиты по источникам" description="Август 2026">
        <LineChart v-bind="args" />
      </ChartCard>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    const ads = await canvas.findByRole("button", { name: "Реклама" });
    await expect(ads).toHaveAttribute("aria-pressed", "true");
    const colorBefore = getComputedStyle(canvasElement.querySelectorAll(".ui-chart-legend__swatch")[2]!).backgroundColor;
    await userEvent.click(ads);
    await expect(ads).toHaveAttribute("aria-pressed", "false");
    // «Соцсети» сохраняет свой цвет после скрытия «Рекламы»
    await expect(getComputedStyle(canvasElement.querySelectorAll(".ui-chart-legend__swatch")[2]!).backgroundColor).toBe(colorBefore);
    await expect(canvasElement.querySelectorAll(".ui-line-chart__line")).toHaveLength(3);
  },
};

/** Выделение: одна серия — цветом, остальные — серым контекстом. */
export const Emphasis: Story = {
  args: { ...Traffic.args, emphasis: "organic" },
  render: Traffic.render,
};

/** Табличный двойник: те же данные строками. */
export const TableView: Story = {
  name: "Table view",
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Показать таблицей" }));
    const table = await canvas.findByRole("table", { name: "Выручка" });
    await expect(table.querySelectorAll("tbody tr")).toHaveLength(30);
    await expect(canvas.getByRole("button", { name: "Показать графиком" })).toBeVisible();
  },
};

/** Смена периода: значения и шкала перетекают на пружине; перезагрузка — прежний график приглушён. */
export const PeriodSwitch: Story = {
  name: "Period switch (animated)",
  render: (args) => ({
    components: { LineChart, ChartCard, Button, Stack },
    setup: () => {
      const week = days(7).map((date, i) => ({ date, revenue: wave(i, 90_000, 8_000, 18_000, 4) }));
      const period = ref<"month" | "week">("month");
      const loading = ref(false);
      const switchTo = (p: "month" | "week") => {
        loading.value = true;
        setTimeout(() => ((period.value = p), (loading.value = false)), 400);
      };
      return { args, week, period, loading, switchTo, revenue };
    },
    template: `
      <Stack gap="4">
        <Stack direction="horizontal" gap="2">
          <Button :variant="period === 'month' ? 'primary' : 'secondary'" @click="switchTo('month')">30 дней</Button>
          <Button :variant="period === 'week' ? 'primary' : 'secondary'" @click="switchTo('week')">7 дней</Button>
        </Stack>
        <ChartCard title="Выручка" :description="period === 'month' ? 'Последние 30 дней' : 'Последние 7 дней'" :loading="loading">
          <LineChart v-bind="args" :data="period === 'month' ? revenue : week" />
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

const m = themeMatrix(Traffic);
export const TrafficGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const TrafficGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const TrafficNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const TrafficNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
export const TrafficBentoLight = { ...m.bentoLight, tags: ["!dev", "!autodocs"] };
