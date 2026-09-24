import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { openModalA11y } from "../../../.storybook/a11y";
import Button from "../Button/Button.vue";
import Sheet from "./Sheet.vue";

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: {
    docs: {
      description: {
        component: [
          "Шторка снизу — модальная панель для мобильных. Сейчас её использует **Select** на узком экране; дальше — меню, фильтры, подтверждения.",
          "",
          "- Reka UI Dialog: фокус внутри, **Esc** и тап по затемнению закрывают, фокус возвращается на элемент, открывший шторку, скролл страницы заблокирован.",
          "- Материал — как у всплывашек (`surface/popover/*`), затемнение — `surface/scrim/*`, скругление — `radius/sheet`.",
          "- Выезжает снизу на пружине; при `prefers-reduced-motion` — только проявление. Учитывает safe-area iPhone.",
        ].join("\n"),
      },
    },
  },
  args: { title: "Сортировка" },
  render: (args) => ({
    components: { Sheet, Button },
    setup: () => ({ args, open: ref(false) }),
    template: `
      <Button variant="secondary" @click="open = true">Открыть шторку</Button>
      <Sheet v-bind="args" v-model:open="open">
        <p style="margin: 0; padding: var(--space-2) var(--space-4) var(--space-4); color: var(--color-text-secondary)">
          Содержимое шторки: список, форма или действия.
        </p>
        <div style="display: grid; padding-inline: var(--space-2)">
          <Button @click="open = false">Готово</Button>
        </div>
      </Sheet>
    `,
  }),
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Открытие, закрытие по Esc, возврат фокуса. */
export const Default: Story = {
  parameters: openModalA11y,
  play: async ({ canvas }) => {
    const opener = canvas.getByRole("button", { name: "Открыть шторку" });
    await userEvent.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Сортировка" });
    await expect(dialog).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
