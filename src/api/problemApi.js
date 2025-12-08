import httpClient from "./httpClient";

/**
 * 문제 번호로 검색
 * @param {number|string} problemNo
 * @returns {Promise<Array>}
 */
export async function searchByNumber(problemNo) {
  const num = Number(problemNo);
  if (!num) return [];
  const res = await httpClient.get(`/v1/problems/${num}`);
  return Array.isArray(res.data) ? res.data : [res.data];
}

/**
 * 복합 조건 검색
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
  // 예시: GET /v1/problems/search?difficultyFrom=...&tag=...
  const res = await httpClient.get("/v1/problems/search", {
    params,
  });
  return res.data;
}

/**
 * 게시 요청 (제목 + 데드라인 + 문제 목록)
 * @param {{ title: string, deadline: string|null, problems: Array }} payload
 * @returns {Promise<{success: boolean, received: any}>}
 */
export async function postBoard(payload) {
  const res = await httpClient.post("/v1/boards", payload);
  return res.data;
}
