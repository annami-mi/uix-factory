import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import Button from "../Button/Button.vue";
import Grid from "../Grid/Grid.vue";
import Heading from "../Heading/Heading.vue";
import Stack from "../Stack/Stack.vue";
import Text from "../Text/Text.vue";
import Section from "./Section.vue";

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Секция страницы: вертикальный ритм лендинга (`layout/section`, 48 → 96px плавно) + **Container** внутри (ширина `size/container/*`, поля `layout/gutter` 16 → 40px).",
          "",
          "- `tone=\"subtle\"` — выделенная секция на плашке.",
          "- Свяжите секцию с её заголовком: `aria-labelledby` уходит на `<section>`.",
        ].join("\n"),
      },
    },
  },
  args: { size: "l", tone: "default" },
  argTypes: {
    size: { control: "inline-radio", options: ["s", "m", "l", "full"] },
    tone: { control: "inline-radio", options: ["default", "subtle"] },
    as: { control: false },
    default: { control: false },
  },
  render: (args) => ({
    components: { Section, Stack, Heading, Text, Button, Grid },
    setup: () => ({ args }),
    template: `
      <Section v-bind="args" aria-labelledby="hero-title">
        <Stack gap="6">
          <Stack gap="3">
            <Heading id="hero-title" :level="1" size="hero">Доставка продуктов за 30 минут</Heading>
            <Text tone="secondary">Свежие овощи, фермерское мясо и выпечка — прямо к двери. Первая доставка бесплатно.</Text>
          </Stack>
          <Stack direction="horizontal" gap="3" wrap>
            <Button>Выбрать продукты</Button>
            <Button variant="secondary">Как это работает</Button>
          </Stack>
        </Stack>
      </Section>
      <Section tone="subtle" aria-labelledby="features-title">
        <Stack gap="6">
          <Heading id="features-title" :level="2">Почему мы</Heading>
          <Grid min="m" gap="4">
            <Stack v-for="f in ['Быстро', 'Свежо', 'Удобно']" :key="f" gap="2">
              <Heading :level="3" size="s">{{ f }}</Heading>
              <Text size="s" tone="secondary">Короткое пояснение преимущества в одну-две строки.</Text>
            </Stack>
          </Grid>
        </Stack>
      </Section>
    `,
  }),
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Первый экран + секция преимуществ: так собирается лендинг из примитивов. */
export const LandingExample: Story = {
  name: "Landing example",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: "Доставка продуктов за 30 минут" })).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Доставка продуктов за 30 минут");
    await expect(canvas.getByRole("region", { name: "Почему мы" })).toBeVisible();
  },
};
