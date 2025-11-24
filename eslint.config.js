import eslintRecommended from "eslint-config-eslint";
import vueRecommended from "eslint-plugin-vue/config/recommended";

export default [
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: ["vue"],
    rules: {
      ...eslintRecommended.rules,
      ...vueRecommended.rules,
    },
  },
];
