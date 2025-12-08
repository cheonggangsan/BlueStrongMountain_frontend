import httpClient from "./httpClient";

/**
 * 그룹 ID에 해당하는 보드 목록 조회
 * GET /v1/groups/{groupId}/boards
 */
export async function fetchBoards(groupId) {
  const res = await httpClient.get(`/v1/groups/${groupId}/boards`);
  return res.data;
}

/**
 * 특정 보드 상세 조회
 * GET /v1/boards/{boardId}
 */
export async function fetchBoardById(boardId) {
  const res = await httpClient.get(`/v1/boards/${boardId}`);
  return res.data;
}

/**
 * 보드 생성
 * POST /v1/boards
 */
export async function createBoard(payload) {
  const res = await httpClient.post("/v1/boards", payload);
  return res.data;
}

/**
 * 보드 수정
 * PUT /v1/boards/{boardId}
 */
export async function updateBoard(boardId, payload) {
  const res = await httpClient.put(`/v1/boards/${boardId}`, payload);
  return res.data;
}

/**
 * 보드 삭제
 * DELETE /v1/boards/{boardId}
 */
export async function deleteBoard(boardId) {
  const res = await httpClient.delete(`/v1/boards/${boardId}`);
  return res.data;
}

/**
 * 보드별 유저 풀이 현황
 * GET /v1/groups/{groupId}/boards/{boardId}/userStatus
 */
export async function getBoardUserStatus(groupId, boardId) {
  const res = await httpClient.get(
    `/v1/groups/${groupId}/boards/${boardId}/userStatus`,
  );
  return res.data;
}
