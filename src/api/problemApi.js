import httpClient from "./httpClient";

/**
 * 문제 번호로 문제를 조회하고 결과를 항상 배열로 반환한다.
 *
 * @param {number|string} problemNo - 조회할 문제 번호(숫자 또는 숫자로 변환 가능한 문자열).
 * @returns {Object[]} 조회된 문제 객체들의 배열. 조회 결과가 없으면 빈 배열을 반환한다.
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
 * 그룹 내에서 지정된 조건으로 문제를 조회하여 문제 배열로 반환합니다.
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
 * }} params - 조회 조건 객체. `groupId`는 필수입니다.
 * @throws {Error} `groupId`가 없을 경우 예외를 던집니다.
 * @returns {Array} 조건에 맞는 문제 객체들의 배열. 일치하는 문제가 없으면 빈 배열을 반환합니다.
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
 * 제목과 선택적 마감일, 문제 목록을 포함한 게시물을 생성한다.
 * @param {{ title: string, deadline: string|null, problems: Array }} payload - 생성할 게시물의 내용. `title`은 게시물 제목, `deadline`은 ISO 형식의 마감일 문자열 또는 `null`, `problems`는 포함할 문제들의 배열이다.
 * @returns {Object} 서버가 반환한 응답 데이터 객체.
 */
export async function postBoard(payload) {
  const res = await httpClient.post("/boards", payload);
  return res.data;
}