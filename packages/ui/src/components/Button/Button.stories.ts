import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ArrowUpRight, Send } from "@lucide/vue";
import { expect, fn, userEvent } from "storybook/test";
import Button from "./Button.vue";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: [
          "Основное действие на экране. Источник — Figma «Buttons» (127:566), маппинг — `docs/figma-code.md`.",
          "",
          "- **primary** — главное действие (роль `surface/accent`), **secondary** — второстепенное (`surface/neutral`).",
          "- Высота 48px — комфортно для тача; компактного размера нет до реального SaaS-кейса.",
          "- **Pressed** — по канону Liquid Glass: scale на пружине, стекло светлеет, блик из точки касания.",
          "- **Focus** — только `:focus-visible` (клавиатура), без пропа.",
          "- **Loading** — только спиннер; лейбл остаётся доступным именем, кнопка не кликается.",
          "- Иконки — слоты `#start` / `#end` (Lucide), кнопка задаёт им размер и цвет.",
        ].join("\n"),
      },
    },
  },
  args: {
    variant: "primary",
    disabled: false,
    loading: false,
    as: "button",
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    size: { control: false },
    as: { control: "inline-radio", options: ["button", "a"] },
    onClick: { table: { disable: true } },
    // Слоты показываются в таблице Docs, но без контрола: содержимое задают истории
    default: { control: false },
    start: { control: false },
    end: { control: false },
  },
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: '<Button v-bind="args">Отправить</Button>',
  }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Интерактивная кнопка: hover/pressed — мышью или пальцем, focus — клавишей Tab. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Отправить" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

/** Фокус видим только при навигации с клавиатуры (`:focus-visible`). */
export const KeyboardFocus: Story = {
  name: "Keyboard focus",
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Отправить" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Нативный `disabled`: не фокусируется и не кликается. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Отправить" });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** Только спиннер; доступное имя сохраняется, `aria-busy="true"`, клик заблокирован. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Отправить" });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * Иконки слева/справа — слоты `#start` / `#end`. Библиотека кита — Lucide (`@lucide/vue`),
 * но Button о ней не знает: размер (`size/20`) и цвет (`currentColor`) задаёт сама кнопка.
 */
export const WithIcons: Story = {
  name: "With icons",
  render: (args) => ({
    components: { Button, Send, ArrowUpRight },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3)">
        <Button v-bind="args"><template #start><Send /></template>Отправить</Button>
        <Button v-bind="args">Подробнее<template #end><ArrowUpRight /></template></Button>
        <Button v-bind="args" variant="secondary"><template #start><Send /></template>Отправить</Button>
        <Button v-bind="args" variant="secondary">Подробнее<template #end><ArrowUpRight /></template></Button>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    // Иконки декоративные — доступное имя кнопки равно тексту
    await expect(canvas.getAllByRole("button", { name: "Отправить" })).toHaveLength(2);
  },
};

/** CTA-ссылка с визуалом кнопки. Disabled-ссылка остаётся в tab-порядке, но клик гасится. */
export const AsLink: Story = {
  name: "As link",
  args: { as: "a" },
  render: (args) => ({
    components: { Button },
    // Только для демо: не уводим превью (и тестовую страницу Vitest) по ссылке
    setup: () => ({ args, stay: (event: MouseEvent) => event.preventDefault() }),
    template: '<Button v-bind="args" href="/pricing" @click.capture="stay">Подробнее</Button>',
  }),
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("link", { name: "Подробнее" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const AsLinkDisabled: Story = {
  name: "As link, disabled",
  args: { as: "a", disabled: true },
  render: AsLink.render,
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole("link", { name: "Подробнее" });
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(link);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

const variants = ["primary", "secondary", "ghost"] as const;
const states = [
  { name: "default", props: {} },
  { name: "hover", props: {} },
  { name: "pressed", props: {} },
  { name: "focused", props: {} },
  { name: "disabled", props: { disabled: true } },
  { name: "loading", props: { loading: true } },
] as const;

/**
 * Матрица variant × state для сравнения стилистик глазами (переключатель темы в toolbar).
 * hover/pressed/focused форсируются через storybook-addon-pseudo-states — в компоненте
 * никаких «демо»-классов нет.
 */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: {
      hover: variants.map((v) => `#${v}-hover`),
      active: variants.map((v) => `#${v}-pressed`),
      focusVisible: variants.map((v) => `#${v}-focused`),
    },
    controls: { disable: true },
  },
  render: () => ({
    components: { Button },
    setup: () => ({ variants, states }),
    template: `
      <div style="display: grid; gap: var(--space-4)">
        <section v-for="variant in variants" :key="variant" style="display: grid; gap: var(--space-2)">
          <h2 style="margin: 0; font: inherit; color: var(--color-text-secondary)">{{ variant }}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-3)">
            <div v-for="state in states" :key="state.name" style="display: grid; gap: var(--space-2); justify-items: start">
              <Button :id="variant + '-' + state.name" :variant="variant" v-bind="state.props">Отправить</Button>
              <span style="font-size: var(--type-caption-font-size); line-height: var(--type-caption-line-height); color: var(--color-text-tertiary)">{{ state.name }}</span>
            </div>
          </div>
        </section>
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
