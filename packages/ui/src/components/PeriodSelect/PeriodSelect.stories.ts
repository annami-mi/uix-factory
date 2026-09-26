import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect } from "storybook/test";
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
        <Text size="s" tone="secondary" data-testid="range">{{ period.from }} — {{ period.to }}</Text>
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

/** Свой период: рядом — поле календаря (DatePicker), не позже «сегодня». */
export const Custom: Story = {
  render: (args) => ({
    components: { PeriodSelect, Text },
    setup: () => ({ args, period: ref<Period>({ preset: "custom", from: "2026-08-01", to: "2026-08-31" }) }),
    template: `
      <div style="display: grid; gap: var(--space-3)">
        <PeriodSelect v-bind="args" v-model="period" />
        <Text size="s" tone="secondary" data-testid="range">{{ period.from }} — {{ period.to }}</Text>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    // Свой период — поле календаря с диапазоном словами
    await expect(await canvas.findByRole("button", { name: "Даты" })).toHaveTextContent("1–31 авг. 2026");
  },
};

const m = themeMatrix(Custom);
export const CustomGlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomGlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomNeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomNeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const CustomBentoLight = { ...m.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
