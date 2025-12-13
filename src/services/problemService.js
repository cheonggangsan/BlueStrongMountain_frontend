import { apiMode } from "@/config/apiMode";
import * as problemApi from "@/api/problemApi";
import {
  searchByNumber as mockSearchByNumber,
  searchWithConditions as mockSearchWithConditions,
  postBoard as mockPostBoard,
} from "@/mocks/problem.mock";
import { difficultyOptions } from "@/data/difficultyOptions";

const USE_MOCK_PROBLEM = apiMode.problem === "mock";

// "ALL" 제외 난이도 value 목록 (Bronze 5 -> ... -> Master 1)
const DIFFICULTY_ORDER = difficultyOptions
  .filter((opt) => opt.value !== "ALL")
  .map((opt) => opt.value);

/**
 * 난이도 표시(문자열 또는 숫자)를 DIFFICULTY_ORDER의 0 기반 인덱스로 변환합니다.
 * 숫자인 경우 정수인지와 유효 범위(0 이상 DIFFICULTY_ORDER.length 미만)를 검증하고,
 * 문자열인 경우 DIFFICULTY_ORDER에서 일치하는 항목의 인덱스를 반환합니다.
 * 입력이 undefined, null, 빈 문자열, "ALL"이거나 유효하지 않으면 `null`을 반환합니다.
 * @param {string|number|null|undefined} value - 난이도 라벨(예: "Easy") 또는 인덱스값
 * @returns {number|null} 해당 난이도의 0 기반 인덱스, 유효하지 않으면 `null`
 */
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

/**
 * 난이도 인덱스 또는 라벨 값을 UI용 난이도 라벨로 변환한다.
 * @param {number|string} value - 난이도를 나타내는 정수 인덱스(0 기반) 또는 라벨 문자열.
 * @returns {string} 유효한 난이도 라벨(예: `"Bronze"`)을 반환하며, 유효하지 않으면 `"Unrated"`을 반환한다.
 */
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

/**
 * 입력값에서 앞부분의 YYYY-MM-DD 날짜 문자열을 추출한다.
 * @param {any} input - 날짜 문자열 또는 날짜를 포함할 수 있는 값. 앞부분에 `YYYY-MM-DD` 패턴이 있으면 해당 부분을 추출한다.
 * @returns {string|null} 추출된 `YYYY-MM-DD` 문자열, 패턴이 없거나 입력이 없으면 `null`.
 */
function toDateOnly(input) {
  if (!input) return null;
  const s = String(input);
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/); // "2025-11-28 ..." or "2025-11-28T..."
  return match ? match[1] : null;
}

/**
 * 값을 유한한 숫자로 변환한다.
 * @param {*} v - 변환할 값.
 * @returns {number|undefined} 변환된 숫자가 유한하면 해당 숫자, 그렇지 않으면 `undefined`.
 */
function toFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 서버 또는 목 데이터에서 UI가 사용하는 공통 문제 모델로 변환한다.
 *
 * 입력 객체는 서로 다른 필드 네이밍을 가질 수 있으며, 이 함수는 UI가 기대하는 형태로 필드를 통일한다.
 *
 * @param {Object} p - 서버/목 문제 객체. 가능한 필드 예: `id` 또는 `problemId`, `title` 또는 `name`, `difficulty`, `tags`(배열), `acceptedUserCount` 또는 `accepted_user_count`, `registeredAt`/`registered_before`/`updatedAt`/`createdAt`, `reviewCount`/`review_count`/`reviewCnt`.
 * @returns {Object} 변환된 문제 모델 객체.
 * @returns {string|number|undefined} returns.id - 문제 식별자 (`id` 또는 `problemId`).
 * @returns {string} returns.title - 문제 제목 (없으면 빈 문자열).
 * @returns {string} returns.difficulty - UI용 난이도 라벨. 유효하지 않으면 "Unrated".
 * @returns {string[]} returns.tags - 태그 배열(존재하지 않으면 빈 배열).
 * @returns {number} returns.acceptedUserCount - 수락자 수(없으면 0).
 * @returns {string|null} returns.registeredAt - 등록일(YYYY-MM-DD) 또는 null.
 * @returns {number|undefined} returns.reviewCount - 리뷰 수(정수가 아니면 `undefined` 가능).
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
    id: p.id ?? p.problemId,
    title: p.title ?? p.name ?? "",
    difficulty: difficultyIndexToLabel(p.difficulty),
    tags: Array.isArray(p.tags) ? p.tags : [],
    acceptedUserCount: p.acceptedUserCount ?? p.accepted_user_count ?? 0,
    registeredAt,
    reviewCount, // undefined 가능
  };
}

export const problemService = {
  /**
   * 문제 번호로 검색 (mock/real 공통 인터페이스)
   *  - 반환은 항상 "문제 배열"
   */
  async searchByNumber(problemNo) {
    if (USE_MOCK_PROBLEM) return mockSearchByNumber(problemNo);
    const list = await problemApi.searchByNumber(problemNo);
    return Array.isArray(list) ? list.map((p) => normalizeProblem(p)) : [];
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
      aiRecommend, // 현재 미사용(확장용)
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

    if (USE_MOCK_PROBLEM) {
      const mockUnsolvedOnly =
        normalizedMode === "normal" && typeof mergedUnsolved === "boolean"
          ? !mergedUnsolved
          : undefined;

      // mock은 기존 로직 재활용
      let base = await mockSearchWithConditions({
        difficultyFrom,
        difficultyTo,
        tag: "", // mock은 tag(string)만 받는 구조였으니 후처리로 tags 적용
        minSolved: mergedMinSolvers,
        beforeDate: registeredBefore ?? beforeDate,
        unsolvedOnly: mockUnsolvedOnly, // boolean
        aiRecommend: !!aiRecommend,
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
    });

    const normalized = Array.isArray(rawList)
      ? rawList.map((p) => normalizeProblem(p))
      : [];

    const dateLimit = registeredBefore ?? beforeDate;
    if (!dateLimit) return normalized;

    return normalized.filter(
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