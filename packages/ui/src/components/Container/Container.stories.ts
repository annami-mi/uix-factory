import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Text from "../Text/Text.vue";
import Container from "./Container.vue";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Центрирует контент и ограничивает ширину: `sm` 640 (текст, формы), `md` 960, `lg` 1200 (лендинг), `full`. Поля по краям — `layout/gutter`, 16 → 40px плавно (без media query).",
      },
    },
  },
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "full"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Container, Text },
    setup: () => ({ args }),
    template: `
      <Container v-bind="args">
        <div style="padding: var(--space-4); border-radius: var(--radius-4); background: var(--color-surface-default)">
          <Text>Контент внутри контейнера. Ширина ограничена, поля — плавные.</Text>
        </div>
      </Container>
    `,
  }),
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** На телефоне поля — 16px (space/4). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector(".ui-container") as HTMLElement;
    const style = getComputedStyle(el);
    const min = parseFloat(style.getPropertyValue("--space-4"));
    const max = parseFloat(style.getPropertyValue("--space-10"));
    const padding = parseFloat(style.paddingInlineStart);
    await expect(padding).toBeGreaterThanOrEqual(min);
    await expect(padding).toBeLessThanOrEqual(max);
  },
};
