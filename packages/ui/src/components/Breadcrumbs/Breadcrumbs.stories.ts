import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Breadcrumbs from "./Breadcrumbs.vue";

const meta = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          "Путь к текущей странице. `<nav aria-label>` + `<ol>`, текущая — последний пункт без ссылки (`aria-current=\"page\"`), разделители декоративные, на узком экране строка переносится. `linkAs` — NuxtLink/RouterLink.",
      },
    },
  },
  args: {
    items: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/catalog" },
      { label: "Молочные продукты", href: "/catalog/dairy" },
      { label: "Творог 5%" },
    ],
  },
  argTypes: { linkAs: { control: false } },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Навигационная цепочка" });
    await expect(nav).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(3);
    await expect(canvas.getByText("Творог 5%")).toHaveAttribute("aria-current", "page");
  },
};

const m = themeMatrix(Default);
export const DefaultGlassDark = m.glassDark;
export const DefaultGlassLight = m.glassLight;
export const DefaultNeutralLight = m.neutralLight;
export const DefaultNeutralDark = m.neutralDark;
