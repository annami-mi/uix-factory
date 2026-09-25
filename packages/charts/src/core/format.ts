/**
 * Формат чисел и дат для графиков — по-русски, через Intl (без d3-format).
 * Большие числа — компактно («1,2 млн»), чтобы подписи осей и KPI не распирали раскладку.
 */
export const LOCALE = "ru-RU";

export type ValueFormat = Intl.NumberFormatOptions | ((value: number) => string);

const cache = new Map<string, Intl.NumberFormat>();
function numberFormat(options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, options);
    cache.set(key, fmt);
  }
  return fmt;
}

/** Число по опциям Intl или своей функцией */
export function formatValue(value: number, format: ValueFormat = {}): string {
  return typeof format === "function" ? format(value) : numberFormat(format).format(value);
}

/** Компактно для осей и KPI: 1 284 → «1,3 тыс.», 4 200 000 → «4,2 млн» */
export function formatCompact(value: number, options: Intl.NumberFormatOptions = {}): string {
  return numberFormat({ notation: "compact", maximumFractionDigits: 1, ...options }).format(value);
}

/** Изменение со знаком: +12,5 % / −3 % */
export function formatDelta(value: number, options: Intl.NumberFormatOptions = {}): string {
  return numberFormat({ signDisplay: "exceptZero", maximumFractionDigits: 1, ...options }).format(value);
}

const dateCache = new Map<string, Intl.DateTimeFormat>();
/** Дата по опциям Intl: { day: "numeric", month: "short" } → «12 мар.» */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(options);
  let fmt = dateCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(LOCALE, options);
    dateCache.set(key, fmt);
  }
  return fmt.format(date);
}
