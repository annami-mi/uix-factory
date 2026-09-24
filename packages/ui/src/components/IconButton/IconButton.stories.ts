import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Heart, Search, Send, X } from "@lucide/vue";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import IconButton from "./IconButton.vue";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component: [
          "Кнопка-иконка. Источник — Figma «Buttons» (127:566), ряд IconButton. Это **Button** с модификатором: круг 48, иконка 24; состояния, пружина, блик, loading — те же.",
          "",
          "- `label` обязателен — единственное доступное имя кнопки без текста (и подсказка при наведении).",
          "- `variant`: `secondary` (по умолчанию), `primary`, `ghost` — без плашки в покое (закрыть, тулбары).",
        ].join("\n"),
      },
    },
  },
  args: { label: "Отправить", variant: "secondary", disabled: false, loading: false, onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost"] },
    onClick: { table: { disable: true } },
    default: { control: false },
  },
  render: (args) => ({
    components: { IconButton, Send },
    setup: () => ({ args }),
    template: '<IconButton v-bind="args"><Send /></IconButton>',
  }),
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Имя — из `label`; клик и клавиатура. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Отправить" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Отправить" });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** Типичные применения: закрыть (ghost), избранное, поиск, отправить (primary). */
export const Examples: Story = {
  render: () => ({
    components: { IconButton, X, Heart, Search, Send },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3)">
        <IconButton label="Закрыть" variant="ghost"><X /></IconButton>
        <IconButton label="В избранное"><Heart /></IconButton>
        <IconButton label="Поиск"><Search /></IconButton>
        <IconButton label="Отправить" variant="primary"><Send /></IconButton>
      </div>
    `,
  }),
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

/** variant × state (как в Figma). */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: {
      hover: variants.map((v) => `#icon-${v}-hover`),
      active: variants.map((v) => `#icon-${v}-pressed`),
      focusVisible: variants.map((v) => `#icon-${v}-focused`),
    },
    controls: { disable: true },
  },
  render: () => ({
    components: { IconButton, Send },
    setup: () => ({ variants, states }),
    template: `
      <div style="display: grid; gap: var(--space-4)">
        <div v-for="variant in variants" :key="variant" style="display: flex; flex-wrap: wrap; gap: var(--space-3)">
          <IconButton v-for="state in states" :id="'icon-' + variant + '-' + state.name" :key="state.name"
            :label="variant + ' ' + state.name" :variant="variant" v-bind="state.props"><Send /></IconButton>
        </div>
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = m.glassDark;
export const MatrixGlassLight = m.glassLight;
export const MatrixNeutralLight = m.neutralLight;
export const MatrixNeutralDark = m.neutralDark;
