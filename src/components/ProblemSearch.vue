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
  groupId: {
    type: [Number, String],
    required: true,
  },
});

// 검색 결과 / 상태
const loading = ref(false);
const error = ref("");
const results = ref([]);

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
    // ===== 1) UI -> service payload (매핑 최소화) =====
    const num = filter.problemNo ? Number(filter.problemNo) : NaN;
    const problemIds = Number.isFinite(num) && num > 0 ? [num] : undefined;

    const minSolversNum = filter.minSolved ? Number(filter.minSolved) : NaN;
    const minSolvers =
      Number.isFinite(minSolversNum) && minSolversNum >= 0
        ? minSolversNum
        : undefined;

    const payload = {
      groupId: props.groupId,
      // SearchFilters.vue: mode = "general" | "review"
      // service에서 "review"만 특별 처리하고 나머지는 normal로 취급하도록 해둠
      mode: filter.mode,

      problemIds,

      // UI는 문자열("Gold 5") 전달 → service가 index로 변환
      difficultyFrom: filter.difficultyFrom,
      difficultyTo: filter.difficultyTo,

      // UI는 배열 → service가 그대로 tags로 전달
      tags:
        Array.isArray(filter.selectedTags) && filter.selectedTags.length > 0
          ? filter.selectedTags
          : undefined,

      minSolvers,

      // UI 토글(너 UI에서 true=모든문제)도 service가 호환 처리(unsolved로 반전)
      unsolvedOnly: filter.unsolvedOnly,

      // UI 날짜 필터 (service가 updatedAt->registeredAt 정규화 후 필터까지 처리)
      registeredBefore: filter.registeredBefore || undefined,

      // 확장용 (현재 서버 미지원이어도 payload로 넘겨도 무방)
      aiRecommend: !!filter.aiRecommend,
    };

    let baseResults = await problemService.filterProblems(payload);

    // ===== 2) UI 전용 후처리(정렬/랜덤)만 남긴다 =====
    if (filter.mode === "review") {
      const hasReviewCount = baseResults.some((p) =>
        Number.isFinite(Number(p.reviewCount)),
      );

      if (hasReviewCount) {
        baseResults.sort(
          (a, b) => Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0),
        );
      } else {
        // reviewCount가 없으면 날짜(registeredAt) 기준으로 의미있는 정렬
        // normalizeProblem에서 registeredAt을 YYYY-MM-DD로 만들어두었으니 문자열 비교 OK
        baseResults.sort((a, b) => {
          const da = a.registeredAt || "";
          const db = b.registeredAt || "";
          return db.localeCompare(da); // 최신 우선
        });
      }
    } else {
      if (filter.aiRecommend) {
        // AI 추천: 서버 순서 그대로 (추후 서버가 지원하면 그대로 UX 유지)
      } else if (filter.randomMode) {
        const count = Math.min(5, baseResults.length);
        baseResults = count > 0 ? getRandomSubset(baseResults, count) : [];
      } else {
        // 기본 정렬: reviewCount(낮은 순) -> registeredAt(오래된 순)
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
      error.value = "조건에 맞는 문제가 없습니다.";
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
