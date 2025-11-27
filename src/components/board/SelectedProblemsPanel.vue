<script setup>
import { ref } from "vue";

const props = defineProps({
  problems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["remove", "reorder", "clear-all"]);

const draggingIndex = ref(null);

function handleDragStart(index) {
  draggingIndex.value = index;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(index) {
  if (draggingIndex.value === null || draggingIndex.value === index) return;

  emit("reorder", { from: draggingIndex.value, to: index });
  draggingIndex.value = null;
}

function handleClearAll() {
  if (!props.problems.length) return;
  const ok = window.confirm("선택된 문제를 모두 삭제할까요?");
  if (!ok) return;
  emit("clear-all");
}
</script>

<template>
  <aside class="left-panel">
    <!-- 헤더: 제목 + 전체 삭제 버튼 한 줄 -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div>
        <div class="left-panel-title">선택된 문제</div>
        <p class="text-xs text-gray-400">
          drag &amp; drop 으로 순서를 변경할 수 있어요.
        </p>
      </div>

      <button
        type="button"
        class="px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        :disabled="problems.length === 0"
        @click="handleClearAll"
      >
        전체 삭제
      </button>
    </div>

    <div class="selected-problems-list">
      <div
        v-for="(problem, idx) in problems"
        :key="problem.id"
        class="problem-slot"
        draggable="true"
        @dragstart="handleDragStart(idx)"
        @dragover="handleDragOver"
        @drop="handleDrop(idx)"
      >
        <div class="text-xs">
          <span class="font-semibold mr-1">문제 {{ idx + 1 }}</span>
          <span class="text-gray-600">{{ problem.title }}</span>
        </div>
        <div class="flex items-center gap-2">
          <a
            :href="`https://www.acmicpc.net/problem/${problem.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center h-6 w-6 rounded-md border border-yellow-300 text-[11px] text-yellow-700 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400 transition"
            @click.stop
          >
            ↗
          </a>

          <button
            type="button"
            class="problem-remove-btn"
            aria-label="문제 제거"
            @click.stop="emit('remove', problem.id)"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        v-if="problems.length === 0"
        class="problem-slot problem-slot-empty"
      >
        선택된 문제가 없습니다.
      </div>
    </div>
  </aside>
</template>
