import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, waitFor } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Button from "../Button/Button.vue";
import Link from "../Link/Link.vue";
import Stack from "../Stack/Stack.vue";
import Alert from "./Alert.vue";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: [
          "Сообщение в потоке страницы. Тонированная плашка тона, иконка, текст ≥ 4.5:1 на плашке (тест токенов). В Figma нет — токен-первый.",
          "",
          "- Статичное — без роли. `live` — появилось в ответ на действие: danger/warning объявляются сразу (`role=alert`), остальные — вежливо (`role=status`).",
          "- `dismissible` — кнопка «Закрыть» и событие `dismiss`; действия — слот `#actions`.",
        ].join("\n"),
      },
    },
  },
  args: { tone: "info", title: "Доставка задерживается", live: false, dismissible: false },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "info", "success", "warning", "danger"] } },
  render: (args) => ({
    components: { Alert, Link },
    setup: () => ({ args }),
    template: `
      <Alert v-bind="args">
        Из-за снегопада курьеры опаздывают до 30 минут. <Link href="#status">Статус заказа</Link>
      </Alert>
    `,
  }),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("status")).toBeNull();
    await expect(canvas.getByText("Доставка задерживается")).toBeVisible();
  },
};

/** Появилось в ответ на действие — объявляется скринридером; закрывается. */
export const LiveDismissible: Story = {
  name: "Live, dismissible",
  render: () => ({
    components: { Alert, Button },
    setup: () => ({ shown: ref(true) }),
    template: `
      <Alert v-if="shown" tone="danger" title="Не удалось сохранить адрес" live dismissible @dismiss="shown = false">
        Проверьте подключение к интернету.
        <template #actions><Button variant="secondary">Повторить</Button></template>
      </Alert>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Не удалось сохранить адрес");
    await userEvent.click(canvas.getByRole("button", { name: "Закрыть" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
  },
};

/** Все тона — для сравнения стилистик и контраста. */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { Alert, Stack },
    template: `
      <Stack gap="3">
        <Alert tone="neutral" title="Нейтральное">Пояснение к сообщению.</Alert>
        <Alert tone="info" title="Информация">Пояснение к сообщению.</Alert>
        <Alert tone="success" title="Заказ оформлен">Мы пришлём СМС, когда курьер выедет.</Alert>
        <Alert tone="warning" title="Осталось 2 штуки">Успейте оформить заказ.</Alert>
        <Alert tone="danger" title="Карта отклонена" dismissible>Попробуйте другую карту.</Alert>
      </Stack>
    `,
  }),
};

const m = themeMatrix(Tones);
export const TonesGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const TonesGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const TonesNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const TonesNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
