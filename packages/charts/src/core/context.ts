import { computed, inject, ref, type ComputedRef, type InjectionKey, type Ref } from "vue";

/** Что ChartCard сообщает графику внутри: режим (график/таблица), загрузка, заголовок */
export interface ChartContext {
  view: Ref<"chart" | "table">;
  loading: ComputedRef<boolean>;
  title: ComputedRef<string>;
}

export const chartContextKey: InjectionKey<ChartContext> = Symbol("uix-chart");

/** Контекст карточки; без ChartCard — график сам по себе (режим «график», без загрузки) */
export function useChartContext(fallbackTitle: () => string): ChartContext {
  return (
    inject(chartContextKey, null) ?? {
      view: ref("chart"),
      loading: computed(() => false),
      title: computed(fallbackTitle),
    }
  );
}
