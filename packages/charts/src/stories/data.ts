/** Детерминированные демо-данные (без Math.random — стабильные тесты и скриншоты) */
export function days(count: number, start = new Date(2026, 7, 1)) {
  return Array.from({ length: count }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Плавная «живая» кривая: тренд + недельный ритм + шум по синусам */
export function wave(i: number, base: number, trend: number, amp: number, seed = 1) {
  return Math.round(base + trend * i + amp * Math.sin(i / 1.3 + seed) + (amp / 3) * Math.sin(i * 2.7 + seed * 2));
}

export const revenue = days(30).map((date, i) => ({
  date,
  revenue: wave(i, 180_000, 3_200, 24_000, 1),
  refunds: wave(i, 22_000, 150, 6_000, 3),
  target: 200_000,
}));

export const traffic = days(30).map((date, i) => ({
  date,
  organic: wave(i, 4200, 40, 600, 2),
  ads: wave(i, 2600, -10, 700, 5),
  social: wave(i, 1500, 25, 400, 7),
  email: wave(i, 900, 5, 250, 9),
}));

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

/** Выручка по месяцам и каналам — группы и стек */
export const monthly = MONTHS.map((month, i) => ({
  month,
  web: wave(i, 820, 38, 120, 1),
  mobile: wave(i, 460, 52, 90, 4),
  partners: wave(i, 210, 12, 60, 6),
}));

/** Рейтинг страниц — горизонтальные полосы с длинными подписями */
export const topPages = [
  { page: "/pricing", views: 18_420 },
  { page: "/", views: 15_870 },
  { page: "/docs/getting-started", views: 9_310 },
  { page: "/blog/liquid-glass-design-system", views: 6_240 },
  { page: "/changelog", views: 3_980 },
  { page: "/integrations/figma", views: 2_150 },
];

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

/** Сессии по дням недели × часам: дневной пик в будни, вечерний — в выходные */
export const sessionsByHour = WEEKDAYS.map((_, d) =>
  HOURS.map((_, h) => {
    const weekend = d >= 5;
    const peak = weekend ? 20 : 13;
    const base = Math.exp(-((h - peak) ** 2) / (weekend ? 18 : 22));
    return Math.round((weekend ? 70 : 120) * base + 8 + 6 * Math.sin(h * 1.7 + d));
  }),
);

/** Источники трафика — доля от целого; 8 источников: хвост свернётся в «Другое» */
export const sources = [
  { source: "Поиск", visits: 48_200 },
  { source: "Прямые заходы", visits: 21_700 },
  { source: "Реклама", visits: 16_900 },
  { source: "Соцсети", visits: 9_400 },
  { source: "Рассылка", visits: 5_100 },
  { source: "Партнёры", visits: 2_300 },
  { source: "Мессенджеры", visits: 1_600 },
  { source: "Прочие", visits: 800 },
];
