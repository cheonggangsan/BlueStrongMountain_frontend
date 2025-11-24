<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import ProblemSearch from "./ProblemSearch.vue";
import BoardHeader from "./board/BoardHeader.vue";
import SelectedProblemsPanel from "./board/SelectedProblemsPanel.vue";
import { postBoard } from "../api/problemApi";
import { addBoard } from "../data/boardStore";

const router = useRouter();

const title = ref("");
const deadline = ref("");
const selectedProblems = ref([]);

// 선택된 문제 id (검색 결과에서 숨기기용)
const selectedProblemIds = computed(() =>
  selectedProblems.value.map((p) => p.id)
);

// 문제 추가 (중복 방지)
function handleAddProblem(problem) {
  const exists = selectedProblems.value.some((p) => p.id === problem.id);
  if (!exists) selectedProblems.value.push(problem);
}

// 문제 제거
function handleRemoveProblem(problemId) {
  selectedProblems.value = selectedProblems.value.filter(
    (p) => p.id !== problemId
  );
}

// 드래그 & 드롭 순서 변경
function handleReorder(payload) {
  const { from, to } = payload;
  if (from === to) return;

  const list = [...selectedProblems.value];
  const moved = list.splice(from, 1)[0];
  list.splice(to, 0, moved);
  selectedProblems.value = list;
}

// 전체 삭제
function handleClearAllProblems() {
  selectedProblems.value = [];
}

const canPost = computed(
  () => title.value.trim().length > 0 && selectedProblems.value.length > 0
);

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

    //TODO: integrate backend
    addBoard({
      id: res?.id || Date.now(),
      title: payload.title,
      deadline: payload.deadline,
      problemsCount: payload.problems.length,
    });

    router.push({ name: "BoardList" });
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
      <!-- 헤더: 제목 + 마감기한 + 게시 버튼 -->
      <BoardHeader
        v-model:title="title"
        v-model:deadline="deadline"
        :can-post="canPost"
        :is-posting="isPosting"
        @submit="handlePost"
      />

      <!-- 본문 -->
      <div class="board-content">
        <!-- 왼쪽: 선택된 문제 패널 -->
        <SelectedProblemsPanel
          :problems="selectedProblems"
          @remove="handleRemoveProblem"
          @reorder="handleReorder"
          @clear-all="handleClearAllProblems"
        />

        <!-- 오른쪽: 검색 및 결과 -->
        <section class="main-panel">
          <div class="main-panel-body">
            <ProblemSearch
              :selected-problem-ids="selectedProblemIds"
              @add-problem="handleAddProblem"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
