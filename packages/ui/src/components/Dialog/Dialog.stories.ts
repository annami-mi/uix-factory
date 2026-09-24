import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { openModalA11y } from "../../../.storybook/a11y";
import Button from "../Button/Button.vue";
import Input from "../Input/Input.vue";
import Stack from "../Stack/Stack.vue";
import Text from "../Text/Text.vue";
import Dialog from "./Dialog.vue";

const desktop = { viewport: { value: "desktop1440", isRotated: false } };

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: [
          "Модальный диалог: подтверждение, короткая форма. Поведение — Reka UI Dialog (фокус внутри и возврат на кнопку, Esc, тап по фону). В Figma нет — токен-первый.",
          "",
          "- **Десктоп** (≥ 768px) — окно по центру на пружине; **мобильный** — шторка снизу (Sheet), кнопки у большого пальца.",
          "- `presentation`: `auto` / `dialog` / `sheet`; до монтирования (SSR) — dialog.",
          "- Заголовок — имя диалога, `description` — описание; действия — слот `#footer`.",
        ].join("\n"),
      },
    },
  },
  args: { title: "Удалить адрес?", description: "Адрес «ул. Ленина, 5» пропадёт из списка доставки.", size: "sm", presentation: "auto" },
  argTypes: {
    presentation: { control: "inline-radio", options: ["auto", "dialog", "sheet"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    open: { control: false },
  },
  render: (args) => ({
    components: { Dialog, Button },
    setup: () => ({ args, open: ref(false) }),
    template: `
      <Button variant="secondary" @click="open = true">Удалить адрес</Button>
      <Dialog v-bind="args" v-model:open="open">
        <template #footer>
          <Button variant="secondary" @click="open = false">Отмена</Button>
          <Button @click="open = false">Удалить</Button>
        </template>
      </Dialog>
    `,
  }),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Мобильный — шторка; десктоп — окно. Переключите viewport. */
export const Playground: Story = {};

/** Окно: открытие, имя и описание, Esc закрывает и возвращает фокус на кнопку. */
export const DialogWindow: Story = {
  name: "Dialog window",
  args: { presentation: "dialog" },
  globals: desktop,
  play: async ({ canvas }) => {
    const opener = canvas.getByRole("button", { name: "Удалить адрес" });
    await userEvent.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Удалить адрес?" });
    await expect(dialog).toHaveAccessibleDescription("Адрес «ул. Ленина, 5» пропадёт из списка доставки.");
    // фокус — на само окно (не на «Закрыть»): скринридер читает заголовок, Tab ведёт дальше
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** Шторка: кнопка «Закрыть» в шапке. */
export const SheetPresentation: Story = {
  name: "Sheet",
  args: { presentation: "sheet" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Удалить адрес" }));
    await screen.findByRole("dialog", { name: "Удалить адрес?" });
    await userEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** Форма в диалоге. Открыто — axe проверяет окно целиком. */
export const WithForm: Story = {
  name: "With form (open)",
  tags: ["!autodocs"],
  args: { title: "Новый адрес", description: undefined, presentation: "dialog" },
  globals: desktop,
  parameters: openModalA11y,
  render: (args) => ({
    components: { Dialog, Button, Input, Stack, Text },
    setup: () => ({ args, open: ref(false) }),
    template: `
      <Button @click="open = true">Добавить адрес</Button>
      <Dialog v-bind="args" v-model:open="open">
        <Stack gap="4">
          <Text size="md" tone="secondary">Курьер привезёт заказ по этому адресу.</Text>
          <Input label="Улица и дом" placeholder="ул. Ленина, 5" autocomplete="street-address" />
          <Input label="Квартира" inputmode="numeric" />
        </Stack>
        <template #footer>
          <Button variant="secondary" @click="open = false">Отмена</Button>
          <Button @click="open = false">Сохранить</Button>
        </template>
      </Dialog>
    `,
  }),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Добавить адрес" }));
    const dialog = await screen.findByRole("dialog", { name: "Новый адрес" });
    await waitFor(() => expect(dialog).toBeVisible());
  },
};

/** Шторка открыта — axe по всему <body>. */
export const SheetOpen: Story = {
  name: "Sheet (open)",
  tags: ["!autodocs"],
  args: { presentation: "sheet" },
  parameters: openModalA11y,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Удалить адрес" }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Удалить адрес?" })).toBeVisible());
  },
};

const open = (theme: string, scheme: string): Story => ({
  ...WithForm,
  name: `With form (open) · ${theme} ${scheme}`,
  globals: { ...desktop, theme, scheme },
});
export const OpenGlassLight = open("glass", "light");
export const OpenNeutralLight = open("neutral", "light");
export const OpenNeutralDark = open("neutral", "dark");
