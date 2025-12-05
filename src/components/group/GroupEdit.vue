<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import GroupForm from "./GroupForm.vue";
import {
  fetchGroupById,
  updateGroup,
  changeGroupOwner,
} from "../../data/groupStore";
import { members } from "../../data/memberStore";
import { useAuthStore } from "../../data/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const groupId = route.params.groupId;

const loading = ref(true);
const submitting = ref(false);
const apiError = ref("");

const group = ref(null);

// GroupForm에 넘겨줄 초기값
const initialGroup = ref({
  title: "",
  description: "",
  visibility: "PRIVATE",
  managerIds: [],
  memberIds: [],
});

const editMode = ref("general");
function setMode(next) {
  editMode.value = next;
}

const ownerCandidateId = ref(null);
const ownerChangeLoading = ref(false);
const ownerChangeError = ref("");
const ownerChangeMessage = ref("");

const currentUserId = computed(() => authStore.user.value?.id ?? null);

const isCurrentUserOwner = computed(() => {
  if (!group.value || !currentUserId.value) return false;
  return group.value.ownerId === currentUserId.value;
});

// 그룹 멤버 목록 (owner 후보들)
const ownerCandidates = computed(() => {
  if (!group.value) return [];
  const idSet = new Set([...(group.value.memberIds || [])]);
  // members는 전체 유저 모음에서 해당 ID만 필터
  return members.value.filter((m) => idSet.has(m.id));
});

const currentOwner = computed(() => {
  if (!group.value) return null;
  return (
    ownerCandidates.value.find((m) => m.id === group.value.ownerId) || null
  );
});

const selectedNewOwner = computed(() => {
  if (!ownerCandidateId.value) return null;
  return (
    ownerCandidates.value.find((m) => m.id === ownerCandidateId.value) || null
  );
});

