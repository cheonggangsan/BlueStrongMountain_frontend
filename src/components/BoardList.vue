<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goCreateBoard() {
  router.push({ name: "BoardCreate" });
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600"
        @click="goCreateBoard"
      >
        보드 만들기
      </button>
    </div>
  </div>
</template>
