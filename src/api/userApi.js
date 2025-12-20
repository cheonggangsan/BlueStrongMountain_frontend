import httpClient from "./httpClient";

/**
 * 유저 정보 조회
 * GET /api/v1/users/{id}
 * res:
 * {
 *   userId: number,
 *   email: string,
 *   username: string,
 *   baekjoonHandle: string | null,
 *   status: "ACTIVE" | ...,
 *   createdAt: string,
 *   updatedAt: string
 * }
 */
export async function fetchUserInfo({ id }) {
  const res = await httpClient.get(`/users/${id}`);
  return res.data;
}

/**
 * 닉네임 변경
 * PATCH /api/v1/users/{id}/username
 * body: { username }
 * res: BaseResponse
 */
export async function changeUsername({ id, username }) {
  const res = await httpClient.patch(`/users/${id}/username`, { username });
  return res.data;
}

/**
 * 비밀번호 변경
 * PATCH /api/v1/users/{id}/password
 * body: { password }
 * res: BaseResponse
 */
export async function changePassword({ id, password }) {
  const res = await httpClient.patch(`/users/${id}/password`, { password });
  return res.data;
}

/**
 * 회원 탈퇴
 * DELETE /api/v1/users/{id}
 * res: BaseResponse
 */
export async function deleteUser({ id }) {
  const res = await httpClient.delete(`/users/${id}`);
  return res.data;
}
