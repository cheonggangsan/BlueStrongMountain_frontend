<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../data/authStore";
import { fetchBoardById } from "../data/boardStore";
import { fetchGroupById } from "../data/groupStore";
import { members } from "@/data/memberStore";
import { getBoardUserStatus } from "@/data/boardStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const board = ref(null);
const group = ref(null);
const status = ref(null); // { problemStatus: [], userStatus: [] }

const loading = ref(true);
const error = ref("");

const viewMode = ref("problem"); // "problem" | "user"
const focusOnMe = ref(false); // 내 현황만 보기

const currentUserId = computed(() => authStore.user.value?.id ?? null);

// ===== 공통 유틸 =====
function toNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// 그룹 참여자 목록 (owner + managers + members)
const participants = computed(() => {
  const list = (status.value?.userStatus || [])
    .map((u) => {
      const id = toNumber(u.userId);
      if (id == null) return null;

      const username = u.username ?? ""; // swager
      return {
        id,
        name: username || `user-${id}`,
        nickname: username,
      };
    })
    .filter(Boolean);

  // userStatus가 비어있을 때만 group+memberStore 방식으로 fallback
  if (list.length) return list;

  if (!group.value) return [];
  const idSet = new Set();
  if (group.value.ownerId != null) idSet.add(toNumber(group.value.ownerId));
  (group.value.managerIds || []).forEach((id) => idSet.add(toNumber(id)));
  (group.value.memberIds || []).forEach((id) => idSet.add(toNumber(id)));

  return members.value.filter((m) => idSet.has(toNumber(m.id)));
});

// focusOnMe 토글을 적용한 사용자 목록
const displayUsers = computed(() => {
  if (!participants.value.length) return [];
  if (focusOnMe.value && currentUserId.value) {
    const uid = toNumber(currentUserId.value);
    return participants.value.filter((u) => toNumber(u.id) === uid);
  }
  return participants.value;
});

// 보드의 문제 목록
const boardProblems = computed(() =>
  (board.value?.problems || []).filter(
    (p) => p && p.id !== undefined && p.id !== null,
  ),
);

// 문제 ID -> solvedUsers(Set) 매핑
const problemSolvedMap = computed(() => {
  const map = new Map();
  if (!status.value?.problemStatus) return map;

  status.value.problemStatus.forEach((p) => {
    const ids = p.solvedUserIds ?? p.solvedUsers ?? [];
    const set = new Set(ids.map(toNumber));
    map.set(toNumber(p.problemId), set);
  });

  return map;
});

// userId -> solvedProblems(Set) 매핑
const userSolvedMap = computed(() => {
  const map = new Map();
  if (!status.value?.userStatus) return map;

  status.value.userStatus.forEach((u) => {
    const ids = u.solvedProblemIds ?? u.solvedProblems ?? [];
    const set = new Set(ids.map(toNumber));
    map.set(toNumber(u.userId), set);
  });

  return map;
});

function isSolvedByUser(problemId, userId) {
  const pId = toNumber(problemId);
  const uId = toNumber(userId);
  const solvedSet = problemSolvedMap.value.get(pId);
  return solvedSet ? solvedSet.has(uId) : false;
}

const totalProblems = computed(() => boardProblems.value.length);
const totalParticipants = computed(() => participants.value.length);

// 전체 평균 완료율 (문제 기준)
const avgCompletionRate = computed(() => {
  if (!totalProblems.value || !totalParticipants.value) return 0;

  let solvedCount = 0;
  boardProblems.value.forEach((problem) => {
    if (!problem || problem.id == null) return;
    const pId = toNumber(problem.id);
    if (pId == null) return;

    const set = problemSolvedMap.value.get(pId);
    if (set) solvedCount += set.size;
  });

  const totalSlots = totalProblems.value * totalParticipants.value;
  return totalSlots ? Math.round((solvedCount / totalSlots) * 100) : 0;
});

// 현재 유저의 완료율
const myCompletionRate = computed(() => {
  if (!currentUserId.value || !totalProblems.value) return 0;
  const mySet = userSolvedMap.value.get(toNumber(currentUserId.value));
  if (!mySet) return 0;
  let solved = 0;
  boardProblems.value.forEach((p) => {
    if (mySet.has(toNumber(p.id))) solved += 1;
  });
  return Math.round((solved / totalProblems.value) * 100);
});

