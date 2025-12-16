import httpClient from "./httpClient";

/**
 * 그룹 ID에 해당하는 보드 목록 조회
 * GET /api/v1/groups/{groupId}/boards
 *
 * query:
 *  - title?: string
 *  - writerId?: number
 *  - from?: string (date-time)
 *  - to?: string (date-time)
 */
export async function fetchBoards(groupId, params = {}) {
  const res = await httpClient.get(`/groups/${groupId}/boards`, {
    params,
  });
  return res.data;
}

/**
 * 특정 보드 상세 조회
 * GET /api/v1/groups/{groupId}/boards/{boardId}
 */
export async function fetchBoardById(groupId, boardId) {
  const res = await httpClient.get(`/groups/${groupId}/boards/${boardId}`);
  return res.data;
}

/**
 * 보드 생성
 * POST /api/v1/groups/{groupId}/boards?requesterId=...
 *
 * body: BoardCreateRequest
 *  - title: string
 *  - content: string
 *  - startTime?: string (date-time)
 *  - endTime?: string (date-time)
 *  - problemIds: number[]
 *
 * 응답: 생성된 boardId (number)
 */
export async function createBoard(groupId, requesterId, payload) {
  const res = await httpClient.post(`/groups/${groupId}/boards`, payload, {
    params: { requesterId },
  });
  return res.data; // boardId (number)
}

/**
 * 보드 수정
 * PATCH /api/v1/groups/{groupId}/boards/{boardId}?requesterId=...
 *
 * body: BoardUpdateRequest
 *  - title?: string
 *  - content?: string
 *  - startTime?: string (date-time)
 *  - endTime?: string (date-time)
 *
 * 응답: "updated"
 */
export async function updateBoard(groupId, boardId, requesterId, payload) {
  const res = await httpClient.patch(
    `/groups/${groupId}/boards/${boardId}`,
    payload,
    {
      params: { requesterId },
    },
  );
  return res.data;
}

/**
 * 보드 삭제
 * DELETE /api/v1/groups/{groupId}/boards/{boardId}?requesterId=...
 *
 * 응답: "deleted"
 */
export async function deleteBoard(groupId, boardId, requesterId) {
  const res = await httpClient.delete(`/groups/${groupId}/boards/${boardId}`, {
    params: { requesterId },
  });
  return res.data;
}

/**
 * 보드 안에 포함된 문제 목록 (ID 배열)
 * GET /api/v1/groups/{groupId}/boards/{boardId}/problems
 */
export async function getBoardProblems(groupId, boardId) {
  const res = await httpClient.get(
    `/groups/${groupId}/boards/${boardId}/problems`,
  );
  return res.data; // number[]
}

/**
 * 보드별 유저 풀이 현황
 * GET /api/v1/groups/{groupId}/boards/{boardId}/userStatus?requesterId=...
 */
export async function getBoardUserStatus({ groupId, boardId, requesterId }) {
  const res = await httpClient.get(
    `/groups/${groupId}/boards/${boardId}/userStatus`,
    { params: { requesterId } },
  );
  return res.data;
}
