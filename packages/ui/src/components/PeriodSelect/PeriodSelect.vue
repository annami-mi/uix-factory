<script setup lang="ts">
/**
 * Фильтр периода дашборда: пресеты (сегодня, 7/30/90 дней, с начала месяца) и свой диапазон.
 * Одна строка фильтров над всеми графиками, которые она ограничивает (не внутри карточки графика).
 * Список — Select (всплывашка на десктопе, шторка на мобильном); «Свой период» — DatePicker рядом
 * (календарь: два месяца во всплывашке, лента месяцев в шторке), не позже «сегодня».
 * Значение — `{ preset, from, to }` (YYYY-MM-DD, включительно): графики получают готовый диапазон.
 */
import { computed } from "vue";
import type { DateRangeValue } from "../Calendar/Calendar.vue";
import DatePicker from "../DatePicker/DatePicker.vue";
import Select from "../Select/Select.vue";
import { isoDay, PERIOD_LABELS, resolvePeriod, type Period, type PeriodPreset } from "../../utils/period";

const props = withDefaults(
  defineProps<{
    /** Подпись поля */
    label?: string;
    /** Какие пресеты показать (порядок сохраняется); «Свой период» — отдельным флагом */
    presets?: Exclude<PeriodPreset, "custom">[];
    /** Показывать «Свой период» с календарём */
    custom?: boolean;
    /** «Сегодня» — для тестов и серверного рендера; по умолчанию текущая дата */
    now?: Date;
    /** Подпись поля своего периода */
    rangeLabel?: string;
  }>(),
  {
    label: "Период",
    presets: () => ["today", "7d", "30d", "90d", "mtd"],
    custom: true,
    rangeLabel: "Даты",
  },
);

const model = defineModel<Period>({ default: () => resolvePeriod("30d", new Date()) });

const options = computed(() => [
  ...props.presets.map((p) => ({ value: p, label: PERIOD_LABELS[p] })),
  ...(props.custom ? [{ value: "custom", label: PERIOD_LABELS.custom }] : []),
]);

const preset = computed({
  get: () => model.value.preset,
  set: (value: string | undefined) => {
    if (!value) return;
    model.value = resolvePeriod(value as PeriodPreset, props.now ?? new Date(), model.value);
  },
});

/** Свой период — календарь; будущее недоступно (статистика — по прошедшим дням) */
const today = computed(() => isoDay(props.now ?? new Date()));
const range = computed<DateRangeValue | null>({
  get: () => ({ from: model.value.from, to: model.value.to }),
  set: (v) => {
    if (v) model.value = { preset: "custom", from: v.from, to: v.to };
  },
});
</script>

<template>
  <div class="ui-period-select">
    <Select
      v-model="preset"
      class="ui-period-select__preset"
      :label="label"
      :options="options"
    />
    <div
      v-if="model.preset === 'custom'"
      class="ui-period-select__range"
    >
      <DatePicker
        v-model="range"
        mode="range"
        :label="rangeLabel"
        :max="today"
        :now="today"
      />
    </div>
  </div>
</template>

<style scoped>
@layer components {
  /* Mobile-first: пресет и диапазон друг под другом; в широком контейнере — в строку */
  .ui-period-select {
    container-type: inline-size;
    display: grid;
    gap: var(--space-3);
    min-inline-size: 0;
  }

  /* size/container/s (640px; в @container нельзя var()) */
  @container (min-width: 640px) {
    .ui-period-select {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
  }
}
</style>
