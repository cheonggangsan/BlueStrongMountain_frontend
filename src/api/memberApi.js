import httpClient from "./httpClient";

/**
 * 멤버 검색
 */
export async function searchMembers(keyword) {
  const q = keyword?.trim();
  const res = await httpClient.get("/v1/members", {
    params: { query: q },
  });
  return res.data;
}

/**
 * 필요하다면 이후 fetchMemberById, fetchGroupMembers 등도 여기 추가
 */
