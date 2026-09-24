/**
 * Общие правила axe для всех историй. Storybook при слиянии parameters заменяет массивы,
 * поэтому истории со своими правилами обязаны включать эти (см. `withA11yRules`).
 */
type Rule = { id: string; enabled?: boolean; selector?: string };

export const baseRules: Rule[] = [
  {
    // WCAG 1.4.3: текст неактивного элемента освобождён от требования контраста.
    // axe не связывает с неактивностью подсказку disabled-поля, отключённую опцию списка
    // и описание отключённого флажка,
    // поэтому исключаем ровно их.
    id: "color-contrast",
    selector: [
      "*:not(.ui-form-field[data-disabled] .ui-form-field__message)",
      ":not(.ui-select-option[data-disabled])",
      ":not(.ui-select-option[data-disabled] *)",
      ":not(.ui-checkbox[data-disabled] .ui-checkbox__description)",
      ":not(.ui-radio[data-disabled] .ui-radio__description)",
      ":not(.ui-radio-group[data-disabled] .ui-radio-group__message)",
      ":not(.ui-switch[data-disabled] .ui-switch__description)",
    ].join(""),
  },
];

/**
 * Открытая модальная панель (Select, Sheet): проверяем весь <body> (панель телепортирована из canvas).
 * aria-hidden-focus выключен: модалка скрывает страницу через aria-hidden и держит фокус внутри —
 * до элементов под ней не дойти, пока она открыта (ложное срабатывание для модальных панелей).
 */
export const openModalA11y = {
  a11y: {
    context: "body",
    config: { rules: [...baseRules, { id: "aria-hidden-focus", enabled: false }] },
  },
};
