// tests/ProblemBoard.spec.js
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextTick } from "vue";
import ProblemBoard from "../src/components/ProblemBoard.vue";
import { problemService } from "@/services/problemService";

// 1) vue-router mock
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(), // 나중에 원하면 push 호출 여부도 검증 가능
  }),
  useRoute: () => ({
    params: {}, // create 모드라 boardId 없음
  }),
}));

// 2) boardStore mock (addBoard, fetchBoards 등)
vi.mock("../src/data/boardStore", () => ({
  addBoard: vi.fn(),
  updateBoard: vi.fn(),
  fetchBoards: vi.fn(),
  fetchBoardById: vi.fn(),
}));

describe("ProblemBoard.vue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("게시 버튼 클릭 시 postBoard 를 올바른 payload 로 호출한다", async () => {
    // postBoard 모킹
    const mockPost = vi
      .spyOn(problemService, "postBoard")
      .mockResolvedValue({ id: 999, success: true });

    const wrapper = mount(ProblemBoard, {
      global: {
        // 3) 자식 컴포넌트들은 stub 으로 단순화
        stubs: {
          ProblemSearch: {
            template: "<div />",
          },
          SelectedProblemsPanel: {
            template: "<div />",
            props: ["problems"],
          },
          // BoardHeader 는 submit 이벤트만 내보내는 버튼으로 대체
          BoardHeader: {
            template: `
              <div>
                <button data-test="submit" @click="$emit('submit')">
                  게시
                </button>
              </div>
            `,
            props: ["title", "deadline", "canPost", "isPosting", "buttonText"],
          },
        },
      },
    });

    const vm = wrapper.vm;

    // 4) 제목, 선택된 문제를 직접 주입 (Composition API 이므로 vm 사용)
    vm.title = "테스트 세션";
    vm.selectedProblems.push(
      {
        id: 1,
        title: "A",
        difficulty: "Gold 5",
        tags: [],
        acceptedUserCount: 1,
      },
      {
        id: 2,
        title: "B",
        difficulty: "Gold 4",
        tags: [],
        acceptedUserCount: 1,
      },
    );

    await nextTick(); // canPost 등 계산 반영

    // 5) BoardHeader stub 의 submit 버튼 클릭 → ProblemBoard 의 handleSubmit → handlePost 실행
    const submitButton = wrapper.get('[data-test="submit"]');
    await submitButton.trigger("click");
    await nextTick();

    // 6) postBoard 호출 검증
    expect(mockPost).toHaveBeenCalledTimes(1);

    const payload = mockPost.mock.calls[0][0];
    expect(payload.title).toBe("테스트 세션");
    expect(payload.deadline).toBeNull(); // deadline 안 넣었으니 null
    expect(payload.problems).toEqual([
      { id: 1, order: 1 },
      { id: 2, order: 2 },
    ]);
  });
});
