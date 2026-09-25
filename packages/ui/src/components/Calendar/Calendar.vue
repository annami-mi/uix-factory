<script setup lang="ts">
/**
 * Календарь — выбор даты или диапазона. Поведение и доступность — Reka UI Calendar / RangeCalendar
 * (role="grid", стрелки, PageUp/PageDown — месяц, Home/End — неделя, озвучка дат); вид — токены.
 *
 * - `mode`: `single` — одна дата, `range` — диапазон (второй клик завершает; до него — предпросмотр
 *   полосой при наведении).
 * - `layout`: `paged` — месяцы рядом со стрелками (десктоп, `months` = 1–2); `scroll` — непрерывная
 *   вертикальная лента месяцев (мобильный: листают пальцем, как в iOS/Airbnb) со своей прокруткой,
 *   дни недели — неподвижной строкой над ней.
 * - Значения — строки `YYYY-MM-DD` (как у PeriodSelect/utils/period): без часовых поясов.
 * - Выбранные края — материал акцентной кнопки, дни между — полоса `surface/calendar/range`; сегодня — точка.
 *   Ячейка — зона касания size/44 (на точном указателе — size/40). Нажатие — скейл на пружине.
 */
import { computed, nextTick, onMounted, ref, shallowRef, useId, watch, type Component } from "vue";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
  type DateRange,
} from "reka-ui";
import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";

export interface DateRangeValue {
  /** Первый день, YYYY-MM-DD */
  from: string;
  /** Последний день включительно, YYYY-MM-DD */
  to: string;
}

const props = withDefaults(
  defineProps<{
    /** Одна дата или диапазон */
    mode?: "single" | "range";
    /** Месяцы рядом со стрелками или вертикальная лента (мобильный) */
    layout?: "paged" | "scroll";
    /** Сколько месяцев показывать рядом в `paged` (1–2) */
    months?: number;
    /** Лента `scroll`: сколько месяцев до текущего (или выбранного) */
    monthsBefore?: number;
    /** Лента `scroll`: сколько месяцев после текущего (или выбранного) */
    monthsAfter?: number;
    /** Самая ранняя доступная дата, YYYY-MM-DD */
    min?: string;
    /** Самая поздняя доступная дата, YYYY-MM-DD */
    max?: string;
    /** Доступное имя календаря */
    label?: string;
    /** Подпись стрелки назад */
    prevLabel?: string;
    /** Подпись стрелки вперёд */
    nextLabel?: string;
    /**
     * Опорная дата, YYYY-MM-DD: с её месяца открывается календарь без выбранного значения (тесты,
     * серверный рендер). Точку «сегодня» Reka ставит по системной дате.
     */
    now?: string;
  }>(),
  {
    mode: "single",
    layout: "paged",
    months: 1,
    monthsBefore: 12,
    monthsAfter: 2,
    label: "Календарь",
    prevLabel: "Предыдущий месяц",
    nextLabel: "Следующий месяц",
  },
);

/** Выбранная дата (`single`) или диапазон (`range`); `null` — ничего не выбрано */
const model = defineModel<string | DateRangeValue | null>({ default: null });

const emit = defineEmits<{
  /** Диапазон выбран полностью (второй клик) — пикер может закрыться */
  complete: [];
  /** Диапазон начат, но не завершён (выбрана только первая дата) */
  pending: [value: boolean];
}>();

const LOCALE = "ru-RU";
const uid = useId();
const isRange = computed(() => props.mode === "range");
const todayDate = computed(() => (props.now ? parseDate(props.now) : today(getLocalTimeZone())));

