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
    visibility: "PRIVATE",
  },
  {
    id: 2,
    name: "CS 면접 대비반",
    description: "네트워크/OS/DB 이론 복습 스터디",
    memberCount: 4,
    visibility: "PRIVATE",
  },
  {
    id: 3,
    name: "사내 해커톤 팀",
    description: "사내 해커톤 준비용 그룹",
    memberCount: 6,
    visibility: "PRIVATE",
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

// 새 그룹 생성 (POST /api/v1/groups mock)
// 실제 백엔드 붙일 땐 이 함수 안에서 axios.post("/api/v1/groups", payload)로 교체.
export async function createGroup(payload) {
  // payload 형태:
  // {
  //   title: "청강산 1기 알고리즘 캠프",
  //   managerIds: [2, 3],
  //   memberIds: [4, 5, 6],
  //   visibility: "PRIVATE",
  //   description: "백준 골드 목표 스터디입니다."
  // }

  // memberIds + managerIds(관리자도 멤버로 취급) 기준으로 멤버 수 계산
  const memberIdSet = new Set([
    ...(payload.memberIds || []),
    ...(payload.managerIds || []),
  ]);

  const newGroup = {
    id: Date.now(), // Mock용 ID
    name: payload.title,
    description: payload.description || "",
    memberCount: memberIdSet.size,
    visibility: payload.visibility || "PRIVATE",
  };

  LOCAL_GROUP_DB.value = [newGroup, ...LOCAL_GROUP_DB.value];
  groups.value = [...LOCAL_GROUP_DB.value];

  console.log("[Mock] POST /api/v1/groups payload:", payload);
  console.log("[Mock] 새 그룹 생성 완료:", newGroup);

  return newGroup;
}
