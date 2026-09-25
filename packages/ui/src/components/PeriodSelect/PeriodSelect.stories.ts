import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import { resolvePeriod, type Period } from "../../utils/period";
import Text from "../Text/Text.vue";
import PeriodSelect from "./PeriodSelect.vue";

const now = new Date(2026, 8, 24);

const meta = {
  title: "Components/PeriodSelect",
  component: PeriodSelect,
  parameters: {
    docs: {
      description: {
        component: [
          "Фильтр периода дашборда: пресеты и свой диапазон. Стоит **одной строкой над всеми графиками**, которые ограничивает (не внутри карточки графика).",
          "",
          "- Список — `Select`: всплывашка на десктопе, шторка на мобильном.",
          "- Значение — `{ preset, from, to }` (YYYY-MM-DD, включительно). `previousPeriod()` из `@uix/ui` — база «к прошлому периоду» для KPI.",
        ].join("\n"),
      },
    },
  },
  args: { now },
  argTypes: { modelValue: { control: false } },
  render: (args) => ({
    components: { PeriodSelect, Text },
    setup: () => ({ args, period: ref<Period>(resolvePeriod("30d", now)) }),
    template: `
      <div style="display: grid; gap: var(--space-3)">
        <PeriodSelect v-bind="args" v-model="period" />
        <Text size="md" tone="secondary" data-testid="range">{{ period.from }} — {{ period.to }}</Text>
      </div>
    `,
  }),
} satisfies Meta<typeof PeriodSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("range")).toHaveTextContent("2026-08-26 — 2026-09-24");
  },
};

/** Свой период: появляются поля дат. */
export const Custom: Story = {
  render: (args) => ({
    components: { PeriodSelect, Text },
    setup: () => ({ args, period: ref<Period>({ preset: "custom", from: "2026-08-01", to: "2026-08-31" }) }),
    template: `
      <div style="display: grid; gap: var(--space-3)">
        <PeriodSelect v-bind="args" v-model="period" />
        <Text size="md" tone="secondary" data-testid="range">{{ period.from }} — {{ period.to }}</Text>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const from = await canvas.findByLabelText("С");
    await userEvent.clear(from);
    await userEvent.type(from, "2026-09-10");
    // «С» позже «По» — «По» подтягивается
    await waitFor(() => expect(canvas.getByTestId("range")).toHaveTextContent("2026-09-10 — 2026-09-10"));
  },
};

const m = themeMatrix(Custom);
export const CustomGlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomGlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomNeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomNeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
