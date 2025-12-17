import { ref } from "vue";
import { groupService } from "@/services/groupService";

export const groups = ref([]);

/**
 * 그룹 목록 조회
 * @param {{ requesterId?: number, name?: string }} options
 */
export async function fetchGroups(options = {}) {
  const list = await groupService.fetchGroups(options);
  groups.value = [...list];
  return groups.value;
}

/**
 * 현재 로그인한 사용자가 그룹에서 탈퇴
 * - mock/real 모두 여기서 state 제거까지 처리
 */
export async function leaveGroup(groupId, options = {}) {
  const numericId = Number(groupId);

  await groupService.leaveGroup(numericId, options);

  // 로컬 상태에서도 제거
  groups.value = groups.value.filter((g) => g.id !== numericId);
}

/**
 * 새 그룹 생성
 *
 * - mock 모드:
 *    groupService.createGroup → 새 그룹 객체 반환
 *    → 여기서 groups 앞에 unshift
 * - real 모드:
 *    BasicResponse { success } 형태면 state는 건드리지 않고
 *    호출자(뷰)에서 fetchGroups를 다시 호출하는 패턴 추천
 */
export async function createGroup(payload) {
  const newGroup = await groupService.createGroup(payload);

  if (newGroup && typeof newGroup === "object" && "id" in newGroup) {
    // mock 모드일 때만 동작 (newGroup가 실제 그룹 객체인 경우)
    groups.value = [newGroup, ...groups.value];
  }

  return newGroup;
}

/**
 * 그룹 하나 상세 조회
 */
export async function fetchGroupById(groupId, options = {}) {
  return groupService.fetchGroupById(groupId, options);
}

/**
 * 그룹 수정
 */
export async function updateGroup(groupId, payload) {
  const updated = await groupService.updateGroup(groupId, payload);

  // mock 모드(그룹 객체 반환) 일 때만 state 반영
  if (updated && typeof updated === "object" && "id" in updated) {
    const numericId = Number(groupId);
    const index = groups.value.findIndex((g) => g.id === numericId);

    if (index !== -1) {
      groups.value.splice(index, 1, updated);
    }
  }

  return updated;
}

/**
 * 그룹 소유자 변경
 */
export async function changeGroupOwner(groupId, { requesterId, newOwnerId }) {
  const updated = await groupService.changeGroupOwner(groupId, {
    requesterId,
    newOwnerId,
  });

  if (updated && typeof updated === "object" && "id" in updated) {
    const numericId = Number(groupId);
    const index = groups.value.findIndex((g) => g.id === numericId);

    if (index !== -1) {
      groups.value.splice(index, 1, updated);
    }
  }

  return updated;
}

/**
 * 그룹 사용자 목록 조회
 */
export async function fetchGroupUsers(groupId, options = {}) {
  return groupService.fetchGroupUsers(groupId, options);
}
