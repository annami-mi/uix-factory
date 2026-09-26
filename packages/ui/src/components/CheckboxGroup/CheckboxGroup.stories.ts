import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import CheckboxGroup, { type CheckboxOption } from "./CheckboxGroup.vue";

const extras: CheckboxOption[] = [
  { value: "case", label: "Чехол", description: "2 990 ₽" },
  { value: "glass", label: "Защитное стекло", description: "1 490 ₽" },
  { value: "charger", label: "Зарядка 30 Вт", description: "3 490 ₽" },
  { value: "care", label: "Страховка", description: "Нет для этой модели", disabled: true },
];

const meta = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "Выбор нескольких вариантов — пара к RadioGroup: `<fieldset>`/`<legend>`, `hint`/`error` группы через `aria-describedby`.",
          "",
          "- `variant=\"list\"` — флажки строками (Checkbox); `variant=\"tiles\"` — плитки-плашки: выбранные — кольцо и галочка в углу, нажатие — скейл на пружине.",
          "- Значение — массив `value` в порядке опций; плитки раскладываются сеткой по ширине контейнера.",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Добавить к заказу",
    options: extras,
    variant: "list",
    disabled: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["list", "tiles"] },
    "onUpdate:modelValue": { table: { disable: true } },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { CheckboxGroup },
    setup: () => ({ args, value: ref(args.modelValue ?? []) }),
    template: '<CheckboxGroup v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Зарядка 30 Вт" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Чехол" }));
    // Порядок — как у опций, не как у кликов
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(["case", "charger"]);
  },
};

/** Плитки: пробел и клик по всей плашке переключают выбор. */
export const Tiles: Story = {
  args: { variant: "tiles", modelValue: ["glass"] },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByText("Чехол"));
    await expect(canvas.getByRole("checkbox", { name: "Чехол" })).toBeChecked();
    await userEvent.click(canvas.getByText("Защитное стекло"));
    await expect(canvas.getByRole("checkbox", { name: "Защитное стекло" })).not.toBeChecked();
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(["case"]);
    await expect(canvas.getByRole("checkbox", { name: "Страховка" })).toBeDisabled();
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { variant: "tiles", error: "Выберите хотя бы один вариант" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Добавить к заказу" })).toHaveAccessibleDescription(
      "Выберите хотя бы один вариант",
    );
  },
};

/** Все состояния обоих вариантов. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#cbg-hover .ui-choice-tile"], focusVisible: ["#cbg-focused .ui-choice-tile__input"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { CheckboxGroup },
    setup: () => ({ extras }),
    template: `
      <div style="display: grid; gap: var(--space-6)">
        <CheckboxGroup label="list" :options="extras" :model-value="['case']" hint="Hint text" />
        <CheckboxGroup label="tiles" variant="tiles" :options="extras" :model-value="['case', 'charger']" />
        <div id="cbg-hover"><CheckboxGroup label="hover" variant="tiles" :options="extras.slice(1, 2)" /></div>
        <div id="cbg-focused"><CheckboxGroup label="focused" variant="tiles" :options="extras.slice(1, 2)" /></div>
        <CheckboxGroup label="error" variant="tiles" :options="extras.slice(0, 2)" error="Текст ошибки" />
        <CheckboxGroup label="disabled" variant="tiles" :options="extras.slice(0, 2)" :model-value="['case']" disabled />
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
export const MatrixBentoLight = { ...m.bentoLight, tags: ["!dev", "!autodocs"] };
