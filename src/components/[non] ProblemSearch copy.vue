<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { tags } from "/src/data/tags";
import { difficultyOptions } from "/src/data/difficultyOptions";
import { searchByNumber, searchWithConditions } from "../api/problemApi";

const emit = defineEmits(["add-problem"]);

const props = defineProps({
  selectedProblemIds: {
    type: Array,
    default: () => [],
  },
});

// ===== 검색 상태 =====
const problemNo = ref("");

const mode = ref("general"); // 'general' or 'review'

// 🔹 난이도 범위
const difficultyFrom = ref("ALL");
const difficultyTo = ref("ALL");

// 🔹 난이도 드롭다운 상태
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

// 🔹 등록일 기준 (이 날짜 이전에 등록된 문제만)
const registeredBefore = ref(""); // "2024-11-20" 이런 형식

// 🔹 미해결 문제만 보기 (일반 모드에서만 사용)
const unsolvedOnly = ref(false);

// 🔹 AI 추천 모드
const aiRecommend = ref(false);

const loading = ref(false);
const error = ref("");
const results = ref([]);

// 🔹 조건 접기 / 펼치기
const isFilterCollapsed = ref(false);

// 🔹 필터 값 공통 초기화 함수
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
  error.value = "";
  results.value = [];

  difficultyFromDropdownOpen.value = false;
  difficultyToDropdownOpen.value = false;

  // keepMode=false 이면 모드까지 일반 모드로 리셋
  if (!keepMode) {
    mode.value = "general";
  }
}

// ===== 태그 드롭다운 & 검색 =====
const tagDropdownOpen = ref(false);
const tagDropdownRef = ref(null);
const searchTagText = ref("");

// 태그 필터링
const filteredTags = computed(() => {
  // 1) 검색어 필터 먼저 적용
  const base = (() => {
    if (!searchTagText.value) return tags;
    const searchLower = searchTagText.value.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(searchLower) ||
        tag.value.toLowerCase().includes(searchLower)
    );
  })();

  // 2) 선택된 태그는 맨 위로, 선택 안 된 태그는 아래에 유지
  const selectedOrder = selectedTags.value; // 선택된 태그의 순서

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

  // selectedTags 배열의 순서를 그대로 반영
  selectedPart.sort((a, b) => a.idx - b.idx);

  return [...selectedPart.map((x) => x.tag), ...unselectedPart];
});

// 태그 칩 최대 3개 노출 + 나머지는 +N
const MAX_VISIBLE_TAGS = 3;

const visibleSelectedTags = computed(() =>
  selectedTags.value.slice(0, MAX_VISIBLE_TAGS)
);

const hiddenTagCount = computed(() =>
  Math.max(0, selectedTags.value.length - MAX_VISIBLE_TAGS)
);

