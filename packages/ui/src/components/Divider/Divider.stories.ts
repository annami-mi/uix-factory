import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Stack from "../Stack/Stack.vue";
import Text from "../Text/Text.vue";
import Divider from "./Divider.vue";

const meta = {
  title: "Layout/Divider",
  component: Divider,
  parameters: {
    docs: {
      description: {
        component:
          "Разделитель: `color/border/default`, `stroke/1`. По умолчанию декоративный (скрыт от скринридера); `semantic` — смысловая граница разделов (`role=separator`).",
      },
    },
  },
  args: { orientation: "horizontal", semantic: false },
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
  render: (args) => ({
    components: { Divider, Stack, Text },
    setup: () => ({ args }),
    template: `
      <Stack :direction="args.orientation === 'vertical' ? 'horizontal' : 'vertical'" gap="3" style="min-block-size: var(--size-48)">
        <Text>Первый раздел</Text>
        <Divider v-bind="args" />
        <Text>Второй раздел</Text>
      </Stack>
    `,
  }),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("separator")).toBeNull();
  },
};

export const Semantic: Story = {
  args: { semantic: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
};
