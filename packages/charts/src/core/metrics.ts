import { tokenNumber } from "@uix/ui";

/**
 * Числа из токенов для расчёта SVG (атрибуты SVG не принимают var()). Читаются на клиенте;
 * на сервере — значения по умолчанию (те же, что в токенах).
 */
export function chartMetrics() {
  return {
    /** Внутренний отступ области графика — space/2 */
    gap: tokenNumber("--space-2", 8),
    /** Кегль и строка подписей осей — type/caption */
    axisFont: tokenNumber("--type-caption-font-size", 11),
    axisLine: tokenNumber("--type-caption-line-height", 14),
    /** Мин. расстояние между делениями X — size/chart/tick */
    tickSpacing: tokenNumber("--size-chart-tick", 72),
    /** Мин. расстояние между делениями Y — size/48 */
    tickSpacingY: tokenNumber("--size-48", 48),
    /** Линия — stroke/2, кольцо точки — stroke/2 */
    line: tokenNumber("--stroke-2", 2),
    ring: tokenNumber("--stroke-2", 2),
    /** Радиус точки ≥ 4 (маркер ≥ 8px) — space/1 */
    dot: tokenNumber("--space-1", 4),
    /** Столбец: макс. толщина и скругление конца */
    barMax: tokenNumber("--size-chart-bar", 24),
    barRadius: tokenNumber("--radius-1", 4),
    /** Зазор между соприкасающимися метками — stroke/2 */
    barGap: tokenNumber("--stroke-2", 2),
  };
}

/** Средняя ширина цифры ≈ 0.6 кегля — оценка ширины подписи оси без измерения текста */
export const DIGIT_WIDTH = 0.6;

/** Раскладка графиков: доли и минимумы, которые не выражаются токенами (пропорции, а не размеры) */
export const LAYOUT = {
  /** Подписи категорий горизонтальных столбцов — не больше этой доли ширины, остальное — графику */
  barLabelShare: 0.4,
  /** Подписи строк тепловой карты — не больше этой доли ширины */
  heatmapLabelShare: 0.3,
  /** Группа столбцов занимает не больше этой доли полосы категории — остальное воздух (методика) */
  bandFill: 0.8,
  /** Метки короче этого, px, не рисуются (сегмент стека, сжатый при скрытии серии) */
  minMark: 0.5,
  /** Минимум делений оси значений: вертикальной и горизонтальной */
  minTicksY: 3,
  minTicksX: 2,
} as const;
