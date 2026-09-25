<script setup lang="ts">
/**
 * Фильтр периода дашборда: пресеты (сегодня, 7/30/90 дней, с начала месяца) и свой диапазон.
 * Одна строка фильтров над всеми графиками, которые она ограничивает (не внутри карточки графика).
 * Список — Select (всплывашка на десктопе, шторка на мобильном); «Свой период» — два поля даты рядом.
 * Значение — `{ preset, from, to }` (YYYY-MM-DD, включительно): графики получают готовый диапазон.
 */
import { computed } from "vue";
import Input from "../Input/Input.vue";
import Select from "../Select/Select.vue";
import { PERIOD_LABELS, resolvePeriod, type Period, type PeriodPreset } from "../../utils/period";

const props = withDefaults(
  defineProps<{
    /** Подпись поля */
    label?: string;
    /** Какие пресеты показать (порядок сохраняется); «Свой период» — отдельным флагом */
    presets?: Exclude<PeriodPreset, "custom">[];
    /** Показывать «Свой период» с полями дат */
    custom?: boolean;
    /** «Сегодня» — для тестов и серверного рендера; по умолчанию текущая дата */
    now?: Date;
    /** Подпись поля начала */
    fromLabel?: string;
    /** Подпись поля конца */
    toLabel?: string;
  }>(),
  {
    label: "Период",
    presets: () => ["today", "7d", "30d", "90d", "mtd"],
    custom: true,
    fromLabel: "С",
    toLabel: "По",
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

/** Свой диапазон: «с» не позже «по» — второе поле подтягивается */
function setFrom(from: string) {
  if (!from) return;
  model.value = { preset: "custom", from, to: model.value.to < from ? from : model.value.to };
}
function setTo(to: string) {
  if (!to) return;
  model.value = { preset: "custom", from: model.value.from > to ? to : model.value.from, to };
}
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
      <Input
        type="date"
        :label="fromLabel"
        :model-value="model.from"
        @update:model-value="(v?: string) => setFrom(v ?? '')"
      />
      <Input
        type="date"
        :label="toLabel"
        :model-value="model.to"
        @update:model-value="(v?: string) => setTo(v ?? '')"
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

  .ui-period-select__range {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }

  /* size/container/sm (640px; в @container нельзя var()) */
  @container (min-width: 640px) {
    .ui-period-select {
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      align-items: end;
    }
  }
}
</style>
