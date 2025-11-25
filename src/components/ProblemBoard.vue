<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProblemSearch from "./ProblemSearch.vue";
import BoardHeader from "./board/BoardHeader.vue";
import SelectedProblemsPanel from "./board/SelectedProblemsPanel.vue";
import { postBoard } from "../api/problemApi";
import { addBoard, updateBoard, fetchBoards, fetchBoardById } from "../data/boardStore";

const router = useRouter();
const route = useRoute();

const boardId = computed(() => route.params.boardId);
const isEditMode = computed(() => !!boardId.value);

const title = ref("");
const deadline = ref("");
const selectedProblems = ref([]);

onMounted(async () => {
    if (isEditMode.value) {
        try {
            // 보드 ID를 이용해 Store에서 기존 데이터를 가져옵니다.
            const existingBoard = await fetchBoardById(boardId.value);
            
            // 폼 필드 초기화
            title.value = existingBoard.title;
            deadline.value = existingBoard.deadline || ""; // null 방지
            
            // 문제 목록 초기화 (문제 상세 데이터 구조가 필요합니다.)
            // Mock DB에 문제 배열이 있다고 가정해야 합니다. (이 부분은 Mock DB 구조에 따라 다름)
            // 여기서는 임시로 문제를 로드하는 과정만 표시합니다.
            selectedProblems.value = existingBoard.problems || [];
            
        } catch (e) {
            console.error("보드 데이터 로드 실패:", e);
            // 에러 처리: 목록으로 돌아가거나 에러 메시지 표시
        }
    }
});

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

    // API 호출 (실제 백엔드는 payload를 저장)
    const res = await postBoard(payload);
    postResult.value = res;

    //TODO: integrate backend
    addBoard({
      id: res?.id || Date.now(),
      title: payload.title,
      deadline: payload.deadline,
      problems: selectedProblems.value,
      // problemsCount: payload.problems.length,
    });

    const groupId = route.params.groupId || 1;

    await fetchBoards(groupId);
    
    router.push({ name: "BoardList" });
  } catch (e) {
    console.error(e);
    postError.value = "서버 전송 중 오류가 발생했습니다.";
  } finally {
    isPosting.value = false;
  }
}

async function handleUpdate() {
    if (!canPost.value || isPosting.value) return;

    isPosting.value = true;
    postError.value = "";

    try {
        const payload = {
            id: boardId.value, // 수정 모드는 ID가 필수입니다.
            title: title.value.trim(),
            deadline: deadline.value || null,
            problems: selectedProblems.value.map((p, index) => ({
                id: p.id,
                order: index + 1,
            })),
        };

        // 🚨 1. API 호출 (실제 백엔드라면 putBoard 사용)
        // const res = await putBoard(boardId.value, payload); 

        // 🚨 2. Mock DB에 수정 반영 (PUT 역할)
        updateBoard(payload); 

        // 3. 목록 데이터 갱신
        const groupId = route.params.groupId || 1;
        await fetchBoards(groupId);
        
        // 4. 목록 페이지로 이동
        router.push({ name: "BoardList" }); 
        
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
              :selected-problem-ids="selectedProblemIds"
              @add-problem="handleAddProblem"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
