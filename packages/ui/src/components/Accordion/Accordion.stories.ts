import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Link from "../Link/Link.vue";
import Accordion, { type AccordionEntry } from "./Accordion.vue";

const faq: AccordionEntry[] = [
  { value: "delivery", title: "Сколько стоит доставка?", content: "Бесплатно от 1500 ₽, иначе 190 ₽. Первая доставка всегда бесплатна." },
  { value: "time", title: "Когда привезут заказ?", content: "Выберите интервал при оформлении: от 30 минут до следующего дня." },
  { value: "return", title: "Как вернуть товар?", content: "Напишите в поддержку — вернём деньги за товар, который не подошёл." },
  { value: "gift", title: "Можно ли оплатить подарочной картой?", disabled: true },
];

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component: [
          "Раскрывающиеся разделы: FAQ, условия, характеристики. Поведение — Reka UI Accordion (aria-expanded, стрелки/Home/End между заголовками). В Figma нет — токен-первый.",
          "",
          "- `headingLevel` — уровень заголовков разделов (h2…h4) для структуры страницы.",
          "- `type`: `single` — открыт один раздел, `multiple` — несколько.",
          "- Содержимое — строка `content` или слот с именем `value` (разметка, ссылки).",
        ].join("\n"),
      },
    },
  },
  args: { items: faq, type: "single", headingLevel: 3 },
  argTypes: {
    type: { control: "inline-radio", options: ["single", "multiple"] },
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { Accordion, Link },
    setup: () => ({ args, open: ref(args.modelValue) }),
    template: `
      <Accordion v-bind="args" v-model="open">
        <template #return>
          Напишите в <Link href="#support">поддержку</Link> — вернём деньги за товар, который не подошёл.
        </template>
      </Accordion>
    `,
  }),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик раскрывает, повторный — сворачивает; стрелки переходят между заголовками. */
export const FAQ: Story = {
  play: async ({ canvas }) => {
    const first = canvas.getByRole("button", { name: "Сколько стоит доставка?" });
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText(/Бесплатно от 1500 ₽/)).toBeVisible());
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("button", { name: "Когда привезут заказ?" })).toHaveFocus();
    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  },
};

/** Раздел открыт, содержимое со ссылкой — для сравнения стилистик. */
export const Opened: Story = {
  args: { modelValue: "return" },
};

const m = themeMatrix(Opened);
export const OpenedGlassDark = m.glassDark;
export const OpenedGlassLight = m.glassLight;
export const OpenedNeutralLight = m.neutralLight;
export const OpenedNeutralDark = m.neutralDark;
