import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, within } from "storybook/test";
import Heading from "../../components/Heading/Heading.vue";
import IconButton from "../../components/IconButton/IconButton.vue";
import { LifeBuoy, navGroups, Settings } from "../stories/nav-data";
import SidebarPanel from "./SidebarPanel.vue";

const meta = {
  title: "Patterns/SidebarPanel",
  component: SidebarPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Развёрнутая навигация на тёмной скруглённой плашке (материал инвертированной плашки): бренд сверху, пункты «иконка в круге + подпись», группы, счётчики; активный — круг цвета spotlight и жирная подпись.",
          "",
          "- Референс — Med.+ (`docs/reference-images/bento-contrast/02-ehr-med.jpg`).",
          "- Контракт общий с другим вариантом сайдбара: `groups` (`value`, `label`, `icon`, `href`, `badge`), `current`, `linkAs` (NuxtLink/RouterLink), событие `navigate`.",
          "- На узком экране (меньше `breakpoint/m`, 768px) — мобильная таб-панель внизу. В приложении — в слоте `nav` каркаса `AppShell` (Patterns → AppShell).",
        ].join("\n"),
      },
    },
  },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
  args: { groups: navGroups, current: "overview", label: "Основная навигация" },
  argTypes: {
    current: { control: "select", options: navGroups.flatMap((g) => g.items.map((i) => i.value)) },
    groups: { control: false },
    linkAs: { control: false },
  },
  render: (args) => ({
    components: { SidebarPanel, Heading, IconButton, LifeBuoy, Settings },
    setup: () => {
      const current = ref(args.current);
      // Демо без роутера: якорные ссылки не меняют адрес страницы, активный пункт ведёт событие navigate
      const stayOnPage = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('a[href^="#"]')) e.preventDefault();
      };
      return { args, current, stayOnPage };
    },
    template: `
      <div style="block-size: 640px" @click.capture="stayOnPage">
        <SidebarPanel v-bind="args" :current="current" @navigate="current = $event">
          <template #brand><Heading :level="2" size="m">Med.+</Heading></template>
          <template #footer>
            <IconButton label="Настройки" variant="ghost"><Settings /></IconButton>
            <IconButton label="Поддержка" variant="ghost"><LifeBuoy /></IconButton>
          </template>
        </SidebarPanel>
      </div>
    `,
  }),
} satisfies Meta<typeof SidebarPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик по пункту — он становится активным (aria-current="page"). */
export const Default: Story = {
  play: async ({ canvas }) => {
    const nav = canvas.getAllByRole("navigation", { name: "Основная навигация" }).find((n) => n.classList.contains("ui-sidebar-panel"))!;
    await expect(nav).toBeVisible();
    await userEvent.click(within(nav).getByRole("link", { name: /Пациенты/ }));
    await expect(within(nav).getByRole("link", { name: /Пациенты/ })).toHaveAttribute("aria-current", "page");
  },
};

/** Активен другой раздел, в тёмной схеме glass — плашка светлая (инвертированная). */
export const GlassDark: Story = {
  name: "Glass dark",
  args: { current: "notes" },
  globals: { theme: "glass", scheme: "dark", viewport: { value: "desktop1440", isRotated: false } },
};

/** Bento-contrast: чёрная панель / чёрный активный круг, цвет-хайлайт из пресета. */
export const Bento: Story = {
  args: { current: "patients" },
  globals: { theme: "bento-contrast", scheme: "light", viewport: { value: "desktop1440", isRotated: false } },
};
