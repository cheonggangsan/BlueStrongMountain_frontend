<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { groups, fetchGroups, leaveGroup } from "../../data/groupStore";
import { useAuthStore } from "../../data/authStore";

const router = useRouter();
const authStore = useAuthStore();

const leavingGroupId = ref(null);

const actionMenuGroupId = ref(null);
const menuPlacement = ref("bottom"); // "bottom" | "top"
const menuRef = ref(null);

function getMenuEl() {
  const v = menuRef.value;
  return Array.isArray(v) ? v[0] : v; // v-for ref 대응
}

async function toggleActionMenu(groupId, e) {
  if (actionMenuGroupId.value === groupId) {
    closeActionMenu();
    return;
  }

  actionMenuGroupId.value = groupId;

  await nextTick();
  computeMenuPlacement(e);
}

function computeMenuPlacement(e) {
  const menuEl = getMenuEl();
  const anchorEl = e?.currentTarget;
  if (!menuEl || !anchorEl) return;

  const a = anchorEl.getBoundingClientRect();
  const m = menuEl.getBoundingClientRect();
  const padding = 12;

  const spaceBelow = window.innerHeight - a.bottom;
  const spaceAbove = a.top;

  // 아래가 부족하면 위로 열기
  menuPlacement.value =
    spaceBelow < m.height + padding && spaceAbove > spaceBelow
      ? "top"
      : "bottom";
}

function closeActionMenu() {
  actionMenuGroupId.value = null;
}

function handleResize() {
  if (actionMenuGroupId.value) closeActionMenu();
}

function handleEditClick(groupId) {
  closeActionMenu();
  goEditGroup(groupId);
}

function handleLeaveClick(groupId) {
  closeActionMenu();
  handleLeaveGroup(groupId);
}

onMounted(async () => {
  document.addEventListener("click", closeActionMenu);
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", closeActionMenu, true);

  const uid = currentUserId.value;
  if (!uid) {
    console.warn(
      "[GroupList] currentUserId가 없어 그룹 목록을 불러오지 않습니다.",
    );
    window.alert("로그인이 필요합니다.");
    return;
  }
  await fetchGroups({ requesterId: uid });
});

onUnmounted(() => {
  document.removeEventListener("click", closeActionMenu);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("scroll", closeActionMenu, true);
});

const searchQuery = ref("");

const currentUserId = computed(() => authStore.user.value?.id ?? null);

function isOwner(group) {
  if (!group) return false;
  if (group.groupRole) return group.groupRole === "OWNER";

  const uid = currentUserId.value;
  if (!uid) return false;

  return Number(group.ownerId) === Number(uid);
}

function isManager(group) {
  if (!group) return false;

  if (group.groupRole) return group.groupRole === "MANAGER";

  const uid = currentUserId.value;
  if (!uid) return false;
  const mids = Array.isArray(group.managerIds)
    ? group.managerIds.map(Number)
    : [];

  if (isOwner(group)) return false;
  return mids.includes(Number(uid));
}

function canEditGroup(group) {
  return isOwner(group);
}

function goGroup(groupId) {
  router.push({
    name: "BoardList",
    params: { groupId },
  });
}

function goCreateGroup() {
  router.push({ name: "GroupCreate" });
}

function goEditGroup(groupId) {
  router.push({
    name: "GroupEdit",
    params: { groupId },
  });
}

