<!-- src/component/search/SearchFilters.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { tags } from "/src/data/tags";
import { difficultyOptions } from "/src/data/difficultyOptions";

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
  resultCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["search", "reset"]);

// ===== 검색 상태 (필터 내부 상태) =====
const problemNo = ref("");

const mode = ref("general"); // 'general' or 'review'

// 난이도 범위
const difficultyFrom = ref("ALL");
const difficultyTo = ref("ALL");

// 난이도 드롭다운 상태
const difficultyFromDropdownOpen = ref(false);
const difficultyToDropdownOpen = ref(false);
const difficultyFromDropdownRef = ref(null);
const difficultyToDropdownRef = ref(null);

// 라벨용 computed
const difficultyFromLabel = computed(() => {
  const opt = difficultyOptions.find((o) => o.value === difficultyFrom.value);
  return opt ? opt.label : "전체 난이도";
});
const difficultyToLabel = computed(() => {
  const opt = difficultyOptions.find((o) => o.value === difficultyTo.value);
  return opt ? opt.label : "전체 난이도";
});

const selectedTags = ref([]);
const minSolved = ref("");
const randomMode = ref(false);

// 등록일 기준 (이 날짜 이전에 등록된 문제만)
const registeredBefore = ref("");

// 미해결 문제만 보기 (일반 모드에서만 사용)
const unsolvedOnly = ref(false);

// AI 추천 모드
const aiRecommend = ref(false);

// 조건 접기 / 펼치기
const isFilterCollapsed = ref(false);

// ===== 태그 드롭다운 & 검색 =====
const tagDropdownOpen = ref(false);
const tagDropdownRef = ref(null);
const searchTagText = ref("");

// 태그 필터링
const filteredTags = computed(() => {
  const base = (() => {
    if (!searchTagText.value) return tags;
    const searchLower = searchTagText.value.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(searchLower) ||
        tag.value.toLowerCase().includes(searchLower)
    );
  })();

  const selectedOrder = selectedTags.value;

  const selectedPart = [];
  const unselectedPart = [];

  for (const tag of base) {
    const idx = selectedOrder.indexOf(tag.value);
    if (idx === -1) {
      unselectedPart.push(tag);
    } else {
      selectedPart.push({ tag, idx });
    }
  }

  selectedPart.sort((a, b) => a.idx - b.idx);

  return [...selectedPart.map((x) => x.tag), ...unselectedPart];
});

// 태그 칩 최대 3개 + 나머지 +N
const MAX_VISIBLE_TAGS = 3;
const visibleSelectedTags = computed(() =>
  selectedTags.value.slice(0, MAX_VISIBLE_TAGS)
);
const hiddenTagCount = computed(() =>
  Math.max(0, selectedTags.value.length - MAX_VISIBLE_TAGS)
);

// 필터 요약
const filterSummary = computed(() => {
  const parts = [];

  if (mode.value === "general") {
    parts.push(unsolvedOnly.value ? "전체 문제" : "미해결만");
  } else {
    parts.push("복습 모드(한 번 이상 푼 문제)");
  }

  if (difficultyFrom.value !== "ALL" || difficultyTo.value !== "ALL") {
    const fromLabel =
      difficultyOptions.find((o) => o.value === difficultyFrom.value)?.label ??
      "전체";
    const toLabel =
      difficultyOptions.find((o) => o.value === difficultyTo.value)?.label ??
      "전체";
    parts.push(`난이도: ${fromLabel} ~ ${toLabel}`);
  }

  if (minSolved.value) {
    parts.push(`최소 해결자 수: ${minSolved.value}`);
  }

  if (selectedTags.value.length > 0) {
    const labelList = selectedTags.value
      .map((v) => tags.find((t) => t.value === v)?.label ?? v)
      .slice(0, 3);
    let text = labelList.join(", ");
    const rest = selectedTags.value.length - labelList.length;
    if (rest > 0) text += ` 외 ${rest}개`;
    parts.push(`태그: ${text}`);
  }

  if (aiRecommend.value) parts.push("AI 추천");
  if (randomMode.value) parts.push("랜덤 최대 5개");

  return parts.length ? parts.join(" · ") : "필터 없음 (전체 문제)";
});

