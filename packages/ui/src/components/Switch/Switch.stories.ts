import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Switch from "./Switch.vue";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: [
          "Переключатель — мгновенное вкл/выкл настройки. Для согласий и выбора в форме (применяется по «Отправить») — **Checkbox**. В Figma нет — токен-первый.",
          "",
          "- Нативный `<input type=\"checkbox\" role=\"switch\">`: скринридер говорит «переключатель, вкл/выкл», пробел переключает.",
          "- Трек 52×32, бегунок 24; выключенный трек ≥ 3:1 к фону, включённый — акцент.",
          "- Как в iOS: при нажатии бегунок растягивается на пружине.",
        ].join("\n"),
      },
    },
  },
  args: { label: "Уведомления о заказе", disabled: false, "onUpdate:modelValue": fn() },
  argTypes: {
    "onUpdate:modelValue": { table: { disable: true } },
    modelValue: { control: false },
  },
  render: (args) => ({
    components: { Switch },
    setup: () => ({ args, value: ref(Boolean(args.modelValue)) }),
    template: '<Switch v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Роль switch, клик по подписи и пробел. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const control = canvas.getByRole("switch", { name: "Уведомления о заказе" });
    await expect(control).not.toBeChecked();
    await userEvent.click(canvas.getByText("Уведомления о заказе"));
    await expect(control).toBeChecked();
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(" ");
    await expect(control).not.toBeChecked();
  },
};

export const WithDescription: Story = {
  name: "With description",
  args: { label: "Тёмная тема", description: "По умолчанию — как в системе", modelValue: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch", { name: "Тёмная тема" })).toHaveAccessibleDescription(
      "По умолчанию — как в системе",
    );
  },
};

/** Список настроек — типичное применение. */
export const SettingsList: Story = {
  name: "Settings list",
  render: () => ({
    components: { Switch },
    setup: () => ({ push: ref(true), email: ref(false), sms: ref(false) }),
    template: `
      <div style="display: grid">
        <Switch v-model="push" label="Пуш-уведомления" />
        <Switch v-model="email" label="Письма об акциях" description="Не чаще раза в неделю" />
        <Switch v-model="sms" label="СМС о статусе заказа" disabled />
      </div>
    `,
  }),
};

/** Все состояния. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { focusVisible: ["#switch-focused .ui-switch__track"], active: ["#switch-pressed .ui-switch__track-wrap"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Switch },
    template: `
      <div style="display: grid">
        <Switch label="off" description="Описание" />
        <Switch label="on" description="Описание" :model-value="true" />
        <div id="switch-pressed"><Switch label="pressed" /></div>
        <div id="switch-focused"><Switch label="focused" /></div>
        <Switch label="disabled off" description="Описание" disabled />
        <Switch label="disabled on" description="Описание" disabled :model-value="true" />
      </div>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = m.glassDark;
export const MatrixGlassLight = m.glassLight;
export const MatrixNeutralLight = m.neutralLight;
export const MatrixNeutralDark = m.neutralDark;
