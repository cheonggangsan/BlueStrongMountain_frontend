<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { boards, deleteBoard, fetchBoards } from "../data/boardStore";

const router = useRouter();
const route = useRoute();

const searchQuery = ref(""); // 검색어
const currentTab = ref("active"); // 'active' (진행중) | 'past' (종료)

onMounted(async () => {
  // 라우터 설정이 { path: '/groups/:groupId', ... } 라고 가정
  const groupId = route.params.groupId || 1; // 파라미터가 없으면 임시로 1번 그룹이라고 가정
  await fetchBoards(groupId);
});

// 1. 검색어로 1차 필터링
const searchedBoards = computed(() => {
  if (!searchQuery.value) return boards.value;
  return boards.value.filter((board) =>
    board.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

// 2. 날짜 비교 로직 (오늘 날짜 기준)
const isExpired = (deadline) => {
  if (!deadline) return false; // 마감일 없으면 계속 진행 중
  const today = new Date();
  // 시간을 00:00:00으로 맞춰 날짜만 비교
  today.setHours(0, 0, 0, 0);
  return new Date(deadline) < today;
};

// 3. 진행 중인 보드 (검색 결과 내에서)
const activeBoards = computed(() => {
  return searchedBoards.value.filter((board) => !isExpired(board.deadline));
});

// 4. 종료된 보드 (검색 결과 내에서)
const pastBoards = computed(() => {
  return searchedBoards.value.filter((board) => isExpired(board.deadline));
});

// 현재 탭에 따라 보여줄 리스트 결정
const currentDisplayBoards = computed(() => {
  return currentTab.value === "active" ? activeBoards.value : pastBoards.value;
});

// --- Actions ---

function goCreateBoard() {
  router.push({ name: "BoardCreate" });
}

function goEditBoard(id) {
  // 1. 현재 라우트의 파라미터에서 groupId를 가져옵니다.
  //    (onMounted에서 사용했던 로직과 동일)
  const groupId = route.params.groupId || 1;

  // 2. router.push를 호출할 때 두 개의 파라미터를 모두 전달합니다.
  router.push({
    name: "BoardEdit",
    params: {
      // 🚨 라우터 설정에서 정의한 파라미터 이름(:groupId)과 동일하게 키를 사용합니다.
      groupId: groupId,
      // 🚨 라우터 설정에서 정의한 파라미터 이름(:id)과 동일하게 키를 사용합니다.
      boardId: id,
    },
  });
}

async function handleDelete(id) {
  if (confirm("정말 이 보드를 삭제하시겠습니까?")) {
    // 1. DELETE API 호출 (Mocking)
    deleteBoard(id);

    // 2. GET API 호출 (업데이트된 전체 목록을 다시 가져옴)
    // 🚨 여기서 groupId가 필요합니다. onMounted에서 가져온 groupId를 사용하거나 상태로 저장해야 합니다.
    const groupId = route.params.groupId || 1;
    await fetchBoards(groupId);
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div class="flex flex-col sm:flex-row justify-between gap-3 mb-6">
      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
        >
          <svg
            class="w-4 h-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-yellow-500 focus:border-yellow-500"
          placeholder="보드 제목 검색..."
        />
      </div>

      <button
        type="button"
        class="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 shrink-0 transition-colors"
        @click="goCreateBoard"
      >
        + 보드 만들기
      </button>
    </div>

    <div class="mb-4 border-b border-gray-200">
      <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
        <li class="mr-2">
          <button
            class="inline-block p-4 border-b-2 rounded-t-lg transition-colors"
            :class="
              currentTab === 'active'
                ? 'text-yellow-600 border-yellow-600'
                : 'border-transparent hover:text-gray-600 hover:border-gray-300 text-gray-500'
            "
            @click="currentTab = 'active'"
          >
            진행 중인 보드
            <span
              class="bg-yellow-100 text-yellow-800 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full"
            >
              {{ activeBoards.length }}
            </span>
          </button>
        </li>
        <li class="mr-2">
          <button
            class="inline-block p-4 border-b-2 rounded-t-lg transition-colors"
            :class="
              currentTab === 'past'
                ? 'text-yellow-600 border-yellow-600'
                : 'border-transparent hover:text-gray-600 hover:border-gray-300 text-gray-500'
            "
            @click="currentTab = 'past'"
          >
            지난 보드
            <span
              class="bg-gray-100 text-gray-800 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full"
            >
              {{ pastBoards.length }}
            </span>
          </button>
        </li>
      </ul>
    </div>

    <div
      v-if="currentDisplayBoards.length === 0"
      class="py-10 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300"
    >
      <p v-if="searchQuery">검색 결과가 없습니다.</p>
      <p v-else>
        {{
          currentTab === "active"
            ? "진행 중인 보드가 없습니다."
            : "기간이 지난 보드가 없습니다."
        }}
      </p>
    </div>

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="board in currentDisplayBoards"
        :key="board.id"
        class="group flex justify-between items-start border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex-1 min-w-0 mr-4">
          <div class="font-semibold text-gray-900 truncate text-base">
            {{ board.title }}
          </div>
          <div class="mt-1.5 flex items-center text-xs text-gray-500 space-x-2">
            <span
              class="px-2 py-0.5 rounded"
              :class="
                currentTab === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              "
            >
              {{ currentTab === "active" ? "진행중" : "마감됨" }}
            </span>
            <span>
              마감: {{ board.deadline ? board.deadline : "설정 안 함" }}
            </span>
            <span>·</span>
            <span>문제 {{ board.problemsCount || 0 }}개</span>
          </div>
        </div>

        <div
          class="flex items-center space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            @click.stop="goEditBoard(board.id)"
          >
            수정
          </button>
          <button
            class="px-3 py-1.5 text-xs font-medium text-white bg-red-500 border border-red-500 rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click.stop="handleDelete(board.id)"
          >
            삭제
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
