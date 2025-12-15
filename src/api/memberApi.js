import httpClient from "./httpClient";

/**
 * 멤버 검색
 * /api/v1/users/search
 *
 * 반환 형식:
 * { id, name, nickname, email }
 */
export async function searchMembers(keyword) {
  const q = String(keyword ?? "").trim();
  if (!q) return [];

  const res = await httpClient.get("/users/search", {
    params: { query: q },
  });

  const list = Array.isArray(res.data) ? res.data : [];

  return list.map((u) => ({
    id: u.id,
    name: u.username ?? "",
    nickname: u.username ?? "",
    email: u.email ?? "",
  }));
}

/**
 * 필요하다면 이후 fetchMemberById, fetchGroupMembers 등도 여기 추가
 */
