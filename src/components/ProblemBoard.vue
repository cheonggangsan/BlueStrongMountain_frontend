<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProblemSearch from "./ProblemSearch.vue";
import BoardHeader from "./board/BoardHeader.vue";
import SelectedProblemsPanel from "./board/SelectedProblemsPanel.vue";
import {
  addBoard,
  updateBoard,
  fetchBoards,
  fetchBoardById,
} from "../data/boardStore";
import { useAuthStore } from "../data/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const boardId = computed(() => route?.params?.boardId ?? null);
const isEditMode = computed(() => !!boardId.value);

const groupId = computed(() => {
  const id = route.params.groupId;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
});

const title = ref("");
const deadline = ref("");
const selectedProblems = ref([]);

const currentUserId = computed(() => authStore.user.value?.id ?? null);

function normalizeSelectedProblem(p) {
  if (!p) return null;

  // 구버전/예외: 숫자 id만 오는 경우
  if (typeof p === "number" || typeof p === "string") {
    const id = Number(p);
    return Number.isFinite(id) ? { id } : null;
  }

  // ✅ 비정상 케이스: p.id가 객체인 경우 (스샷의 [object Object] 원인)
  if (p.id && typeof p.id === "object") {
    const inner = p.id;
    const id = Number(inner.id);
    if (!Number.isFinite(id)) return null;

    return {
      id,
      title: inner.title ?? p.title ?? null,
      difficulty: inner.difficulty ?? p.difficulty ?? null,
    };
  }

  // 정상 케이스
  const id = Number(p.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    title: p.title ?? p.titleKo ?? null,
    difficulty: p.difficulty ?? null,
  };
}

onMounted(async () => {
  if (isEditMode.value) {
    try {
      const groupId = Number(route.params.groupId);
      // 보드 ID를 이용해 Store에서 기존 데이터를 가져옵니다.
      const existingBoard = await fetchBoardById(groupId, boardId.value);

      // 폼 필드 초기화
      title.value = existingBoard.title;
      deadline.value = existingBoard.deadline || "";

      // 문제 목록 초기화 (문제 상세 데이터 구조가 필요합니다.)
      selectedProblems.value = (existingBoard.problems || [])
        .map(normalizeSelectedProblem)
        .filter(Boolean);
    } catch (e) {
      console.error("보드 데이터 로드 실패:", e);
    }
  }
});

// 선택된 문제 id (검색 결과에서 숨기기용)
const selectedProblemIds = computed(() =>
  selectedProblems.value.map((p) => p.id),
);

// 문제 추가 (중복 방지)
function handleAddProblem(problem) {
  const normalized = normalizeSelectedProblem(problem);
  if (!normalized) return;

  const exists = selectedProblems.value.some(
    (p) => Number(p.id) === Number(normalized.id),
  );
  if (!exists) selectedProblems.value.push(normalized);
}

// 문제 제거
function handleRemoveProblem(problemId) {
  selectedProblems.value = selectedProblems.value.filter(
    (p) => p.id !== problemId,
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
  () => title.value.trim().length > 0 && selectedProblems.value.length > 0,
);

const isPosting = ref(false);
const postError = ref("");

async function handlePost() {
  const gid = groupId.value;
  if (gid === null) {
    postError.value = "그룹 ID가 유효하지 않습니다.";
    return;
  }

  if (!canPost.value || isPosting.value) return;

  if (!currentUserId.value) {
    postError.value = "로그인이 필요합니다.";
    return;
  }

  isPosting.value = true;
  postError.value = "";

  try {
    const boardPayload = {
      groupId: gid,
      requesterId: currentUserId.value,
      title: title.value.trim(),
      deadline: deadline.value || null,
      // content 필드는 아직 UI가 없어서 빈 문자열로 처리 (원하면 textarea 추가)
      content: "",
      problems: selectedProblems.value.map((p) => ({ ...p })),
    };

    await addBoard(boardPayload);

    await fetchBoards(gid);

    router.push({ name: "BoardList", params: { groupId: gid } });
  } catch (e) {
    console.error(e);
    postError.value = "서버 전송 중 오류가 발생했습니다.";
  } finally {
    isPosting.value = false;
  }
}

async function handleUpdate() {
  const gid = groupId.value;
  if (gid === null) {
    postError.value = "그룹 ID가 유효하지 않습니다.";
    return;
  }

  if (!boardId.value) {
    postError.value = "게시판 ID가 유효하지 않습니다.";
    return;
  }

  if (!canPost.value || isPosting.value) return;

  if (!currentUserId.value) {
    postError.value = "로그인이 필요합니다.";
    return;
  }

  isPosting.value = true;
  postError.value = "";

  try {
    const boardPayload = {
      id: Number(boardId.value),
      groupId: gid,
      requesterId: currentUserId.value,
      title: title.value.trim(),
      deadline: deadline.value || null,
      content: "",
      problems: selectedProblems.value.map((p) => ({ ...p })),
    };

    await updateBoard(boardPayload);

    await fetchBoards(gid);

    // 4. 목록 페이지로 이동
    router.push({ name: "BoardList", params: { groupId: gid } });
  } catch (e) {
    console.error(e);
    postError.value = "서버 전송 중 오류가 발생했습니다.";
  } finally {
    isPosting.value = false;
  }
}

async function handleSubmit() {
  if (isEditMode.value) {
    await handleUpdate();
  } else {
    await handlePost();
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
        :button-text="isEditMode ? '게시판 수정' : '게시판 만들기'"
        @submit="handleSubmit"
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
              :group-id="groupId"
              :selected-problem-ids="selectedProblemIds"
              @add-problem="handleAddProblem"
            />
          </div>
        </section>
      </div>

      <p
        v-if="postError"
        class="mt-3 text-sm text-red-500"
      >
        {{ postError }}
      </p>
    </div>
  </div>
</template>
