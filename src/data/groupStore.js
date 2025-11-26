import { ref } from "vue";

/**
 *   그룹 리스트
 *   추후에는 여기도 백엔드 API(예: GET /api/v1/groups) 로 교체될 예정.
 */
export const groups = ref([
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
]);

export async function fetchGroups() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[API Mock] 그룹 목록 조회 성공");
      resolve(groups.value);
    }, 300);
  });
}
