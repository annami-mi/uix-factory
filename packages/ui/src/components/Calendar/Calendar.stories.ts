import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Text from "../Text/Text.vue";
import Calendar, { type DateRangeValue } from "./Calendar.vue";

const NOW = "2026-09-24";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: [
          "Выбор даты или диапазона. Поведение и доступность — Reka UI Calendar / RangeCalendar: `role=\"grid\"`, стрелки, PageUp/PageDown — месяц, Home/End — неделя, озвучка дат.",
          "",
          "- `mode`: `single` / `range` — во втором режиме до второго клика видна полоса-предпросмотр.",
          "- `layout`: `paged` — месяцы рядом со стрелками (десктоп, `months` 1–2); `scroll` — вертикальная лента месяцев (мобильный, как в iOS/Airbnb), дни недели — неподвижной строкой над собственной прокруткой.",
          "- Значения — строки `YYYY-MM-DD`. Края диапазона — материал акцентной кнопки, дни между — `surface/calendar/range`, сегодня — точка.",
          "- Ячейка — зона касания 44 (на точном указателе — 40). В пикере с полем — `DatePicker`.",
        ].join("\n"),
      },
    },
  },
  args: { mode: "single", layout: "paged", months: 1, now: NOW, label: "Дата" },
  argTypes: {
    mode: { control: "inline-radio", options: ["single", "range"] },
    layout: { control: "inline-radio", options: ["paged", "scroll"] },
    months: { control: { type: "range", min: 1, max: 2 } },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { Calendar, Text },
    setup: () => ({ args, value: ref<string | DateRangeValue | null>(args.modelValue ?? null) }),
    template: `
      <div style="display: grid; gap: var(--space-3)">
        <Calendar v-bind="args" v-model="value" />
        <Text size="s" tone="secondary" data-testid="value">{{ value ? JSON.stringify(value) : "ничего не выбрано" }}</Text>
      </div>
    `,
  }),
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Одна дата: клик и клавиатура (стрелки двигают фокус по дням, Enter — выбор). */
export const Single: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /, 15 сентября 2026/ }));
    await expect(canvas.getByTestId("value")).toHaveTextContent('"2026-09-15"');
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await expect(canvas.getByTestId("value")).toHaveTextContent('"2026-09-16"');
  },
};

/** Диапазон на двух месяцах: первый клик — начало, второй — конец; до него — предпросмотр полосой. */
export const Range: Story = {
  args: { mode: "range", months: 2, label: "Период" },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /, 28 сентября 2026/ }));
    await expect(canvas.getByTestId("value")).toHaveTextContent("ничего не выбрано");
    await userEvent.click(canvas.getByRole("button", { name: /, 6 октября 2026/ }));
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent('{"from":"2026-09-28","to":"2026-10-06"}'));
  },
};

/** Выбранный диапазон и ограничения: раньше min и позже max выбрать нельзя. */
export const RangeWithLimits: Story = {
  name: "Range with limits",
  args: {
    mode: "range",
    months: 2,
    label: "Период",
    min: "2026-09-05",
    max: NOW,
    modelValue: { from: "2026-09-10", to: "2026-09-18" },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: /, 3 сентября 2026/ })).toHaveAttribute("data-disabled");
  },
};

/** Мобильная лента: месяцы подряд, листают пальцем; открывается на выбранном месяце. */
export const Scroll: Story = {
  args: { mode: "range", layout: "scroll", monthsBefore: 6, monthsAfter: 1, label: "Период", max: NOW },
  render: (args) => ({
    components: { Calendar },
    setup: () => ({ args, value: ref<DateRangeValue | null>({ from: "2026-09-01", to: "2026-09-14" }) }),
    template: `
      <Calendar v-bind="args" v-model="value" />
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole("heading", { name: "Сентябрь 2026" })).toBeInTheDocument();
    // 6 месяцев до, текущий и 1 после — сетка на каждый (у Reka роль таблицы — application)
    await expect(canvasElement.querySelectorAll("table")).toHaveLength(8);
  },
};

const m = themeMatrix(RangeWithLimits);
export const LimitsGlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const LimitsGlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const LimitsNeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const LimitsNeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const LimitsBentoLight = { ...m.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
