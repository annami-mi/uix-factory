import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { openModalA11y } from "../../../.storybook/a11y";
import { themeMatrix } from "../../../.storybook/story-helpers";
import type { DateRangeValue } from "../Calendar/Calendar.vue";
import DatePicker from "./DatePicker.vue";

const NOW = "2026-09-24";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    docs: {
      description: {
        component: [
          "Поле выбора даты или периода — Calendar в поле формы.",
          "",
          "- **Десктоп** — всплывашка «толстого» стекла: слева пресеты (`presets`), справа два месяца. Вторая дата или пресет закрывают панель.",
          "- **Мобильный** — шторка: пресеты чипами, ниже — вертикальная лента месяцев (листают пальцем). Период применяется кнопкой «Готово», одна дата — сразу.",
          "- Значение — `YYYY-MM-DD` или `{ from, to }`; в поле — «10–18 сент. 2026».",
        ].join("\n"),
      },
    },
  },
  args: { mode: "single", label: "Дата доставки", now: NOW, presentation: "auto" },
  argTypes: {
    mode: { control: "inline-radio", options: ["single", "range"] },
    presentation: { control: "inline-radio", options: ["auto", "popover", "sheet"] },
    modelValue: { control: false },
    presets: { control: false },
  },
  render: (args) => ({
    components: { DatePicker },
    setup: () => ({ args, value: ref<string | DateRangeValue | null>(args.modelValue ?? null) }),
    template: `<div style="max-inline-size: 360px"><DatePicker v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Одна дата: клик по дню закрывает всплывашку, в поле — дата словами. */
export const Single: Story = {
  args: { presentation: "popover", min: NOW },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole("button", { name: "Дата доставки" });
    await userEvent.click(field);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: /, 30 сентября 2026/ }));
    await waitFor(() => expect(field).toHaveTextContent("30 сентября 2026"));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** Период с пресетами (Stripe/Linear): пресет — сразу, свой период — два клика. */
export const Range: Story = {
  args: {
    mode: "range",
    label: "Период",
    presentation: "popover",
    max: NOW,
    presets: ["today", "7d", "30d", "90d", "mtd"],
    placeholder: "Выберите период",
  },
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole("button", { name: "Период" });
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(field);
    await userEvent.click(await body.findByRole("button", { name: "Последние 7 дней" }));
    await waitFor(() => expect(field).toHaveTextContent("18–24 сент. 2026"));
    await userEvent.click(field);
    await userEvent.click(await body.findByRole("button", { name: /, 3 сентября 2026/ }));
    await userEvent.click(body.getByRole("button", { name: /, 10 сентября 2026/ }));
    await waitFor(() => expect(field).toHaveTextContent("3–10 сент. 2026"));
  },
};

/** Мобильная шторка: лента месяцев, пресеты чипами, «Готово» применяет период. */
export const Sheet: Story = {
  args: {
    mode: "range",
    label: "Период",
    presentation: "sheet",
    max: NOW,
    presets: ["7d", "30d", "90d", "mtd"],
    modelValue: { from: "2026-09-01", to: "2026-09-14" },
  },
  parameters: openModalA11y,
  tags: ["!autodocs"],
  play: async ({ canvas, canvasElement }) => {
    const field = canvas.getByRole("button", { name: "Период" });
    await expect(field).toHaveTextContent("1–14 сент. 2026");
    await userEvent.click(field);
    const body = within(canvasElement.ownerDocument.body);
    const done = await body.findByRole("button", { name: "Готово" });
    await userEvent.click(body.getByRole("button", { name: /, 15 сентября 2026/ }));
    await expect(done).toBeDisabled(); // выбрана только первая дата
    await userEvent.click(body.getByRole("button", { name: /, 20 сентября 2026/ }));
    await expect(field).toHaveTextContent("1–14 сент. 2026"); // черновик ещё не применён
    await userEvent.click(done);
    await waitFor(() => expect(field).toHaveTextContent("15–20 сент. 2026"));
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "Укажите дату доставки" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Дата доставки" })).toHaveAccessibleDescription("Укажите дату доставки");
  },
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: "2026-09-30" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Дата доставки" })).toBeDisabled();
  },
};

const m = themeMatrix(ErrorState);
export const ErrorGlassDark = { ...m.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const ErrorGlassLight = { ...m.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const ErrorNeutralLight = { ...m.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const ErrorNeutralDark = { ...m.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const ErrorBentoLight = { ...m.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