/* ---------- значение: строки YYYY-MM-DD ⇄ даты Reka ---------- */
const parse = (v?: string | null) => (v ? parseDate(v) : undefined);
const rekaValue = computed<DateRange | DateValue | undefined>(() => {
  const v = model.value;
  if (isRange.value) {
    const r = v && typeof v === "object" ? v : null;
    return { start: parse(r?.from), end: parse(r?.to) };
  }
  return typeof v === "string" ? parse(v) : undefined;
});
/** Незавершённый диапазон (выбран только первый день) живёт внутри — наружу уходит только полный */
const partial = shallowRef<DateRange | null>(null);
function onUpdate(value: unknown) {
  if (isRange.value) {
    const r = value as DateRange | null;
    if (r?.start && r.end) {
      partial.value = null;
      emit("pending", false);
      model.value = { from: r.start.toString(), to: r.end.toString() };
      emit("complete");
    } else {
      partial.value = r;
      emit("pending", !!r?.start);
    }
    return;
  }
  const d = value as DateValue | undefined;
  model.value = d ? d.toString() : null;
  if (d) emit("complete");
}
const rootValue = computed<DateRange | DateValue | undefined>(() =>
  isRange.value && partial.value ? partial.value : rekaValue.value,
);

/* ---------- какой месяц показывать ---------- */
const anchor = computed<DateValue>(() => {
  const v = rekaValue.value;
  const first = v && "start" in (v as object) ? (v as { start?: DateValue }).start : (v as DateValue | undefined);
  return (first ?? todayDate.value).set({ day: 1 });
});
/* shallowRef: классы дат не разворачиваются в структурный тип (Reka ждёт DateValue) */
const placeholder = shallowRef<DateValue>(
  props.layout === "scroll" ? anchor.value.subtract({ months: props.monthsBefore }) : anchor.value,
);
watch(anchor, (a) => {
  if (props.layout === "paged") placeholder.value = a;
});
const numberOfMonths = computed(() =>
  props.layout === "scroll" ? props.monthsBefore + props.monthsAfter + 1 : Math.max(1, props.months),
);

