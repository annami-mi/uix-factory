import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { AppShell, Badge, Button, Card, DataTable, Grid, Heading, IconButton, SidebarPanel, Stack, Tabs, Text, type NavGroup } from "@uix/ui";
import { ChartLine, House, LifeBuoy, Settings, Wallet, ArrowLeftRight, Landmark } from "@lucide/vue";
import { ref } from "vue";
import BarChart from "../components/BarChart.vue";
import ChartCard from "../components/ChartCard.vue";
import Sparkline from "../components/Sparkline.vue";
import StatTile from "../components/StatTile.vue";
import { monthly, revenue, traffic, wave } from "./data";

/*
 * Витрина стилистики bento-contrast (паспорт — docs/reference-library.md; референсы —
 * docs/reference-images/bento-contrast: Portfolio, Client Dashboard, PayWave). Собрано только из компонентов
 * кита: белые карточки на серой странице, инвертированные плашки (Card/StatTile tone="inverted"),
 * встроенные мини-графики (Sparkline variant="bars"), чипы spotlight (Badge tone="spotlight").
 * Цвет-хайлайт — тулбар «Акцент» (data-accent, LookRecipe.accentColor), шрифт — «Шрифты».
 */
const rub = { style: "currency", currency: "RUB", maximumFractionDigits: 0 } as const;
const week = (seed: number, base: number) => Array.from({ length: 12 }, (_, i) => wave(i, base, base / 60, base / 4, seed));

const holdings = [
  { id: "sber", name: "Сбер", ticker: "SBER", value: 198_400, delta: "+5,6 %", trend: week(2, 300) },
  { id: "yndx", name: "Яндекс", ticker: "YDEX", value: 144_200, delta: "+2,1 %", trend: week(5, 400) },
  { id: "ofz", name: "ОФЗ 26238", ticker: "SU26238", value: 91_700, delta: "+0,4 %", trend: week(7, 200) },
];
const money = new Intl.NumberFormat("ru-RU", rub);

