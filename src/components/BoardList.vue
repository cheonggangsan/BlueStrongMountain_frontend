<script setup>
import { useRouter } from "vue-router";
import { boards } from "../data/boardStore";

const router = useRouter();

function goCreateBoard() {
  router.push({ name: "BoardCreate" }); // 라우터에서 name:"BoardCreate"로 설정할 거
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

    <!-- 보드 리스트 -->
    <div
      v-if="boards.length === 0"
      class="text-sm text-gray-400"
    >
      아직 생성된 보드가 없습니다. "보드 만들기" 버튼으로 새 보드를 만들어
      보세요.
    </div>

    <ul
      v-else 
      class="space-y-2"
    >
      <li
        v-for="board in boards"
        :key="board.id"
        class="border rounded-lg px-3 py-2 bg-white shadow-sm"
      >
        <div class="font-semibold text-sm text-gray-800">
          {{ board.title }}
        </div>
        <div class="mt-1 text-[11px] text-gray-500">
          마감:
          <span v-if="board.deadline">
            {{ board.deadline }}
          </span>
          <span v-else>설정 안 함</span>
          · 문제 {{ board.problemsCount }}개
        </div>
      </li>
    </ul>
  </div>
</template>