// 로딩
onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    const gid = Number(route.params.groupId);
    const bid = Number(route.params.boardId);

    const [g, b, s] = await Promise.all([
      fetchGroupById(gid),
      fetchBoardById(gid, bid),
      getBoardUserStatus({
        groupId: gid,
        boardId: bid,
        requesterId: Number(currentUserId.value),
      }),
    ]);

    group.value = g;
    board.value = b;
    status.value = s;
  } catch (e) {
    console.error(e);
    error.value = "보드 정보를 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <!-- 상단: 헤더 -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            class="mb-2 inline-flex items-center text-[11px] text-gray-400 hover:text-gray-600"
            @click="
              router.push({
                name: 'BoardList',
                params: { groupId: route.params.groupId },
              })
            "
          >
            ← 보드 목록으로
          </button>

          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
            {{ board?.title || "보드 상세" }}
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-gray-500">
            {{ group?.name || "스터디 그룹" }}
          </p>

          <div class="mt-2 flex flex-wrap gap-2 text-[11px] sm:text-xs">
            <span
              class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-800 border border-yellow-200"
            >
              📌 문제 {{ totalProblems }}개
            </span>
            <span
              class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 border border-gray-200"
            >
              👥 참여 {{ totalParticipants }}명
            </span>
            <span
              v-if="board?.deadline"
              class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-800 border border-blue-200"
            >
              ⏰ 마감 {{ board.deadline }}
            </span>
          </div>
        </div>

        <!-- 오른쪽: 요약 배지 -->
        <div class="space-y-2 text-right text-[11px] sm:text-xs">
          <!-- 전체 평균 완료율 -->
          <div
            class="inline-flex w-28 sm:w-32 flex-col items-center rounded-xl bg-white border border-gray-100 shadow-sm px-3 py-2 text-center"
          >
            <span class="text-[10px] text-gray-400">전체 평균 완료율</span>
            <span class="text-lg font-bold text-yellow-600">
              {{ avgCompletionRate }}%
            </span>
          </div>

          <!-- 내 완료율 -->
          <div
            v-if="currentUserId"
            class="inline-flex w-28 sm:w-32 flex-col items-center rounded-xl bg-yellow-400 border border-yellow-300 shadow-sm px-3 py-2 text-center text-gray-900"
          >
            <span class="text-[10px] text-gray-700">내 완료율</span>
            <span class="text-lg font-bold"> {{ myCompletionRate }}% </span>
          </div>
        </div>
      </div>

      <!-- 로딩 / 에러 -->
      <div
        v-if="loading"
        class="py-10 text-center text-sm text-gray-500"
      >
        데이터를 불러오는 중입니다...
      </div>
      <div
        v-else-if="error"
        class="py-10 text-center text-sm text-red-500"
      >
        {{ error }}
      </div>

      <template v-else>
        <!-- 모드 토글 + 내 현황만 보기 -->
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4"
        >
          <div class="inline-flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold"
              :class="
                viewMode === 'problem'
                  ? 'bg-yellow-400 text-white shadow'
                  : 'text-gray-600'
              "
              @click="viewMode = 'problem'"
            >
              문제 기준 보기
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold"
              :class="
                viewMode === 'user'
                  ? 'bg-yellow-400 text-white shadow'
                  : 'text-gray-600'
              "
              @click="viewMode = 'user'"
            >
              사용자 기준 보기
            </button>
          </div>

          <label
            class="inline-flex items-center gap-2 text-[11px] sm:text-xs text-gray-600"
          >
            <input
              v-model="focusOnMe"
              type="checkbox"
              class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
              :disabled="!currentUserId"
            />
            <span>
              내 현황만 보기
              <span
                v-if="!currentUserId"
                class="text-gray-400"
              >
                (로그인 필요)
              </span>
            </span>
          </label>
        </div>

        <!-- 1) 문제 기준 보기: 문제 x 사용자 매트릭스 -->
        <section
          v-if="viewMode === 'problem'"
          class="mt-3"
        >
          <div
            class="mb-2 text-[11px] text-gray-500 flex items-center justify-between"
          >
            <span>
              각 문제별로 누가 풀었는지 한눈에 볼 수 있어요. (체크 ✅ 는 풀이
              완료)
            </span>
          </div>

          <div
            class="overflow-x-auto rounded-xl border border-gray-200 bg-white"
          >
            <table class="min-w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left text-[11px] font-semibold text-gray-700 border-b border-r border-gray-200"
                  >
                    문제
                  </th>
                  <th
                    v-for="user in displayUsers"
                    :key="user.id"
                    class="px-3 py-2 text-[11px] font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
                    :class="
                      currentUserId && Number(user.id) === Number(currentUserId)
                        ? 'bg-yellow-50'
                        : ''
                    "
                  >
                    {{ user.name }}
                    <span class="text-[10px] text-gray-400">
                      (@{{ user.nickname }})
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="problem in boardProblems"
                  :key="problem.id"
                  class="border-t border-gray-100"
                >
                  <!-- 문제 정보 -->
                  <td
                    class="sticky left-0 z-10 bg-white/95 px-3 py-2 text-[11px] border-r border-gray-100"
                  >
                    <div class="font-medium text-gray-900">
                      {{ problem.title || problem.titleKo || `#${problem.id}` }}
                    </div>
                    <div class="text-[10px] text-gray-500">
                      ID: {{ problem.id }}
                    </div>
                    <div class="text-[10px] text-gray-400 mt-0.5">
                      {{
                        (problemSolvedMap.get(problem.id)?.size || 0) +
                        " / " +
                        totalParticipants +
                        " 명 해결"
                      }}
                    </div>
                  </td>

                  <!-- 사용자별 풀이 여부 -->
                  <td
                    v-for="user in displayUsers"
                    :key="user.id"
                    class="px-3 py-2 text-center align-middle"
                    :class="
                      currentUserId && Number(user.id) === Number(currentUserId)
                        ? 'bg-yellow-50/80'
                        : ''
                    "
                  >
                    <span
                      v-if="isSolvedByUser(problem.id, user.id)"
                      class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-[12px] text-green-800 border border-green-200"
                    >
                      ✅
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-[11px] text-gray-400 border border-dashed border-gray-200"
                    >
                      ···
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 2) 사용자 기준 보기: 사용자 카드 + 문제 체크리스트 -->
        <section
          v-else
          class="mt-4"
        >
          <p class="mb-3 text-[11px] text-gray-500">
            각 사용자별로 이번 보드에서 어떤 문제를 풀었는지 확인할 수 있습니다.
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="user in displayUsers"
              :key="user.id"
              class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4"
              :class="
                currentUserId && Number(user.id) === Number(currentUserId)
                  ? 'ring-1 ring-yellow-400'
                  : ''
              "
            >
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="text-sm font-semibold text-gray-900">
                    {{ user.name }}
                  </p>
                  <p class="text-[11px] text-gray-500">@{{ user.nickname }}</p>
                </div>

                <div class="text-right">
                  <p class="text-[10px] text-gray-400 mb-0.5">완료율</p>
                  <p class="text-sm font-bold text-yellow-600">
                    {{
                      (() => {
                        const solvedSet =
                          userSolvedMap.get(toNumber(user.id)) || new Set();
                        const solvedCount = boardProblems.filter((p) =>
                          solvedSet.has(toNumber(p.id)),
                        ).length;
                        return totalProblems
                          ? Math.round((solvedCount / totalProblems) * 100)
                          : 0;
                      })()
                    }}%
                  </p>
                </div>
              </div>

              <div class="space-y-1 max-h-40 overflow-y-auto pr-1">
                <div
                  v-for="problem in boardProblems"
                  :key="problem.id"
                  class="flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px]"
                  :class="
                    isSolvedByUser(problem.id, user.id)
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-gray-50 border border-gray-100'
                  "
                >
                  <div class="min-w-0">
                    <p
                      class="truncate font-medium"
                      :class="
                        isSolvedByUser(problem.id, user.id)
                          ? 'text-gray-900'
                          : 'text-gray-600'
                      "
                    >
                      {{ problem.title || problem.titleKo || `#${problem.id}` }}
                    </p>
                    <p class="text-[10px] text-gray-400">
                      ID: {{ problem.id }}
                    </p>
                  </div>
                  <span
                    v-if="isSolvedByUser(problem.id, user.id)"
                    class="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-[11px] text-green-700 border border-green-200"
                  >
                    ✔
                  </span>
                  <span
                    v-else
                    class="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[11px] text-gray-300 border border-gray-200"
                  >
                    …
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
