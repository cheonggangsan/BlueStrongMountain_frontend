import httpClient from "./httpClient";

/**
 * GET /api/v1/groups
 * 그룹 리스트 조회
 */
export async function fetchGroups() {
  const res = await httpClient.get("/v1/groups");
  return res.data;
}

/**
 * DELETE /api/v1/groups/{groupId}/members/me
 * 현재 로그인한 사용자가 그룹에서 탈퇴
 */
export async function leaveGroup(groupId) {
  const res = await httpClient.delete(`/v1/groups/${groupId}/members/me`);
  return res.data;
}

/**
 * POST /api/v1/groups
 * 새 그룹 생성
 */
export async function createGroup(payload) {
  const res = await httpClient.post("/v1/groups", payload);
  return res.data;
}

/**
 * GET /api/v1/groups/{groupId}
 * 그룹 상세 조회
 */
export async function fetchGroupById(groupId) {
  const res = await httpClient.get(`/v1/groups/${groupId}`);
  return res.data;
}

/**
 * PUT /api/v1/groups/{groupId}
 * 그룹 수정
 */
export async function updateGroup(groupId, payload) {
  const res = await httpClient.put(`/v1/groups/${groupId}`, payload);
  return res.data;
}

/**
 * POST /api/v1/groups/{groupId}/owner
 * 그룹 소유자 변경
 * (실제 백엔드 스펙에 맞게 엔드포인트/메서드는 나중에 조정)
 */
export async function changeGroupOwner(groupId, { requesterId, newOwnerId }) {
  const res = await httpClient.post(`/v1/groups/${groupId}/owner`, {
    requesterId,
    newOwnerId,
  });
  return res.data;
}
