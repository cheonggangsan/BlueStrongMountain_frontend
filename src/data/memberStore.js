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
 * 멤버 검색
 */
export async function searchMembers(keyword) {
  const result = await memberService.searchMembers(keyword);
  return result;
}
