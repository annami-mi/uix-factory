import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * Совпадение media query, реактивно. До монтирования (и на сервере) — `false`,
 * чтобы SSR и первая отрисовка на клиенте совпадали; актуальное значение — после onMounted.
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false);
  let media: MediaQueryList | undefined;
  const update = () => {
    matches.value = media?.matches ?? false;
  };

  onMounted(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    media = window.matchMedia(query);
    update();
    media.addEventListener("change", update);
  });
  onBeforeUnmount(() => media?.removeEventListener("change", update));

  return matches;
}
