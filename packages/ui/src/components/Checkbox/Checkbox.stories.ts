import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import Checkbox from "./Checkbox.vue";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: [
          "Флажок. В Figma нет — токен-первый. Нативный `<input type=\"checkbox\">`: семантика, пробел, формы — из коробки.",
          "",
          "- Квадрат 24 (`radius/2`), вся строка — зона касания 44.",
          "- Пустой — плашка **с обводкой**: граница ≥ 3:1 к фону (WCAG 1.4.11), иначе не видно флажка и его состояния. Токены `surface/control/*` — в любой стилистике можно поменять.",
          "- Отмечен — цвет акцента и галочка; `indeterminate` — черта («выбрано частично»).",
          "- Нажатие — scale на пружине, как у Button; фокус с клавиатуры — кольцо `color/state/focus`.",
          "- `description`, `error` — связаны через `aria-describedby`; ошибка ставит `aria-invalid`.",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Получать новости об акциях",
    disabled: false,
    indeterminate: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    "onUpdate:modelValue": { table: { disable: true } },
    modelValue: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Checkbox },
    setup: () => ({ args, value: ref(Boolean(args.modelValue)) }),
    template: '<Checkbox v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик по подписи и пробел с клавиатуры. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const box = canvas.getByRole("checkbox", { name: "Получать новости об акциях" });
    await userEvent.click(canvas.getByText("Получать новости об акциях"));
    await expect(box).toBeChecked();
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(" ");
    await expect(box).not.toBeChecked();
  },
};

export const WithDescription: Story = {
  name: "With description",
  args: { label: "Бесконтактная доставка", description: "Курьер оставит заказ у двери и позвонит" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "Бесконтактная доставка" })).toHaveAccessibleDescription(
      "Курьер оставит заказ у двери и позвонит",
    );
  },
};

/** Обязательное согласие: ошибка, пока не отмечено. Подпись со ссылкой — через слот. */
export const RequiredConsent: Story = {
  name: "Required consent (error)",
  args: { label: undefined, error: "Без согласия не сможем оформить заказ" },
  render: (args) => ({
    components: { Checkbox },
    setup: () => ({ args, value: ref(false) }),
    template: `
      <Checkbox v-bind="args" v-model="value" :error="value ? undefined : args.error">
        Согласен с <a href="#" style="color: var(--color-accent-default)">условиями</a>
      </Checkbox>
    `,
  }),
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox", { name: /Согласен с условиями/ });
    await expect(box).toBeInvalid();
    await userEvent.click(box);
    await expect(box).toBeValid();
  },
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: true },
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox", { name: "Получать новости об акциях" });
    await expect(box).toBeDisabled();
    await expect(box).toBeChecked();
  },
};

/** «Выбрать всё»: indeterminate, когда выбрана часть. */
export const SelectAll: Story = {
  name: "Select all (indeterminate)",
  render: () => ({
    components: { Checkbox },
    setup: () => {
      const items = ref([
        { id: "sms", label: "СМС", on: true },
        { id: "email", label: "Почта", on: false },
        { id: "push", label: "Пуш-уведомления", on: false },
      ]);
      const all = computed(() => items.value.every((i) => i.on));
      const some = computed(() => !all.value && items.value.some((i) => i.on));
      const toggleAll = (v: boolean) => items.value.forEach((i) => (i.on = v));
      return { items, all, some, toggleAll };
    },
    template: `
      <div style="display: grid">
        <Checkbox label="Все уведомления" :model-value="all" :indeterminate="some" @update:model-value="toggleAll" />
        <div style="display: grid; padding-inline-start: calc(var(--size-24) + var(--space-3))">
          <Checkbox v-for="item in items" :key="item.id" v-model="item.on" :label="item.label" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const all = canvas.getByRole("checkbox", { name: "Все уведомления" });
    await expect(all).toBePartiallyChecked();
    await userEvent.click(all);
    await expect(all).toBeChecked();
    for (const name of ["СМС", "Почта", "Пуш-уведомления"]) await expect(canvas.getByRole("checkbox", { name })).toBeChecked();
  },
};

const states = [
  { name: "unchecked", props: {} },
  { name: "hover", props: {} },
  { name: "checked", props: { modelValue: true } },
  { name: "indeterminate", props: { indeterminate: true } },
  { name: "focused", props: {} },
  { name: "error", props: { error: "Текст ошибки" } },
  { name: "disabled", props: { disabled: true } },
  { name: "disabled checked", props: { disabled: true, modelValue: true } },
] as const;

/** Все состояния для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#checkbox-hover .ui-checkbox__row"], focusVisible: ["#checkbox-focused .ui-checkbox__box"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Checkbox },
    setup: () => ({ states }),
    template: `
      <div style="display: grid">
        <div v-for="state in states" :id="'checkbox-' + state.name.replace(' ', '-')" :key="state.name">
          <Checkbox :label="state.name" description="Описание" v-bind="state.props" />
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
