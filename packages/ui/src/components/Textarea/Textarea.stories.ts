import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import Textarea from "./Textarea.vue";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: [
          "Многострочное поле. В Figma нет — собрано из тех же частей, что Input: **FormField** + **Field** (`multiline`: скругление `radius/6` вместо капсулы) + `<textarea>`.",
          "",
          "- Растёт по содержимому от `rows` до `maxRows` строк (`field-sizing: content`, в Safari — на JS), дальше — прокрутка.",
          "- `maxlength` — счётчик справа от подсказки; лимит скринридеру — через описание поля.",
          "- Материал, фокус, ошибка, disabled — как у Input (`surface/field/*`).",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Комментарий к заказу",
    hint: "Например, как найти подъезд",
    placeholder: "Напишите пожелания",
    rows: 3,
    autoResize: true,
    maxRows: 10,
    disabled: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    "onUpdate:modelValue": { table: { disable: true } },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { Textarea },
    setup: () => ({ args, value: ref(args.modelValue ?? "") }),
    template: '<Textarea v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Печать и рост по содержимому. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Комментарий к заказу" });
    const before = field.getBoundingClientRect().height;
    await userEvent.type(field, "Первая строка{enter}Вторая{enter}Третья{enter}Четвёртая{enter}Пятая");
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalled();
    await expect(field).toHaveAccessibleDescription("Например, как найти подъезд");
    // Выросло по содержимому: 5 строк больше стартовых 3
    await expect(field.getBoundingClientRect().height).toBeGreaterThan(before);
  },
};

/** Счётчик символов и нативный предел. */
export const WithLimit: Story = {
  name: "With limit",
  args: { label: "Отзыв", hint: "Что понравилось", maxlength: 20, modelValue: "Всё отлично" },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Отзыв" });
    await expect(canvas.getByText("11 / 20")).toBeVisible();
    await userEvent.type(field, " — спасибо большое!");
    await expect((field as HTMLTextAreaElement).value).toHaveLength(20);
    await expect(canvas.getByText("20 / 20")).toBeVisible();
    await expect(field).toHaveAccessibleDescription("Что понравилось Не больше 20 символов");
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { error: "Напишите хотя бы пару слов" },
  play: async ({ canvas }) => {
    const field = canvas.getByRole("textbox", { name: "Комментарий к заказу" });
    await expect(field).toBeInvalid();
    await expect(field).toHaveAccessibleDescription("Напишите хотя бы пару слов");
  },
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: "Поле недоступно" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Комментарий к заказу" })).toBeDisabled();
  },
};

/** Фиксированная высота с ручным изменением размера (`autoResize: false`). */
export const FixedHeight: Story = {
  name: "Fixed height",
  args: { autoResize: false, rows: 4 },
};

const states = [
  { name: "default", props: {} },
  { name: "filled", props: { modelValue: "Позвоните за 30 минут.\nДомофон не работает — наберите по телефону." } },
  { name: "hover", props: {} },
  { name: "focused", props: {} },
  { name: "error", props: { error: "Текст ошибки" } },
  { name: "disabled", props: { disabled: true } },
] as const;

/** Все состояния для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#textarea-hover .ui-field"], focusWithin: ["#textarea-focused .ui-field"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Textarea },
    setup: () => ({ states }),
    template: `
      <div style="display: grid; gap: var(--space-6)">
        <div v-for="state in states" :id="'textarea-' + state.name" :key="state.name">
          <Textarea :label="state.name" hint="Hint text" placeholder="Напишите пожелания" :rows="2" v-bind="state.props" />
        </div>
      </div>
    `,
  }),
};

/* Та же матрица во всех комбинациях стилистика × схема (ADR-0005): axe проверяет контраст в каждой. */
const combo = (theme: string, scheme: string): Story => ({
  ...StateMatrix,
  name: `State matrix · ${theme} ${scheme}`,
  tags: ["!autodocs"],
  globals: { theme, scheme },
});

export const MatrixGlassDark = { ...combo("glass", "dark"), tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...combo("glass", "light"), tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...combo("neutral", "light"), tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...combo("neutral", "dark"), tags: ["!dev", "!autodocs"] };
export const MatrixBentoLight = { ...combo("bento-contrast", "light"), tags: ["!dev", "!autodocs"] };
