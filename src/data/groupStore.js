import { ref } from "vue";
import { groupService } from "@/services/groupService";

export const groups = ref([]);

/**
 *   그룹 목록 조회
 */
export async function fetchGroups() {
  const list = await groupService.fetchGroups();
  groups.value = [...list];
  return groups.value;
}

/**
 * 현재 로그인한 사용자가 그룹에서 탈퇴
 */
export async function leaveGroup(groupId) {
  const numericId = Number(groupId);
  await groupService.leaveGroup(numericId);
  groups.value = groups.value.filter((g) => g.id !== numericId);
}

/**
 * 새 그룹 생성
 */
export async function createGroup(payload) {
  const newGroup = await groupService.createGroup(payload);
  groups.value = [newGroup, ...groups.value];
  return newGroup;
}

/**
 * 그룹 하나 상세 조회
 */
export async function fetchGroupById(groupId) {
  return groupService.fetchGroupById(groupId);
}

/**
 * 그룹 수정
 */
export async function updateGroup(groupId, payload) {
  const updated = await groupService.updateGroup(groupId, payload);

  const numericId = Number(groupId);
  const index = groups.value.findIndex((g) => g.id === numericId);

  if (index === -1) {
    groups.value.splice(index, 1, updated);
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

  const numericId = Number(groupId);
  const index = groups.value.findIndex((g) => g.id === numericId);

  if (index === -1) {
    groups.value.splice(index, 1, updated);
  }

  return updated;
}
