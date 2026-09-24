import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Card from "../Card/Card.vue";
import Stack from "../Stack/Stack.vue";
import Skeleton from "./Skeleton.vue";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          "Заглушка на время загрузки. Декоративная (скрыта от скринридера) — загрузку сообщает контейнер: `aria-busy=\"true\"` на области, которая грузится. Строка `text` — высотой в строку body/lg, без скачка при замене на текст. При reduced motion — без блика.",
      },
    },
  },
  args: { shape: "text", lines: 3 },
  argTypes: { shape: { control: "inline-radio", options: ["text", "rect", "circle"] } },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".ui-skeleton")).toHaveLength(3);
    await expect(canvasElement.querySelector(".ui-skeleton-group")).toHaveAttribute("aria-hidden", "true");
  },
};

/** Карточка товара во время загрузки. */
export const ProductCard: Story = {
  name: "Product card (loading)",
  render: () => ({
    components: { Skeleton, Card, Stack },
    template: `
      <Card as="section" aria-busy="true" aria-label="Загрузка товара" style="max-inline-size: var(--size-container-sm)">
        <Stack gap="3">
          <div style="block-size: var(--size-64)"><Skeleton shape="rect" /></div>
          <Skeleton :lines="2" />
          <Stack direction="horizontal" gap="3" align="center">
            <Skeleton shape="circle" />
            <Skeleton />
          </Stack>
        </Stack>
      </Card>
    `,
  }),
};
