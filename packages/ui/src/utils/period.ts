/**
 * Периоды для фильтра дашборда: пресеты → диапазон дат [from, to] включительно (локальные дни).
 * Чистые функции — тестируются без компонента; `now` передаётся явно.
 */
export type PeriodPreset = "today" | "7d" | "30d" | "90d" | "mtd" | "custom";

export interface Period {
  preset: PeriodPreset;
  /** Первый день, YYYY-MM-DD */
  from: string;
  /** Последний день включительно, YYYY-MM-DD */
  to: string;
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Сегодня",
  "7d": "Последние 7 дней",
  "30d": "Последние 30 дней",
  "90d": "Последние 90 дней",
  mtd: "С начала месяца",
  custom: "Свой период",
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Дата → YYYY-MM-DD по местному времени (не UTC: иначе «сегодня» сдвигается ночью) */
export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/** Диапазон пресета на дату `now`; для custom — `fallback` (или последние 30 дней) */
export function resolvePeriod(preset: PeriodPreset, now: Date, fallback?: Pick<Period, "from" | "to">): Period {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1);
  const to = isoDay(today);
  switch (preset) {
    case "today":
      return { preset, from: to, to };
    case "7d":
      return { preset, from: isoDay(back(7)), to };
    case "30d":
      return { preset, from: isoDay(back(30)), to };
    case "90d":
      return { preset, from: isoDay(back(90)), to };
    case "mtd":
      return { preset, from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    case "custom":
      return { preset, ...(fallback ?? { from: isoDay(back(30)), to }) };
  }
}

/** Число дней в периоде (включительно) — для «к прошлому периоду той же длины» */
export function periodDays(period: Pick<Period, "from" | "to">): number {
  const ms = parseDay(period.to).getTime() - parseDay(period.from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Прошлый период той же длины, вплотную перед текущим — база для дельт KPI */
export function previousPeriod(period: Pick<Period, "from" | "to">): Pick<Period, "from" | "to"> {
  const days = periodDays(period);
  const from = parseDay(period.from);
  const prevTo = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
  const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - days + 1);
  return { from: isoDay(prevFrom), to: isoDay(prevTo) };
}