async function handleLeaveGroup(groupId) {
  const target = groups.value.find((g) => g.id === groupId);
  const name = target?.name ?? "이 그룹";
  const uid = currentUserId.value;

  if (!uid) {
    window.alert("로그인 정보가 없어 그룹을 탈퇴할 수 없습니다.");
    return;
  }

  if (isOwner(target)) {
    window.alert(
      "이 그룹의 소유자는 바로 탈퇴할 수 없습니다.\n" +
        "그룹 수정 > 소유자 변경에서 소유권을 다른 멤버에게 넘긴 뒤 탈퇴해 주세요.",
    );
    return;
  }

  const ok = window.confirm(
    `정말 '${name}' 그룹에서 탈퇴하시겠습니까?\n` +
      "탈퇴해도 기존에 풀었던 문제 기록은 유지되지만, 이 그룹의 보드에는 더 이상 접근할 수 없습니다.",
  );
  if (!ok) return;

  try {
    leavingGroupId.value = groupId;
    await leaveGroup(groupId, { requesterId: uid });
  } catch (e) {
    console.error(e);
    alert("그룹 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    leavingGroupId.value = null;
  }
}

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const uid = currentUserId.value;

  let list = [...groups.value];

  if (!uid) {
    list = [];
  }

  if (q) {
    list = list.filter((g) => {
      const name = g.name?.toLowerCase() ?? "";
      const desc = g.description?.toLowerCase() ?? "";
      return name.includes(q) || desc.includes(q);
    });
  }

  // 정렬: updatedAt 내림차순 → 없으면 id 내림차순
  return [...list].sort((a, b) => {
    const aTime = a.updatedAt || 0;
    const bTime = b.updatedAt || 0;

    if (aTime && bTime) {
      // ISO 문자열이면 문자열 비교로도 시간 순서가 유지된다.
      return String(bTime).localeCompare(String(aTime));
    }

    if (aTime) return -1;
    if (bTime) return 1;

    // 둘 다 updatedAt 없으면 id 기준으로 가장 최근 생성(큰 숫자) 우선
    return (b.id || 0) - (a.id || 0);
  });
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-50/60 to-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <!-- 상단 헤더 -->
      <div class="mb-6 sm:mb-8">
        <div
          class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-100 text-[11px] font-semibold text-yellow-700 mb-2"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          내 스터디 그룹
        </div>

        <div class="flex items-end justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
              스터디 그룹 선택
            </h1>
            <p class="mt-1 text-xs sm:text-sm text-gray-500">
              들어가고 싶은 그룹을 선택하면, 해당 그룹 안의
              <span class="font-semibold text-yellow-700">문제 보드</span>들이
              열립니다.
            </p>
          </div>
          <button
            type="button"
            class="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 shrink-0 transition-colors"
            @click="goCreateGroup"
          >
            + 스터디 그룹 생성
          </button>
        </div>
      </div>

      <!-- 그룹 검색 바 -->
      <div class="mb-4 flex items-center gap-2">
        <div class="relative flex-1">
          <span
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="그룹 이름 또는 설명으로 검색..."
            class="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
          />
        </div>
        <span
          v-if="searchQuery"
          class="hidden sm:inline-flex text-[11px] text-gray-400"
        >
          "{{ searchQuery }}" 검색 결과
          <span class="font-semibold text-gray-600 ml-1">
            {{ filteredGroups.length }}개
          </span>
        </span>
      </div>

      <!-- 그룹 리스트 -->
      <ul class="grid gap-3 sm:gap-4 md:grid-cols-2">
        <li
          v-for="group in filteredGroups"
          :key="group.id"
          :class="[
            'group relative overflow-visible transition-all hover:-translate-y-0.5',
            actionMenuGroupId === group.id ? 'z-50' : 'z-0',
          ]"
          role="button"
          tabindex="0"
          @click="goGroup(group.id)"
          @keydown.enter="goGroup(group.id)"
          @keydown.space.prevent="goGroup(group.id)"
        >
          <!-- ✅ 카드 본문: 여기만 클리핑 -->
          <div
            class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-all group-hover:border-yellow-300 group-hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-2"
          >
            <!-- 상단 색띠 -->
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            <div class="flex items-start gap-3 pr-12">
              <!-- 이니셜 뱃지 -->
              <div
                class="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm font-semibold text-yellow-700"
              >
                {{ group.name?.charAt(0) || "G" }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h2
                    class="flex-1 truncate text-sm sm:text-base font-semibold text-gray-900"
                  >
                    {{ group.name }}
                  </h2>

                  <!-- (선택) 카드 클릭 유도 chevron -->
                  <svg
                    class="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-yellow-500 transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 18l6-6-6-6"
                    />
                  </svg>
                </div>

                <p
                  class="mt-1 line-clamp-2 text-[11px] sm:text-xs text-gray-500"
                >
                  {{ group.description }}
                </p>

                <p
                  v-if="group.updatedAt"
                  class="mt-1 text-[10px] text-gray-400"
                >
                  최근 업데이트: {{ group.updatedAt }}
                </p>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between text-[11px]">
              <div class="flex items-center gap-2 text-gray-400">
                <span
                  class="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-100"
                >
                  👥 멤버 {{ group.memberCount }}명
                </span>

                <span
                  v-if="isOwner(group)"
                  class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 border border-yellow-200"
                >
                  ⭐ 내 소유 그룹
                </span>

                <span
                  v-else-if="isManager(group)"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100"
                >
                  🛠 매니저
                </span>
              </div>
            </div>
          </div>

          <!-- ✅ 더보기 액션: 클리핑 밖(안 잘림) -->
          <div
            class="absolute right-3 top-3 z-50"
            @click.stop
          >
            <button
              type="button"
              class="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="그룹 액션 메뉴"
              aria-haspopup="menu"
              :aria-expanded="actionMenuGroupId === group.id"
              @click.stop="toggleActionMenu(group.id, $event)"
              @keydown.esc.stop="closeActionMenu"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 7a2 2 0 1 0-0.001-4.001A2 2 0 0 0 12 7Zm0 7a2 2 0 1 0-0.001-4.001A2 2 0 0 0 12 14Zm0 7a2 2 0 1 0-0.001-4.001A2 2 0 0 0 12 21Z"
                />
              </svg>
            </button>

            <div
              v-if="actionMenuGroupId === group.id"
              ref="menuRef"
              :class="[
                'absolute right-0 z-50 w-44 max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
                menuPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              ]"
              role="menu"
              @click.stop
              @keydown.esc.stop="closeActionMenu"
            >
              <button
                v-if="canEditGroup(group)"
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                role="menuitem"
                @click.stop="handleEditClick(group.id)"
              >
                ✏️ 수정
              </button>

              <div
                v-if="canEditGroup(group)"
                class="h-px bg-gray-100"
              />

              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                role="menuitem"
                :disabled="leavingGroupId === group.id || isOwner(group)"
                :title="
                  isOwner(group)
                    ? '소유자는 바로 탈퇴할 수 없습니다. 소유자 변경 후 탈퇴하세요.'
                    : ''
                "
                @click.stop="handleLeaveClick(group.id)"
              >
                <span v-if="leavingGroupId === group.id">⏳ 탈퇴 중...</span>
                <span v-else-if="isOwner(group)">🚫 탈퇴 불가</span>
                <span v-else>🚪 그룹 탈퇴</span>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
