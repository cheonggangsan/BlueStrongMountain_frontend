import { ref } from "vue";
import { memberService } from "@/services/memberService";

export const members = ref([]);

/**
 * 초기 멤버 목록 채우기
 */
export async function initMembers(limit = 10) {
  const list = await memberService.fetchInitialMembers(limit);
  members.value = [...list];
  return members.value;
}

/**
 * 필요할 때 한 번만 멤버 로딩
 */
export async function ensureMembersLoaded(limit = 1000) {
  if (members.value.length > 0) {
    return members.value;
  }
  return initMembers(limit);
}

/**
 * 멤버 검색
 */
export async function searchMembers(keyword) {
  const result = await memberService.searchMembers(keyword);
  return result;
}
