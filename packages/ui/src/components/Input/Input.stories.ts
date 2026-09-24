import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Mail, Search } from "@lucide/vue";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import Input from "./Input.vue";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: [
          "Текстовое поле. Источник — Figma «Inputs» (149:723): `input` = подпись + капсула `field` + подсказка.",
          "",
          "- Собран из **FormField** (подпись, подсказка/ошибка, связи `for` / `aria-describedby`) и **Field** (капсула со слотами и состояниями). Select строится на тех же двух частях.",
          "- Высота 48px, текст 16px — меньше iOS Safari зумит страницу при фокусе (в макете 14px, см. `docs/figma-todo.md`).",
          "- **Focus** — кольцо `color/state/focus` на капсуле (в макете индикатора нет).",
          "- **Error** — текст ошибки заменяет подсказку, красит подпись и бордер, ставит `aria-invalid`.",
          "- **Loading** — спиннер справа, поле только для чтения, `aria-busy`.",
          "- Атрибуты (`name`, `autocomplete`, `inputmode`, `required`) уходят на `<input>`.",
        ].join("\n"),
      },
    },
  },
  args: {
    label: "Email",
    hint: "Пришлём подтверждение",
    placeholder: "name@example.com",
    type: "email",
    disabled: false,
    loading: false,
    clearable: false,
    "onUpdate:modelValue": fn(),
    onClear: fn(),
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "tel", "url", "search", "password"] },
    "onUpdate:modelValue": { table: { disable: true } },
    onClear: { table: { disable: true } },
    start: { control: false },
    end: { control: false },
  },
  render: (args) => ({
    components: { Input },
    setup: () => ({ args, value: ref("") }),
    template: '<Input v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Интерактивное поле: печать, фокус, контролы. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await userEvent.type(input, "anna@example.com");
    await expect(input).toHaveValue("anna@example.com");
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith("anna@example.com");
    await expect(input).toHaveAccessibleDescription("Пришлём подтверждение");
  },
};

/** Клик по подписи переводит фокус в поле. */
export const LabelFocus: Story = {
  name: "Label focuses input",
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Email"));
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus();
  },
};

/** Ошибка заменяет подсказку и связана с полем через `aria-describedby`. */
export const ErrorState: Story = {
  name: "Error",
  args: { error: "Проверьте адрес — не хватает @" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription("Проверьте адрес — не хватает @");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await expect(input).toBeDisabled();
    await userEvent.type(input, "x", { skipClick: true });
    await expect(input).toHaveValue("");
  },
};

/** Спиннер справа, поле только для чтения (напр. проверка адреса на сервере). */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await expect(input).toHaveAttribute("aria-busy", "true");
    await expect(input).toHaveAttribute("readonly");
  },
};

/**
 * Поиск: иконка слева (слот `#start`, Lucide), кнопка очистки (`clearable`).
 * Как компактный `field` из Figma — без подписи, поэтому с `aria-label`.
 */
export const SearchField: Story = {
  name: "Search (clearable)",
  args: { label: undefined, hint: undefined, type: "search", placeholder: "Поиск", clearable: true },
  render: (args) => ({
    components: { Input, Search },
    setup: () => ({ args, value: ref("кроссовки") }),
    template: `
      <Input v-bind="args" v-model="value" aria-label="Поиск по каталогу">
        <template #start><Search /></template>
      </Input>
    `,
  }),
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("searchbox", { name: "Поиск по каталогу" });
    await userEvent.click(canvas.getByRole("button", { name: "Очистить" }));
    await expect(input).toHaveValue("");
    await expect(input).toHaveFocus();
    await expect(args.onClear).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("button", { name: "Очистить" })).toBeNull();
  },
};

/** Иконка слева и произвольное действие справа. */
export const WithIcons: Story = {
  name: "With icons",
  render: (args) => ({
    components: { Input, Mail },
    setup: () => ({ args, value: ref("") }),
    template: `
      <Input v-bind="args" v-model="value">
        <template #start><Mail /></template>
      </Input>
    `,
  }),
};

const states = [
  { name: "default", props: {} },
  { name: "hover", props: {} },
  { name: "focused", props: {} },
  { name: "error", props: { error: "Текст ошибки" } },
  { name: "disabled", props: { disabled: true } },
  { name: "loading", props: { loading: true } },
] as const;

/**
 * Все состояния из Figma для сравнения стилистик (переключатель темы в toolbar).
 * hover/focused форсируются storybook-addon-pseudo-states — в компоненте демо-классов нет.
 */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: {
      hover: ["#input-hover .ui-field"],
      focusWithin: ["#input-focused .ui-field"],
    },
    controls: { disable: true },
  },
  render: () => ({
    components: { Input, Search },
    setup: () => ({ states }),
    template: `
      <div style="display: grid; gap: var(--space-6)">
        <div v-for="state in states" :id="'input-' + state.name" :key="state.name">
          <Input :label="state.name" hint="Hint text" model-value="Текст" v-bind="state.props">
            <template #start><Search /></template>
          </Input>
        </div>
      </div>
    `,
  }),
};

/*
 * Та же матрица во всех комбинациях стилистика × схема (ADR-0005): каждая — отдельный тест,
 * поэтому axe проверяет контраст в каждой, а не только в стартовой. В Docs не выводятся.
 */
const combo = (theme: string, scheme: string): Story => ({
  ...StateMatrix,
  name: `State matrix · ${theme} ${scheme}`,
  tags: ["!autodocs"],
  globals: { theme, scheme },
});

export const MatrixGlassDark = combo("glass", "dark");
export const MatrixGlassLight = combo("glass", "light");
export const MatrixNeutralLight = combo("neutral", "light");
export const MatrixNeutralDark = combo("neutral", "dark");