onMounted(async () => {
  try {
    const g = await fetchGroupById(groupId);
    group.value = g;

    // ⚠️ 기억용 주석:
    // groupStore 안에서는 name/description/visibility/managerIds/memberIds 구조로 들고 있음.
    initialGroup.value = {
      title: g.name,
      description: g.description || "",
      visibility: g.visibility || "PRIVATE",
      managerIds: g.managerIds || [],
      memberIds: g.memberIds || [],
    };

    ownerCandidateId.value = g.ownerId ?? null;
  } catch (e) {
    console.error(e);
    apiError.value = "그룹 정보를 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
});

async function handleSubmit(payload) {
  if (submitting.value) return;

  submitting.value = true;
  apiError.value = "";

  try {
    // 실제로는 PUT /api/v1/groups/{groupId}
    await updateGroup(groupId, payload);

    router.push({ name: "GroupList" });
  } catch (e) {
    console.error(e);
    apiError.value = "스터디 그룹 수정 중 오류가 발생했습니다.";
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.back();
}

async function handleChangeOwner() {
  ownerChangeError.value = "";
  ownerChangeMessage.value = "";

  if (!group.value) {
    ownerChangeError.value = "그룹 정보를 찾을 수 없습니다.";
    return;
  }

  if (!isCurrentUserOwner.value) {
    ownerChangeError.value = "소유자만 소유권을 변경할 수 있습니다.";
    return;
  }

  if (!ownerCandidateId.value) {
    ownerChangeError.value = "새 소유자로 지정할 멤버를 선택해주세요.";
    return;
  }

  if (ownerCandidateId.value === group.value.ownerId) {
    ownerChangeError.value = "이미 이 멤버가 소유자입니다.";
    return;
  }

  ownerChangeLoading.value = true;

  try {
    const requesterId = currentUserId.value;
    if (!requesterId) {
      ownerChangeError.value =
        "로그인 정보가 없어 소유자를 변경할 수 없습니다.";
      return;
    }

    // 실제 백엔드라면:
    // await httpClient.patch(
    //   `/api/v1/groups/${groupId}/owner?requesterId=${requesterId}`,
    //   ownerCandidateId.value
    // );
    const updated = await changeGroupOwner(groupId, {
      requesterId,
      newOwnerId: ownerCandidateId.value,
    });

    group.value = updated;
    ownerChangeMessage.value = "소유자가 변경되었습니다.";
  } catch (e) {
    console.error(e);
    ownerChangeError.value =
      "소유자 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  } finally {
    ownerChangeLoading.value = false;
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">스터디 그룹 수정</h1>

      <!-- ⭐ 모드 토글 -->
      <div class="flex items-center gap-3">
        <div class="inline-flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold"
            :class="
              editMode === 'general'
                ? 'bg-yellow-400 text-white shadow'
                : 'text-gray-500'
            "
            @click="setMode('general')"
          >
            일반 설정
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold"
            :class="
              editMode === 'owner'
                ? 'bg-yellow-400 text-white shadow'
                : 'text-gray-500'
            "
            @click="setMode('owner')"
          >
            소유자 변경
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div
      v-if="loading"
      class="text-sm text-gray-500"
    >
      그룹 정보를 불러오는 중입니다...
    </div>

    <!-- 일반 설정 모드: 기존 GroupForm 재사용 -->
    <GroupForm
      v-else-if="editMode === 'general'"
      mode="edit"
      :initial-group="initialGroup"
      :submitting="submitting"
      :api-error="apiError"
      :show-title="false"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <!-- ⭐ 소유자 변경 모드 -->
    <section
      v-else
      class="space-y-4 border rounded-2xl bg-white shadow-sm p-5 sm:p-6"
    >
      <div class="space-y-1">
        <h2 class="text-sm font-semibold text-gray-800">그룹 소유자 변경</h2>
        <p class="text-xs text-gray-500">
          소유자는 그룹 삭제, 설정 변경 권한을 가지며, 탈퇴 전에 반드시 소유권을
          다른 멤버에게 넘겨야 합니다.
        </p>
      </div>

      <!-- 현재 소유자 / 권한 안내 -->
      <div class="flex items-center justify-between text-xs">
        <div>
          <p class="text-[11px] text-gray-500">현재 소유자</p>
          <p class="mt-0.5 text-sm font-medium text-gray-900">
            <span v-if="currentOwner">
              {{ currentOwner.name }} (@{{ currentOwner.nickname }})
            </span>
            <span
              v-else
              class="text-gray-400"
            >
              정보 없음
            </span>
          </p>
        </div>
        <span
          v-if="isCurrentUserOwner"
          class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-[11px] font-medium text-yellow-800"
        >
          ⭐ 현재 로그인 계정이 소유자입니다.
        </span>
        <span
          v-else
          class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500"
        >
          소유자만 소유자를 변경할 수 있습니다.
        </span>
      </div>

      <!-- 멤버 선택 2컬럼 -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- 왼쪽: 후보 리스트 -->
        <div class="border rounded-xl p-3 bg-gray-50/60 min-h-[180px]">
          <p class="text-xs font-medium text-gray-700 mb-2">
            새 소유자로 지정할 멤버 선택
          </p>
          <p
            v-if="ownerCandidates.length === 0"
            class="text-[11px] text-gray-400"
          >
            이 그룹에 등록된 멤버가 없습니다.
          </p>
          <ul
            v-else
            class="space-y-1 max-h-56 overflow-y-auto text-xs"
          >
            <li
              v-for="m in ownerCandidates"
              :key="m.id"
              class="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-yellow-50"
              :class="
                ownerCandidateId === m.id
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-white border border-transparent'
              "
              @click="ownerCandidateId = m.id"
            >
              <div>
                <p class="font-medium text-gray-800">
                  {{ m.name }}
                </p>
                <p class="text-[11px] text-gray-500">@{{ m.nickname }}</p>
              </div>
              <span
                class="px-2 py-[2px] rounded-full text-[11px] font-semibold"
                :class="
                  ownerCandidateId === m.id
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ ownerCandidateId === m.id ? "선택됨" : "선택" }}
              </span>
            </li>
          </ul>
        </div>

        <!-- 오른쪽: 선택된 새 소유자 정보 -->
        <div class="border rounded-xl p-3 bg-gray-50/60 min-h-[180px]">
          <p class="text-xs font-medium text-gray-700 mb-2">선택된 새 소유자</p>

          <div
            v-if="selectedNewOwner"
            class="flex items-center gap-3 rounded-lg bg-white px-3 py-2 border border-yellow-100"
          >
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full bg-yellow-100 text-xs font-semibold text-yellow-700"
            >
              {{ selectedNewOwner.name.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ selectedNewOwner.name }}
              </p>
              <p class="text-[11px] text-gray-500">
                @{{ selectedNewOwner.nickname }}
              </p>
              <p class="mt-1 text-[11px] text-yellow-700">
                이 멤버에게 그룹 소유권이 이전됩니다.
              </p>
            </div>
          </div>

          <div
            v-else
            class="text-[11px] text-gray-400"
          >
            왼쪽에서 새 소유자로 지정할 멤버를 선택하면 여기에 표시됩니다.
          </div>
        </div>
      </div>

      <!-- 에러 / 메시지 -->
      <p
        v-if="ownerChangeError"
        class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
      >
        {{ ownerChangeError }}
      </p>
      <p
        v-if="ownerChangeMessage"
        class="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
      >
        {{ ownerChangeMessage }}
      </p>

      <!-- 버튼 영역 -->
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
          @click="setMode('general')"
        >
          일반 설정으로 돌아가기
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-xs font-semibold border border-yellow-500 text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="ownerChangeLoading || !isCurrentUserOwner"
          @click="handleChangeOwner"
        >
          {{ ownerChangeLoading ? "변경 중..." : "소유자 변경 확정" }}
        </button>
      </div>
    </section>
  </div>
</template>
