import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import RadioGroup, { type RadioOption } from "./RadioGroup.vue";

const delivery: RadioOption[] = [
  { value: "courier", label: "Курьером", description: "Завтра, 10:00–18:00 · 390 ₽" },
  { value: "pickup", label: "Самовывоз", description: "Сегодня после 15:00 · бесплатно" },
  { value: "post", label: "Почтой", description: "Недоступно для этого адреса", disabled: true },
];

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "Выбор одного из немногих видимых вариантов. В Figma нет — токен-первый, пара к Checkbox (`surface/control/*`).",
          "",
          "- Нативные радио в `<fieldset>`/`<legend>`: стрелки внутри группы, одна точка Tab, формы — из коробки.",
          "- Круг 24 с обводкой ≥ 3:1 к фону, выбранный — акцент и точка (появляется на пружине); строка — зона касания 44.",
          "- `hint` / `error` группы — через `aria-describedby`; вариантов больше 5–6 — лучше Select.",
          "- `variant=\"tiles\"` — плитки-плашки вместо кружков: короткие варианты, которые сравнивают взглядом (объём, тариф). Материал — как у secondary-кнопки, выбранная — кольцо и галочка; нажатие — скейл на пружине.",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Способ доставки",
    options: delivery,
    hint: "Можно изменить до отправки заказа",
    disabled: false,
    orientation: "vertical",
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    variant: { control: "inline-radio", options: ["list", "tiles"] },
    "onUpdate:modelValue": { table: { disable: true } },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { RadioGroup },
    setup: () => ({ args, value: ref(args.modelValue) }),
    template: '<RadioGroup v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик по подписи, стрелки с клавиатуры (пропускают недоступный вариант). */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole("group", { name: "Способ доставки" });
    await expect(group).toHaveAccessibleDescription("Можно изменить до отправки заказа");
    await userEvent.click(canvas.getByText("Курьером"));
    const courier = canvas.getByRole("radio", { name: "Курьером" });
    await expect(courier).toBeChecked();
    await expect(courier).toHaveAccessibleDescription("Завтра, 10:00–18:00 · 390 ₽");
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("radio", { name: "Самовывоз" })).toBeChecked();
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith("pickup");
    await userEvent.keyboard("{ArrowDown}");
    // «Почтой» недоступна — стрелка возвращается к первому варианту
    await expect(courier).toBeChecked();
  },
};

export const Horizontal: Story = {
  args: {
    label: "Размер",
    hint: undefined,
    orientation: "horizontal",
    options: ["S", "M", "L", "XL"].map((v) => ({ value: v, label: v })),
    modelValue: "M",
  },
};

const capacity: RadioOption[] = [
  { value: "128", label: "128 ГБ", description: "79 990 ₽" },
  { value: "256", label: "256 ГБ", description: "89 990 ₽" },
  { value: "512", label: "512 ГБ", description: "109 990 ₽" },
  { value: "1024", label: "1 ТБ", description: "Нет в наличии", disabled: true },
];

/** Плитки: вся плашка — зона касания, стрелки работают как у обычных радио. */
export const Tiles: Story = {
  args: { label: "Объём памяти", hint: undefined, variant: "tiles", options: capacity, modelValue: "256" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("128 ГБ"));
    const small = canvas.getByRole("radio", { name: "128 ГБ" });
    await expect(small).toBeChecked();
    await expect(small).toHaveAccessibleDescription("79 990 ₽");
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "256 ГБ" })).toBeChecked();
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "Выберите способ доставки" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Способ доставки" })).toHaveAccessibleDescription(
      "Выберите способ доставки",
    );
    await expect(canvas.getByRole("radio", { name: "Курьером" })).toBeInvalid();
  },
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: "pickup" },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).toBeDisabled();
  },
};

/** Все состояния варианта. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: {
      hover: ["#radio-hover .ui-radio", "#tile-hover .ui-choice-tile"],
      focusVisible: ["#radio-focused .ui-radio__circle", "#tile-focused .ui-choice-tile__input"],
    },
    controls: { disable: true },
  },
  render: () => ({
    components: { RadioGroup },
    setup: () => ({ delivery, capacity }),
    template: `
      <div style="display: grid; gap: var(--space-6)">
        <RadioGroup label="default" :options="delivery" model-value="courier" hint="Hint text" />
        <div id="radio-hover"><RadioGroup label="hover" :options="delivery.slice(0, 1)" /></div>
        <div id="radio-focused"><RadioGroup label="focused" :options="delivery.slice(0, 1)" /></div>
        <RadioGroup label="error" :options="delivery.slice(0, 2)" error="Текст ошибки" />
        <RadioGroup label="disabled" :options="delivery.slice(0, 2)" model-value="courier" hint="Hint text" disabled />
        <RadioGroup label="tiles" variant="tiles" :options="capacity" model-value="256" />
        <div id="tile-hover"><RadioGroup label="tiles hover" variant="tiles" :options="capacity.slice(0, 1)" /></div>
        <div id="tile-focused"><RadioGroup label="tiles focused" variant="tiles" :options="capacity.slice(0, 1)" /></div>
        <RadioGroup label="tiles error" variant="tiles" :options="capacity.slice(0, 2)" error="Выберите объём" />
        <RadioGroup label="tiles disabled" variant="tiles" :options="capacity.slice(0, 2)" model-value="128" disabled />
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
