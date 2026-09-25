<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * Таблица данных SaaS: сортировка, выбор строк, липкая шапка, мобильная раскладка.
 *
 * - **Mobile-first:** в узком контейнере строка — карточка (первая колонка — заголовок, остальные —
 *   «подпись: значение»), шапка — ряд кнопок сортировки. С ширины контейнера size/container/sm — таблица.
 *   Контейнерный запрос: раскладка зависит от места, а не от экрана (таблица в боковой панели — карточками).
 * - **Сортировка:** кнопка в заголовке, `aria-sort`; по кругу: по возрастанию → по убыванию → без.
 *   По умолчанию — на клиенте; `manualSort` — только событие (сортирует сервер).
 * - **Выбор:** `v-model:selected` — ключи строк; «выбрать всё» — частичное состояние.
 * - `maxHeight` — область прокручивается, шапка прилипает. `loading` — прежние строки приглушены.
 * - Ячейка — слот `#cell-<key>` ({ row, value }); формат — `column.format`.
 */
import { computed } from "vue";
import { ArrowDown, ArrowUp, ArrowUpDown } from "@lucide/vue";
import Checkbox from "../Checkbox/Checkbox.vue";

export interface DataTableColumn<R = Record<string, unknown>> {
  key: string;
  label: string;
  /** Числа — вправо, моноширинные цифры */
  numeric?: boolean;
  sortable?: boolean;
  /** Значение для сортировки, если отличается от поля (напр. дата строкой) */
  sortValue?: (row: R) => unknown;
  format?: (value: unknown, row: R) => string;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

const props = withDefaults(
  defineProps<{
    /** Колонки: поле, заголовок, формат, сортировка */
    columns: DataTableColumn<T>[];
    /** Строки данных */
    rows: T[];
    /** Поле-ключ строки (для выбора и отрисовки) */
    rowKey: string;
    /** Подпись таблицы — имя для скринридера */
    caption: string;
    /** Показать подпись над таблицей (иначе — только для скринридера) */
    captionVisible?: boolean;
    /** Флажки выбора строк */
    selectable?: boolean;
    /** Сортирует сервер: таблица только сообщает `update:sort` */
    manualSort?: boolean;
    /** Высота области прокрутки (CSS-длина) — шапка прилипает */
    maxHeight?: string;
    /** Идёт загрузка — строки приглушены, aria-busy */
    loading?: boolean;
    /** Текст, когда строк нет */
    emptyText?: string;
    /** Подписи флажков выбора */
    selectAllLabel?: string;
    /** Доступное имя флажка строки (по умолчанию «Выбрать: <первая колонка>») */
    selectRowLabel?: (row: T) => string;
  }>(),
  {
    captionVisible: false,
    selectable: false,
    manualSort: false,
    loading: false,
    emptyText: "Ничего не найдено",
    selectAllLabel: "Выбрать все строки",
  },
);

const sort = defineModel<DataTableSort | null>("sort", { default: null });
const selected = defineModel<unknown[]>("selected", { default: () => [] });

defineSlots<
  {
    empty?: () => unknown;
  } & Partial<Record<`cell-${string}`, (props: { row: T; value: unknown }) => unknown>>
>();

const collator = new Intl.Collator("ru-RU", { numeric: true, sensitivity: "base" });
function compare(a: unknown, b: unknown) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return collator.compare(String(a), String(b));
}

const sortedRows = computed(() => {
  const s = sort.value;
  if (!s || props.manualSort) return props.rows;
  const col = props.columns.find((c) => c.key === s.key);
  if (!col) return props.rows;
  const value = (r: T) => (col.sortValue ? col.sortValue(r) : r[col.key]);
  const sign = s.direction === "asc" ? 1 : -1;
  return [...props.rows].sort((a, b) => sign * compare(value(a), value(b)));
});

function toggleSort(key: string) {
  const s = sort.value;
  sort.value =
    s?.key !== key ? { key, direction: "asc" }
    : s.direction === "asc" ? { key, direction: "desc" }
    : null;
}
const ariaSort = (key: string) =>
  sort.value?.key === key ? (sort.value.direction === "asc" ? "ascending" : "descending") : undefined;

/* ---------- выбор ---------- */
const keyOf = (row: T) => row[props.rowKey];
const selectedSet = computed(() => new Set(selected.value));
const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r) => selectedSet.value.has(keyOf(r))));
const someSelected = computed(() => !allSelected.value && props.rows.some((r) => selectedSet.value.has(keyOf(r))));
function toggleAll(value: boolean) {
  selected.value = value ? props.rows.map(keyOf) : [];
}
function toggleRow(row: T, value: boolean) {
  const k = keyOf(row);
  selected.value = value ? [...selected.value, k] : selected.value.filter((x) => x !== k);
}

