<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  title: { type: String, default: "" },
  deadline: { type: String, default: "" },
  canPost: { type: Boolean, default: false },
  isPosting: { type: Boolean, default: false },
});

const emit = defineEmits(["update:title", "update:deadline", "submit"]);

// v-model:title
const titleModel = computed({
  get: () => props.title,
  set: (val) => emit("update:title", val),
});

// v-model:deadline
const deadlineModel = computed({
  get: () => props.deadline,
  set: (val) => emit("update:deadline", val),
});

// datetime-local input DOM
const deadlineInputRef = ref(null);

// 표시용 포맷
const formattedDeadline = computed(() => {
  if (!deadlineModel.value) return "연도-월-일  —  시:분 선택";

  const [date, time] = deadlineModel.value.split("T");
  if (!date || !time) return deadlineModel.value;

  const [yyyy, mm, dd] = date.split("-");
  const [hh, min] = time.split(":");

  return `${yyyy}년 ${mm}월 ${dd}일  ${hh}시 ${min}분`;
});

// 박스 클릭 시 달력 열기
function openDeadlinePicker() {
  const el = deadlineInputRef.value;
  if (!el) return;

  if (typeof el.showPicker === "function") {
    el.showPicker();
  } else {
    el.focus();
    el.click();
  }
}

function handleSubmit() {
  emit("submit");
}
</script>

<template>
  <div class="board-header">
    <!-- 제목 -->
    <div class="board-header-title">
      <label class="block text-sm font-medium text-gray-700 mb-1"> 제목 </label>
      <input
        v-model="titleModel"
        type="text"
        placeholder="이번 스터디 세션 제목을 입력하세요"
        class="w-full rounded-lg border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
      >
    </div>

    <!-- 마감 기한 -->
    <div class="w-full md:w-80 lg:w-72">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        마감 기한 (deadline)
      </label>

      <!-- 전체 박스를 클릭하면 openDeadlinePicker -->
      <div
        class="relative flex items-center justify-between px-3 py-1.5 rounded-lg border text-gray-700 shadow-sm cursor-pointer hover:border-yellow-400 hover:bg-yellow-100 transition-colors"
        @click="openDeadlinePicker"
      >
        <!-- 왼쪽: 아이콘 + 텍스트 -->
        <div class="flex items-center gap-2">
          <span class="text-lg">📅</span>
          <span
            :class="[
              'text-sm truncate',
              deadlineModel ? 'text-gray-800' : 'text-gray-400',
            ]"
          >
            {{ formattedDeadline }}
          </span>
        </div>

        <!-- 오른쪽: '선택/변경' 라벨 -->
        <span
          class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 pointer-events-none"
        >
          {{ deadlineModel ? "변경" : "선택" }}
        </span>

        <!-- 실제 datetime-local 인풋 (보이지 않지만 값/이벤트 담당) -->
        <input
          ref="deadlineInputRef"
          v-model="deadlineModel"
          type="datetime-local"
          class="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          tabindex="-1"
        >
      </div>
    </div>

    <!-- 게시 버튼 -->
    <div class="w-full md:w-auto flex justify-end items-end">
      <button
        type="button"
        class="px-5 py-2 rounded-xl text-sm font-semibold border border-transparent text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canPost || isPosting"
        @click="handleSubmit"
      >
        {{ isPosting ? "게시 중..." : "게시" }}
      </button>
    </div>
  </div>
</template>
