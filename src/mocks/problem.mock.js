import { difficultyOptions } from "@/data/difficultyOptions";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 난이도 문자열을 순서 있는 숫자로 변환하기 위한 매핑
// 앞에 있을수록 더 쉬운 난이도로 가정
const DIFFICULTY_ORDER = difficultyOptions
  .filter((opt) => opt.value !== "ALL")
  .map((opt) => opt.value);

function difficultyToIndex(value) {
  if (value === undefined || value === null || value === "ALL") return null;
  const idx = DIFFICULTY_ORDER.indexOf(value);
  return idx === -1 ? null : idx;
}

// TODO: dependency management
export const MOCK_PROBLEMS = [
  {
    id: 1409,
    title: "피보나치 수 1",
    difficulty: "Gold 5",
    tags: ["DP"],
    acceptedUserCount: 1200,
    registeredAt: "2024-11-01", // 🔹 등록일
    reviewCount: 2, // 🔹 복습 횟수
  },
  {
    id: 1508,
    title: "DFS와 BFS",
    difficulty: "Gold 4",
    tags: ["Graph", "Breadth-first Search(BFS)", "DFS"],
    acceptedUserCount: 3920,
    registeredAt: "2024-11-02",
    reviewCount: 1,
  },
  {
    id: 1000,
    title: "A+B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-03",
    reviewCount: 0,
  },
  {
    id: 1001,
    title: "A-B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-04",
    reviewCount: 3,
  },
  {
    id: 1002,
    title: "A*B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-05",
    reviewCount: 1,
  },
  {
    id: 1003,
    title: "A/B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-06",
    reviewCount: 0,
  },
  {
    id: 1004,
    title: "A%B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-07",
    reviewCount: 2,
  },
  {
    id: 1005,
    title: "A&B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-08",
    reviewCount: 4,
  },
  {
    id: 1006,
    title: "A|B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-09",
    reviewCount: 0,
  },
  {
    id: 1007,
    title: "A^B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-10",
    reviewCount: 2,
  },
  {
    id: 1008,
    title: "A@B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-11",
    reviewCount: 1,
  },
  {
    id: 1009,
    title: "A#B",
    difficulty: "Bronze 5",
    tags: ["Implementation"],
    acceptedUserCount: 99999,
    registeredAt: "2024-11-12",
    reviewCount: 5,
  },
  {
    id: 2000,
    title: "이분 탐색 기본",
    difficulty: "Silver 3",
    tags: ["Binary Search"],
    acceptedUserCount: 8000,
    registeredAt: "2024-11-13",
    reviewCount: 0,
  },
  {
    id: 2004,
    title:
      "이것은 세상에서 제일 긴 문제 이름입니다. 테스트를 위해서 이렇게 일단 만들었습니다. 과연 어떻게 나올 것인가",
    difficulty: "Silver 3",
    tags: ["Binary Search"],
    acceptedUserCount: 8000,
    registeredAt: "2024-11-14",
    reviewCount: 2,
  },
];

/**
 * 문제 번호로 검색 (mock)
 * @param {number|string} problemNo
 * @returns {Promise<Array>}
 */
export async function searchByNumber(problemNo) {
  await delay(200);
  const num = Number(problemNo);
  if (!num) return [];
  return MOCK_PROBLEMS.filter((p) => p.id === num);
}

/**
 * 복합 조건 검색 (mock)
 *  - 실제 서버의 /groups/{groupId}/problems/filter 와는 스펙이 다르지만,
 *    프론트단 필터링/테스트용으로 유지.
 *
 * @param {{
 *   difficulty?: string,
 *   difficultyFrom?: string,
 *   difficultyTo?: string,
 *   tag?: string,
 *   minSolved?: number,
 *   beforeDate?: string,    // YYYY-MM-DD
 *   unsolvedOnly?: boolean, // 미해결 문제만 조회할지 여부
 *   aiRecommend?: boolean   // AI 추천 모드 여부
 * }} params
 * @returns {Promise<Array>}
 */
export async function searchWithConditions(params = {}) {
  await delay(200);

  const {
    difficulty, // 예전 방식: 단일 난이도
    difficultyFrom, // 새 방식: 난이도 범위 시작
    difficultyTo, // 새 방식: 난이도 범위 끝
    tag,
    minSolved,
    beforeDate, // 🔹 등록일 필터
    unsolvedOnly, // 🔹 미해결 필터 (mock에서는 사용 X)
    aiRecommend, // 🔹 AI 추천 모드 (mock에서는 사용 X)
  } = params;

  const minDiffRaw = difficultyToIndex(difficultyFrom);
  const maxDiffRaw = difficultyToIndex(difficultyTo);

  const hasRange = minDiffRaw !== null || maxDiffRaw !== null;
  const hasSingleDifficulty = !hasRange && difficulty && difficulty !== "ALL";

  // TODO: use for api connection
  unsolvedOnly;
  aiRecommend;

  return MOCK_PROBLEMS.filter((p) => {
    // ===== 난이도 필터 =====
    if (hasRange) {
      const pd = difficultyToIndex(p.difficulty);
      if (pd === null) return false;

      let min = minDiffRaw;
      let max = maxDiffRaw;

      if (min !== null || max !== null) {
        if (min === null) min = -Infinity;
        if (max === null) max = Infinity;
        if (min > max) {
          const tmp = min;
          min = max;
          max = tmp;
        }
        if (pd < min || pd > max) return false;
      }
    } else if (hasSingleDifficulty) {
      if (p.difficulty !== difficulty) return false;
    }

    // ===== 태그 필터 =====
    if (
      tag &&
      String(tag).trim() &&
      !p.tags.some((t) => t.toLowerCase().includes(String(tag).toLowerCase()))
    ) {
      return false;
    }

    // ===== 최소 해결자 수 필터 =====
    if (typeof minSolved === "number" && !Number.isNaN(minSolved)) {
      if (p.acceptedUserCount < minSolved) return false;
    }

    // ===== 날짜 필터 (beforeDate) =====
    if (beforeDate) {
      if (!p.registeredAt || p.registeredAt > beforeDate) {
        return false;
      }
    }

    // NOTE:
    // unsolvedOnly, aiRecommend 는 실제 서버에서
    //  - unsolvedOnly: 그룹/사용자 기준 미해결 문제만 필터링
    //  - aiRecommend: AI 추천 알고리즘을 적용한 문제 목록 반환
    // 에 사용된다고 가정하고, mock 에서는 별도 로직을 넣지 않습니다.

    return true;
  });
}

/**
 * 게시 요청 (제목 + 데드라인 + 문제 목록) - mock
 * @param {{ title: string, deadline: string|null, problems: Array }} payload
 * @returns {Promise<{success: boolean, received: any}>}
 */
export async function postBoard(payload) {
  await delay(300);
  console.log("mock postBoard payload:", payload);
  return {
    success: true,
    received: payload,
  };
}
