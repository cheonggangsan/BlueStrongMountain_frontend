import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      // .scss 파일에 대해 modern API 사용
      scss: {
        api: "modern-compiler", // 또는 'modern'
      },
      // 만약 .sass 확장자를 쓴다면 여기도 추가 가능
      sass: {
        api: "modern-compiler",
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.js",
  },
});
