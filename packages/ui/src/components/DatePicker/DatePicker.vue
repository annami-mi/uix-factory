<script setup lang="ts">
/**
 * Поле выбора даты или периода: FormField + Field-кнопка, по нажатию — Calendar.
 *
 * - **Десктоп** — всплывашка «толстого» стекла (surface/popover/*): слева пресеты периода (`presets`),
 *   справа календарь — два месяца рядом для диапазона. Выбор второй даты или пресета закрывает панель.
 * - **Мобильный** — шторка: пресеты чипами сверху, ниже — вертикальная лента месяцев (листают пальцем,
 *   как в iOS/Airbnb). Выбор копится в черновике и применяется кнопкой «Готово» (случайный тап не сбрасывает
 *   фильтр); одна дата применяется сразу.
 * - Значения — строки `YYYY-MM-DD` (`{ from, to }` для диапазона); подпись в поле — Intl по-русски
 *   («10–18 сент. 2026»).
 */
import { computed, ref, useAttrs, watch } from "vue";
import { Calendar as CalendarIcon, Check } from "@lucide/vue";
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from "reka-ui";
import { breakpoints } from "@uix/tokens";
import { useMediaQuery } from "../../composables/useMediaQuery";
import { PERIOD_LABELS, parseDay, resolvePeriod, type PeriodPreset } from "../../utils/period";
import { tokenNumber } from "../../utils/tokens";
import Button from "../Button/Button.vue";
import Calendar, { type DateRangeValue } from "../Calendar/Calendar.vue";
import Field from "../Field/Field.vue";
import FormField from "../FormField/FormField.vue";
import Sheet from "../Sheet/Sheet.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Одна дата или период */
    mode?: "single" | "range";
    /** Видимая подпись над полем; заголовок шторки на мобильном */
    label?: string;
    /** Подсказка под полем */
    hint?: string;
    /** Текст ошибки: заменяет подсказку, ставит `aria-invalid` */
    error?: string;
    /** Текст, пока ничего не выбрано */
    placeholder?: string;
    /** Поле недоступно */
    disabled?: boolean;
    /** Самая ранняя доступная дата, YYYY-MM-DD */
    min?: string;
    /** Самая поздняя доступная дата, YYYY-MM-DD */
    max?: string;
    /** Пресеты периода (только `range`): сегодня, 7/30/90 дней, с начала месяца */
    presets?: Exclude<PeriodPreset, "custom">[];
    /** Как раскрывать: по ширине экрана, всплывашкой или шторкой */
    presentation?: "auto" | "popover" | "sheet";
    /** Подпись кнопки применения в шторке */
    doneLabel?: string;
    /** Опорная «сегодня», YYYY-MM-DD, для пресетов и стартового месяца (тесты, серверный рендер) */
    now?: string;
    /** Явный id триггера; по умолчанию — сгенерированный */
    id?: string;
  }>(),
  {
    mode: "single",
    placeholder: "Выберите дату",
    presets: () => [],
    presentation: "auto",
    doneLabel: "Готово",
  },
);

/** Выбранная дата или период; `null` — ничего не выбрано */
const model = defineModel<string | DateRangeValue | null>({ default: null });

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);

const isNarrow = useMediaQuery(`(width < ${breakpoints.m}px)`);
const presentationMode = computed(() =>
  props.presentation === "auto" ? (isNarrow.value ? "sheet" : "popover") : props.presentation,
);
const isRange = computed(() => props.mode === "range");
const open = ref(false);
const sideOffset = computed(() => tokenNumber("--space-2", 8));

/* ---------- подпись в поле ---------- */
const dayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const rangeFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
/** «г.» в конце — канцелярит для поля; Intl ставит его в русской локали */
const clean = (s: string) => s.replace(/\s?г\.$/, "");
const display = computed(() => {
  const v = model.value;
  if (!v) return "";
  if (typeof v === "string") return clean(dayFmt.format(parseDay(v)));
  return clean(rangeFmt.formatRange(parseDay(v.from), parseDay(v.to)));
});

/* ---------- пресеты ---------- */
const nowDate = computed(() => (props.now ? parseDay(props.now) : new Date()));
const presetItems = computed(() =>
  isRange.value
    ? props.presets.map((p) => {
        const r = resolvePeriod(p, nowDate.value);
        return { key: p, label: PERIOD_LABELS[p], value: { from: r.from, to: r.to } };
      })
    : [],
);
const sameRange = (a: unknown, b: DateRangeValue) =>
  !!a && typeof a === "object" && (a as DateRangeValue).from === b.from && (a as DateRangeValue).to === b.to;

