<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { boards, deleteBoard, fetchBoards } from "../data/boardStore";
import { useAuthStore } from "../data/authStore";
import { fetchGroupById } from "../data/groupStore";

const router = useRouter();
const route = useRoute();

const searchQuery = ref(""); // 검색어
const currentTab = ref("active"); // 'active' (진행중) | 'past' (종료)

const authStore = useAuthStore();
const group = ref(null);

onMounted(async () => {
  // 라우터 설정이 { path: '/groups/:groupId', ... } 라고 가정
  const groupId = route.params.groupId;
  const uid = currentUserId.value;

  if (!uid) {
    console.warn(
      "[BoardList] currentUserId가 없어 그룹 정보를 불러오지 않습니다.",
    );
    return;
  }

  group.value = await fetchGroupById(groupId, { requesterId: uid });
  await fetchBoards(groupId);
});

const currentUserId = computed(() => authStore.user.value?.id ?? null);

const canManageBoards = computed(() => {
  if (!group.value || !currentUserId.value) return false;
  const uid = currentUserId.value;
  return (
    group.value.ownerId === uid || (group.value.managerIds || []).includes(uid)
  );
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
  router.push({
    name: "BoardCreate",
    params: { groupId: route.params.groupId },
  });
}

function goEditBoard(id) {
  router.push({
    name: "BoardEdit",
    params: {
      groupId: route.params.groupId,
      boardId: id,
    },
  });
}

function goBoardDetail(id) {
  router.push({
    name: "BoardDetail",
    params: {
      groupId: route.params.groupId,
      boardId: id,
    },
  });
}

function goGroupList() {
  router.push({ name: "GroupList" });
}

async function handleDelete(id) {
  if (!currentUserId.value) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (confirm("정말 이 보드를 삭제하시겠습니까?")) {
    try {
      await deleteBoard({
        groupId: Number(route.params.groupId),
        boardId: id,
        requesterId: currentUserId.value,
      });

      await fetchBoards(Number(route.params.groupId));
    } catch (e) {
      console.error(e);
      alert("보드 삭제 중 오류가 발생했습니다: " + e.message);
    }
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <button
      type="button"
      class="mb-2 inline-flex items-center text-[11px] text-gray-400 hover:text-gray-600"
      @click="goGroupList"
    >
      ← 보드 목록으로
    </button>
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
        v-if="canManageBoards"
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
        class="group flex justify-between items-center border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <button
          type="button"
          class="flex justify-between items-start w-full text-left"
          @click="goBoardDetail(board.id)"
        >
          <div class="flex-1 min-w-0 mr-4">
            <div class="font-semibold text-gray-900 truncate text-base">
              {{ board.title }}
            </div>
            <div
              class="mt-1.5 flex items-center text-xs text-gray-500 space-x-2"
            >
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
        </button>
        <div
          v-if="canManageBoards"
          class="flex flex-row items-center self-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            v-if="!isExpired(board.deadline)"
            class="px-3 py-1.5 text-xs font-medium whitespace-nowrap text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            @click.stop="goEditBoard(board.id)"
          >
            수정
          </button>
          <button
            class="px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white bg-red-500 border border-red-500 rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click.stop="handleDelete(board.id)"
          >
            삭제
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
