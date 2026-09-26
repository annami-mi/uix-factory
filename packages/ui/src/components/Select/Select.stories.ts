import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Globe } from "@lucide/vue";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { openModalA11y } from "../../../.storybook/a11y";
import Select, { type SelectOption } from "./Select.vue";

const options: SelectOption[] = [
  { value: "ru", label: "Россия" },
  { value: "kz", label: "Казахстан" },
  { value: "by", label: "Беларусь", disabled: true },
  { value: "am", label: "Армения" },
  { value: "ge", label: "Грузия" },
  { value: "uz", label: "Узбекистан" },
];

const desktop = { viewport: { value: "desktop1440", isRotated: false } };


const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component: [
          "Выбор одного значения. Источник — Figma «Inputs» (149:723), `select` = капсула `field` + шеврон. Раскрытый список в макете не нарисован — спроектирован в коде.",
          "",
          "- **Десктоп** (≥ `breakpoint/m`, 768px) — всплывашка у поля (Reka UI Select: listbox, typeahead, стрелки).",
          "- **Мобильный** — шторка снизу (**Sheet**, Reka Dialog + Listbox): затемнение, ручка, заголовок = подпись поля, safe-area.",
          "- `presentation`: `auto` (по ширине экрана), `popover`, `sheet`. До монтирования (SSR) — popover.",
          "- Поле, подпись, подсказка, ошибка — общие с Input (**FormField** + **Field**), вся капсула кликабельна.",
          "- Опции — капсулы 44px, выбранная — галочка цвета акцента; материал панели — `surface/popover/*`.",
        ].join("\n"),
      },
    },
  },
  args: {
    options,
    label: "Страна",
    hint: "Для расчёта доставки",
    placeholder: "Выберите страну",
    presentation: "auto",
    disabled: false,
    loading: false,
    "onUpdate:modelValue": fn(),
  },
  argTypes: {
    presentation: { control: "inline-radio", options: ["auto", "popover", "sheet"] },
    "onUpdate:modelValue": { table: { disable: true } },
    start: { control: false },
  },
  render: (args) => ({
    components: { Select },
    // Локальное значение стартует с args.modelValue, дальше — v-model (он перекрывает modelValue из args)
    setup: () => ({ args, value: ref<string | undefined>(args.modelValue) }),
    template: '<Select v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `auto`: на мобильной ширине (по умолчанию 390px) — шторка, на десктопной — всплывашка. */
export const Playground: Story = {};

/** Десктоп: всплывашка. Выбор мышью. */
export const Popover: Story = {
  args: { presentation: "popover" },
  globals: desktop,
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Страна" });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Казахстан" }));
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("kz");
    await expect(trigger).toHaveTextContent("Казахстан");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  },
};

/** Всплывашка с клавиатуры: Tab → Enter открывает, стрелки выбирают, Enter подтверждает. */
export const PopoverKeyboard: Story = {
  name: "Popover · keyboard",
  args: { presentation: "popover" },
  globals: desktop,
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Страна" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("kz");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Открытая всплывашка — axe проверяет панель целиком (она в <body>, вне canvas). */
export const PopoverOpen: Story = {
  // Сценарий для теста (открытая панель + axe). Не в Docs: там play не запускается,
  // а сама история вызывает зависание таблицы Controls Storybook (см. docs/components.md)
  tags: ["!autodocs"],
  name: "Popover · open",
  args: { presentation: "popover", modelValue: "ru" },
  parameters: openModalA11y,
  globals: desktop,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Страна" }));
    // Панель появляется с анимацией (opacity 0 → 1) — ждём окончания
    await waitFor(() => expect(screen.getByRole("listbox")).toBeVisible());
  },
};

