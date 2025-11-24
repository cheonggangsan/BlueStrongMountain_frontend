import eslintRecommended from "eslint-config-eslint";

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
      "vue/valid-v-for": "error", // v-for 구문이 올바른지 여부
      "vue/valid-v-bind": "error", // v-bind의 구문이 유효한지
      "vue/no-unused-vars": "warn", // 사용하지 않는 변수 경고
      "vue/require-v-for-key": "error", // v-for에 key 속성이 반드시 있어야 한다는 규칙
      "vue/no-mutating-props": "error", // prop 값 수정 금지
      "vue/valid-v-model": "error", // v-model의 유효성 검사
    },
  },
];
