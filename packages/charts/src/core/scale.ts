import { scaleLinear } from "d3-scale";

/** «Красивая» шкала значений: базовая линия — 0, если данные неотрицательны (столбцы и площади от нуля) */
export function niceDomain(values: number[], ticks: number): [number, number] {
  const lo = Math.min(0, ...values);
  const hi = values.length ? Math.max(...values) : 1;
  const nice = scaleLinear()
    .domain([lo, hi === lo ? lo + 1 : hi])
    .nice(ticks)
    .domain();
  return [nice[0]!, nice[1]!];
}

/** Приблизительная ширина подписи, px: символ ≈ `ratio` кегля (без измерения текста — работает и на сервере) */
export function textWidth(text: string, fontSize: number, ratio: number): number {
  return text.length * fontSize * ratio;
}

/** Обрезать подпись до `maxWidth` с многоточием (полная — в подсказке и таблице) */
export function truncate(text: string, maxWidth: number, fontSize: number, ratio: number): string {
  const fit = Math.floor(maxWidth / (fontSize * ratio));
  if (text.length <= fit) return text;
  return fit <= 1 ? "…" : `${text.slice(0, fit - 1).trimEnd()}…`;
}

/** Число — конечное, иначе 0 (пропуски в данных) */
export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Путь столбца со скруглённым только концом-данными (у базовой линии — прямой угол).
 * Вертикальный: от `base` к `end` по Y; горизонтальный — по X. Радиус не больше половины толщины и длины.
 */
export function barPath(
  orientation: "vertical" | "horizontal",
  pos: number,
  thickness: number,
  base: number,
  end: number,
  radius: number,
): string {
  const len = Math.abs(end - base);
  if (len < 0.01 || thickness <= 0) return "";
  const r = Math.max(0, Math.min(radius, thickness / 2, len));
  const dir = Math.sign(end - base);
  if (orientation === "vertical") {
    const x0 = pos;
    const x1 = pos + thickness;
    // Конец по Y: столбец вверх — dir < 0 (SVG), скругление у `end`
    const sy = -dir;
    return [
      `M${x0},${base}`,
      `L${x0},${end + sy * r}`,
      `Q${x0},${end} ${x0 + r},${end}`,
      `L${x1 - r},${end}`,
      `Q${x1},${end} ${x1},${end + sy * r}`,
      `L${x1},${base}`,
      "Z",
    ].join("");
  }
  const y0 = pos;
  const y1 = pos + thickness;
  const sx = -dir;
  return [
    `M${base},${y0}`,
    `L${end + sx * r},${y0}`,
    `Q${end},${y0} ${end},${y0 + r}`,
    `L${end},${y1 - r}`,
    `Q${end},${y1} ${end + sx * r},${y1}`,
    `L${base},${y1}`,
    "Z",
  ].join("");
}

/**
 * «Красивые» деления, но не больше `max`: d3 `ticks(n)` — лишь подсказка и может вернуть больше,
 * тогда подписи слипаются — уменьшаем запрос, пока не влезет.
 */
export function fitTicks(domain: [number, number], max: number): number[] {
  const s = scaleLinear().domain(domain);
  let count = Math.max(1, max);
  let ticks = s.ticks(count);
  while (ticks.length > max && count > 1) ticks = s.ticks(--count);
  return ticks;
}
