<script setup>
import { ref, computed } from "vue";
import ProblemSearch from "./ProblemSearch.vue";
import { postBoard } from "../api/problemApi";

const title = ref("");
const deadline = ref("");
const selectedProblems = ref([]);

// drag & drop 인덱스
const draggingIndex = ref(null);

const selectedProblemIds = computed(() =>
  selectedProblems.value.map((p) => p.id)
);

function onAddProblem(problem) {
  const exists = selectedProblems.value.some((p) => p.id === problem.id);
  if (!exists) {
    selectedProblems.value.push(problem);
  }
}

function onRemoveProblem(problemId) {
  selectedProblems.value = selectedProblems.value.filter(
    (p) => p.id !== problemId
  );
}

// ✅ datetime-local 인풋 ref
const deadlineInputRef = ref(null); // TS면 ref<HTMLInputElement | null>(null)

const formattedDeadline = computed(() => {
  if (!deadline.value) return "연도-월-일  —  시:분 선택";

  const [date, time] = deadline.value.split("T");
  if (!date || !time) return deadline.value;

  const [yyyy, mm, dd] = date.split("-");
  const [hh, min] = time.split(":");

  return `${yyyy}년 ${mm}월 ${dd}일  ${hh}시 ${min}분`;
});

// ✅ 박스 클릭 시 달력 열기
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

// ✅ 전체 삭제 함수 추가
function onClearAllProblems() {
  if (!selectedProblems.value.length) return;

  const ok = window.confirm("선택된 문제를 모두 삭제할까요?");
  if (!ok) return;

  selectedProblems.value = [];
  draggingIndex.value = null;
}

function clearAllSelectedProblems() {
  selectedProblems.value = [];
}

function handleDragStart(index) {
  draggingIndex.value = index;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(index) {
  if (draggingIndex.value === null || draggingIndex.value === index) return;
  const list = [...selectedProblems.value];
  const dragged = list.splice(draggingIndex.value, 1)[0];
  list.splice(index, 0, dragged);
  selectedProblems.value = list;
  draggingIndex.value = null;
}

const canPost = computed(() => {
  return title.value.trim().length > 0 && selectedProblems.value.length > 0;
});

const isPosting = ref(false);
const postResult = ref(null);
const postError = ref("");

async function handlePost() {
  if (!canPost.value || isPosting.value) return;
  isPosting.value = true;
  postError.value = "";
  postResult.value = null;
  try {
    const payload = {
      title: title.value.trim(),
      deadline: deadline.value || null,
      problems: selectedProblems.value.map((p, index) => ({
        id: p.id,
        order: index + 1,
      })),
    };
    const res = await postBoard(payload);
    postResult.value = res;
  } catch (e) {
    console.error(e);
    postError.value = "서버 전송 중 오류가 발생했습니다.";
  } finally {
    isPosting.value = false;
  }
}
</script>

<template>
  <div class="app-root">
    <div class="board-container">
      <!-- 헤더 -->
      <div class="board-header">
        <!-- 제목 -->
        <div class="board-header-title">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >제목</label
          >
          <input
            v-model="title"
            type="text"
            placeholder="이번 스터디 세션 제목을 입력하세요"
            class="w-full rounded-lg border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
          />
        </div>

        <div class="w-full md:w-80 lg:w-72">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            마감 기한 (deadline)
          </label>

          <!-- ✅ 전체 박스를 클릭하면 openDeadlinePicker 실행 -->
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
                  deadline ? 'text-gray-800' : 'text-gray-400',
                ]"
              >
                {{ formattedDeadline }}
              </span>
            </div>

            <!-- 오른쪽: '선택/변경' 라벨 (표시만) -->
            <span
              class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 pointer-events-none"
            >
              {{ deadline ? "변경" : "선택" }}
            </span>

            <!-- 실제 datetime 인풋 (눈에만 안 보이게, 클릭은 JS로) -->
            <input
              ref="deadlineInputRef"
              v-model="deadline"
              type="datetime-local"
              class="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              tabindex="-1"
            />
          </div>
        </div>

        <!-- ✅ 게시 버튼: 마감 기한 옆으로 이동 -->
        <div class="w-full md:w-auto flex justify-end items-end">
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-sm font-semibold border border-transparent text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canPost || isPosting"
            @click="handlePost"
          >
            {{ isPosting ? "게시 중..." : "게시" }}
          </button>
        </div>
      </div>

      <!-- 본문 -->
      <div class="board-content">
        <!-- 왼쪽: 선택된 문제 목록 -->
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
              :disabled="selectedProblems.length === 0"
              @click="clearAllSelectedProblems"
            >
              전체 삭제
            </button>
          </div>

          <div class="selected-problems-list">
            <div
              v-for="(problem, idx) in selectedProblems"
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
                  @click="onRemoveProblem(problem.id)"
                  aria-label="문제 제거"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              v-if="selectedProblems.length === 0"
              class="problem-slot problem-slot-empty"
            >
              선택된 문제가 없습니다.
            </div>
          </div>

          <!-- <div class="flex items-center justify-between mt-2">
            <button type="button" class="add-problem-btn" disabled>
              +
            </button>
            <span class="text-[11px] text-gray-400">
              검색 결과 카드 클릭으로 문제를 추가하세요
            </span>
          </div> -->
        </aside>

        <!-- 오른쪽: 검색 및 결과 -->
        <section class="main-panel">
          <!-- ✅ 이 안이 스크롤 높이를 공유할 영역 -->
          <div class="main-panel-body">
            <ProblemSearch
              :selected-problem-ids="selectedProblemIds"
              @add-problem="onAddProblem"
            />
          </div>

          <!-- 상태 메시지 영역: 그대로 유지 -->
          <!-- <div class="mt-1 text-sm h-5 flex items-center">
            <span v-if="postError" class="text-red-500">
              {{ postError }}
            </span>
            <span v-else-if="postResult?.success" class="text-emerald-600">
              게시 요청이 mock 서버로 성공적으로 전송되었습니다. (콘솔을
              확인해보세요)
            </span>
            <span v-else class="text-transparent select-none">
              placeholder
            </span>
          </div> -->
        </section>
      </div>
    </div>
  </div>
</template>
