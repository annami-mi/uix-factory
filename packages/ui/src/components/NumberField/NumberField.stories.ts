import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import NumberField from "./NumberField.vue";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  parameters: {
    docs: {
      description: {
        component: [
          "Число со степпером «− число +»: количество товара, гостей. Reka UI NumberField — роль spinbutton, ↑/↓, ввод с клавиатуры, min/max/step, формат по локали. В Figma нет — токен-первый.",
          "",
          "- FormField + Field: подпись, подсказка, ошибка, материал — как у Input.",
          "- Кнопки − / + — 48×48, у предела недоступны; `formatOptions` — единицы («2 кг»).",
        ].join("\n"),
      },
    },
  },
  args: { label: "Количество", hint: "Не больше 10 в одни руки", min: 1, max: 10, step: 1, disabled: false },
  argTypes: { modelValue: { control: false }, formatOptions: { control: false } },
  render: (args) => ({
    components: { NumberField },
    setup: () => ({ args, value: ref(args.modelValue ?? 1) }),
    template: '<div style="max-inline-size: var(--size-grid-item-md)"><NumberField v-bind="args" v-model="value" /></div>',
  }),
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Кнопки и стрелки меняют значение, у минимума «−» недоступна. */
export const Quantity: Story = {
  play: async ({ canvas }) => {
    const field = canvas.getByRole("spinbutton", { name: "Количество" });
    await expect(field).toHaveAccessibleDescription("Не больше 10 в одни руки");
    await expect(canvas.getByRole("button", { name: "Уменьшить" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Увеличить" }));
    await expect(field).toHaveValue("2");
    await userEvent.click(field);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(field).toHaveValue("4");
  },
};

/** Вес с единицами и шагом 0,5. */
export const Weight: Story = {
  args: { label: "Вес", hint: undefined, min: 0.5, max: 5, step: 0.5, modelValue: 1.5, formatOptions: { style: "unit", unit: "kilogram" } },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "Столько нет на складе" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("spinbutton", { name: "Количество" })).toBeInvalid();
  },
};

/** Обычное, ошибка, недоступно — для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { NumberField },
    template: `
      <div style="display: grid; gap: var(--space-6); max-inline-size: var(--size-grid-item-md)">
        <NumberField label="default" hint="Hint text" :model-value="2" :min="1" :max="10" />
        <NumberField label="error" error="Текст ошибки" :model-value="11" :min="1" :max="10" />
        <NumberField label="disabled" hint="Hint text" :model-value="2" disabled />
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
