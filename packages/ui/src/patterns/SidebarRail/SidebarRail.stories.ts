import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, within } from "storybook/test";
import Heading from "../../components/Heading/Heading.vue";
import IconButton from "../../components/IconButton/IconButton.vue";
import { LifeBuoy, navGroups, Settings } from "../stories/nav-data";
import SidebarRail from "./SidebarRail.vue";

const meta = {
  title: "Patterns/SidebarRail",
  component: SidebarRail,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Компактная навигация — столбик круглых кнопок: неактивные — материал карточки, активная — материал главной кнопки; подпись — подсказка справа и доступное имя, «есть новое» — точка.",
          "",
          "- Референс — Client Dashboard (`docs/reference-images/bento-contrast/04-client-dashboard.jpg`).",
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
    components: { SidebarRail, Heading, IconButton, LifeBuoy, Settings },
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
        <SidebarRail v-bind="args" :current="current" @navigate="current = $event">
          
          <template #footer>
            <IconButton label="Поддержка" variant="ghost"><LifeBuoy /></IconButton>
          </template>
        </SidebarRail>
      </div>
    `,
  }),
} satisfies Meta<typeof SidebarRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Клик по пункту — он становится активным (aria-current="page"). */
export const Default: Story = {
  play: async ({ canvas }) => {
    const nav = canvas.getAllByRole("navigation", { name: "Основная навигация" }).find((n) => n.classList.contains("ui-sidebar-rail"))!;
    await expect(nav).toBeVisible();
    await userEvent.click(within(nav).getByRole("link", { name: "Пациенты, 3" }));
    await expect(within(nav).getByRole("link", { name: "Пациенты, 3" })).toHaveAttribute("aria-current", "page");
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
