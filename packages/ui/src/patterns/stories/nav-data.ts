import { CalendarDays, FileText, FolderOpen, House, LifeBuoy, MessageSquare, Settings, Users } from "@lucide/vue";
import type { NavGroup } from "../navigation/types";

/** Демо-навигация (по мотивам Med.+ / Client Dashboard) */
export const navGroups: NavGroup[] = [
  {
    items: [
      { value: "overview", label: "Обзор", icon: House, href: "#overview" },
      { value: "patients", label: "Пациенты", icon: Users, href: "#patients", badge: 3 },
      { value: "calendar", label: "Расписание", icon: CalendarDays, href: "#calendar" },
    ],
  },
  {
    label: "Документы",
    items: [
      { value: "notes", label: "Заметки", icon: FileText, href: "#notes" },
      { value: "files", label: "Файлы", icon: FolderOpen, href: "#files" },
      { value: "messages", label: "Сообщения", icon: MessageSquare, href: "#messages" },
    ],
  },
];

export { LifeBuoy, Settings };
