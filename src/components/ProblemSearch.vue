<script setup>
import { ref, computed } from "vue";
import SearchFilters from "./search/SearchFilters.vue";
import { problemService } from "@/services/problemService";

const emit = defineEmits(["add-problem"]);

const props = defineProps({
  selectedProblemIds: {
    type: Array,
    default: () => [],
  },
});

// 검색 결과 / 상태
const loading = ref(false);
const error = ref("");
const results = ref([]);

// 태그 조건 만족 여부 (필터에서 넘어온 selectedTags 사용)
function matchesSelectedTags(problem, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return true;

  const selectedLower = selectedTags.map((t) => t.toLowerCase());
  return problem.tags.some((ptag) =>
    selectedLower.some((st) => ptag.toLowerCase().includes(st)),
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

// 🔍 필터 컴포넌트에서 'search' 이벤트를 받았을 때 실행
async function handleFiltersSearch(filter) {
  loading.value = true;
  error.value = "";

  try {
    const hasProblemNo = !!filter.problemNo;
    const hasDifficultyRange =
      (filter.difficultyFrom && filter.difficultyFrom !== "ALL") ||
      (filter.difficultyTo && filter.difficultyTo !== "ALL");
    const hasTag = filter.selectedTags && filter.selectedTags.length > 0;

    const minSolvedNum =
      filter.minSolved && !isNaN(Number(filter.minSolved))
        ? Number(filter.minSolved)
        : undefined;

    const hasMinSolved =
      typeof minSolvedNum === "number" && !Number.isNaN(minSolvedNum);

    const hasDate = !!filter.registeredBefore;
    const hasUnsolvedFilter = filter.unsolvedOnly;
    const hasAiRecommend = filter.aiRecommend;

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
      // 조건이 하나도 없을 때: 기본 전체 검색
      baseResults = await problemService.searchWithConditions({
        difficultyFrom: undefined,
        difficultyTo: undefined,
        tag: "",
        minSolved: undefined,
        beforeDate: undefined,
        unsolvedOnly: false,
        aiRecommend: false,
      });
    } else if (hasProblemNo) {
      // 문제 번호를 입력한 경우: 번호 + 나머지 조건
      const candidates = await problemService.searchWithConditions({
        difficultyFrom: hasDifficultyRange ? filter.difficultyFrom : undefined,
        difficultyTo: hasDifficultyRange ? filter.difficultyTo : undefined,
        tag: "",
        minSolved: minSolvedNum,
        beforeDate: hasDate ? filter.registeredBefore : undefined,
        unsolvedOnly: filter.unsolvedOnly,
        aiRecommend: filter.aiRecommend,
      });

      const num = Number(filter.problemNo);
      baseResults = Number.isNaN(num)
        ? []
        : candidates.filter((p) => p.id === num);

      if (hasTag) {
        baseResults = baseResults.filter((p) =>
          matchesSelectedTags(p, filter.selectedTags),
        );
      }
    } else {
      // 번호는 없고, 나머지 조건 검색
      baseResults = await problemService.searchWithConditions({
        difficultyFrom: hasDifficultyRange ? filter.difficultyFrom : undefined,
        difficultyTo: hasDifficultyRange ? filter.difficultyTo : undefined,
        tag: "",
        minSolved: minSolvedNum,
        beforeDate: hasDate ? filter.registeredBefore : undefined,
        unsolvedOnly: filter.unsolvedOnly,
        aiRecommend: filter.aiRecommend,
      });

      if (hasTag) {
        baseResults = baseResults.filter((p) =>
          matchesSelectedTags(p, filter.selectedTags),
        );
      }
    }

    // 모드별 후처리 + 정렬
    if (filter.mode === "review") {
      // 복습 모드: 한 번 이상 푼 문제만, 복습 횟수 높은 순
      baseResults = baseResults.filter((p) => (p.reviewCount ?? 0) > 0);
      baseResults.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else {
      // 일반 모드
      // 기본: 미해결만(복습 횟수 0) 보이게, 토글 켠 경우엔 전체
      if (!filter.unsolvedOnly) {
        baseResults = baseResults.filter((p) => (p.reviewCount ?? 0) === 0);
      }

      if (filter.aiRecommend) {
        // AI 추천: 서버 순서 그대로
      } else if (filter.randomMode) {
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
  }
}

// 필터 컴포넌트에서 'reset' 이벤트 → 결과/에러만 초기화
function handleFiltersReset() {
  error.value = "";
  results.value = [];
}

// 이미 선택된 문제는 검색 결과에서 숨기기
const visibleResults = computed(() => {
  if (!props.selectedProblemIds || props.selectedProblemIds.length === 0) {
    return results.value;
  }
  const selectedIdSet = new Set(props.selectedProblemIds);
  return results.value.filter((p) => !selectedIdSet.has(p.id));
});

// 결과 카드 클릭 → 부모로 add-problem 이벤트
function onClickProblem(problem) {
  emit("add-problem", problem);
}
</script>

<template>
  <div class="search-bar-wrapper space-y-3">
    <!-- 필터 UI 전체 -->
    <SearchFilters
      :loading="loading"
      :error="error"
      :result-count="visibleResults.length"
      @search="handleFiltersSearch"
      @reset="handleFiltersReset"
    />

    <!-- 결과 리스트 -->
    <div class="search-results mt-1">
      <div
        v-for="problem in visibleResults"
        :key="problem.id"
        class="problem-card"
        @click="onClickProblem(problem)"
      >
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
