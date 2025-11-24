/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-vue/**/*.{js,jsx,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ✅ 기본 sans 폰트를 Pretendard로
        sans: ['"Pretendard"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
