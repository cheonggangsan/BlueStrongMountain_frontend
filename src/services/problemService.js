import { apiMode } from "@/config/apiMode";
import * as problemApi from "@/api/problemApi";
import {
  searchByNumber as mockSearchByNumber,
  searchWithConditions as mockSearchWithConditions,
  postBoard as mockPostBoard,
} from "@/mocks/problem.mock";

import { assertSchema, isDevEnv } from "@/lib/schema/assertSchema";
import {
  ApiProblemListSchema,
  FrontProblemListSchema,
} from "@/lib/schema/problem.schema";
import { difficultyOptions } from "@/data/difficultyOptions";

const USE_MOCK_PROBLEM = apiMode.problem === "mock";

// "ALL" 제외 난이도 value 목록 (Bronze 5 -> ... -> Master 1)
const DIFFICULTY_ORDER = difficultyOptions
  .filter((opt) => opt.value !== "ALL")
  .map((opt) => opt.value);

function difficultyToIndex(value) {
  if (value === undefined || value === null || value === "" || value === "ALL")
    return null;

  // 숫자인 경우에도 유효 범위 + 정수 검증
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
    if (value < 0 || value >= DIFFICULTY_ORDER.length) return null;
    return value;
  }

  const idx = DIFFICULTY_ORDER.indexOf(String(value));
  return idx === -1 ? null : idx;
}

function difficultyIndexToLabel(value) {
  if (typeof value === "string") {
    // 문자열이 들어오면 "유효한 라벨인지" 보장하고 반환
    return DIFFICULTY_ORDER.includes(value) ? value : "Unrated";
  }

  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value >= DIFFICULTY_ORDER.length
  ) {
    return "Unrated";
  }

  return DIFFICULTY_ORDER[value];
}

function toDateOnly(input) {
  if (!input) return null;
  const s = String(input);
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/); // "2025-11-28 ..." or "2025-11-28T..."
  return match ? match[1] : null;
}

function toFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toFiniteInt(v, fallback = undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * 서버/목 스펙이 달라도 UI가 쓰는 공통 모델로 정규화
 * UI에서 사용하는 필드:
 *  - id, title, difficulty(라벨), tags[], acceptedUserCount
 *  - registeredAt(YYYY-MM-DD), reviewCount(number)
 */
function normalizeProblem(p) {
  const registeredAt =
    p.registeredAt ??
    p.registered_before ??
    toDateOnly(p.updatedAt) ??
    toDateOnly(p.createdAt) ??
    null;

  const reviewCount = toFiniteNumber(
    p.reviewCount ?? p.review_count ?? p.reviewCnt,
  );

  return {
    id: toFiniteInt(p.id ?? p.problemId, 0),
    title: p.title ?? p.name ?? "",
    difficulty: difficultyIndexToLabel(p.difficulty),
    tags: Array.isArray(p.tags) ? p.tags : [],
    acceptedUserCount: toFiniteInt(
      p.acceptedUserCount ?? p.accepted_user_count,
      0,
    ),
    registeredAt,
    reviewCount, // undefined 가능
  };
}

function normalizeOption(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isInteger(n) && [0, 1, 2].includes(n) ? n : undefined;
}

function getRandomSubset(arr, count) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function assertSchemaDev(schema, data, context) {
  return isDevEnv() ? assertSchema(schema, data, context) : data;
}

export const problemService = {
  /**
   * 문제 번호로 검색 (mock/real 공통 인터페이스)
   *  - 반환은 항상 "문제 배열"
   */
  async searchByNumber(problemNo) {
    if (USE_MOCK_PROBLEM) return mockSearchByNumber(problemNo);
    const list = assertSchema(
      ApiProblemListSchema,
      await problemApi.searchByNumber(problemNo),
      "problemApi.searchByNumber",
    );

    // 1) raw api response validate (always)
    // 2) normalized frontend model validate (DEV/TEST only)
    //
    // Why double validation?
    // - Catch backend contract drift early (API schema)
    // - Catch internal mapping regression (frontend schema) without shipping runtime overhead to prod
    const normalized = list.map((p) => normalizeProblem(p));
    return assertSchemaDev(
      FrontProblemListSchema,
      normalized,
      "problemService.normalizeProblem",
    );
  },

  /**
   * 그룹 내 문제 필터링
   *
   * UI 쪽에서 넘겨주는 payload 예시 (ProblemSearch 기준):
   * {
   *   groupId: number,
   *   mode: "general" | "review",
   *   difficultyFrom?: string,        // "Gold 5" ...
   *   difficultyTo?: string,
   *   tag?: string,                   // (현재는 "" 로만 사용)
   *   minSolved?: number,
   *   beforeDate?: string,            // YYYY-MM-DD
   *   unsolvedOnly?: boolean,
   *   aiRecommend?: boolean,          // 현재는 사용 X, 확장용
   *   problemIds?: number[],          // 선택(번호 기반 필터)
   * }
   *
   * 반환: 필터링된 문제 배열
   */
  async filterProblems(params = {}) {
    const {
      groupId,
      mode, // "normal" | "review" | "general"(호환)
      problemIds,

      difficultyFrom,
      difficultyTo,

      tags,
      tag, // 호환
      minSolvers,
      minSolved, // 호환

      unsolved, // 백엔드 의미 그대로 (true=미해결만)
      unsolvedOnly, // 기존 UI 토글(너는 true=모든문제) -> unsolved로 반전

      registeredBefore, // YYYY-MM-DD (클라 후처리)
      beforeDate, // 호환
      aiRecommend, // option=2로 매핑 가능
      randomMode, // option=1로 매핑 가능
      option, // 0|1|2 (swagger)
    } = params;

    const normalizedMode = mode === "review" ? "review" : "normal"; // general/undefined -> normal

    const diffFromIdx = difficultyToIndex(difficultyFrom);
    const diffToIdx = difficultyToIndex(difficultyTo);

    const mergedTags =
      Array.isArray(tags) && tags.length > 0
        ? tags
        : tag && String(tag).trim()
          ? [String(tag).trim()]
          : undefined;

    const mergedMinSolvers =
      typeof minSolvers === "number" && !Number.isNaN(minSolvers)
        ? minSolvers
        : typeof minSolved === "number" && !Number.isNaN(minSolved)
          ? minSolved
          : undefined;

    // UI의 unsolvedOnly(=모든문제 토글) 호환
    // - unsolved가 직접 오면 그걸 우선
    // - unsolvedOnly(너 UI에서 true=모든문제)면 unsolved = !unsolvedOnly
    const mergedUnsolved =
      typeof unsolved === "boolean"
        ? unsolved
        : typeof unsolvedOnly === "boolean" && normalizedMode === "normal"
          ? !unsolvedOnly
          : undefined;

    const explicitOption = normalizeOption(option);
    const derivedOption =
      normalizedMode === "review" ? 0 : aiRecommend ? 2 : randomMode ? 1 : 0;

    const mergedOption = explicitOption ?? derivedOption;

    if (USE_MOCK_PROBLEM) {
      const mockUnsolvedOnly =
        normalizedMode === "normal" && typeof mergedUnsolved === "boolean"
          ? !mergedUnsolved
          : undefined;

      const mockAiRecommend = mergedOption === 2;

      // mock은 기존 로직 재활용
      let base = await mockSearchWithConditions({
        difficultyFrom,
        difficultyTo,
        tag: "", // mock은 tag(string)만 받는 구조였으니 후처리로 tags 적용
        minSolved: mergedMinSolvers,
        beforeDate: registeredBefore ?? beforeDate,
        unsolvedOnly: mockUnsolvedOnly, // boolean
        aiRecommend: mockAiRecommend,
      });

      // tags 후처리 (mockSearchWithConditions는 tag string 기반이라)
      if (Array.isArray(mergedTags) && mergedTags.length > 0) {
        const lower = mergedTags.map((t) => String(t).toLowerCase());
        base = base.filter((p) =>
          (p.tags ?? []).some((pt) =>
            lower.some((t) => String(pt).toLowerCase().includes(t)),
          ),
        );
      }

      if (Array.isArray(problemIds) && problemIds.length > 0) {
        const set = new Set(problemIds.map(Number));
        base = base.filter((p) => set.has(Number(p.id)));
      }

      // option=1: 랜덤 5문제 반환 (중복 없음)
      if (normalizedMode === "normal" && mergedOption === 1) {
        const count = Math.min(5, base.length);
        base = count > 0 ? getRandomSubset(base, count) : [];
      }

      return base;
    }

    if (!groupId) {
      throw new Error(
        "[problemService.filterProblems] real 모드에서는 groupId가 필수입니다.",
      );
    }

    const rawList = await problemApi.filterProblems({
      groupId,
      mode: normalizedMode,
      problemIds,
      difficultyFrom: diffFromIdx ?? undefined,
      difficultyTo: diffToIdx ?? undefined,
      tags: mergedTags,
      minSolvers: mergedMinSolvers,
      unsolved: mergedUnsolved,
      option: mergedOption,
    });

    const apiList = assertSchema(
      ApiProblemListSchema,
      rawList,
      "problemApi.filterProblems",
    );

    // 1) raw api response validate (always)
    // 2) normalized frontend model validate (DEV/TEST only)
    //
    // Why double validation?
    // - Catch backend contract drift early (API schema)
    // - Catch internal mapping regression (frontend schema) without shipping runtime overhead to prod
    const normalized = apiList.map((p) => normalizeProblem(p));
    const normalizedSafe = assertSchemaDev(
      FrontProblemListSchema,
      normalized,
      "problemService.normalizeProblem",
    );

    const dateLimit = registeredBefore ?? beforeDate;
    if (!dateLimit) return normalizedSafe;

    return normalizedSafe.filter(
      (p) => p.registeredAt && p.registeredAt <= dateLimit,
    );
  },

  /**
   * 게시판 생성 (현재는 ProblemBoard.vue에서 사용)
   *  - mock에서는 mockPostBoard 사용
   *  - real에서는 /v1/boards 호출
   *  - 나중에 boardService로 이관 예정
   */
  async postBoard(payload) {
    if (USE_MOCK_PROBLEM) {
      return mockPostBoard(payload);
    }
    return problemApi.postBoard(payload);
  },
};
