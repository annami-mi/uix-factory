import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Copy, Ellipsis, Pencil, Share2, Trash2 } from "@lucide/vue";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { openModalA11y } from "../../../.storybook/a11y";
import IconButton from "../IconButton/IconButton.vue";
import DropdownMenu, { type MenuEntry } from "./DropdownMenu.vue";

const items: MenuEntry[] = [
  { type: "label", label: "Заказ №1284" },
  { value: "edit", label: "Изменить", icon: Pencil },
  { value: "repeat", label: "Повторить заказ", icon: Copy },
  { value: "share", label: "Поделиться", icon: Share2, disabled: true },
  { type: "separator" },
  { value: "delete", label: "Удалить", icon: Trash2, danger: true },
];

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    docs: {
      description: {
        component: [
          "Меню действий по кнопке. Поведение — Reka UI DropdownMenu (menu/menuitem, стрелки, typeahead, Esc → фокус на кнопку). В Figma нет — токен-первый.",
          "",
          "- `items`: действия, `separator`, `label`; выбор — событие `select(value)`.",
          "- Панель и пункты — как у Select; опасное действие — `danger`.",
          "- Кнопка — слот (IconButton / Button), её имя — имя меню.",
        ].join("\n"),
      },
    },
  },
  args: { items, align: "start", onSelect: fn() },
  argTypes: {
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    onSelect: { table: { disable: true } },
  },
  render: (args) => ({
    components: { DropdownMenu, IconButton, Ellipsis },
    setup: () => ({ args }),
    template: `
      <DropdownMenu v-bind="args">
        <IconButton label="Действия с заказом"><Ellipsis /></IconButton>
      </DropdownMenu>
    `,
  }),
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Клик открывает, стрелки идут по пунктам (недоступный пропускается), Enter выбирает. */
export const Keyboard: Story = {
  tags: ["!autodocs"],
  parameters: openModalA11y,
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Действия с заказом" });
    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(screen.getByRole("menuitem", { name: "Повторить заказ" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelect).toHaveBeenCalledWith("repeat");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Открытое меню — axe по всему <body>. */
export const Open: Story = {
  tags: ["!autodocs"],
  parameters: openModalA11y,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Действия с заказом" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible());
  },
};

const open = (theme: string, scheme: string): Story => ({ ...Open, name: `Open · ${theme} ${scheme}`, globals: { theme, scheme } });
export const OpenGlassLight = { ...open("glass", "light"), tags: ["!dev", "!autodocs"] };
export const OpenNeutralLight = { ...open("neutral", "light"), tags: ["!dev", "!autodocs"] };
export const OpenNeutralDark = { ...open("neutral", "dark"), tags: ["!dev", "!autodocs"] };
