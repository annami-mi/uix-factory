import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Text from "./Text.vue";

const meta = {
  title: "Typography/Text",
  component: Text,
  parameters: {
    docs: {
      description: {
        component:
          "Текст. `size` — стиль `type/body/*` или `caption`; `tone` — роль `color/text/*` (все ≥ 4.5:1 в каждой схеме, см. Typography/Heading → Scale); `as` — p, span, li… Контраст всех тонов проверяется в матрицах Heading.",
      },
    },
  },
  args: { size: "lg", tone: "primary" },
  argTypes: {
    size: { control: "inline-radio", options: ["lg", "md", "sm", "caption"] },
    tone: { control: "inline-radio", options: ["primary", "secondary", "tertiary", "danger"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Text },
    setup: () => ({ args }),
    template: '<Text v-bind="args">Доставим завтра с 10:00 до 18:00. Курьер позвонит за час.</Text>',
  }),
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("p.ui-text")).not.toBeNull();
  },
};