/* ---------- черновик шторки: применяется «Готово» ---------- */
const draft = ref<string | DateRangeValue | null>(model.value);
/** Период начат новым тапом, но не завершён — «Готово» недоступна */
const pending = ref(false);
watch(open, (o) => {
  if (o) {
    draft.value = model.value;
    pending.value = false;
  }
});
const draftComplete = computed(
  () => !pending.value && (isRange.value ? !!draft.value && typeof draft.value === "object" : !!draft.value),
);

function applyPreset(value: DateRangeValue) {
  model.value = value;
  open.value = false;
}
function onPopoverComplete() {
  open.value = false;
}
function onSheetComplete() {
  // Одна дата — сразу; период — ждёт «Готово»
  if (!isRange.value) applyDraft();
}
function applyDraft() {
  model.value = draft.value;
  open.value = false;
}
/* Фокус после закрытия — на кнопку поля; клик по ней при открытой панели — закрыть, а не переоткрыть */
const trigger = ref<HTMLButtonElement>();
function onCloseAutoFocus(event: Event) {
  event.preventDefault();
  trigger.value?.focus();
}
function onPointerDownOutside(event: CustomEvent<{ originalEvent: PointerEvent }>) {
  if (trigger.value?.contains(event.detail.originalEvent.target as Node)) event.preventDefault();
}
const popoverValue = computed({
  get: () => model.value,
  set: (v) => (model.value = v),
});
</script>

<template>
  <FormField
    v-bind="rootAttrs"
    :id="id"
    v-slot="{ id: controlId, describedBy, invalid }"
    class="ui-date-picker"
    :label="label"
    :hint="hint"
    :error="error"
    :disabled="disabled"
  >
    <PopoverRoot
      v-if="presentationMode === 'popover'"
      v-model:open="open"
    >
      <!-- Кнопка поля — своя (id для <label for>; PopoverTrigger ставит свой id), Reka — только якорь -->
      <PopoverAnchor as-child>
        <Field
          flush
          :invalid="invalid"
          :disabled="disabled"
        >
          <button
            :id="controlId"
            ref="trigger"
            v-bind="controlAttrs"
            type="button"
            data-field-control
            class="ui-date-picker__trigger"
            :data-empty="display ? undefined : ''"
            :disabled="disabled"
            aria-haspopup="dialog"
            :aria-expanded="open"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedBy"
            @click="open = !open"
          >
            <CalendarIcon
              class="ui-date-picker__icon"
              aria-hidden="true"
            />
            <span class="ui-date-picker__value">{{ display || placeholder }}</span>
          </button>
        </Field>
      </PopoverAnchor>
      <PopoverPortal>
        <!-- PopoverContent рендерит фрагмент — scoped-стили у него не срабатывают: материал на обёртке -->
        <PopoverContent
          align="start"
          :side-offset="sideOffset"
          :aria-label="label ?? placeholder"
          :style="{ zIndex: 'var(--z-index-popover)' }"
          @close-auto-focus="onCloseAutoFocus"
          @pointer-down-outside="onPointerDownOutside"
        >
          <div class="ui-date-picker__panel">
            <ul
              v-if="presetItems.length"
              class="ui-date-picker__presets"
            >
              <li
                v-for="p in presetItems"
                :key="p.key"
              >
                <button
                  type="button"
                  class="ui-date-picker__preset"
                  :aria-pressed="sameRange(model, p.value)"
                  @click="applyPreset(p.value)"
                >
                  {{ p.label }}
                  <Check
                    class="ui-date-picker__check"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>
            <Calendar
              v-model="popoverValue"
              :mode="mode"
              :months="isRange ? 2 : 1"
              :min="min"
              :max="max"
              :now="now"
              :label="label ?? placeholder"
              @complete="onPopoverComplete"
            />
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <template v-else>
      <Field
        flush
        :invalid="invalid"
        :disabled="disabled"
      >
        <button
          :id="controlId"
          v-bind="controlAttrs"
          type="button"
          data-field-control
          class="ui-date-picker__trigger"
          :data-empty="display ? undefined : ''"
          :disabled="disabled"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          @click="open = true"
        >
          <CalendarIcon
            class="ui-date-picker__icon"
            aria-hidden="true"
          />
          <span class="ui-date-picker__value">{{ display || placeholder }}</span>
        </button>
      </Field>

      <Sheet
        v-model:open="open"
        :title="label ?? placeholder"
        initial-focus="container"
      >
        <div
          v-if="presetItems.length"
          class="ui-date-picker__chips"
        >
          <button
            v-for="p in presetItems"
            :key="p.key"
            type="button"
            class="ui-date-picker__chip"
            :aria-pressed="sameRange(draft, p.value)"
            @click="applyPreset(p.value)"
          >
            {{ p.label }}
          </button>
        </div>
        <Calendar
          v-model="draft"
          :mode="mode"
          layout="scroll"
          :min="min"
          :max="max"
          :now="now"
          :label="label ?? placeholder"
          @complete="onSheetComplete"
          @pending="pending = $event"
        />
        <template
          v-if="isRange"
          #footer
        >
          <Button
            class="ui-date-picker__done"
            :disabled="!draftComplete"
            @click="applyDraft"
          >
            {{ doneLabel }}
          </Button>
        </template>
      </Sheet>
    </template>
  </FormField>
