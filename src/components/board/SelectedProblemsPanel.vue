<script setup>
import { ref, computed } from "vue";
import { difficultyOptions } from "@/data/difficultyOptions";
import { confirm } from "@/lib/feedback/confirm";

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

async function handleClearAll() {
  if (!props.problems.length) return;
  const ok = await confirm({
    title: "전체 삭제",
    description: "선택된 문제를 모두 삭제할까요?",
    confirmText: "삭제",
    cancelText: "취소",
    variant: "danger",
  });
  if (!ok) return;
  emit("clear-all");
}

const tierLabel = (difficulty) => {
  if (difficulty === undefined || difficulty === null) return null;

  // 문자열로 이미 들어오는 케이스(예: "Gold 5")면 그대로 라벨 처리
  const direct = difficultyOptions.find((o) => o.value === String(difficulty));
  if (direct) return direct.label;

  const n = Number(difficulty);
  if (!Number.isFinite(n)) return null;

  const list = difficultyOptions.filter((o) => o.value !== "ALL"); // [Unrated, Bronze 5, ...]
  return list[n]?.label ?? `난이도 ${n}`;
};

const displayProblems = computed(() => props.problems || []);
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
        v-for="(problem, idx) in displayProblems"
        :key="problem.id"
        class="problem-slot"
        draggable="true"
        @dragstart="handleDragStart(idx)"
        @dragover="handleDragOver"
        @drop="handleDrop(idx)"
      >
        <!-- 왼쪽: 문제 번호 + 제목 + 티어 -->
        <div class="min-w-0">
          <!-- 1) 첫 줄: 문제번호 + 문제이름 -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-700 shrink-0">
              #{{ idx + 1 }}
            </span>

            <span class="text-xs font-medium text-gray-900 truncate">
              {{ problem.title || `문제 ${problem.id}` }}
            </span>
          </div>

          <!-- 2) 둘째 줄: ID + 난이도(ProblemSearch 스타일) -->
          <div class="mt-0.5 flex items-center gap-2">
            <span class="text-[10px] text-gray-400 truncate">
              ID: {{ problem.id }}
            </span>

            <span
              v-if="tierLabel(problem.difficulty)"
              class="px-2 py-[2px] rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-semibold shrink-0"
              title="난이도"
            >
              {{ tierLabel(problem.difficulty) }}
            </span>
          </div>
        </div>

        <!-- 오른쪽: 링크 + 삭제 -->
        <div class="flex items-center gap-2 shrink-0">
          <a
            :href="`https://www.acmicpc.net/problem/${problem.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center h-6 w-6 rounded-md border border-yellow-300 text-[11px] text-yellow-700 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400 transition"
            title="백준 문제 열기"
            @click.stop
          >
            ↗
          </a>

          <button
            type="button"
            class="problem-remove-btn"
            aria-label="문제 제거"
            title="선택 목록에서 제거"
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
