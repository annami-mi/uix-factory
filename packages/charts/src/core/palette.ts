/**
 * Цвета серий: слот 1…8 в фиксированном порядке (порядок — механизм различимости при дальтонизме,
 * проверен валидатором, ADR-0007). Цвет следует за сущностью — индекс в полном списке серий, а не
 * среди видимых, поэтому скрытие серии в легенде не перекрашивает остальные.
 * Больше 8 серий не бывает: хвост сворачивается в «Другое» (muted), фасеты или таблицу.
 */
export const MAX_SERIES = 8;

export function seriesColor(index: number): string {
  if (index < 0 || index >= MAX_SERIES) {
    if (import.meta.env?.DEV) {
      console.warn(`[@uix/charts] серия №${index + 1}: больше ${MAX_SERIES} цветов нет — сверните хвост в «Другое»`);
    }
    return MUTED;
  }
  return `var(--color-chart-series-${index + 1}, CanvasText)`;
}

/** Цвет «Другое» и контекстных серий при выделении одной */
export const MUTED = "var(--color-chart-muted, GrayText)";
