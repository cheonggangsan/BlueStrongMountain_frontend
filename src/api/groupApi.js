import httpClient from "./httpClient";

/**
 * GET /api/v1/groups
 *
 * 쿼리:
 *  - requesterId: number (required)
 *  - name: string (optional, 검색어)
 *
 * 응답: GroupSummaryResponse[]
 */
export async function fetchGroups({ requesterId, name } = {}) {
  const res = await httpClient.get("/groups", {
    params: {
      requesterId,
      name,
    },
  });
  return res.data;
}

/**
 * DELETE /api/v1/groups/{groupId}/members/me
 *
 * 쿼리:
 *  - requesterId: number
 *
 * 응답: BasicResponse { success: boolean }
 */
export async function leaveGroup({ groupId, requesterId }) {
  const res = await httpClient.delete(`/groups/${groupId}/members/me`, {
    params: { requesterId },
  });
  return res.data; // BasicResponse
}

/**
 * POST /api/v1/groups
 *
 * 쿼리:
 *  - requesterId: number (required)
 *
 * Body: GroupCreateRequest
 *  {
 *    title: string,
 *    managerIds: number[],
 *    memberIds: number[],
 *    visibility: string,
 *    description: string
 *  }
 *
 * 응답: BasicResponse { success: boolean }
 */
export async function createGroup({
  requesterId,
  title,
  managerIds,
  memberIds,
  visibility,
  description,
}) {
  const res = await httpClient.post(
    "/groups",
    {
      title,
      managerIds,
      memberIds,
      visibility,
      description,
    },
    {
      params: { requesterId },
    },
  );
  return res.data; // BasicResponse
}

/**
 * GET /api/v1/groups/{groupId}
 * 그룹 상세 조회
 */
export async function fetchGroupById(groupId, { requesterId } = {}) {
  const res = await httpClient.get(`/groups/${groupId}/detail`, {
    params: { requesterId },
  });
  return res.data;
}

/**
 * PATCH /api/v1/groups/{groupId}
 * query: requesterId
 * body: GroupUpdateRequest
 */
export async function updateGroup({
  groupId,
  requesterId,
  title,
  visibility,
  description,
  managerIds,
  memberIds,
} = {}) {
  const body = {
    title,
    visibility,
    description,
  };

  if (Array.isArray(managerIds)) body.managerIds = managerIds;
  if (Array.isArray(memberIds)) body.memberIds = memberIds;

  const res = await httpClient.patch(`/groups/${groupId}`, body, {
    params: { requesterId },
  });

  return res.data; // BasicResponse or updated object
}

/**
 * PATCH /api/v1/groups/{groupId}/owner
 *
 * 쿼리:
 *  - requesterId: number
 *
 * Body: OwnerChangeRequest { newOwnerId }
 *
 * 응답: BasicResponse { success: boolean }
 */
export async function changeGroupOwner({ groupId, requesterId, newOwnerId }) {
  const res = await httpClient.patch(
    `/groups/${groupId}/owner`,
    { newOwnerId },
    {
      params: { requesterId },
    },
  );
  return res.data; // BasicResponse
}

/**
 * GET /api/v1/groups/{groupId}/users
 * 그룹 유저 목록 조회
 * query: requesterId
 * resp: GroupUserDto[]
 */
export async function fetchGroupUsers(groupId, { requesterId } = {}) {
  const res = await httpClient.get(`/groups/${groupId}/users`, {
    params: { requesterId },
  });
  return res.data;
}
