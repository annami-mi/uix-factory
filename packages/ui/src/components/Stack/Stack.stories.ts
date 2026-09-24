import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Button from "../Button/Button.vue";
import Stack from "./Stack.vue";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          "Стопка элементов с отступом из шкалы `space/*` — основной примитив раскладки внутри секций и карточек вместо ручных `margin`. `direction`, `gap`, `align`, `justify`, `wrap`, `as` (div, ul, nav).",
      },
    },
  },
  args: { direction: "vertical", gap: "4", align: "stretch", justify: "start", wrap: false },
  argTypes: {
    direction: { control: "inline-radio", options: ["vertical", "horizontal"] },
    gap: { control: "select", options: ["0", "px", "1", "2", "3", "4", "5", "6", "8", "10", "12"] },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Stack, Button },
    setup: () => ({ args }),
    template: `
      <Stack v-bind="args">
        <Button>Оформить заказ</Button>
        <Button variant="secondary">В избранное</Button>
        <Button variant="ghost">Подробнее</Button>
      </Stack>
    `,
  }),
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  play: async ({ canvasElement }) => {
    const stack = canvasElement.querySelector(".ui-stack") as HTMLElement;
    await expect(getComputedStyle(stack).rowGap).toBe(getComputedStyle(stack).getPropertyValue("--space-4").trim());
  },
};

/** Кнопки в строку с переносом — на узком экране встают друг под друга. */
export const HorizontalWrap: Story = {
  name: "Horizontal, wrap",
  args: { direction: "horizontal", gap: "3", wrap: true, align: "center" },
};
