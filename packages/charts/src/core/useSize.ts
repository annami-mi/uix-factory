import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * Размер контейнера графика (ResizeObserver). Ширину задаёт раскладка, высоту — CSS (токен size/chart/*),
 * поэтому график адаптивен без медиа-запросов. До монтирования (SSR) — 0.
 */
export function useSize(el: Ref<HTMLElement | undefined>) {
  const width = ref(0);
  const height = ref(0);
  let observer: ResizeObserver | undefined;

  onMounted(() => {
    if (!el.value) return;
    const rect = el.value.getBoundingClientRect();
    width.value = rect.width;
    height.value = rect.height;
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width.value = entry.contentRect.width;
      height.value = entry.contentRect.height;
    });
    observer.observe(el.value);
  });
  onBeforeUnmount(() => observer?.disconnect());

  return { width, height };
}
