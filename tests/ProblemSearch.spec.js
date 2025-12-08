import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProblemSearch from "../src/components/ProblemSearch.vue";
import { problemService } from "@/services/problemService";

describe("ProblemSearch.vue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("검색 결과 카드를 클릭하면 add-problem 이벤트를 발생시킨다", async () => {
    // 검색 API가 돌려줄 문제 mock
    const problem = {
      id: 123,
      title: "테스트 문제",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
    };

    vi.spyOn(problemService, "searchWithConditions").mockResolvedValue([
      problem,
    ]);

    const wrapper = mount(ProblemSearch);

    // 1) 문제 번호 입력 (SearchFilters 안의 input)
    await wrapper.find("input[type='number']").setValue("123");

    // 2) "검색" 버튼 클릭
    const buttons = wrapper.findAll("button");
    const searchButton = buttons.find((btn) => btn.text() === "검색");

    expect(searchButton).toBeTruthy();
    await searchButton.trigger("click");

    // 비동기 검색 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 3) 결과 카드가 렌더링 되었는지 확인
    const card = wrapper.find(".problem-card");
    expect(card.exists()).toBe(true);

    // 4) 카드 클릭 → add-problem 이벤트 발생 여부 확인
    await card.trigger("click");

    const emits = wrapper.emitted("add-problem");
    expect(emits).toBeTruthy();
    expect(emits[0][0]).toEqual(problem);
  });
});
