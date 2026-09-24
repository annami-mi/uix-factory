import pluginVue from "eslint-plugin-vue";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules", "**/dist", "**/storybook-static"] },
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  // Правила для *.stories.* (CSF, play-функции, импорты из storybook/test)
  ...storybook.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    rules: {
      // Однословное имя допустимо: компоненты кита живут в своём пространстве (@uix/ui)
      "vue/multi-word-component-names": "off",
      // TS-пропсы: необязательный проп и так undefined, дефолт ради дефолта не нужен
      "vue/require-default-prop": "off",
    },
  },
);