/* ---------- подписи ---------- */
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "long" });
const monthTitle = (d: DateValue) => {
  const m = monthFmt.format(d.toDate(getLocalTimeZone()));
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.year}`;
};
const monthKey = (d: DateValue) => `${d.year}-${String(d.month).padStart(2, "0")}`;

/* ---------- лента: при открытии — к выбранному (или текущему) месяцу ---------- */
const root = ref<HTMLElement>();
onMounted(async () => {
  if (props.layout !== "scroll") return;
  await nextTick();
  root.value
    ?.querySelector(`[data-month="${monthKey(anchor.value)}"]`)
    ?.scrollIntoView({ block: "start", behavior: "instant" });
});

/* Компоненты Reka: одна разметка на оба режима (API у Calendar и RangeCalendar одинаковый — типы
   объединения несовместимы для :is, поэтому таблица компонентов — просто Component) */
const C = computed<Record<string, Component>>(() =>
  isRange.value
    ? {
        Root: RangeCalendarRoot,
        Grid: RangeCalendarGrid,
        Head: RangeCalendarGridHead,
        Body: RangeCalendarGridBody,
        Row: RangeCalendarGridRow,
        HeadCell: RangeCalendarHeadCell,
        Cell: RangeCalendarCell,
        Trigger: RangeCalendarCellTrigger,
        Prev: RangeCalendarPrev,
        Next: RangeCalendarNext,
      }
    : {
        Root: CalendarRoot,
        Grid: CalendarGrid,
        Head: CalendarGridHead,
        Body: CalendarGridBody,
        Row: CalendarGridRow,
        HeadCell: CalendarHeadCell,
        Cell: CalendarCell,
        Trigger: CalendarCellTrigger,
        Prev: CalendarPrev,
        Next: CalendarNext,
      },
);
</script>

<template>
  <div
    ref="root"
    class="ui-calendar"
    :data-layout="layout"
    :data-mode="mode"
  >
    <component
      :is="C.Root"
      v-slot="{ grid, weekDays }"
      v-model:placeholder="placeholder"
      :model-value="rootValue"
      :locale="LOCALE"
      :week-starts-on="1"
      weekday-format="short"
      :number-of-months="numberOfMonths"
      :paged-navigation="layout === 'paged'"
      :min-value="parse(min)"
      :max-value="parse(max)"
      :calendar-label="label"
      :fixed-weeks="false"
      :disable-days-outside-current-view="true"
      class="ui-calendar__root"
      @update:model-value="onUpdate"
    >
      <!-- Лента: дни недели — одной липкой строкой (декоративно; у каждой сетки есть свои заголовки колонок) -->
      <div
        v-if="layout === 'scroll'"
        class="ui-calendar__weekdays"
        aria-hidden="true"
      >
        <span
          v-for="day in weekDays"
          :key="day"
        >{{ day }}</span>
      </div>

      <div class="ui-calendar__months">
        <section
          v-for="(month, mi) in grid"
          :key="month.value.toString()"
          class="ui-calendar__month"
          :data-month="monthKey(month.value)"
        >
          <header class="ui-calendar__header">
            <component
              :is="C.Prev"
              v-if="layout === 'paged' && mi === 0"
              class="ui-calendar__nav"
              :aria-label="prevLabel"
            >
              <ChevronLeft aria-hidden="true" />
            </component>
            <h3
              :id="`${uid}-${mi}`"
              class="ui-calendar__title"
            >
              {{ monthTitle(month.value) }}
            </h3>
            <component
              :is="C.Next"
              v-if="layout === 'paged' && mi === grid.length - 1"
              class="ui-calendar__nav"
              :aria-label="nextLabel"
            >
              <ChevronRight aria-hidden="true" />
            </component>
          </header>

          <component
            :is="C.Grid"
            class="ui-calendar__grid"
            :aria-labelledby="`${uid}-${mi}`"
          >
            <component
              :is="C.Head"
              :class="{ 'ui-calendar__sr': layout === 'scroll' }"
            >
              <component :is="C.Row">
                <component
                  :is="C.HeadCell"
                  v-for="day in weekDays"
                  :key="day"
                  class="ui-calendar__weekday"
                >
                  {{ day }}
                </component>
              </component>
            </component>
            <component :is="C.Body">
              <component
                :is="C.Row"
                v-for="(week, wi) in month.rows"
                :key="`${month.value.toString()}-${wi}`"
              >
                <component
                  :is="C.Cell"
                  v-for="day in week"
                  :key="day.toString()"
                  :date="day"
                  class="ui-calendar__cell"
                >
                  <component
                    :is="C.Trigger"
                    :day="day"
                    :month="month.value"
                    class="ui-calendar__day"
                  />
                </component>
              </component>
            </component>
          </component>
        </section>
      </div>
    </component>
  </div>
</template>

<style scoped>
@layer components {
  .ui-calendar {
    /* Ячейка: зона касания size/44; точный указатель — size/40 (две сетки рядом во всплывашке) */
    --_cell: var(--size-44);

    min-inline-size: 0;
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-body-m-font-family);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
  }

  @media (pointer: fine) {
    .ui-calendar[data-layout="paged"] {
      --_cell: var(--size-40);
    }
  }

  .ui-calendar__months {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
  }

  /* Лента прокручивается сама: высота — 10 строк дней, скроллбар скрыт (листают пальцем) */
  .ui-calendar[data-layout="scroll"] .ui-calendar__months {
    flex-direction: column;
    flex-wrap: nowrap;
    max-block-size: calc(var(--_cell) * 10);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }

  .ui-calendar__month {
    display: grid;
    gap: var(--space-2);
  }


  .ui-calendar__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--_cell);
  }

  .ui-calendar__title {
    flex: 1;
    margin: 0;
    padding-inline: var(--space-2);
    font-family: var(--type-label-m-font-family);
    font-weight: var(--type-label-m-font-weight);
    font-size: var(--type-label-m-font-size);
    line-height: var(--type-label-m-line-height);
  }

  /* В ленте месяц подписан слева, как в iOS */
  .ui-calendar[data-layout="paged"] .ui-calendar__title {
    text-align: center;
  }

  .ui-calendar__nav {
    display: grid;
    flex: none;
    place-items: center;
    inline-size: var(--_cell);
    block-size: var(--_cell);
    border: 0;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-icon-secondary, CanvasText);
    cursor: pointer;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-calendar__nav:hover:not(:disabled) {
    background: var(--surface-ghost-hover-bg, ButtonFace);
  }

  .ui-calendar__nav:active:not(:disabled) {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-calendar__nav:disabled {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-calendar__nav:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  .ui-calendar__nav svg {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }

  .ui-calendar__grid {
    border-collapse: collapse;
    table-layout: fixed;
    inline-size: calc(7 * var(--_cell));
  }

  .ui-calendar[data-layout="scroll"] .ui-calendar__grid {
    inline-size: 100%;
  }

  .ui-calendar__weekday {
    block-size: var(--size-32);
    padding: 0;
    color: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
    text-align: center;
  }

  /* Лента: дни недели — неподвижная строка над прокруткой месяцев (как в iOS; вложенное размытие
     внутри стеклянной шторки не работает, поэтому строка не «липнет» поверх содержимого) */
  .ui-calendar__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding-block: var(--space-2);
    border-block-end: var(--stroke-1) solid var(--color-divider, GrayText);
    color: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
    text-align: center;
  }

  /* Лента: заголовки колонок каждой сетки — только для скринридера (видимая строка — общая сверху) */
  .ui-calendar__sr .ui-calendar__weekday {
    block-size: 0;
    overflow: hidden;
    clip-path: inset(50%);
    font-size: 0;
    line-height: 0;
  }

  /* ---------- ячейка: полоса диапазона — на ячейке, круг выбора — на дне ---------- */
  .ui-calendar__cell {
    position: relative;
    block-size: var(--_cell);
    padding: 0;
    text-align: center;
  }

  .ui-calendar__cell:has(> [data-selected]:not([data-outside-view])) {
    background: var(--surface-calendar-range, transparent);
  }

  .ui-calendar__cell:has(> [data-highlighted]:not([data-selected], [data-outside-view])) {
    background: var(--surface-calendar-preview, transparent);
  }

  /* Края полосы: от центра края диапазона; у краёв недели — скругление */
  .ui-calendar__cell:has(> [data-selection-start]:not([data-outside-view])) {
    background: linear-gradient(to right, transparent 50%, var(--surface-calendar-range, transparent) 50%);
  }

  .ui-calendar__cell:has(> [data-selection-end]:not([data-outside-view])) {
    background: linear-gradient(to left, transparent 50%, var(--surface-calendar-range, transparent) 50%);
  }

  .ui-calendar__cell:has(> [data-selection-start][data-selection-end]:not([data-outside-view])),
  .ui-calendar[data-mode="single"] .ui-calendar__cell {
    background: none;
  }

  .ui-calendar__cell:first-child {
    border-start-start-radius: var(--radius-full);
    border-end-start-radius: var(--radius-full);
  }

  .ui-calendar__cell:last-child {
    border-start-end-radius: var(--radius-full);
    border-end-end-radius: var(--radius-full);
  }

  .ui-calendar__day {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: var(--_cell);
    block-size: var(--_cell);
    margin-inline: auto;
    border-radius: var(--radius-full);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-calendar__day:hover:not([data-disabled], [data-selection-start], [data-selection-end]) {
    background: var(--surface-ghost-hover-bg, ButtonFace);
  }

  .ui-calendar__day:active:not([data-disabled]) {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-calendar__day:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  /* Выбранный день (single) и края диапазона — материал акцентной кнопки */
  .ui-calendar[data-mode="single"] .ui-calendar__day[data-selected],
  .ui-calendar__day:is([data-selection-start], [data-selection-end]) {
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
    font-weight: var(--type-label-m-font-weight);
  }

  /* Сегодня — точка под числом */
  .ui-calendar__day[data-today]::after {
    content: "";
    position: absolute;
    inset-block-end: var(--space-1);
    inline-size: var(--space-1);
    block-size: var(--space-1);
    border-radius: var(--radius-full);
    background: var(--color-accent-default, Highlight);
  }

  .ui-calendar__day[data-today]:is([data-selection-start], [data-selection-end])::after,
  .ui-calendar[data-mode="single"] .ui-calendar__day[data-today][data-selected]::after {
    background: var(--color-text-on-accent, HighlightText);
  }

  /* Дни других месяцев не показываем — месяцы не «перетекают» друг в друга */
  .ui-calendar__day[data-outside-view] {
    visibility: hidden;
  }

  .ui-calendar__day:is([data-disabled], [data-unavailable]) {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-calendar__day[data-unavailable] {
    text-decoration: line-through;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-calendar__day,
    .ui-calendar__day:active:not([data-disabled]),
    .ui-calendar__nav,
    .ui-calendar__nav:active:not(:disabled) {
      scale: none;
      transition: none;
    }
  }
}
</style>
