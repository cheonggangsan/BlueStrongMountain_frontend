import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProblemSearch from "../src/components/ProblemSearch.vue";
import { problemService } from "@/services/problemService";

const SearchFiltersStub = {
  name: "SearchFilters",
  props: ["loading", "error", "resultCount"],
  template: `
    <div class="search-filters-stub">
      <span class="loading">{{ String(loading) }}</span>
      <span class="error">{{ error }}</span>
      <span class="resultCount">{{ String(resultCount) }}</span>
    </div>
  `,
};

function mountSubject(props = {}) {
  return mount(ProblemSearch, {
    props: {
      groupId: 1,
      selectedProblemIds: [],
      ...props,
    },
    global: {
      stubs: {
        SearchFilters: SearchFiltersStub,
      },
    },
  });
}

function emitSearch(wrapper, overrides = {}) {
  const baseFilter = {
    problemNo: "",
    mode: "general",
    difficultyFrom: "ALL",
    difficultyTo: "ALL",
    selectedTags: [],
    minSolved: "",
    unsolvedOnly: false,
    registeredBefore: "",
    aiRecommend: false,
    randomMode: false,
  };

  wrapper.findComponent({ name: "SearchFilters" }).vm.$emit("search", {
    ...baseFilter,
    ...overrides,
  });
}

function emitReset(wrapper) {
  wrapper.findComponent({ name: "SearchFilters" }).vm.$emit("reset");
}

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
      registeredAt: "2025-01-01",
      reviewCount: 0,
    };

    const spy = vi
      .spyOn(problemService, "filterProblems")
      .mockResolvedValue([problem]);

    const wrapper = mountSubject({ groupId: 1 });

    emitSearch(wrapper, { problemNo: "123", mode: "general" });
    await flushPromises();

    // 서비스 호출 payload가 제대로 매핑되었는지 확인
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 1,
        mode: "general",
        problemIds: [123],
        option: 0,
      }),
    );

    // 3) 결과 카드가 렌더링 되었는지 확인
    const card = wrapper.find(".problem-card");
    expect(card.exists()).toBe(true);

    // 4) 카드 클릭 → add-problem 이벤트 발생 여부 확인
    await card.trigger("click");

    const emits = wrapper.emitted("add-problem");
    expect(emits).toBeTruthy();
    expect(emits[0][0]).toEqual(problem);
  });

  it("selectedProblemIds에 포함된 문제는 검색 결과에서 숨긴다", async () => {
    const problem = {
      id: 123,
      title: "이미 선택된 문제",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
      registeredAt: "2025-01-01",
      reviewCount: 0,
    };

    vi.spyOn(problemService, "filterProblems").mockResolvedValue([problem]);

    const wrapper = mountSubject({
      groupId: 1,
      selectedProblemIds: [123],
    });

    emitSearch(wrapper, { problemNo: "123" });
    await flushPromises();

    // 결과는 있었지만 visibleResults에서 숨겨져서 카드가 없어야 함
    expect(wrapper.find(".problem-card").exists()).toBe(false);

    // error가 없고 visibleResults가 0이면 placeholder가 보여야 함
    expect(wrapper.text()).toContain("검색 결과가 여기에 표시됩니다.");
  });

  it("reset 이벤트가 오면 results/error를 초기화한다", async () => {
    // 검색 결과 0개 -> error = "조건에 맞는 문제가 없습니다."
    vi.spyOn(problemService, "filterProblems").mockResolvedValue([]);

    const wrapper = mountSubject({ groupId: 1 });

    emitSearch(wrapper, { problemNo: "99999" });
    await flushPromises();

    // SearchFilters로 전달되는 error가 세팅되었는지 확인(스텁 출력으로 검증)
    expect(wrapper.find(".search-filters-stub .error").text()).toBe(
      "조건에 맞는 문제가 없습니다.",
    );

    // reset
    emitReset(wrapper);
    await flushPromises();

    // 에러/결과 초기화
    expect(wrapper.find(".search-filters-stub .error").text()).toBe("");
    expect(wrapper.find(".problem-card").exists()).toBe(false);
    expect(wrapper.text()).toContain("검색 결과가 여기에 표시됩니다.");
  });

  it("review 모드: reviewCount가 있으면 reviewCount 내림차순 정렬한다", async () => {
    const p1 = {
      id: 1,
      title: "rc=2",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
      registeredAt: "2025-01-01",
      reviewCount: 2,
    };
    const p2 = {
      id: 2,
      title: "rc=5",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
      registeredAt: "2025-01-02",
      reviewCount: 5,
    };

    vi.spyOn(problemService, "filterProblems").mockResolvedValue([p1, p2]);

    const wrapper = mountSubject({ groupId: 1 });

    emitSearch(wrapper, { mode: "review" });
    await flushPromises();

    const ids = wrapper
      .findAll(".problem-card-id")
      .map((el) => el.text().replace("ID:", "").trim());

    // reviewCount 큰 것이 먼저
    expect(ids[0]).toBe("2");
    expect(ids[1]).toBe("1");
  });

  it("review 모드: reviewCount가 없으면 registeredAt 최신순 정렬한다", async () => {
    const oldOne = {
      id: 10,
      title: "old",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
      registeredAt: "2025-01-01",
      // reviewCount intentionally missing
    };
    const newOne = {
      id: 20,
      title: "new",
      difficulty: "Gold 5",
      tags: [],
      acceptedUserCount: 10,
      registeredAt: "2025-12-01",
      // reviewCount intentionally missing
    };

    vi.spyOn(problemService, "filterProblems").mockResolvedValue([
      oldOne,
      newOne,
    ]);

    const wrapper = mountSubject({ groupId: 1 });

    emitSearch(wrapper, { mode: "review" });
    await flushPromises();

    const firstId = wrapper
      .findAll(".problem-card-id")[0]
      .text()
      .replace("ID:", "")
      .trim();

    // registeredAt 최신(큰 날짜)이 먼저
    expect(firstId).toBe("20");
  });

  it("randomMode가 true일 때 option: 1을 전달한다", async () => {
    const spy = vi
      .spyOn(problemService, "filterProblems")
      .mockResolvedValue([]);

    const wrapper = mountSubject({ groupId: 1 });
    emitSearch(wrapper, { mode: "general", randomMode: true });
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        option: 1,
        randomMode: true,
      }),
    );
  });

  it("aiRecommend가 true일 때 option: 2를 전달한다", async () => {
    const spy = vi
      .spyOn(problemService, "filterProblems")
      .mockResolvedValue([]);

    const wrapper = mountSubject({ groupId: 1 });
    emitSearch(wrapper, { mode: "general", aiRecommend: true });
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        option: 2,
        aiRecommend: true,
      }),
    );
  });
});
