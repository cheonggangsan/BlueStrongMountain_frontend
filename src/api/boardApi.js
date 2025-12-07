import httpClient from "./httpClient";

// 방금 만든 목업 API
import { mockGetBoardUserStatus } from "@/mocks/boardUserStatus.mock";

// 나중에 .env로 빼면 더 좋음
const USE_MOCK = true;

export async function getBoardUserStatus(groupId, boardId) {
  if (USE_MOCK) {
    // ✅ 지금은 목업 데이터 반환
    return mockGetBoardUserStatus(groupId, boardId);
  }

  // 🔜 실제 백엔드 붙일 때는 여기만 살리면 됨
  const res = await httpClient.get(
    `/api/v1/groups/${groupId}/boards/${boardId}/userStatus`,
  );
  return res.data;
}
