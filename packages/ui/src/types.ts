/** Ключи шкалы отступов (primitive space/*) — пропсы раскладки принимают только их, не пиксели */
export type SpaceKey = "0" | "px" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16" | "20" | "24";

/** Ширины контейнера (primitive size/container/*) */
export type ContainerSize = "s" | "m" | "l" | "full";

/** CSS-переменная отступа по ключу шкалы */
export const space = (key: SpaceKey) => `var(--space-${key})`;
