import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref, type ConcreteComponent } from "vue";
import { expect, userEvent, within } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Badge from "../Badge/Badge.vue";
import DataTable, { type DataTableColumn, type DataTableSort } from "./DataTable.vue";

interface Customer extends Record<string, unknown> {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  seats: number;
  since: Date;
  status: "active" | "trial" | "churned";
}

const customers: Customer[] = [
  { id: "c1", name: "Ромашка", plan: "Бизнес", mrr: 48_000, seats: 24, since: new Date(2024, 2, 12), status: "active" },
  { id: "c2", name: "Вектор Лаб", plan: "Старт", mrr: 9_900, seats: 5, since: new Date(2026, 6, 3), status: "trial" },
  { id: "c3", name: "Северный ветер", plan: "Про", mrr: 21_500, seats: 11, since: new Date(2025, 0, 20), status: "active" },
  { id: "c4", name: "Атлас", plan: "Бизнес", mrr: 0, seats: 0, since: new Date(2023, 10, 5), status: "churned" },
  { id: "c5", name: "Гранит и партнёры", plan: "Про", mrr: 32_700, seats: 16, since: new Date(2025, 8, 1), status: "active" },
];

const rub = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const columns: DataTableColumn<Customer>[] = [
  { key: "name", label: "Клиент", sortable: true },
  { key: "plan", label: "Тариф", sortable: true },
  { key: "status", label: "Статус" },
  { key: "mrr", label: "MRR", numeric: true, sortable: true, format: (v) => rub.format(v as number) },
  { key: "seats", label: "Места", numeric: true, sortable: true },
  { key: "since", label: "Клиент с", sortable: true, format: (v) => date.format(v as Date) },
];
const STATUS = {
  active: { label: "Активен", tone: "success" },
  trial: { label: "Пробный", tone: "accent" },
  churned: { label: "Ушёл", tone: "neutral" },
} as const;

/** Generic-компонент: Storybook не выводит его props — аргументы историй описаны явно */
interface Args {
  columns: DataTableColumn[];
  rows: Record<string, unknown>[];
  rowKey: string;
  caption: string;
  selectable?: boolean;
  maxHeight?: string;
  loading?: boolean;
}

const meta = {
  title: "Components/DataTable",
  component: DataTable as unknown as ConcreteComponent<Args>,
  parameters: {
    docs: {
      description: {
        component: [
          "Таблица данных SaaS. **Mobile-first:** в узком контейнере строки — карточки, шапка — чипы сортировки; с ширины контейнера size/container/sm (640px) — таблица с липкой шапкой.",
          "",
          "- Сортировка — кнопка в заголовке, `aria-sort`, по кругу: ↑ → ↓ → без. `manualSort` — сортирует сервер.",
          "- Выбор — `v-model:selected` (ключи строк), «выбрать всё» с частичным состоянием.",
          "- Ячейки — слот `#cell-<key>`; `maxHeight` — прокрутка с липкой шапкой; `loading` — строки приглушены.",
        ].join("\n"),
      },
    },
  },
  args: { columns: columns as DataTableColumn[], rows: customers, rowKey: "id", caption: "Клиенты", selectable: true },
  argTypes: { columns: { control: false }, rows: { control: false } },
  render: (args) => ({
    components: { DataTable, Badge },
    setup: () => ({ args, selected: ref<unknown[]>([]), sort: ref<DataTableSort | null>(null), STATUS }),
    template: `
      <DataTable v-bind="args" v-model:selected="selected" v-model:sort="sort">
        <template #cell-status="{ value }">
          <Badge :tone="STATUS[value].tone">{{ STATUS[value].label }}</Badge>
        </template>
      </DataTable>
    `,
  }),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Мобильный (по умолчанию): карточки. Сортировка и выбор. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const table = await canvas.findByRole("table", { name: "Клиенты" });
    await userEvent.click(within(table).getByRole("button", { name: /MRR/ }));
    await expect(within(table).getByRole("columnheader", { name: /MRR/ })).toHaveAttribute("aria-sort", "ascending");
    await expect(table.querySelector("tbody tr td:nth-child(2)")).toHaveTextContent("Атлас");
    await userEvent.click(within(table).getByRole("button", { name: /MRR/ }));
    await expect(table.querySelector("tbody tr td:nth-child(2)")).toHaveTextContent("Ромашка");

    await userEvent.click(canvas.getByRole("checkbox", { name: "Выбрать: Ромашка" }));
    const all = canvas.getByRole("checkbox", { name: "Выбрать все строки" });
    await expect(all).toHaveProperty("indeterminate", true);
    await userEvent.click(all);
    await expect(canvas.getByRole("checkbox", { name: "Выбрать: Атлас" })).toBeChecked();
  },
};

/** Десктоп: таблица, липкая шапка при `maxHeight`. */
export const Desktop: Story = {
  args: { maxHeight: "240px" },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};

export const Loading: Story = { args: { loading: true } };

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Ничего не найдено")).toBeVisible();
  },
};

const m = themeMatrix(Desktop);
export const DesktopGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const DesktopGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const DesktopNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const DesktopNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
