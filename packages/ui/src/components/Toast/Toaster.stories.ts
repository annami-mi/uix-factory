import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { useToast } from "../../composables/useToast";
import Button from "../Button/Button.vue";
import Stack from "../Stack/Stack.vue";
import Toaster from "./Toaster.vue";

const onUndo = fn();

const meta = {
  title: "Components/Toast",
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component: [
          "Всплывающие уведомления. `<Toaster />` — один раз в корневом layout; показать — `useToast().toast({ title, description, tone, action })` из любого места.",
          "",
          "- Reka UI Toast: объявляется скринридером (`danger` — сразу, остальные — вежливо), таймер (`duration/toast`, 5 с) замирает при наведении/фокусе, F8 — к уведомлениям, смахивание вправо закрывает.",
          "- Внизу по центру, шириной как узкий контейнер; на телефоне — во всю ширину с полями, с учётом safe-area.",
          "- `action` требует `altText` — как сделать то же без уведомления (оно исчезает).",
        ].join("\n"),
      },
    },
  },
  render: () => ({
    components: { Toaster, Button, Stack },
    setup: () => {
      const { toast } = useToast();
      return {
        added: () => toast({ title: "Товар добавлен в корзину", tone: "success" }),
        removed: () =>
          toast({
            title: "Адрес удалён",
            description: "ул. Ленина, 5",
            action: { label: "Вернуть", altText: "Вернуть адрес можно в разделе «Адреса»", onClick: onUndo },
          }),
        failed: () => toast({ title: "Не удалось оплатить", description: "Проверьте данные карты и попробуйте снова", tone: "danger" }),
      };
    },
    template: `
      <Stack direction="horizontal" gap="3" wrap>
        <Button variant="secondary" @click="added">Успех</Button>
        <Button variant="secondary" @click="removed">С действием</Button>
        <Button variant="secondary" @click="failed">Ошибка</Button>
      </Stack>
      <Toaster />
    `,
  }),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Уведомление с действием: появляется, действие вызывается, «Закрыть» убирает. */
export const WithAction: Story = {
  name: "With action",
  tags: ["!autodocs"],
  parameters: { a11y: { context: "body" } },
  play: async ({ canvas }) => {
    onUndo.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "С действием" }));
    // Сам тост (текст ещё дублируется в скрытом объявлении для скринридера); появляется с анимацией
    const toast = () => document.querySelector<HTMLElement>(".ui-toast");
    await waitFor(() => expect(toast()).toBeVisible());
    await expect(toast()).toHaveTextContent("Адрес удалён");
    await userEvent.click(screen.getByRole("button", { name: "Вернуть" }));
    await expect(onUndo).toHaveBeenCalledOnce();
    await waitFor(() => expect(toast()).toBeNull());
  },
};

/** Ошибка: объявляется сразу, закрывается кнопкой. */
export const Danger: Story = {
  tags: ["!autodocs"],
  parameters: { a11y: { context: "body" } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Ошибка" }));
    const toast = () => document.querySelector<HTMLElement>(".ui-toast");
    await waitFor(() => expect(toast()).toBeVisible());
    await expect(toast()).toHaveAttribute("data-tone", "danger");
    await userEvent.click(screen.getByRole("button", { name: "Закрыть уведомление" }));
    await waitFor(() => expect(toast()).toBeNull());
  },
};
