import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Badge from "../Badge/Badge.vue";
import Button from "../Button/Button.vue";
import Grid from "../Grid/Grid.vue";
import Heading from "../Heading/Heading.vue";
import Stack from "../Stack/Stack.vue";
import Text from "../Text/Text.vue";
import Card from "./Card.vue";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: [
          "Плашка для группы контента: товар, преимущество, отзыв, тариф. Материал — `surface/card/*` (в glass — Figma `effect/glass/default`), скругление 24.",
          "",
          "- `as=\"a\"`, `as=\"button\"`, `NuxtLink` — вся карточка кликабельна: подсветка, лёгкое «вдавливание» на пружине, кольцо фокуса. Внутри такой карточки — без других ссылок и кнопок.",
          "- `padding`: `m` (16, мобильный), `l` (24), `none` (картинка во всю карточку).",
        ].join("\n"),
      },
    },
  },
  args: { padding: "m" },
  argTypes: {
    padding: { control: "inline-radio", options: ["none", "m", "l"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Card, Stack, Heading, Text, Badge, Button },
    setup: () => ({ args }),
    template: `
      <Card v-bind="args" as="article">
        <Stack gap="3">
          <Badge tone="success">В наличии</Badge>
          <Heading :level="3" size="s">Фермерский творог 5%</Heading>
          <Text size="s" tone="secondary">400 г · Ферма «Заречье»</Text>
          <Stack direction="horizontal" justify="between" align="center">
            <Text>189 ₽</Text>
            <Button variant="secondary">В корзину</Button>
          </Stack>
        </Stack>
      </Card>
    `,
  }),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Product: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("article")).toBeVisible();
  },
};

/** Клики по карточке-ссылке в истории (переход по ссылке гасится, чтобы не уводить превью) */
const onCardClick = fn();

/** Кликабельная карточка-ссылка: вся площадь — одна ссылка с именем из содержимого. */
export const AsLink: Story = {
  name: "As link",
  render: () => ({
    components: { Card, Stack, Heading, Text },
    setup: () => ({ onClick: (e: MouseEvent) => (e.preventDefault(), onCardClick()) }),
    template: `
      <Card as="a" href="/catalog/dairy" @click="onClick">
        <Stack gap="2">
          <Heading :level="3" size="s">Молочные продукты</Heading>
          <Text size="s" tone="secondary">124 товара</Text>
        </Stack>
      </Card>
    `,
  }),
  play: async ({ canvas }) => {
    onCardClick.mockClear();
    const link = canvas.getByRole("link", { name: /Молочные продукты/ });
    await userEvent.click(link);
    await expect(onCardClick).toHaveBeenCalledOnce();
    await expect(link).toHaveFocus();
  },
};

/** Сетка карточек преимуществ — типичный блок лендинга. */
export const FeatureGrid: Story = {
  name: "Feature grid",
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { Card, Grid, Stack, Heading, Text },
    template: `
      <Grid min="m" gap="4">
        <Card v-for="f in ['Доставка за 30 минут', 'Фермерские продукты', 'Оплата при получении']" :key="f" padding="l">
          <Stack gap="2">
            <Heading :level="3" size="s">{{ f }}</Heading>
            <Text size="s" tone="secondary">Короткое пояснение преимущества в одну-две строки.</Text>
          </Stack>
        </Card>
      </Grid>
    `,
  }),
};

/** Обычная, наведение, фокус — для сравнения стилистик. */
export const StateMatrix: Story = {
  name: "State matrix",
  parameters: {
    pseudo: { hover: ["#card-hover"], focusVisible: ["#card-focused"] },
    controls: { disable: true },
  },
  render: () => ({
    components: { Card, Stack, Heading, Text },
    template: `
      <Stack gap="4">
        <Card v-for="s in ['default', 'hover', 'focused']" :id="'card-' + s" :key="s" as="button">
          <Stack gap="1">
            <Heading :level="3" size="s">{{ s }}</Heading>
            <Text size="s" tone="secondary">Вторичный текст на карточке</Text>
          </Stack>
        </Card>
      </Stack>
    `,
  }),
};

const m = themeMatrix(StateMatrix);
export const MatrixGlassDark = { ...m.glassDark, tags: ["!dev", "!autodocs"] };
export const MatrixGlassLight = { ...m.glassLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralLight = { ...m.neutralLight, tags: ["!dev", "!autodocs"] };
export const MatrixNeutralDark = { ...m.neutralDark, tags: ["!dev", "!autodocs"] };
