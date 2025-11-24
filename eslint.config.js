export default {
  languageOptions: {
    globals: {
      window: "readonly",
      document: "readonly",
    },
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
