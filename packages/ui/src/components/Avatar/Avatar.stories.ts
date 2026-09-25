import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, waitFor } from "storybook/test";
import Avatar from "./Avatar.vue";

/** Фото в виде data-URI — история не зависит от сети */
const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#8ab4f8"/><circle cx="20" cy="16" r="7" fill="#fff"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#fff"/></svg>',
  );

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          "Фото или инициалы (если фото нет или не загрузилось). Размеры 32 / 40 / 48, круг. `name` — доступное имя; `decorative` — имя уже написано рядом, аватар скрыт от скринридера.",
      },
    },
  },
  args: { name: "Анна Киселева", size: "m", decorative: false },
  argTypes: { size: { control: "inline-radio", options: ["s", "m", "l"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Инициалы: имя — доступное имя. */
export const Initials: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "Анна Киселева" });
    await expect(avatar).toHaveTextContent("АК");
  },
};

export const Photo: Story = {
  args: { src: photo },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Анна Киселева" }).tagName).toBe("IMG");
  },
};

/** Фото не загрузилось — инициалы. */
export const BrokenPhoto: Story = {
  name: "Broken photo → initials",
  args: { src: "/does-not-exist.png" },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("img", { name: "Анна Киселева" })).toHaveTextContent("АК"));
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { Avatar },
    setup: () => ({ photo }),
    template: `
      <div style="display: flex; gap: var(--space-3); align-items: center">
        <Avatar name="Анна Киселева" size="s" />
        <Avatar name="Борис Орлов" />
        <Avatar name="Вера Лисина" size="l" :src="photo" />
      </div>
    `,
  }),
};
