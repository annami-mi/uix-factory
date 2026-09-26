import type { Component } from "vue";

/**
 * Контракт навигации приложения — общий для всех вариантов сайдбара (SidebarPanel, SidebarRail) и
 * мобильной таб-панели (ADR-0008: варианты — разные компоненты с одним контрактом, не пропы-переключатели).
 */
export interface NavItem {
  /** Ключ пункта: сравнивается с `current` */
  value: string;
  label: string;
  /** Иконка (Lucide или любой компонент с currentColor) */
  icon: Component;
  /** Адрес: пункт — ссылка; без него — кнопка (событие navigate) */
  href?: string;
  /** Счётчик у пункта (непрочитанные, задачи) */
  badge?: string | number;
}

export interface NavGroup {
  /** Подпись группы (видна в развёрнутой панели) */
  label?: string;
  items: NavItem[];
}

/** Общие пропсы вариантов сайдбара */
export interface NavProps {
  groups: NavGroup[];
  /** Активный пункт (value) — aria-current="page" */
  current?: string;
  /** Доступное имя навигации */
  label?: string;
  /** Компонент ссылки: NuxtLink, RouterLink; по умолчанию <a> */
  linkAs?: string | Component;
  /** Сколько пунктов показать в мобильной таб-панели (Apple HIG — до 5) */
  tabBarItems?: number;
}
