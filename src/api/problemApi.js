import httpClient from "./httpClient";

/**
 * 문제 번호로 단건 조회
 *  - GET /api/v1/problems/{problemNo}
 *  - 백엔드가 단건/배열 중 어떤 형태로 내려줘도
 *    최종 반환은 "배열"로 맞춰줌.
 */
export async function searchByNumber(problemNo) {
  const num = Number(problemNo);
  if (!num) return [];

  const res = await httpClient.get(`/problems/${num}`);
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
}

/**
 * 그룹 단위 문제 필터링
 *
 * 스펙 (Swagger):
 *  GET /api/v1/groups/{groupId}/problems/filter
 *
 * @param {{
 *   groupId: number | string,
 *   mode?: "normal" | "review",
 *   problemIds?: number[],
 *   difficultyFrom?: number | null,
 *   difficultyTo?: number | null,
 *   tags?: string[],
 *   minSolvers?: number,
 *   unsolved?: boolean
 * }} params
 * @returns {Promise<Array>} problems
 */
export async function filterProblems({
  groupId,
  mode,
  problemIds,
  difficultyFrom,
  difficultyTo,
  tags,
  minSolvers,
  unsolved,
} = {}) {
  if (!groupId) {
    throw new Error(
      "[problemApi.filterProblems] groupId는 필수입니다. (/groups/{groupId}/problems/filter)",
    );
  }

  // 배열도 params에 포함 (serializer가 explode 처리)
  const params = {
    mode,
    difficultyFrom,
    difficultyTo,
    minSolvers,
    unsolved,
    problemIds,
    tags,
  };

  // explode=true: ?tags=a&tags=b&problemIds=1&problemIds=2
  const paramsSerializer = (p) => {
    const sp = new URLSearchParams();

    const append = (k, v) => {
      if (v === undefined || v === null || v === "") return;
      sp.append(k, String(v));
    };

    for (const [k, v] of Object.entries(p ?? {})) {
      if (Array.isArray(v)) {
        for (const item of v) append(k, item);
      } else {
        append(k, v);
      }
    }

    return sp.toString();
  };

  const res = await httpClient.get(`/groups/${groupId}/problems/filter`, {
    params,
    paramsSerializer,
  });

  const body = res.data;

  // 언래핑 (실제/스웨거/변형 케이스 모두 방어)
  if (Array.isArray(body)) return body;

  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.problems)) return body.problems;

  if (Array.isArray(body?.data?.problems)) return body.data.problems;
  if (Array.isArray(body?.data?.data)) return body.data.data; // 혹시 이중 래핑인 경우

  return [];
}

/**
 * 게시 요청 (제목 + 데드라인 + 문제 목록)
 * @param {{ title: string, deadline: string|null, problems: Array }} payload
 * @returns {Promise<{success: boolean, received: any}>}
 */
export async function postBoard(payload) {
  const res = await httpClient.post("/boards", payload);
  return res.data;
}
