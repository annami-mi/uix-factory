import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Truck } from "@lucide/vue";
import { expect } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Badge from "./Badge.vue";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "Короткая метка статуса или категории. Тон — `color/badge/<tone>/{bg,fg}`: тонированная плашка, текст ≥ 4.5:1 на ней в каждой схеме (проверяется тестом токенов). Не кнопка. Иконка — слот `#start`.",
      },
    },
  },
  args: { tone: "neutral" },
  argTypes: {
    tone: { control: "inline-radio", options: ["neutral", "accent", "success", "warning", "danger"] },
    default: { control: false },
    start: { control: false },
  },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: '<Badge v-bind="args">Новинка</Badge>',
  }),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Новинка")).toBeVisible();
  },
};

export const WithIcon: Story = {
  name: "With icon",
  render: () => ({
    components: { Badge, Truck },
    template: '<Badge tone="accent"><template #start><Truck /></template>В пути</Badge>',
  }),
};

/** Все тона — для сравнения стилистик и проверки контраста. */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-2)">
        <Badge>Нейтральный</Badge>
        <Badge tone="accent">Новинка</Badge>
        <Badge tone="success">В наличии</Badge>
        <Badge tone="warning">Осталось 2</Badge>
        <Badge tone="danger">−20%</Badge>
      </div>
    `,
  }),
};

const m = themeMatrix(Tones);
export const TonesGlassDark = m.glassDark;
export const TonesGlassLight = m.glassLight;
export const TonesNeutralLight = m.neutralLight;
export const TonesNeutralDark = m.neutralDark;
