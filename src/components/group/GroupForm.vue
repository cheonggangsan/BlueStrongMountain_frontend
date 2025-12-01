<script setup>
import { ref, computed, onMounted } from "vue";
import { searchMembers, members } from "../../data/memberStore";

const props = defineProps({
  // "create" | "edit"
  mode: {
    type: String,
    default: "create",
  },
  // 수정 모드일 때 초기값
  initialGroup: {
    type: Object,
    default: () => ({
      title: "",
      description: "",
      visibility: "PRIVATE",
      managerIds: [],
      memberIds: [],
    }),
  },
  // 부모에서 API 호출 중일 때 버튼 비활성화용
  submitting: {
    type: Boolean,
    default: false,
  },
  // 부모가 내려주는 API 에러 메시지 (옵션)
  apiError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["submit", "cancel"]);

// ===== 폼 상태 =====
const title = ref("");
const description = ref("");
const visibility = ref("PRIVATE");

// 멤버 검색 상태
const memberSearch = ref("");
const searchLoading = ref(false);
const searchResults = ref([]);

// 선택된 멤버: { id, name, nickname, isManager }
const selectedMembers = ref([]);

// 로컬 에러 (유효성)
const formError = ref("");

// ----- 초기값 세팅 (수정 모드일 때) -----
function syncFromInitialGroup() {
  title.value = props.initialGroup.title || "";
  description.value = props.initialGroup.description || "";
  visibility.value = props.initialGroup.visibility || "PRIVATE";

  // managerIds / memberIds 를 통해 selectedMembers 복원
  const managerSet = new Set(props.initialGroup.managerIds || []);
  const memberSet = new Set([
    ...(props.initialGroup.memberIds || []),
    ...managerSet,
  ]);

  // memberStore 안에 있는 멤버 목록에서 찾아서 isManager 플래그 세팅
  selectedMembers.value = members.value
    .filter((m) => memberSet.has(m.id))
    .map((m) => ({
      ...m,
      isManager: managerSet.has(m.id),
    }));
}

onMounted(() => {
  syncFromInitialGroup();
});

// ----- 멤버 검색 -----
async function handleSearchMembers() {
  searchLoading.value = true;
  formError.value = "";

  try {
    const results = await searchMembers(memberSearch.value);
    searchResults.value = results;
  } catch (e) {
    console.error(e);
    formError.value = "멤버 검색 중 오류가 발생했습니다.";
  } finally {
    searchLoading.value = false;
  }
}

function isSelected(userId) {
  return selectedMembers.value.some((m) => m.id === userId);
}

function toggleMember(user) {
  const idx = selectedMembers.value.findIndex((m) => m.id === user.id);
  if (idx !== -1) {
    selectedMembers.value.splice(idx, 1);
  } else {
    selectedMembers.value.push({ ...user, isManager: false });
  }
}

function toggleManager(userId) {
  const idx = selectedMembers.value.findIndex((m) => m.id === userId);
  if (idx === -1) return;
  selectedMembers.value[idx].isManager = !selectedMembers.value[idx].isManager;
}

// 선택된 ID들
const managerIds = computed(() =>
  selectedMembers.value.filter((m) => m.isManager).map((m) => m.id),
);
const memberIds = computed(() => selectedMembers.value.map((m) => m.id));

const canSubmit = computed(() => {
  return (
    title.value.trim().length > 0 &&
    memberIds.value.length > 0 &&
    managerIds.value.length > 0 && // 최소 1명은 관리자여야 함
    !props.submitting
  );
});

// ----- submit / cancel -----
async function handleSubmit() {
  if (!canSubmit.value) {
    formError.value = "그룹 이름과 멤버/관리자를 설정했는지 확인해주세요.";
    return;
  }

  formError.value = "";

  const payload = {
    title: title.value.trim(),
    description: description.value.trim(),
    visibility: visibility.value || "PRIVATE",
    managerIds: managerIds.value,
    memberIds: memberIds.value,
  };

  // ⚠️ 여기서는 실제 API를 호출하지 않고,
  //    부모(페이지 컴포넌트)에 payload만 전달한다.
  emit("submit", payload);
}

function handleCancel() {
  emit("cancel");
}
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-xl font-bold mb-4">
      {{ props.mode === "create" ? "스터디 그룹 생성" : "스터디 그룹 수정" }}
    </h1>

    <div class="space-y-5 border rounded-2xl bg-white shadow-sm p-5 sm:p-6">
      <!-- 기본 정보 -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          그룹 이름
        </label>
        <input
          v-model="title"
          type="text"
          placeholder="예) 청강산 1기 알고리즘 캠프"
          class="w-full rounded-lg border-gray-300 text-sm focus:border-yellow-400 focus:ring-yellow-400"
        />

        <label class="block text-sm font-medium text-gray-700 mt-3">
          설명
        </label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="그룹 목적이나 진행 방식을 간단히 적어주세요."
          class="w-full rounded-lg border-gray-300 text-sm focus:border-yellow-400 focus:ring-yellow-400"
        />
      </div>

      <!-- 공개 범위 -->
      <div class="space-y-2">
        <p class="text-sm font-medium text-gray-700">공개 범위</p>
        <div class="flex gap-3">
          <label
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer"
            :class="
              visibility === 'PRIVATE'
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-300 bg-white'
            "
          >
            <input
              v-model="visibility"
              type="radio"
              value="PRIVATE"
            />
            <span class="text-xs"> 비공개 (초대된 멤버만 입장 가능) </span>
          </label>
          <!-- TODO: Apply public mode when extending
          <label
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer"
            :class="
              visibility === 'PUBLIC'
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-300 bg-white'
            "
          >
            <input
              v-model="visibility"
              type="radio"
              value="PUBLIC"
            />
            <span class="text-xs"> 공개 (링크를 아는 사람은 신청 가능) </span>
          </label>
          -->
        </div>
      </div>

      <!-- 멤버 검색 & 선택 -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-gray-700">멤버 추가</p>

        <!-- 검색 바 -->
        <div class="flex gap-2">
          <input
            v-model="memberSearch"
            type="text"
            placeholder="이름 또는 닉네임으로 검색"
            class="flex-1 rounded-lg border-gray-300 text-sm focus:border-yellow-400 focus:ring-yellow-400"
            @keyup.enter="handleSearchMembers"
          />
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-semibold border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
            @click="handleSearchMembers"
          >
            검색
          </button>
        </div>

        <!-- 검색 결과 + 선택된 멤버 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 검색 결과 -->
          <div class="border rounded-xl p-3 bg-gray-50/60 min-h-[160px]">
            <p class="text-xs font-medium text-gray-600 mb-2">검색 결과</p>
            <div
              v-if="searchLoading"
              class="text-xs text-gray-500"
            >
              검색 중...
            </div>
            <div
              v-else-if="searchResults.length === 0"
              class="text-xs text-gray-400"
            >
              검색 결과가 여기 표시됩니다.
            </div>
            <ul
              v-else
              class="space-y-1 max-h-52 overflow-y-auto"
            >
              <li
                v-for="user in searchResults"
                :key="user.id"
                class="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-yellow-50"
                @click="toggleMember(user)"
              >
                <div>
                  <div class="font-medium text-gray-800">
                    {{ user.name }}
                  </div>
                  <div class="text-[11px] text-gray-500">
                    @{{ user.nickname }}
                  </div>
                </div>
                <span
                  class="px-2 py-[2px] rounded-full text-[11px] font-semibold"
                  :class="
                    isSelected(user.id)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  "
                >
                  {{ isSelected(user.id) ? "선택됨" : "추가" }}
                </span>
              </li>
            </ul>
          </div>

          <!-- 선택된 멤버 -->
          <div class="border rounded-xl p-3 bg-gray-50/60 min-h-[160px]">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-gray-600">
                선택된 멤버 ({{ selectedMembers.length }}명)
              </p>
            </div>

            <div
              v-if="selectedMembers.length === 0"
              class="text-xs text-gray-400"
            >
              오른쪽에서 멤버를 선택하면 여기에 표시됩니다.
            </div>

            <ul
              v-else
              class="space-y-1 max-h-52 overflow-y-auto"
            >
              <li
                v-for="m in selectedMembers"
                :key="m.id"
                class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white"
              >
                <div>
                  <div class="text-xs font-medium text-gray-800">
                    {{ m.name }}
                  </div>
                  <div class="text-[11px] text-gray-500">@{{ m.nickname }}</div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="px-2 py-[2px] rounded-full border text-[11px]"
                    :class="
                      m.isManager
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                        : 'border-gray-300 bg-white text-gray-500'
                    "
                    @click="toggleManager(m.id)"
                  >
                    {{ m.isManager ? "관리자" : "관리자로 지정" }}
                  </button>
                  <button
                    type="button"
                    class="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-[11px] text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                    @click="toggleMember(m)"
                  >
                    ✕
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <p class="text-[11px] text-gray-400 mt-1">
          최소 1명 이상을 <span class="font-semibold">관리자</span>로 지정해야
          그룹을 만들 수 있어요.
        </p>
      </div>

      <!-- 에러 메시지 -->
      <p
        v-if="formError || props.apiError"
        class="text-xs text-red-500"
      >
        {{ formError || props.apiError }}
      </p>

      <!-- 버튼 영역 -->
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
          @click="handleCancel"
        >
          취소
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-xs font-semibold border border-yellow-500 text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{
            props.submitting
              ? props.mode === "create"
                ? "생성 중..."
                : "저장 중..."
              : props.mode === "create"
                ? "스터디 그룹 생성"
                : "변경 사항 저장"
          }}
        </button>
      </div>
    </div>
  </div>
</template>
