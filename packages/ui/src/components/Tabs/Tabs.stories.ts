import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Text from "../Text/Text.vue";
import Tabs, { type TabItem } from "./Tabs.vue";

const items: TabItem[] = [
  { value: "description", label: "Описание" },
  { value: "composition", label: "Состав" },
  { value: "reviews", label: "Отзывы" },
];

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: [
          "Вкладки — сегментированный контрол в стиле Liquid Glass: дорожка и плашка активной вкладки, которая перетекает на пружине. Поведение — Reka UI Tabs (tablist/tab/tabpanel, стрелки/Home/End). В Figma нет — токен-первый (`surface/segmented/*`).",
          "",
          "- `label` — доступное имя списка вкладок.",
          "- `stretch` — поровну на всю ширину (мобильный, 2–4 вкладки); иначе по содержимому с горизонтальной прокруткой.",
          "- Панель — слот с именем `value`.",
        ].join("\n"),
      },
    },
  },
  args: { items, label: "О товаре", stretch: true },
  argTypes: { modelValue: { control: false } },
  render: (args) => ({
    components: { Tabs, Text },
    setup: () => ({ args, tab: ref(args.modelValue ?? "description") }),
    template: `
      <Tabs v-bind="args" v-model="tab">
        <template #description><Text tone="secondary">Нежный творог из цельного молока, без консервантов.</Text></template>
        <template #composition><Text tone="secondary">Молоко нормализованное, закваска.</Text></template>
        <template #reviews><Text tone="secondary">4,8 из 5 — 126 отзывов.</Text></template>
      </Tabs>
    `,
  }),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик и стрелки переключают вкладку и панель. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tablist", { name: "О товаре" })).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "Состав" }));
    await expect(canvas.getByRole("tab", { name: "Состав" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Молоко нормализованное");
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: "Отзывы" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("4,8 из 5");
  },
};

/** По содержимому, много вкладок — горизонтальная прокрутка. */
export const Scrollable: Story = {
  args: {
    stretch: false,
    label: "Категории",
    items: ["Все", "Овощи", "Фрукты", "Молочное", "Мясо", "Выпечка", "Напитки"].map((l) => ({ value: l, label: l })),
  },
  render: (args) => ({
    components: { Tabs },
    setup: () => ({ args, tab: ref("Все") }),
    template: '<Tabs v-bind="args" v-model="tab" />',
  }),
};

/** Активная, наведение, недоступная — для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#tabs-hover [role=tab]:nth-child(3)"], focusVisible: ["#tabs-hover [role=tab]:nth-child(4)"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Tabs },
    setup: () => ({
      items: [
        { value: "a", label: "Активная" },
        { value: "b", label: "Наведение" },
        { value: "c", label: "Фокус" },
        { value: "d", label: "Недоступна", disabled: true },
      ],
    }),
    template: '<div id="tabs-hover"><Tabs :items="items" label="Состояния" model-value="a" /></div>',
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
export const MatrixBentoLight = { ...m.bentoLight, tags: ["!dev", "!autodocs"] };
