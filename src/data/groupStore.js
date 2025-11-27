import { ref } from "vue";

export const groups = ref([]);

/**
 *   그룹 리스트
 *   추후에는 여기도 백엔드 API(예: GET /api/v1/groups) 로 교체될 예정.
 */
const MOCK_GROUPS = [
  {
    id: 1,
    name: "1조 알고리즘 스터디",
    description: "골드 5 ~ 골드 3 위주, 주 3회 모임",
    memberCount: 5,
  },
  {
    id: 2,
    name: "CS 면접 대비반",
    description: "네트워크/OS/DB 이론 복습 스터디",
    memberCount: 4,
  },
  {
    id: 3,
    name: "사내 해커톤 팀",
    description: "사내 해커톤 준비용 그룹",
    memberCount: 6,
  },
];

const LOCAL_GROUP_DB = ref([...MOCK_GROUPS]);

export async function fetchGroups() {
  return new Promise((resolve) => {
    setTimeout(() => {
      groups.value = [...LOCAL_GROUP_DB.value];
      console.log("[API Mock] 그룹 목록 조회 성공");
      resolve(groups.value);
    }, 300);
  });
}

/**
 * 현재 로그인한 사용자가 그룹에서 탈퇴하는 함수 (Mock).
 * 실제 백엔드가 붙으면 여기서 axios 로
 *   DELETE /api/v1/groups/{groupId}/members/me
 * 같은 엔드포인트를 호출하면 됩니다.
 */
export async function leaveGroup(groupId) {
  const numericId = Number(groupId);

  // 1) Mock DB에서 제거
  LOCAL_GROUP_DB.value = LOCAL_GROUP_DB.value.filter((g) => g.id !== numericId);

  // 2) 화면에 바인딩된 groups에서도 제거
  groups.value = groups.value.filter((g) => g.id !== numericId);

  console.log(`[Mock] 그룹 ${numericId} 탈퇴 / 리스트에서 제거됨`);

  // 실제로는 axios 호출 결과 반환
  return true;
}
