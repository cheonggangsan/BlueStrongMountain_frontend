<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { groups, fetchGroups, leaveGroup } from "../../data/groupStore";

const router = useRouter();

const leavingGroupId = ref(null);

onMounted(async () => {
  await fetchGroups();
});

function goGroup(groupId) {
  router.push({
    name: "BoardList",
    params: { groupId },
  });
}

function goCreateGroup() {
  router.push({ name: "GroupCreate" });
}

async function handleLeaveGroup(groupId) {
  const target = groups.value.find((g) => g.id === groupId);
  const name = target?.name ?? "이 그룹";

  const ok = window.confirm(
    `정말 '${name}' 그룹에서 탈퇴하시겠습니까?\n` +
      "탈퇴해도 기존에 풀었던 문제 기록은 유지되지만, 이 그룹의 보드에는 더 이상 접근할 수 없습니다.",
  );
  if (!ok) return;

  try {
    leavingGroupId.value = groupId;
    await leaveGroup(groupId); // 실제로는 백엔드 API 호출 자리
  } catch (e) {
    console.error(e);
    alert("그룹 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    leavingGroupId.value = null;
  }
}
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

      <!-- 그룹 리스트 -->
      <ul class="grid gap-3 sm:gap-4 md:grid-cols-2">
        <li
          v-for="group in groups"
          :key="group.id"
          class="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md"
        >
          <!-- 상단 색띠 -->
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity"
          />

          <div class="flex items-start gap-3">
            <!-- 이니셜 뱃지 -->
            <div
              class="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-sm font-semibold text-yellow-700"
            >
              {{ group.name?.charAt(0) || "G" }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h2
                  class="truncate text-sm sm:text-base font-semibold text-gray-900"
                >
                  {{ group.name }}
                </h2>
              </div>

              <p class="mt-1 line-clamp-2 text-[11px] sm:text-xs text-gray-500">
                {{ group.description }}
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
            </div>

            <div class="flex items-center gap-1">
              <!-- 그룹 입장 -->
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                @click="goGroup(group.id)"
              >
                그룹 들어가기
              </button>

              <!-- 그룹 탈퇴 -->
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-400 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="leavingGroupId === group.id"
                @click="handleLeaveGroup(group.id)"
              >
                {{ leavingGroupId === group.id ? "탈퇴 중..." : "그룹 탈퇴" }}
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
