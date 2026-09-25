/** Строка данных графика: поле x (дата/число/строка) и числовые поля серий */
export type Datum = Record<string, unknown>;

export interface ChartSeries {
  /** Поле в строке данных */
  key: string;
  /** Подпись серии (легенда, подсказка, таблица) */
  label: string;
}

/** Колонка табличного двойника */
export interface TableColumn {
  key: string;
  label: string;
  /** Формат значения ячейки */
  format?: (value: unknown) => string;
  /** Числовая колонка — выравнивание вправо, моноширинные цифры */
  numeric?: boolean;
}
