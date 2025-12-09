import { apiMode } from "@/config/apiMode";
import * as memberApi from "@/api/memberApi";
import { MOCK_MEMBERS, mockSearchMembers } from "@/mocks/member.mock";

const USE_MOCK_MEMBER = apiMode.member === "mock";

export const memberService = {
  async fetchInitialMembers(limit = 10) {
    if (USE_MOCK_MEMBER) {
      return MOCK_MEMBERS.slice(0, limit);
    }
    // real: 빈 검색으로 전체 또는 상위 N명 가져오기
    const data = await memberApi.searchMembers("");
    return Array.isArray(data) ? data.slice(0, limit) : [];
  },

  async searchMembers(keyword) {
    if (USE_MOCK_MEMBER) {
      return mockSearchMembers(keyword);
    }
    return memberApi.searchMembers(keyword);
  },
};