const cellText = (row: T, col: DataTableColumn<T>) => {
  const v = row[col.key];
  return col.format ? col.format(v, row) : v == null ? "—" : String(v);
};
const rowLabel = (row: T) =>
  props.selectRowLabel ? props.selectRowLabel(row) : `Выбрать: ${cellText(row, props.columns[0]!)}`;
const colspan = computed(() => props.columns.length + (props.selectable ? 1 : 0));
</script>

<template>
  <div class="ui-data-table">
    <div
      class="ui-data-table__scroll"
      :style="maxHeight ? { maxBlockSize: maxHeight } : undefined"
      :tabindex="maxHeight ? 0 : undefined"
      :role="maxHeight ? 'region' : undefined"
      :aria-label="maxHeight ? caption : undefined"
    >
      <table :aria-busy="loading ? 'true' : undefined">
        <caption :class="captionVisible ? 'ui-data-table__caption' : 'ui-data-table__sr'">
          {{ caption }}
        </caption>
        <thead>
          <tr>
            <th
              v-if="selectable"
              class="ui-data-table__select"
              scope="col"
            >
              <Checkbox
                :model-value="allSelected"
                :indeterminate="someSelected"
                :aria-label="selectAllLabel"
                :disabled="!rows.length"
                @update:model-value="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :data-numeric="col.numeric || undefined"
              :data-sortable="col.sortable || undefined"
              :aria-sort="col.sortable ? ariaSort(col.key) : undefined"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="ui-data-table__sort"
                :data-active="sort?.key === col.key || undefined"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <ArrowUp
                  v-if="sort?.key === col.key && sort.direction === 'asc'"
                  aria-hidden="true"
                />
                <ArrowDown
                  v-else-if="sort?.key === col.key"
                  aria-hidden="true"
                />
                <ArrowUpDown
                  v-else
                  aria-hidden="true"
                />
              </button>
              <template v-else>
                {{ col.label }}
              </template>
            </th>
          </tr>
        </thead>
        <tbody :data-loading="loading || undefined">
          <tr v-if="!rows.length">
            <td
              class="ui-data-table__empty"
              :colspan="colspan"
            >
              <slot name="empty">
                {{ emptyText }}
              </slot>
            </td>
          </tr>
          <tr
            v-for="row in sortedRows"
            :key="String(keyOf(row))"
            :data-selected="selectedSet.has(keyOf(row)) || undefined"
          >
            <td
              v-if="selectable"
              class="ui-data-table__select"
            >
              <Checkbox
                :model-value="selectedSet.has(keyOf(row))"
                :aria-label="rowLabel(row)"
                @update:model-value="(v: boolean) => toggleRow(row, v)"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :data-label="col.label"
              :data-numeric="col.numeric || undefined"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="row[col.key]"
              >
                {{ cellText(row, col) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@layer components {
  /* Раскладка — от ширины контейнера, не экрана */
  .ui-data-table {
    container-type: inline-size;
    min-inline-size: 0;
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
  }

  .ui-data-table__scroll {
    overflow: auto;
    border-radius: var(--radius-3);
  }

  table {
    inline-size: 100%;
    border-collapse: collapse;
  }

  .ui-data-table__caption {
    padding-block-end: var(--space-3);
    font-family: var(--type-heading-sm-font-family);
    font-weight: var(--type-heading-sm-font-weight);
    font-size: var(--type-heading-sm-font-size);
    line-height: var(--type-heading-sm-line-height);
    text-align: start;
  }

  .ui-data-table__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ---------- Мобильная раскладка (по умолчанию): строки — карточки ---------- */
  thead tr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding-block-end: var(--space-3);
  }

  /* Несортируемые заголовки в карточках не нужны — подписи есть у каждого значения */
  thead th:not([data-sortable], .ui-data-table__select) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  tbody {
    display: grid;
    gap: var(--space-2);
    transition: opacity var(--duration-normal) ease;
  }

  tbody[data-loading] {
    opacity: var(--opacity-50);
  }

  tbody tr {
    position: relative;
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-3);
    background: var(--surface-card-bg, Canvas);
  }

  tbody tr[data-selected] {
    background: var(--surface-option-highlighted-bg, Highlight);
  }

  tbody td {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: var(--space-2);
    text-align: end;
  }

  /* Значение из слота (бейдж, ссылка) — к правому краю, как текст */
  tbody td > :deep(*) {
    justify-self: end;
  }

  tbody td::before {
    content: attr(data-label);
    color: var(--color-text-secondary, CanvasText);
    text-align: start;
  }

  /* Первая колонка — заголовок карточки */
  tbody td:nth-child(1 of :not(.ui-data-table__select)) {
    display: block;
    padding-inline-end: var(--size-44);
    font-family: var(--type-label-lg-font-family);
    font-weight: var(--type-label-lg-font-weight);
    text-align: start;
  }

  tbody td:nth-child(1 of :not(.ui-data-table__select))::before {
    content: none;
  }

  tbody td.ui-data-table__select {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    display: block;
  }

  tbody td.ui-data-table__select::before,
  tbody td.ui-data-table__empty::before {
    content: none;
  }

  tbody td.ui-data-table__empty {
    display: block;
    padding-block: var(--space-8);
    color: var(--color-text-secondary, CanvasText);
    text-align: center;
  }

  [data-numeric] {
    font-variant-numeric: tabular-nums;
  }

  /* Кнопка сортировки: в карточках — «чип», в таблице — заголовок */
  .ui-data-table__sort {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-block-size: var(--size-32);
    padding-inline: var(--space-3);
    border: none;
    border-radius: var(--radius-full);
    background: var(--surface-neutral-default-bg, ButtonFace);
    color: var(--color-text-secondary, ButtonText);
    font: inherit;
    font-family: var(--type-label-sm-font-family);
    font-weight: var(--type-label-sm-font-weight);
    font-size: var(--type-label-sm-font-size);
    cursor: pointer;
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  /* Зона касания чипа — size/44 при визуальной высоте size/32 */
  .ui-data-table__sort::after {
    content: "";
    position: absolute;
    inset: calc((var(--size-32) - var(--size-44)) / 2) 0;
  }

  .ui-data-table__sort:active {
    scale: var(--scale-pressed-surface);
  }

  .ui-data-table__sort[data-active] {
    color: var(--color-text-primary, ButtonText);
  }

  .ui-data-table__sort:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-data-table__sort svg {
    inline-size: var(--size-16);
    block-size: var(--size-16);
    stroke-width: var(--stroke-icon);
  }

  .ui-data-table__sort:not([data-active]) svg {
    opacity: var(--opacity-50);
  }

  /* ---------- Таблица: с ширины size/container/sm (640px; в @container нельзя var()) ---------- */
  @container (min-width: 640px) {
    thead tr {
      display: table-row;
      padding: 0;
    }

    thead th:not([data-sortable], .ui-data-table__select) {
      position: sticky;
      inline-size: auto;
      block-size: auto;
      overflow: visible;
      clip-path: none;
      white-space: normal;
    }

    thead th {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
      padding: var(--space-2) var(--space-3);
      border-block-end: var(--stroke-1) solid var(--color-border-subtle, GrayText);
      background: var(--color-chart-surface, Canvas);
      color: var(--color-text-secondary, CanvasText);
      font-family: var(--type-label-sm-font-family);
      font-weight: var(--type-label-sm-font-weight);
      font-size: var(--type-label-sm-font-size);
      line-height: var(--type-label-sm-line-height);
      text-align: start;
      white-space: nowrap;
    }

    thead th[data-numeric] {
      text-align: end;
    }

    .ui-data-table__sort {
      min-block-size: auto;
      margin-inline: calc(-1 * var(--space-2));
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-2);
      background: transparent;
      font-size: inherit;
    }

    .ui-data-table__sort:hover {
      background: var(--surface-ghost-hover-bg, ButtonFace);
    }

    th[data-numeric] .ui-data-table__sort {
      flex-direction: row-reverse;
    }

    tbody {
      display: table-row-group;
    }

    tbody tr {
      display: table-row;
      padding: 0;
      border-radius: 0;
      background: transparent;
    }

    tbody tr:hover {
      background: var(--surface-ghost-hover-bg, transparent);
    }

    tbody tr[data-selected] {
      background: var(--surface-option-highlighted-bg, Highlight);
    }

    tbody td,
    tbody td:nth-child(1 of :not(.ui-data-table__select)),
    tbody td.ui-data-table__select {
      position: static;
      display: table-cell;
      padding: var(--space-3);
      border-block-end: var(--stroke-1) solid var(--color-border-subtle, GrayText);
      font-family: inherit;
      font-weight: inherit;
      text-align: start;
      vertical-align: middle;
    }

    tbody td:nth-child(1 of :not(.ui-data-table__select)) {
      font-weight: var(--type-label-md-font-weight);
    }

    tbody td[data-numeric] {
      text-align: end;
      white-space: nowrap;
    }

    tbody td::before {
      content: none;
    }

    .ui-data-table__select {
      inline-size: var(--size-44);
    }

    tbody td.ui-data-table__empty {
      padding-block: var(--space-8);
      text-align: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    tbody,
    .ui-data-table__sort {
      transition: none;
    }
  }
}
</style>