// 🔹 필터 요약 (조건이 접혀 있을 때 상단에 표시)
const filterSummary = computed(() => {
  const parts = [];

  // 모드
  if (mode.value === "general") {
    parts.push(unsolvedOnly.value ? "전체 문제" : "미해결만");
  } else {
    parts.push("복습 모드(한 번 이상 푼 문제)");
  }

  // 난이도 범위
  if (difficultyFrom.value !== "ALL" || difficultyTo.value !== "ALL") {
    const fromLabel =
      difficultyOptions.find((o) => o.value === difficultyFrom.value)?.label ??
      "전체";
    const toLabel =
      difficultyOptions.find((o) => o.value === difficultyTo.value)?.label ??
      "전체";
    parts.push(`난이도: ${fromLabel} ~ ${toLabel}`);
  }

  // 최소 해결자 수
  if (minSolved.value) {
    parts.push(`최소 해결자 수: ${minSolved.value}`);
  }

  // 태그
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

// 선택된 태그 조건 만족 여부
function matchesSelectedTags(problem) {
  if (selectedTags.value.length === 0) return true;

  const selectedLower = selectedTags.value.map((t) => t.toLowerCase());
  return problem.tags.some((ptag) =>
    selectedLower.some((st) => ptag.toLowerCase().includes(st))
  );
}

// 배열에서 랜덤으로 최대 count개 추출
function getRandomSubset(arr, count) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// 바깥 클릭하면 태그 / 난이도 드롭다운 닫기
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

// 모드 변경 핸들러
function setMode(newMode) {
  if (mode.value === newMode) return;

  mode.value = newMode;

  // 모드가 바뀔 때마다 조건 초기화 + 조건 접기
  resetFilters(true); // 모드는 유지, 나머지 필터만 초기화
  isFilterCollapsed.value = false;
}

// 조건 접기/펼치기
function toggleFilterCollapsed() {
  isFilterCollapsed.value = !isFilterCollapsed.value;
}

// ===== 검색 실행 =====
async function handleSearch() {
  loading.value = true;
  error.value = "";

  try {
    const hasProblemNo = !!problemNo.value;
    const hasDifficultyRange =
      (difficultyFrom.value && difficultyFrom.value !== "ALL") ||
      (difficultyTo.value && difficultyTo.value !== "ALL");
    const hasTag = selectedTags.value.length > 0;

    const minSolvedNum =
      minSolved.value && !isNaN(Number(minSolved.value))
        ? Number(minSolved.value)
        : undefined;

    const hasMinSolved =
      typeof minSolvedNum === "number" && !Number.isNaN(minSolvedNum);

    // 🔹 날짜 조건 여부
    const hasDate = !!registeredBefore.value;

    // 🔹 필터링: 미해결만 or 모든 문제
    const hasUnsolvedFilter = unsolvedOnly.value;

    // 🔹 AI 추천 필터 여부
    const hasAiRecommend = aiRecommend.value;

    const hasAnyCondition =
      hasProblemNo ||
      hasDifficultyRange ||
      hasTag ||
      hasMinSolved ||
      hasDate ||
      hasUnsolvedFilter ||
      hasAiRecommend;

    let baseResults = [];

    if (!hasAnyCondition) {
      baseResults = await searchWithConditions({
        difficultyFrom: undefined,
        difficultyTo: undefined,
        tag: "",
        minSolved: undefined,
        beforeDate: undefined,
        unsolvedOnly: false,
        aiRecommend: false,
      });
    } else if (hasProblemNo) {
      const candidates = await searchWithConditions({
        difficultyFrom: hasDifficultyRange ? difficultyFrom.value : undefined,
        difficultyTo: hasDifficultyRange ? difficultyTo.value : undefined,
        tag: "",
        minSolved: minSolvedNum,
        beforeDate: hasDate ? registeredBefore.value : undefined,
        unsolvedOnly: unsolvedOnly.value,
        aiRecommend: aiRecommend.value,
      });

      const num = Number(problemNo.value);
      baseResults = Number.isNaN(num)
        ? []
        : candidates.filter((p) => p.id === num);

      if (hasTag) {
        baseResults = baseResults.filter((p) => matchesSelectedTags(p));
      }
    } else {
      baseResults = await searchWithConditions({
        difficultyFrom: hasDifficultyRange ? difficultyFrom.value : undefined,
        difficultyTo: hasDifficultyRange ? difficultyTo.value : undefined,
        tag: "",
        minSolved: minSolvedNum,
        beforeDate: hasDate ? registeredBefore.value : undefined,
        unsolvedOnly: unsolvedOnly.value,
        aiRecommend: aiRecommend.value,
      });

      if (hasTag) {
        baseResults = baseResults.filter((p) => matchesSelectedTags(p));
      }
    }

    // 모드별 필터 + 정렬
    if (mode.value === "review") {
      // 🔹 복습 모드: 한 번 이상 푼 문제만 + 복습 횟수 많은 순
      baseResults = baseResults.filter((p) => (p.reviewCount ?? 0) > 0);
      baseResults.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else {
      // 🔹 일반 모드
      // 기본: 미해결만(복습 횟수 0) 보이게, 토글 켠 경우엔 전체
      if (!unsolvedOnly.value) {
        baseResults = baseResults.filter((p) => (p.reviewCount ?? 0) === 0);
      }

      if (aiRecommend.value) {
        // AI 추천: 서버 순서 그대로
      } else if (randomMode.value) {
        const count = Math.min(5, baseResults.length);
        baseResults = count > 0 ? getRandomSubset(baseResults, count) : [];
      } else {
        // 기본 정렬 (복습 횟수 -> 등록일)
        baseResults.sort((a, b) => {
          const ra = a.reviewCount ?? Number.POSITIVE_INFINITY;
          const rb = b.reviewCount ?? Number.POSITIVE_INFINITY;

          if (ra !== rb) return ra - rb;

          const da = a.registeredAt || "";
          const db = b.registeredAt || "";
          return da.localeCompare(db);
        });
      }
    }

    results.value = baseResults;

    if (results.value.length === 0) {
      error.value = "조건에 맞는 문제가 없습니다. (mock 데이터 기준)";
    }
  } catch (e) {
    console.error(e);
    error.value = "검색 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
    // 검색이 끝나면 조건 영역 자동 접기
    isFilterCollapsed.value = true;
  }
}

// ===== 초기화 =====
function handleReset() {
  resetFilters(false); // 모드까지 일반 모드로 초기화
  isFilterCollapsed.value = false;
}

// 태그 토글 (선택/해제)
function toggleTag(tagValue) {
  const idx = selectedTags.value.indexOf(tagValue);
  if (idx === -1) {
    // 새로 선택된 태그는 맨 앞에 위치시킨다
    selectedTags.value.unshift(tagValue);
  } else {
    // 이미 선택된 태그면 선택 해제
    selectedTags.value.splice(idx, 1);
  }
}

// 칩의 X 버튼으로 태그 제거
function removeTag(tagValue) {
  selectedTags.value = selectedTags.value.filter((v) => v !== tagValue);
}

// ✅ 모든 선택 태그 한 번에 삭제
function clearAllTags() {
  selectedTags.value = [];
}

// 검색 결과 카드 클릭 → 보드에 추가
function onClickProblem(problem) {
  emit("add-problem", problem);
}

// 이미 왼쪽 보드에 올라간 문제는 검색 결과에서 숨기기
const visibleResults = computed(() => {
  if (!props.selectedProblemIds || props.selectedProblemIds.length === 0) {
    return results.value;
  }
  const selectedIdSet = new Set(props.selectedProblemIds);
  return results.value.filter((p) => !selectedIdSet.has(p.id));
});
</script>

<template>
  <div class="search-bar-wrapper space-y-3">
    <!-- ===== 상단 헤더: 모드 + 조건 접기 ===== -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <!-- <span class="text-xs font-medium text-gray-600">
          모드 (일반 / 복습)
        </span> -->
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

      <!-- 조건 접기/펼치기 -->
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50"
        @click="toggleFilterCollapsed"
      >
        {{ isFilterCollapsed ? "조건 펼치기" : "조건 접기" }}
      </button>
    </div>

    <!-- ===== 조건 영역 (접기/펼치기 대상) ===== -->
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
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- 난이도 / 최소 해결자 수 -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-600">
          난이도 / 최소 해결자 수
        </label>
        <div class="flex flex-wrap gap-2 items-center">
          <!-- 🔹 난이도 범위: 커스텀 드롭다운 -->
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
            @keyup.enter="handleSearch"
          />

          <!-- 일반 모드에서만 보이는 '미해결만/모든 문제' 토글 -->
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

      <!-- ===== 태그 선택 ===== -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-600"> 태그 </label>
        <div class="relative" ref="tagDropdownRef">
          <!-- 칩 / placeholder + 전체 해제 버튼 래퍼 -->
          <div
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-xs px-2 py-2 min-h-[40px]"
          >
            <!-- 왼쪽: 칩/placeholder 영역 -->
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

            <!-- 오른쪽 끝: 태그 전체 해제 버튼 -->
            <button
              v-if="selectedTags.length > 0"
              type="button"
              class="shrink-0 px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-500 hover:bg-gray-50"
              @click.stop="clearAllTags"
            >
              태그 전체 해제
            </button>
          </div>

          <!-- 드롭다운 목록 -->
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
                @keyup.enter="handleSearch"
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

      <!-- ===== 하단: 랜덤 / AI / 버튼 ===== -->
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

          <!-- 🔹 AI 추천 토글 -->
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
            @click="handleReset"
          >
            조건 초기화
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-lg text-xs font-semibold border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
            @click="handleSearch"
          >
            검색
          </button>
        </div>
      </div>
    </div>

    <!-- 🔹 조건 요약 (접힘 상태일 때만 노출) -->
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
        <span v-if="error" class="text-red-500">
          {{ error }}
        </span>
        <span v-else-if="loading" class="text-gray-500">검색 중...</span>
        <span v-else class="text-gray-400">
          검색 조건을 선택한 뒤 <b>검색</b> 버튼을 눌러주세요.
        </span>
      </div>
      <div class="text-[11px] text-gray-400">
        결과 {{ visibleResults.length }}개
      </div>
    </div>

    <!-- 결과 리스트 -->
    <div class="search-results mt-1">
      <div
        v-for="problem in visibleResults"
        :key="problem.id"
        class="problem-card"
        @click="onClickProblem(problem)"
      >
        <!-- 1줄: 제목 + 오른쪽(ID, 백준 열기) -->
        <div class="problem-card-header">
          <div class="problem-card-title">
            {{ problem.title }}
          </div>

          <div class="problem-card-actions">
            <span class="problem-card-id"> ID: {{ problem.id }} </span>

            <a
              :href="`https://www.acmicpc.net/problem/${problem.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="problem-card-link"
              @click.stop
            >
              백준 열기 ↗
            </a>
          </div>

          <!-- 2줄: 난이도 / 해결자 수 / 복습 횟수 -->
          <div class="problem-card-meta">
            <span
              class="px-2 py-[2px] rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-semibold"
            >
              {{ problem.difficulty }}
            </span>
            <span class="text-[11px]">
              해결자 수: {{ problem.acceptedUserCount.toLocaleString() }}
            </span>
            <span
              v-if="
                problem.reviewCount !== undefined &&
                problem.reviewCount !== null
              "
              class="text-[11px] text-blue-600"
            >
              복습 횟수: {{ problem.reviewCount }}
            </span>
          </div>
        </div>
      </div>

      <p
        v-if="!loading && !error && visibleResults.length === 0"
        class="text-xs text-gray-400"
      >
        검색 결과가 여기에 표시됩니다.
      </p>
    </div>
  </div>
</template>
