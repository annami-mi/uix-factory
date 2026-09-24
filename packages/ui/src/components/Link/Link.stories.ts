import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Link from "./Link.vue";

const meta = {
  title: "Components/Link",
  component: Link,
  parameters: {
    docs: {
      description: {
        component: [
          "Текстовая ссылка. Цвет — `color/text/link` (≥ 4.5:1 в каждой схеме), подчёркнута — отличима не только цветом.",
          "",
          "- `as` — `NuxtLink`, `RouterLink` или `a` (по умолчанию).",
          "- `external` — новая вкладка, иконка ↗ и пояснение для скринридера.",
        ].join("\n"),
      },
    },
  },
  args: { external: false },
  argTypes: { as: { control: false }, default: { control: false } },
  render: (args) => ({
    components: { Link },
    setup: () => ({ args }),
    template: `
      <p style="margin: 0; max-inline-size: 32em; font-size: var(--type-body-lg-font-size); line-height: var(--type-body-lg-line-height)">
        Оформляя заказ, вы соглашаетесь с <Link v-bind="args" href="#terms">условиями доставки</Link> и правилами возврата.
      </p>
    `,
  }),
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InText: Story = {
  name: "In text",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "условиями доставки" })).toHaveAttribute("href", "#terms");
  },
};

/** Внешняя ссылка: новая вкладка, пояснение в доступном имени. */
export const External: Story = {
  args: { external: true },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "условиями доставки (откроется в новой вкладке)" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

/** Обычная, наведение, фокус — на фоне страницы и на плашке. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#link-hover a"], focusVisible: ["#link-focused a"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Link },
    template: `
      <div style="display: grid; gap: var(--space-4); font-size: var(--type-body-lg-font-size); line-height: var(--type-body-lg-line-height)">
        <p id="link-default" style="margin: 0">Обычная: <Link href="#">условия доставки</Link></p>
        <p id="link-hover" style="margin: 0">Наведение: <Link href="#">условия доставки</Link></p>
        <p id="link-focused" style="margin: 0">Фокус: <Link href="#">условия доставки</Link></p>
        <p style="margin: 0">Внешняя: <Link href="#" external>документация</Link></p>
        <p style="margin: 0; padding: var(--space-4); border-radius: var(--radius-4); background: var(--color-surface-default)">
          На плашке: <Link href="#">условия доставки</Link>
        </p>
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = m.glassDark;
export const MatrixGlassLight = m.glassLight;
export const MatrixNeutralLight = m.neutralLight;
export const MatrixNeutralDark = m.neutralDark;