// 바깥 클릭 → 드롭다운 닫기
function handleClickOutside(event) {
  if (
    tagDropdownOpen.value &&
    tagDropdownRef.value &&
    !tagDropdownRef.value.contains(event.target)
  ) {
    tagDropdownOpen.value = false;
  }

  if (
    difficultyFromDropdownOpen.value &&
    difficultyFromDropdownRef.value &&
    !difficultyFromDropdownRef.value.contains(event.target)
  ) {
    difficultyFromDropdownOpen.value = false;
  }

  if (
    difficultyToDropdownOpen.value &&
    difficultyToDropdownRef.value &&
    !difficultyToDropdownRef.value.contains(event.target)
  ) {
    difficultyToDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// ===== 내부 유틸 =====
function resetFilters(keepMode = true) {
  problemNo.value = "";
  difficultyFrom.value = "ALL";
  difficultyTo.value = "ALL";
  selectedTags.value = [];
  minSolved.value = "";
  registeredBefore.value = "";
  unsolvedOnly.value = false;
  aiRecommend.value = false;
  randomMode.value = false;
  tagDropdownOpen.value = false;
  searchTagText.value = "";

  difficultyFromDropdownOpen.value = false;
  difficultyToDropdownOpen.value = false;

  if (!keepMode) {
    mode.value = "general";
  }
}

function setMode(newMode) {
  if (mode.value === newMode) return;
  mode.value = newMode;
  resetFilters(true);
  isFilterCollapsed.value = false;
}

function toggleFilterCollapsed() {
  isFilterCollapsed.value = !isFilterCollapsed.value;
}

function toggleTag(tagValue) {
  const idx = selectedTags.value.indexOf(tagValue);
  if (idx === -1) {
    selectedTags.value.unshift(tagValue);
  } else {
    selectedTags.value.splice(idx, 1);
  }
}

function removeTag(tagValue) {
  selectedTags.value = selectedTags.value.filter((v) => v !== tagValue);
}

function clearAllTags() {
  selectedTags.value = [];
}

// 부모에게 넘길 필터 payload
function buildFilterPayload() {
  return {
    mode: mode.value,
    problemNo: problemNo.value,
    difficultyFrom: difficultyFrom.value,
    difficultyTo: difficultyTo.value,
    selectedTags: [...selectedTags.value],
    minSolved: minSolved.value,
    registeredBefore: registeredBefore.value,
    unsolvedOnly: unsolvedOnly.value,
    randomMode: randomMode.value,
    aiRecommend: aiRecommend.value,
  };
}

// 검색 버튼/엔터 → 부모로 search 이벤트
function emitSearch() {
  const payload = buildFilterPayload();
  emit("search", payload);
  // 예전엔 API 끝난 뒤 접었는데, 여기서는 검색 버튼 눌렀을 때 접도록 처리
  isFilterCollapsed.value = true;
}

// 초기화 버튼 → 내부 상태 리셋 + 부모 reset 이벤트
function emitReset() {
  resetFilters(false);
  isFilterCollapsed.value = false;
  emit("reset");
}
</script>

<template>
  <div class="space-y-3">
    <!-- 상단 헤더: 모드 + 조건 접기 -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="inline-flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold"
            :class="
              mode === 'general'
                ? 'bg-yellow-400 text-white shadow'
                : 'text-gray-500'
            "
            @click="setMode('general')"
          >
            일반 모드
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold"
            :class="
              mode === 'review'
                ? 'bg-yellow-400 text-white shadow'
                : 'text-gray-500'
            "
            @click="setMode('review')"
          >
            복습 모드
          </button>
        </div>
      </div>

      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50"
        @click="toggleFilterCollapsed"
      >
        {{ isFilterCollapsed ? "조건 펼치기" : "조건 접기" }}
      </button>
    </div>

    <!-- 조건 영역 -->
    <div
      v-show="!isFilterCollapsed"
      class="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-4"
    >
      <!-- 문제 번호 -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-600">
          문제 번호로 검색
        </label>
        <input
          v-model="problemNo"
          type="number"
          placeholder="예) 1409 (비워두면 번호 조건 없이 검색)"
          class="w-full rounded-lg border-gray-300 text-sm focus:border-yellow-400 focus:ring-yellow-400"
          @keyup.enter="emitSearch"
        />
      </div>

      <!-- 난이도 / 최소 해결자 수 -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-600">
          난이도 / 최소 해결자 수
        </label>
        <div class="flex flex-wrap gap-2 items-center">
          <!-- 난이도 범위 -->
          <div class="flex items-center gap-2">
            <!-- From -->
            <div class="relative" ref="difficultyFromDropdownRef">
              <button
                type="button"
                class="inline-flex items-center justify-between min-w-[110px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                @click="
                  difficultyFromDropdownOpen = !difficultyFromDropdownOpen
                "
              >
                <span>{{ difficultyFromLabel }}</span>
                <span class="ml-2 text-[10px]">▼</span>
              </button>

              <div
                v-if="difficultyFromDropdownOpen"
                class="absolute z-20 mt-1 w-40 max-h-40 overflow-y-auto bg-white border border-yellow-400 rounded-lg shadow-lg text-xs"
              >
                <button
                  v-for="opt in difficultyOptions"
                  :key="'from-' + opt.value"
                  type="button"
                  class="w-full text-left px-3 py-1 hover:bg-yellow-50 flex items-center justify-between"
                  @click="
                    difficultyFrom = opt.value;
                    difficultyFromDropdownOpen = false;
                  "
                >
                  <span>{{ opt.label }}</span>
                  <span
                    v-if="difficultyFrom === opt.value"
                    class="text-yellow-500 text-[11px] font-semibold"
                  >
                    선택됨
                  </span>
                </button>
              </div>
            </div>

            <span class="text-xs text-gray-400">~</span>

            <!-- To -->
            <div class="relative" ref="difficultyToDropdownRef">
              <button
                type="button"
                class="inline-flex items-center justify-between min-w-[110px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                @click="difficultyToDropdownOpen = !difficultyToDropdownOpen"
              >
                <span>{{ difficultyToLabel }}</span>
                <span class="ml-2 text-[10px]">▼</span>
              </button>

              <div
                v-if="difficultyToDropdownOpen"
                class="absolute z-20 mt-1 w-40 max-h-40 overflow-y-auto bg-white border border-yellow-400 rounded-lg shadow-lg text-xs"
              >
                <button
                  v-for="opt in difficultyOptions"
                  :key="'to-' + opt.value"
                  type="button"
                  class="w-full text-left px-3 py-1 hover:bg-yellow-50 flex items-center justify-between"
                  @click="
                    difficultyTo = opt.value;
                    difficultyToDropdownOpen = false;
                  "
                >
                  <span>{{ opt.label }}</span>
                  <span
                    v-if="difficultyTo === opt.value"
                    class="text-yellow-500 text-[11px] font-semibold"
                  >
                    선택됨
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- 최소 해결자 수 -->
          <input
            v-model="minSolved"
            type="number"
            min="0"
            placeholder="최소 해결자 수"
            class="w-32 rounded-lg border-gray-300 text-xs focus:border-yellow-400 focus:ring-yellow-400"
            @keyup.enter="emitSearch"
          />

          <!-- 일반 모드에서만: 미해결만/모든 문제 -->
          <button
            v-if="mode === 'general'"
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50 ml-auto"
            :class="
              unsolvedOnly
                ? 'border-red-400 text-red-600'
                : 'border-gray-300 text-gray-500'
            "
            @click="unsolvedOnly = !unsolvedOnly"
          >
            <span class="relative inline-flex items-center">
              <span
                class="w-7 h-4 rounded-full transition-colors"
                :class="unsolvedOnly ? 'bg-red-300' : 'bg-gray-300'"
              ></span>
              <span
                class="absolute w-3 h-3 rounded-full bg-white shadow transform transition-transform"
                :class="unsolvedOnly ? 'translate-x-3' : 'translate-x-0'"
              ></span>
            </span>
            <span>{{ unsolvedOnly ? "모든 문제" : "미해결만" }}</span>
          </button>
        </div>
      </div>

      <!-- 태그 선택 -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-600"> 태그 </label>
        <div class="relative" ref="tagDropdownRef">
          <div
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-xs px-2 py-2 min-h-[40px]"
          >
            <div
              class="flex flex-wrap items-center gap-1 flex-1 cursor-pointer focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400"
              @click="tagDropdownOpen = !tagDropdownOpen"
              tabindex="0"
            >
              <span
                v-if="selectedTags.length === 0"
                class="text-gray-400 select-none"
              >
                태그 선택 (여러 개 선택 가능)
              </span>

              <span
                v-for="tagValue in visibleSelectedTags"
                :key="tagValue"
                class="flex items-center gap-1 px-2 py-[2px] rounded-full bg-yellow-100 text-yellow-700"
              >
                {{ tags.find((t) => t.value === tagValue)?.label ?? tagValue }}
                <button
                  type="button"
                  class="text-[10px] leading-none ml-1 hover:text-red-500"
                  @click.stop="removeTag(tagValue)"
                >
                  ✕
                </button>
              </span>

              <span
                v-if="hiddenTagCount > 0"
                class="px-2 py-[2px] rounded-full bg-gray-100 text-gray-500"
              >
                +{{ hiddenTagCount }}
              </span>
            </div>

            <button
              v-if="selectedTags.length > 0"
              type="button"
              class="shrink-0 px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50"
              @click.stop="clearAllTags"
            >
              태그 전체 해제
            </button>
          </div>

          <div
            v-if="tagDropdownOpen"
            class="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-yellow-400 rounded-lg shadow-lg text-xs"
          >
            <div
              class="p-1 sticky top-0 bg-white border-b border-yellow-100 flex items-center gap-2"
            >
              <input
                v-model="searchTagText"
                type="text"
                placeholder="태그 검색 (예: DP, Greedy)"
                class="flex-1 rounded-md border-gray-300 text-xs focus:border-yellow-400 focus:ring-yellow-400"
                @keyup.enter="emitSearch"
              />
            </div>

            <button
              v-for="tagOption in filteredTags"
              :key="tagOption.value"
              type="button"
              class="w-full text-left px-3 py-1 hover:bg-yellow-50 flex items-center justify-between"
              @click="toggleTag(tagOption.value)"
            >
              <span>{{ tagOption.label }}</span>
              <span
                v-if="selectedTags.includes(tagOption.value)"
                class="text-yellow-500 text-[11px] font-semibold"
              >
                선택됨
              </span>
            </button>

            <p
              v-if="filteredTags.length === 0"
              class="p-3 text-center text-gray-500"
            >
              검색된 태그가 없습니다.
            </p>
          </div>
        </div>
      </div>

      <!-- 하단: 랜덤 / AI / 버튼 -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200"
      >
        <div class="flex gap-2">
          <!-- 랜덤 5개 토글 -->
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50"
            :class="
              randomMode
                ? 'border-yellow-400 text-yellow-700'
                : 'border-gray-300 text-gray-500'
            "
            @click="randomMode = !randomMode"
          >
            <span class="relative inline-flex items-center">
              <span
                class="w-7 h-4 rounded-full transition-colors"
                :class="randomMode ? 'bg-yellow-300' : 'bg-gray-300'"
              ></span>
              <span
                class="absolute w-3 h-3 rounded-full bg-white shadow transform transition-transform"
                :class="randomMode ? 'translate-x-3' : 'translate-x-0'"
              ></span>
            </span>
            <span>조건에 맞는 문제 중 랜덤 최대 5개</span>
          </button>

          <!-- AI 추천 토글 -->
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50"
            :class="
              aiRecommend
                ? 'border-indigo-400 text-indigo-600'
                : 'border-gray-300 text-gray-500'
            "
            @click="
              aiRecommend = !aiRecommend;
              if (aiRecommend) {
                randomMode = false;
              }
            "
          >
            <span class="relative inline-flex items-center">
              <span
                class="w-7 h-4 rounded-full transition-colors"
                :class="aiRecommend ? 'bg-indigo-300' : 'bg-gray-300'"
              ></span>
              <span
                class="absolute w-3 h-3 rounded-full bg-white shadow transform transition-transform"
                :class="aiRecommend ? 'translate-x-3' : 'translate-x-0'"
              ></span>
            </span>
            <span>AI 추천</span>
          </button>
        </div>

        <!-- 검색 / 초기화 -->
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
            @click="emitReset"
          >
            조건 초기화
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-semibold border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
            @click="emitSearch"
          >
            검색
          </button>
        </div>
      </div>
    </div>

    <!-- 조건 요약 (접힘 상태일 때만 노출) -->
    <div
      v-if="isFilterCollapsed"
      class="mb-3 text-[11px] text-gray-500 bg-gray-50 rounded-md px-3 py-2 truncate"
    >
      {{ filterSummary }}
    </div>

    <!-- 상태 메시지 + 결과 헤더 -->
    <div
      class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between"
    >
      <div class="text-xs h-5 flex items-center">
        <span v-if="props.error" class="text-red-500">
          {{ props.error }}
        </span>
        <span v-else-if="props.loading" class="text-gray-500">
          검색 중...
        </span>
        <span v-else class="text-gray-400">
          검색 조건을 선택한 뒤 <b>검색</b> 버튼을 눌러주세요.
        </span>
      </div>
      <div class="text-[11px] text-gray-400">
        결과 {{ props.resultCount }}개
      </div>
    </div>
  </div>
</template>
