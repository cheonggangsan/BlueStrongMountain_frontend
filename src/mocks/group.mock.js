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
    memberCount: 6,
    visibility: "PRIVATE",
    ownerId: 1764919478917, //TODO: change this code
    managerIds: [1, 1764919478917],
    memberIds: [2, 3, 4, 5],
    updatedAt: "2025-01-01T12:00:00.000Z",
  },
  {
    id: 2,
    name: "CS 면접 대비반",
    description: "네트워크/OS/DB 이론 복습 스터디",
    memberCount: 5,
    visibility: "PRIVATE",
    ownerId: 2,
    managerIds: [2],
    memberIds: [3, 4, 5, 1764919478917],
    updatedAt: "2025-01-03T09:30:00.000Z",
  },
  {
    id: 3,
    name: "사내 해커톤 팀",
    description: "사내 해커톤 준비용 그룹",
    memberCount: 7,
    visibility: "PRIVATE",
    ownerId: 3,
    managerIds: [3, 1764919478917],
    memberIds: [4, 5, 6, 7, 8],
    updatedAt: "2025-01-03T09:30:00.000Z",
  },
];

const LOCAL_GROUP_DB = ref([...MOCK_GROUPS]);

export async function mockFetchGroups() {
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
export async function mockLeaveGroup(groupId) {
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
export async function mockCreateGroup(payload) {
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

  const now = new Date().toISOString();

  const ownerId =
    payload.ownerId ??
    (payload.managerIds && payload.managerIds.length > 0
      ? payload.managerIds[0]
      : null);

  const newGroup = {
    id: Date.now(), // Mock용 ID
    name: payload.title,
    description: payload.description || "",
    visibility: payload.visibility || "PRIVATE",
    ownerId,
    managerIds: [...(payload.managerIds || [])],
    memberIds: [...(payload.memberIds || [])],
    memberCount: memberIdSet.size,
    updatedAt: now,
  };

  LOCAL_GROUP_DB.value = [newGroup, ...LOCAL_GROUP_DB.value];
  groups.value = [...LOCAL_GROUP_DB.value];

  console.log("[Mock] POST /api/v1/groups payload:", payload);
  console.log("[Mock] 새 그룹 생성 완료:", newGroup);

  return newGroup;
}

// 그룹 하나 상세 조회 (GET /api/v1/groups/{groupId} mock)
export async function mockFetchGroupById(groupId) {
  const numericId = Number(groupId);
  const found = LOCAL_GROUP_DB.value.find((g) => g.id === numericId);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (found) {
        console.log(`[Mock] 그룹 ${numericId} 상세 조회 성공`, found);
        resolve(found);
      } else {
        console.error(`[Mock] 그룹 ${numericId}를 찾을 수 없습니다.`);
        reject(new Error("Group Not Found"));
      }
    }, 300);
  });
}

// 그룹 수정 (PUT /api/v1/groups/{groupId} mock)
export async function mockUpdateGroup(groupId, payload) {
  // payload:
  // { title, description, visibility, managerIds, memberIds }
  const numericId = Number(groupId);
  const index = LOCAL_GROUP_DB.value.findIndex((g) => g.id === numericId);

  if (index === -1) {
    console.error(`[Mock] 수정할 그룹 ${numericId}을(를) 찾을 수 없습니다.`);
    throw new Error("Group Not Found");
  }

  const memberIdSet = new Set([
    ...(payload.memberIds || []),
    ...(payload.managerIds || []),
  ]);

  const now = new Date().toISOString();

  const updated = {
    ...LOCAL_GROUP_DB.value[index],
    name: payload.title,
    description: payload.description || "",
    visibility: payload.visibility || "PRIVATE",
    managerIds: [...(payload.managerIds || [])],
    memberIds: [...(payload.memberIds || [])],
    memberCount: memberIdSet.size,
    updatedAt: now,
  };

  LOCAL_GROUP_DB.value.splice(index, 1, updated);
  groups.value = [...LOCAL_GROUP_DB.value];

  console.log(`[Mock] 그룹 ${numericId} 수정 완료`, updated);

  return updated;
}

export async function mockChangeGroupOwner(
  groupId,
  { requesterId, newOwnerId },
) {
  const numericId = Number(groupId);
  const index = LOCAL_GROUP_DB.value.findIndex((g) => g.id === numericId);

  if (index === -1) {
    console.error(
      `[Mock] 소유자 변경 대상 그룹 ${numericId}을(를) 찾을 수 없습니다.`,
    );
    throw new Error("Group Not Found");
  }

  const prev = LOCAL_GROUP_DB.value[index];

  // (mock이니까 간단히) requesterId === prev.ownerId 인지만 체크
  if (requesterId && prev.ownerId && requesterId !== prev.ownerId) {
    console.warn("[Mock] 소유자만 소유권을 변경할 수 있습니다.");
    // 실제라면 403 에러 등으로 처리
  }

  // 새 소유자는 그룹 멤버여야 한다고 가정
  const allMemberIds = new Set([
    ...(prev.memberIds || []),
    ...(prev.managerIds || []),
  ]);
  if (!allMemberIds.has(newOwnerId)) {
    throw new Error("New owner must be a member of the group");
  }

  // 새 소유자도 manager로 승급
  const managerIds = new Set(prev.managerIds || []);
  managerIds.add(newOwnerId);

  const updated = {
    ...prev,
    ownerId: newOwnerId,
    managerIds: [...managerIds],
    updatedAt: new Date().toISOString(),
  };

  LOCAL_GROUP_DB.value.splice(index, 1, updated);
  groups.value = [...LOCAL_GROUP_DB.value];

  console.log(
    `[Mock] 그룹 ${numericId} 소유자 변경 완료: ${prev.ownerId} -> ${newOwnerId}`,
    updated,
  );

  return updated;
}
