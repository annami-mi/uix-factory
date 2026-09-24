import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Pagination from "./Pagination.vue";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component: [
          "Постраничная навигация. Reka UI Pagination: первая/последняя видны всегда, между ними «…». В Figma нет — токен-первый.",
          "",
          "- `hrefFor(page)` — страницы-ссылки (индексируются, открываются в новой вкладке) — для каталога на SSG. Без него — кнопки и `update:page`.",
          "- Кнопки 44×44, текущая — плашка акцента и `aria-current=\"page\"`; на мобильном соседних страниц не показывается.",
        ].join("\n"),
      },
    },
  },
  args: { total: 400, pageSize: 20, "onUpdate:page": fn() },
  argTypes: { hrefFor: { control: false }, page: { control: false }, "onUpdate:page": { table: { disable: true } } },
  render: (args) => ({
    components: { Pagination },
    setup: () => ({ args, page: ref(args.page ?? 1) }),
    template: '<Pagination v-bind="args" v-model:page="page" />',
  }),
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Кнопки: «Следующая», клик по номеру, текущая помечена. */
export const Buttons: Story = {
  play: async ({ args, canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Страницы" });
    await expect(nav).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Предыдущая страница" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Следующая страница" }));
    await expect(args["onUpdate:page"]).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole("button", { name: "Страница 2" })).toHaveAttribute("aria-current", "page");
  },
};

/** Ссылки для каталога: у каждой страницы — адрес. */
export const Links: Story = {
  args: { page: 5, hrefFor: (p: number) => `/catalog?page=${p}` },
  play: async ({ canvas }) => {
    const current = canvas.getByRole("link", { name: "Страница 5" });
    await expect(current).toHaveAttribute("href", "/catalog?page=5");
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("link", { name: "Следующая страница" })).toHaveAttribute("href", "/catalog?page=6");
  },
};

/** Середина длинного списка — для сравнения стилистик. */
export const Middle: Story = {
  args: { page: 7 },
};

const m = themeMatrix(Middle);
export const MiddleGlassDark = m.glassDark;
export const MiddleGlassLight = m.glassLight;
export const MiddleNeutralLight = m.neutralLight;
export const MiddleNeutralDark = m.neutralDark;