</template>

<style scoped>
@layer components {
  .ui-date-picker__trigger {
    display: flex;
    flex: 1;
    align-items: center;
    align-self: stretch;
    gap: var(--space-3);
    min-inline-size: 0;
    padding-inline: var(--space-4);
    border: 0;
    border-radius: inherit;
    background: none;
    color: inherit;
    font-family: var(--type-body-m-font-family);
    font-weight: var(--type-body-m-font-weight);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
    text-align: start;
    cursor: pointer;
    outline: none; /* фокус показывает капсула Field (:focus-within) */
  }

  .ui-date-picker__trigger:disabled {
    cursor: not-allowed;
  }

  .ui-date-picker__trigger[data-empty] .ui-date-picker__value {
    color: var(--color-text-tertiary, GrayText);
  }

  .ui-date-picker__value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ui-date-picker__icon {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    color: var(--color-icon-secondary, CanvasText);
    stroke-width: var(--stroke-icon);
  }

  /* ---------- всплывашка: пресеты слева, календарь справа ---------- */
  .ui-date-picker__panel {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-4);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-6);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    transform-origin: var(--reka-popover-content-transform-origin);
    /* Появление — пружиной (панель монтируется заново при каждом открытии) */
    animation: ui-date-picker-in var(--duration-release) var(--easing-spring-release);
  }

  @keyframes ui-date-picker-in {
    from {
      opacity: 0;
      scale: var(--scale-popover-enter);
    }
  }

  .ui-date-picker__presets {
    display: grid;
    align-content: start;
    gap: var(--space-1);
    min-inline-size: var(--size-grid-item-s);
    margin: 0;
    padding: 0 var(--space-4) 0 0;
    border-inline-end: var(--stroke-1) solid var(--color-divider, GrayText);
    list-style: none;
  }

  .ui-date-picker__preset {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    inline-size: 100%;
    min-block-size: var(--size-40);
    padding-inline: var(--space-3);
    border: 0;
    border-radius: var(--radius-3);
    background: transparent;
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-body-m-font-family);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
    text-align: start;
    cursor: pointer;
    transition: background-color var(--duration-fast) ease-out;
  }

  /* Всплывашка бывает и на планшете — на тач-экране зона касания size/44 */
  @media (pointer: coarse) {
    .ui-date-picker__preset {
      min-block-size: var(--size-44);
    }
  }

  .ui-date-picker__preset:hover {
    background: var(--surface-option-highlighted-bg, ButtonFace);
  }

  .ui-date-picker__preset:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  .ui-date-picker__check {
    inline-size: var(--size-16);
    block-size: var(--size-16);
    color: var(--color-accent-default, Highlight);
    stroke-width: var(--stroke-2);
    opacity: 0;
  }

  .ui-date-picker__preset[aria-pressed="true"] {
    font-weight: var(--type-label-m-font-weight);
  }

  .ui-date-picker__preset[aria-pressed="true"] .ui-date-picker__check {
    opacity: 1;
  }

  /* ---------- шторка: пресеты — чипы с горизонтальной прокруткой ---------- */
  .ui-date-picker__chips {
    display: flex;
    gap: var(--space-2);
    margin-block-end: var(--space-3);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ui-date-picker__chip {
    flex: none;
    min-block-size: var(--size-44);
    padding-inline: var(--space-4);
    border: 0;
    border-radius: var(--radius-full);
    background: var(--surface-neutral-default-bg, ButtonFace);
    color: var(--color-text-primary, ButtonText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
    cursor: pointer;
    transition: scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-date-picker__chip:active {
    scale: var(--scale-pressed-surface);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-date-picker__chip:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-date-picker__chip[aria-pressed="true"] {
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
  }

  .ui-date-picker__done {
    inline-size: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-date-picker__panel {
      animation: none;
    }

    .ui-date-picker__chip,
    .ui-date-picker__chip:active {
      scale: none;
      transition: none;
    }
  }
}
</style>
