import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, userEvent, within } from "storybook/test";
import { themeMatrix } from "../../../.storybook/story-helpers";
import Card from "../../components/Card/Card.vue";
import Heading from "../../components/Heading/Heading.vue";
import IconButton from "../../components/IconButton/IconButton.vue";
import Text from "../../components/Text/Text.vue";
import SidebarPanel from "../SidebarPanel/SidebarPanel.vue";
import SidebarRail from "../SidebarRail/SidebarRail.vue";
import { LifeBuoy, navGroups, Settings } from "../stories/nav-data";
import AppShell from "./AppShell.vue";

const desktop = { viewport: { value: "desktop1440", isRotated: false } };

const CONTENT = `
  <template #header>
    <Heading :level="1" size="display">{{ titles[current] ?? "Обзор" }}</Heading>
  </template>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-grid-item-m)), 1fr)); gap: var(--space-3)">
    <Card v-for="n in 6" :key="n" padding="l">
      <Text tone="secondary">Плитка {{ n }}</Text>
      <Heading :level="2" size="m">{{ n * 12 }} записей</Heading>
    </Card>
  </div>
`;

const titles: Record<string, string> = {
  overview: "Обзор",
  patients: "Пациенты",
  calendar: "Расписание",
  notes: "Заметки",
  files: "Файлы",
  messages: "Сообщения",
};

const meta = {
  title: "Patterns/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Каркас приложения (ADR-0008): навигация + шапка + `<main>`. Вариант навигации — в слот `nav`, выбирает composition root (`LookRecipe.appShell`). Общий контракт вариантов — `NavGroup[]` (`value`, `label`, `icon`, `href`, `badge`), `current`, `linkAs` (NuxtLink/RouterLink), событие `navigate`.",
          "",
          "- **SidebarPanel** — развёрнутая тёмная панель (референс Med.+): материал инвертированной плашки, активный пункт — круг spotlight под иконкой.",
          "- **SidebarRail** — рельс круглых кнопок (референс Client Dashboard): активная — материал главной кнопки, подпись — подсказка.",
          "- **Мобильный** (mobile-first) — обе становятся плавающей таб-панелью внизу (Apple HIG: до 5 разделов), каркас оставляет под неё место.",
          "- Ссылка «Перейти к содержимому» — первый фокус; активный пункт — `aria-current=\"page\"`.",
        ].join("\n"),
      },
    },
  },
  tags: ["!autodocs"],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const render = (nav: "panel" | "rail") => () => ({
  components: { AppShell, Card, Heading, IconButton, LifeBuoy, Settings, SidebarPanel, SidebarRail, Text },
  setup: () => ({
    navGroups,
    current: ref("overview"),
    titles,
    nav,
    // Демо без роутера: якорные ссылки не меняют адрес (иначе раннер тестов теряет страницу) —
    // активный пункт ведёт событие navigate, в приложении этим занимается роутер (linkAs)
    stayOnPage: (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a[href^="#"]:not(.ui-app-shell__skip)')) e.preventDefault();
    },
  }),
  template: `
    <div @click.capture="stayOnPage"><AppShell>
      <template #nav>
        <SidebarPanel v-if="nav === 'panel'" :groups="navGroups" :current="current" @navigate="current = $event">
          <template #brand><Heading :level="2" size="m">Med.+</Heading></template>
          <template #footer>
            <IconButton label="Настройки" variant="ghost"><Settings /></IconButton>
            <IconButton label="Поддержка" variant="ghost"><LifeBuoy /></IconButton>
          </template>
        </SidebarPanel>
        <SidebarRail v-else :groups="navGroups" :current="current" @navigate="current = $event">
          <template #footer>
            <IconButton label="Поддержка" variant="ghost"><LifeBuoy /></IconButton>
          </template>
        </SidebarRail>
      </template>
      ${CONTENT}
    </AppShell></div>
  `,
});

/** Мобильный (по умолчанию): таб-панель внизу, до 5 разделов. */
export const Mobile: Story = {
  render: render("panel"),
  play: async ({ canvas }) => {
    const bar = canvas.getAllByRole("navigation", { name: "Основная навигация" }).find((n) => n.classList.contains("ui-tab-bar"))!;
    await expect(bar).toBeVisible();
    await expect(within(bar).getAllByRole("link")).toHaveLength(5);
    await userEvent.click(within(bar).getByRole("link", { name: "Расписание" }));
    await expect(within(bar).getByRole("link", { name: "Расписание" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Расписание");
  },
};

/** Десктоп: развёрнутая панель (Med.+). */
export const Panel: Story = {
  globals: desktop,
  render: render("panel"),
  play: async ({ canvas }) => {
    const panel = canvas.getAllByRole("navigation", { name: "Основная навигация" }).find((n) => n.classList.contains("ui-sidebar-panel"))!;
    await expect(panel).toBeVisible();
    await userEvent.click(within(panel).getByRole("link", { name: /Пациенты/ }));
    await expect(within(panel).getByRole("link", { name: /Пациенты/ })).toHaveAttribute("aria-current", "page");
  },
};

/** Десктоп: рельс (Client Dashboard). */
export const Rail: Story = {
  globals: desktop,
  render: render("rail"),
  play: async ({ canvas }) => {
    const rail = canvas.getAllByRole("navigation", { name: "Основная навигация" }).find((n) => n.classList.contains("ui-sidebar-rail"))!;
    await expect(within(rail).getByRole("link", { name: "Пациенты, 3" })).toBeInTheDocument();
    await expect(within(rail).getByRole("link", { name: "Обзор" })).toHaveAttribute("aria-current", "page");
  },
};

/** Клавиатура: первый Tab — «Перейти к содержимому». */
export const SkipLink: Story = {
  name: "Skip link",
  globals: desktop,
  render: render("panel"),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Перейти к содержимому" })).toHaveFocus();
  },
};

const mp = themeMatrix(Panel);
export const PanelGlassDark = { ...mp.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const PanelGlassLight = { ...mp.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const PanelNeutralLight = { ...mp.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const PanelNeutralDark = { ...mp.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const PanelBentoLight = { ...mp.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
const mr = themeMatrix(Rail);
export const RailGlassDark = { ...mr.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const RailGlassLight = { ...mr.glassLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const RailNeutralLight = { ...mr.neutralLight, play: undefined, tags: ["!dev", "!autodocs"] };
export const RailNeutralDark = { ...mr.neutralDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const RailBentoLight = { ...mr.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
const mm = themeMatrix(Mobile);
export const MobileGlassDark = { ...mm.glassDark, play: undefined, tags: ["!dev", "!autodocs"] };
export const MobileBentoLight = { ...mm.bentoLight, play: undefined, tags: ["!dev", "!autodocs"] };
