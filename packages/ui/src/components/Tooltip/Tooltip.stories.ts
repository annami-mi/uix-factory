import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Heart } from "@lucide/vue";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import IconButton from "../IconButton/IconButton.vue";
import Tooltip from "./Tooltip.vue";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: [
          "Подсказка при наведении и фокусе с клавиатуры (Reka UI Tooltip; Esc прячет). В Figma нет — токен-первый.",
          "",
          "- На сенсорных экранах не показывается — только уточнение, ничего важного.",
          "- Элемент внутри — фокусируемый (кнопка, ссылка). Имя кнопки-иконки всё равно задаёт `label` IconButton; подсказка — дополнение.",
        ].join("\n"),
      },
    },
  },
  args: { content: "Добавить в избранное — сохранится на всех устройствах", side: "top" },
  argTypes: { side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] } },
  render: (args) => ({
    components: { Tooltip, IconButton, Heart },
    setup: () => ({ args }),
    template: `
      <div style="padding-block-start: var(--size-64)">
        <Tooltip v-bind="args">
          <IconButton label="В избранное"><Heart /></IconButton>
        </Tooltip>
      </div>
    `,
  }),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Фокус с клавиатуры показывает подсказку и связывает её с кнопкой; Esc прячет. */
export const Playground: Story = {
  tags: ["!autodocs"],
  parameters: { a11y: { context: "body" } },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "В избранное" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    // Фокус с клавиатуры открывает подсказку, её текст — описание кнопки
    await waitFor(() => expect(button.getAttribute("data-state")).toMatch(/open/));
    await expect(button).toHaveAccessibleDescription("Добавить в избранное — сохранится на всех устройствах");
    // появляется с анимацией (opacity 0 → 1)
    await waitFor(() =>
      expect(screen.getByText("Добавить в избранное — сохранится на всех устройствах", { selector: ".ui-tooltip" })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(button).toHaveAttribute("data-state", "closed"));
  },
};

export const Default: Story = {};