const meta = {
  title: "Стилистики/Bento-contrast",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Светлая bento-сетка белых карточек, чёрные акцентные плашки и один яркий цвет-хайлайт проекта (ADR-0008, паспорт `bento-contrast`). Тёмной схемы пока нет — `data-scheme=\"dark\"` показывает светлую (исключение из ADR-0005).",
          "",
          "- **Инвертированная плашка** — `Card` / `StatTile` `tone=\"inverted\"`: вложенные компоненты сами получают светлый текст, сетку графиков и цвет выделения.",
          "- **Встроенный график** — `Sparkline variant=\"bars\"`: столбики без осей, выделенный — чёрный на белом, spotlight на чёрном.",
          "- **Цвет-хайлайт** — `Badge tone=\"spotlight\"` и выделение графиков; выбирается пресетом (`data-accent`, тулбар «Акцент»).",
        ].join("\n"),
      },
    },
  },
  globals: { theme: "bento-contrast", scheme: "light", viewport: { value: "desktop1440", isRotated: false } },
  tags: ["!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Portfolio: Story = {
  name: "Портфель",
  render: () => ({
    components: { Badge, BarChart, Button, Card, ChartCard, DataTable, Grid, Heading, Sparkline, Stack, StatTile, Tabs, Text },
    setup: () => ({
      rub,
      money,
      holdings,
      monthly,
      revenueTrend: revenue.map((d) => d.revenue),
      visits: traffic.slice(-12).map((d) => d.organic),
      weekBars: week(3, 900),
      tabs: [
        { value: "overview", label: "Обзор" },
        { value: "assets", label: "Активы" },
      ],
      rows: holdings.map((h) => ({ id: h.id, name: h.name, ticker: h.ticker, value: h.value })),
      columns: [
        { key: "name", label: "Актив", sortable: true },
        { key: "ticker", label: "Тикер" },
        { key: "value", label: "Стоимость", numeric: true, sortable: true, format: (v: unknown) => money.format(v as number) },
      ],
    }),
    template: `
      <Stack gap="6">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4)">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-6)">
            <Heading :level="1" size="display">Портфель</Heading>
            <Tabs :items="tabs" label="Раздел портфеля" />
          </div>
          <Stack direction="horizontal" gap="2">
            <Button variant="secondary">Инвест-план</Button>
            <Button>Добавить</Button>
          </Stack>
        </div>

        <Grid min="s" :columns="4" gap="3">
          <StatTile label="Брокерский счёт" :value="42500" :value-format="rub" :delta="0.059" delta-label="за неделю" :trend="weekBars" trend-variant="bars" />
          <StatTile label="ИИС" :value="56200" :value-format="rub" :delta="0.031" delta-label="за неделю" :trend="revenueTrend" tone="inverted" />
          <StatTile label="Вклады" :value="82250" :value-format="rub" :delta="0.012" delta-label="за неделю" :trend="visits" trend-variant="bars" />
          <StatTile label="Крипто" :value="120250" :value-format="rub" :delta="-0.042" delta-label="за неделю" :trend="weekBars" trend-variant="bars" tone="inverted" />
        </Grid>

        <Grid min="l" :columns="2" gap="3">
          <ChartCard :heading-level="2" title="Общий баланс" description="2026, тыс. ₽ по месяцам">
            <BarChart :data="monthly" x="month" x-label="Месяц" :series="[{ key: 'web', label: 'Баланс' }]" />
          </ChartCard>

          <Card tone="inverted" padding="l" as="section" aria-labelledby="holdings-title">
            <Stack gap="4">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-2)">
                <Heading id="holdings-title" :level="2" size="s">Активы</Heading>
                <Badge tone="spotlight">+4,2 % за месяц</Badge>
              </div>
              <div
                v-for="h in holdings"
                :key="h.id"
                style="display: grid; grid-template-columns: minmax(0, 1fr) var(--size-grid-item-s) auto; align-items: center; gap: var(--space-4)"
              >
                <div>
                  <Text>{{ h.name }}</Text>
                  <Text size="xs" tone="tertiary">{{ h.ticker }}</Text>
                </div>
                <Sparkline :data="h.trend" :label="h.name + ', неделя'" variant="bars" />
                <div style="text-align: end">
                  <Text>{{ money.format(h.value) }}</Text>
                  <Badge tone="spotlight">{{ h.delta }}</Badge>
                </div>
              </div>
            </Stack>
          </Card>
        </Grid>

        <Card padding="l">
          <DataTable caption="Активы портфеля" caption-visible row-key="id" :rows="rows" :columns="columns" />
        </Card>
      </Stack>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Инвертированные плашки и чипы spotlight на месте
    await expect(canvasElement.querySelectorAll('.ui-card[data-tone="inverted"]').length).toBeGreaterThanOrEqual(3);
    await expect(canvasElement.querySelectorAll('.ui-badge[data-tone="spotlight"]').length).toBe(4);
  },
};

const nav: NavGroup[] = [
  {
    items: [
      { value: "home", label: "Главная", icon: House },
      { value: "portfolio", label: "Портфель", icon: ChartLine },
      { value: "wallet", label: "Кошелёк", icon: Wallet },
      { value: "transfers", label: "Переводы", icon: ArrowLeftRight, badge: 2 },
    ],
  },
  { label: "Планирование", items: [{ value: "invest", label: "Инвестиции", icon: Landmark }] },
];

/** Портфель в каркасе приложения: тёмная панель навигации (референс Med.+), на телефоне — таб-панель. */
export const WithSidebar: Story = {
  name: "Портфель с сайдбаром",
  parameters: { layout: "fullscreen" },
  render: (args, ctx) => {
    const inner = Portfolio.render!(args, ctx) as { components: Record<string, unknown>; setup: () => Record<string, unknown>; template: string };
    return {
      components: { ...inner.components, AppShell, SidebarPanel, IconButton, Settings, LifeBuoy },
      setup: () => ({ ...inner.setup(), nav, current: ref("portfolio") }),
      template: `
        <AppShell>
          <template #nav>
            <SidebarPanel :groups="nav" :current="current" @navigate="current = $event">
              <template #brand><Heading :level="2" size="m">Капитал</Heading></template>
              <template #footer>
                <IconButton label="Настройки" variant="ghost"><Settings /></IconButton>
                <IconButton label="Поддержка" variant="ghost"><LifeBuoy /></IconButton>
              </template>
            </SidebarPanel>
          </template>
          ${inner.template}
        </AppShell>
      `,
    };
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".ui-sidebar-panel")).not.toBeNull();
    await expect(canvasElement.querySelector('[aria-current="page"]')).not.toBeNull();
  },
};