/** Мобильный: шторка снизу. Выбор закрывает шторку и возвращает фокус на поле. */
export const SheetPresentation: Story = {
  name: "Sheet",
  args: { presentation: "sheet" },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Страна/ });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Страна" });
    await expect(dialog).toBeVisible();
    await userEvent.click(screen.getByRole("option", { name: "Армения" }));
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("am");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveTextContent("Армения");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Открытая шторка — axe по всему <body>. */
export const SheetOpen: Story = {
  // Сценарий для теста (открытая панель + axe). Не в Docs: там play не запускается,
  // а сама история вызывает зависание таблицы Controls Storybook (см. docs/components.md)
  tags: ["!autodocs"],
  name: "Sheet · open",
  args: { presentation: "sheet", modelValue: "kz" },
  parameters: openModalA11y,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Страна/ }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Страна" })).toBeVisible());
    await expect(screen.getByRole("listbox", { name: "Страна" })).toBeVisible();
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: { presentation: "popover", error: "Выберите страну доставки" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Страна" });
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription("Выберите страну доставки");
  },
};

export const Disabled: Story = {
  args: { presentation: "popover", disabled: true, modelValue: "ru" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Страна" })).toBeDisabled();
  },
};

/** Опции грузятся: спиннер вместо шеврона, выбор заблокирован. */
export const Loading: Story = {
  args: { presentation: "popover", loading: true },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Страна" });
    await expect(trigger).toHaveAttribute("aria-busy", "true");
    await expect(trigger).toBeDisabled();
  },
};

/** Иконка слева — слот `#start`. */
export const WithIcon: Story = {
  name: "With icon",
  render: (args) => ({
    components: { Select, Globe },
    setup: () => ({ args, value: ref("ru") }),
    template: '<Select v-bind="args" v-model="value"><template #start><Globe /></template></Select>',
  }),
};

const states = [
  { name: "default", props: {} },
  { name: "filled", props: { modelValue: "kz" } },
  { name: "hover", props: {} },
  { name: "focused", props: {} },
  { name: "error", props: { error: "Текст ошибки" } },
  { name: "disabled", props: { disabled: true } },
  { name: "loading", props: { loading: true } },
] as const;

/** Все состояния поля (Figma select) для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: {
      hover: ["#select-hover .ui-field"],
      focusWithin: ["#select-focused .ui-field"],
    },
    controls: { disable: true },
  },
  render: () => ({
    components: { Select },
    setup: () => ({ states, options }),
    template: `
      <div style="display: grid; gap: var(--space-6)">
        <div v-for="state in states" :id="'select-' + state.name" :key="state.name">
          <Select :options="options" :label="state.name" hint="Hint text" placeholder="Выберите" presentation="popover" v-bind="state.props" />
        </div>
      </div>
    `,
  }),
};

/*
 * Та же матрица во всех комбинациях стилистика × схема (ADR-0005): axe проверяет контраст в каждой.
 */
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

/** Открытая панель во всех комбинациях — контраст опций на материале панели. */
const openCombo = (theme: string, scheme: string, presentation: "popover" | "sheet"): Story => ({
  ...(presentation === "popover" ? PopoverOpen : SheetOpen),
  name: `${presentation === "popover" ? "Popover" : "Sheet"} · open · ${theme} ${scheme}`,
  tags: ["!autodocs"],
  globals: { theme, scheme, ...(presentation === "popover" ? desktop : {}) },
});

export const PopoverOpenGlassLight = { ...openCombo("glass", "light", "popover"), tags: ["!dev", "!autodocs"] };
export const PopoverOpenNeutralLight = { ...openCombo("neutral", "light", "popover"), tags: ["!dev", "!autodocs"] };
export const PopoverOpenNeutralDark = { ...openCombo("neutral", "dark", "popover"), tags: ["!dev", "!autodocs"] };
export const PopoverOpenBentoLight = { ...openCombo("bento-contrast", "light", "popover"), tags: ["!dev", "!autodocs"] };
export const SheetOpenGlassLight = { ...openCombo("glass", "light", "sheet"), tags: ["!dev", "!autodocs"] };
export const SheetOpenNeutralLight = { ...openCombo("neutral", "light", "sheet"), tags: ["!dev", "!autodocs"] };
export const SheetOpenNeutralDark = { ...openCombo("neutral", "dark", "sheet"), tags: ["!dev", "!autodocs"] };
export const SheetOpenBentoLight = { ...openCombo("bento-contrast", "light", "sheet"), tags: ["!dev", "!autodocs"] };
