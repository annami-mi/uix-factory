import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Grid from "./Grid.vue";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  parameters: {
    docs: {
      description: {
        component: [
          "Сетка карточек без media query: колонок столько, сколько помещается при минимальной ширине ячейки (`size/grid-item/*`). На телефоне — одна.",
          "",
          "- `min`: `sm` 160 (логотипы), `md` 260 (карточки), `lg` 340 (отзывы, крупные карточки).",
          "- `columns` — максимум колонок на широком экране.",
          "- `gap` — ключ шкалы `space/*`.",
        ].join("\n"),
      },
    },
  },
  args: { min: "md", gap: "4" },
  argTypes: {
    min: { control: "inline-radio", options: ["sm", "md", "lg"] },
    gap: { control: "select", options: ["2", "3", "4", "5", "6", "8"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Grid },
    setup: () => ({ args }),
    template: `
      <Grid v-bind="args">
        <div v-for="n in 6" :key="n" style="min-block-size: var(--size-64); border-radius: var(--radius-4); background: var(--color-surface-default); display: grid; place-items: center; color: var(--color-text-secondary)">{{ n }}</div>
      </Grid>
    `,
  }),
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Число колонок зависит от ширины: при 390px и min=md — одна колонка. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector(".ui-grid") as HTMLElement;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const minItem = parseFloat(getComputedStyle(grid).getPropertyValue("--size-grid-item-md"));
    // колонок ровно столько, сколько помещается при минимальной ширине ячейки
    await expect(columns).toBe(Math.max(1, Math.floor((grid.clientWidth + 16) / (minItem + 16))));
  },
};

export const LogoWall: Story = {
  name: "Logo wall (min sm)",
  args: { min: "sm", gap: "3" },
};

/** Не больше 3 колонок на широком экране. */
export const MaxThreeColumns: Story = {
  name: "Max 3 columns",
  args: { min: "sm", columns: 3 },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector(".ui-grid") as HTMLElement;
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ").length).toBeLessThanOrEqual(3);
  },
};
