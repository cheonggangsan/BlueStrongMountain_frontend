import js from "@eslint/js";
import eslintPluginVue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...eslintPluginVue.configs["flat/recommended"],
  {
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "vue/valid-v-for": "error",
      "vue/valid-v-bind": "error",
      "vue/no-unused-vars": "warn",
      "vue/require-v-for-key": "error",
      "vue/no-mutating-props": "error",
      "vue/valid-v-model": "error",
    },
  },

  {
    files: ["*.config.*", "*.cjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
      },
    },
  },
];
