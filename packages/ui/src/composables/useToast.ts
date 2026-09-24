import { readonly, ref } from "vue";

export interface ToastOptions {
  /** Заголовок: коротко, что произошло */
  title: string;
  /** Пояснение */
  description?: string;
  /** neutral — информация, success — готово, danger — ошибка (объявляется скринридером сразу) */
  tone?: "neutral" | "success" | "danger";
  /** Действие в уведомлении: «Отменить», «Повторить» */
  action?: {
    label: string;
    /** Как выполнить это же действие без уведомления (для скринридера, WCAG 2.2.1) */
    altText: string;
    onClick: () => void;
  };
  /** Сколько висит, мс. По умолчанию — duration/toast */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
  open: boolean;
}

/** Очередь уведомлений — одна на приложение, её показывает <Toaster /> */
const items = ref<ToastItem[]>([]);
let nextId = 1;

/**
 * Показать уведомление из любого места приложения:
 *
 *   const { toast } = useToast();
 *   toast({ title: "Товар добавлен в корзину", tone: "success" });
 *
 * В приложении должен быть один <Toaster /> (обычно в корневом layout).
 */
export function useToast() {
  function toast(options: ToastOptions) {
    const id = nextId++;
    items.value.push({ ...options, id, open: true });
    return id;
  }

  function dismiss(id: number) {
    const item = items.value.find((t) => t.id === id);
    if (item) item.open = false;
  }

  /** Убрать из очереди после анимации закрытия (вызывает Toaster) */
  function remove(id: number) {
    items.value = items.value.filter((t) => t.id !== id);
  }

  return { toasts: readonly(items), toast, dismiss, remove };
}
