import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, ref } from "vue";
import { expect, waitFor } from "storybook/test";
import { DataTable, Grid, Heading, PeriodSelect, Stack, parseDay, periodDays, resolvePeriod, type Period } from "@uix/ui";
import BarChart from "../components/BarChart.vue";
import ChartCard from "../components/ChartCard.vue";
import Heatmap from "../components/Heatmap.vue";
import LineChart from "../components/LineChart.vue";
import Meter from "../components/Meter.vue";
import StatTile from "../components/StatTile.vue";
import { HOURS, monthly, sessionsByHour, topPages, WEEKDAYS, wave } from "./data";

const NOW = new Date(2026, 8, 24);
const rub = { style: "currency", currency: "RUB", maximumFractionDigits: 0 } as const;

/** Данные периода: дни от from до to, детерминированно */
function series(period: Period) {
  const n = periodDays(period);
  const start = parseDay(period.from);
  return Array.from({ length: n }, (_, i) => ({
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    revenue: wave(i, 180_000, 900, 24_000, 1),
    organic: wave(i, 4200, 20, 600, 2),
    ads: wave(i, 2600, -5, 700, 5),
  }));
}

const meta = {
  title: "Charts/Dashboard",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Сборка дашборда SaaS из `@uix/ui` и `@uix/charts`: **одна строка фильтров над всем**, ряд KPI на `Grid`, графики в `ChartCard`, таблица. Смена периода — все графики перетекают на пружине. Mobile-first: на 390px всё в одну колонку.",
      },
    },
  },
  tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => ({
    components: { BarChart, ChartCard, DataTable, Grid, Heading, Heatmap, LineChart, Meter, PeriodSelect, Stack, StatTile },
    setup: () => {
      const period = ref<Period>(resolvePeriod("30d", NOW));
      const data = computed(() => series(period.value));
      const total = computed(() => data.value.reduce((s, d) => s + d.revenue, 0));
      const visits = computed(() => data.value.reduce((s, d) => s + d.organic + d.ads, 0));
      const pages = topPages.map((p) => ({ ...p, id: p.page }));
      return { period, data, total, visits, rub, NOW, monthly, WEEKDAYS, HOURS, sessionsByHour, topPages, pages };
    },
    template: `
      <Stack gap="6">
        <Stack gap="4">
          <Heading :level="1" size="md">Обзор</Heading>
          <div style="max-inline-size: 720px"><PeriodSelect v-model="period" :now="NOW" /></div>
        </Stack>

        <Grid min="sm" :columns="4" gap="3">
          <StatTile label="Выручка" :value="total" :value-format="rub" :delta="0.124" delta-label="к прошлому периоду" :trend="data.map(d => d.revenue)" />
          <StatTile label="Визиты" :value="visits" :delta="0.057" delta-label="к прошлому периоду" :series="3" :trend="data.map(d => d.organic + d.ads)" />
          <StatTile label="Конверсия" :value="0.034" :value-format="{ style: 'percent', maximumFractionDigits: 1 }" :delta="-0.004" delta-label="к прошлому периоду" />
          <StatTile label="Отток" :value="0.042" :value-format="{ style: 'percent', maximumFractionDigits: 1 }" :delta="0.08" delta-label="к прошлому периоду" :up-is-good="false" />
        </Grid>

        <Grid min="lg" :columns="2" gap="3">
          <ChartCard :heading-level="2" title="Выручка" description="По дням за период">
            <LineChart :data="data" x="date" :series="[{ key: 'revenue', label: 'Выручка' }]" area :value-format="rub" />
          </ChartCard>
          <ChartCard :heading-level="2" title="Визиты по источникам" description="По дням за период">
            <LineChart :data="data" x="date" :series="[{ key: 'organic', label: 'Поиск' }, { key: 'ads', label: 'Реклама' }]" :value-format="{ maximumFractionDigits: 0 }" />
          </ChartCard>
          <ChartCard :heading-level="2" title="Выручка по каналам" description="2026, тыс. ₽">
            <BarChart :data="monthly" x="month" x-label="Месяц" stacked :series="[{ key: 'web', label: 'Сайт' }, { key: 'mobile', label: 'Приложение' }, { key: 'partners', label: 'Партнёры' }]" />
          </ChartCard>
          <ChartCard :heading-level="2" title="Активность по часам" description="Сессии">
            <Heatmap :rows="WEEKDAYS" :columns="HOURS" :values="sessionsByHour" row-label="День" value-label="Сессии" />
          </ChartCard>
        </Grid>

        <Grid min="lg" :columns="2" gap="3">
          <ChartCard :heading-level="2" title="Популярные страницы" description="Просмотры">
            <BarChart :data="topPages" x="page" x-label="Страница" orientation="horizontal" :series="[{ key: 'views', label: 'Просмотры' }]" :value-format="{ maximumFractionDigits: 0 }" />
          </ChartCard>
          <ChartCard :heading-level="2" title="Лимиты тарифа" description="Бизнес">
            <Stack gap="5">
              <Meter label="Участники" :value="18" :max="25" />
              <Meter label="Запросы API" :value="86_400" :max="100_000" />
              <Meter label="Хранилище" :value="42" :max="100" :value-format="(v) => v + ' ГБ'" />
            </Stack>
          </ChartCard>
        </Grid>

        <DataTable
          caption="Страницы"
                    row-key="id"
          :rows="pages"
          :columns="[{ key: 'page', label: 'Страница', sortable: true }, { key: 'views', label: 'Просмотры', numeric: true, sortable: true, format: (v) => new Intl.NumberFormat('ru-RU').format(v) }]"
        />
      </Stack>
    `,
  }),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getAllByRole("figure").length).toBeGreaterThanOrEqual(6));
  },
};
