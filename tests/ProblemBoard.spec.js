import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextTick } from "vue";
import ProblemBoard from "../src/components/ProblemBoard.vue";
import { problemService } from "@/services/problemService";
import { addBoard, fetchBoards } from "../src/data/boardStore";

// 1) vue-router mock
const pushMock = vi.fn();
let routeParams = { groupId: "1" };

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: routeParams }),
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
    pushMock.mockReset();
    Object.assign(routeParams, { groupId: "1" }); // 기본은 create 모드
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
            name: "ProblemSearch",
            props: ["groupId", "selectedProblemIds"],
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

  it("ProblemSearch에 groupId를 전달한다", async () => {
    const wrapper = mount(ProblemBoard, {
      global: {
        stubs: {
          ProblemSearch: {
            name: "ProblemSearch",
            props: ["groupId", "selectedProblemIds"],
            template: "<div />",
          },
          SelectedProblemsPanel: { template: "<div />", props: ["problems"] },
          BoardHeader: { template: "<div />" },
        },
      },
    });

    const ps = wrapper.findComponent({ name: "ProblemSearch" });
    expect(ps.exists()).toBe(true);
    expect(ps.props("groupId")).toBe(1);
  });

  it("게시 성공 시 addBoard/fetchBoards/router.push를 groupId로 호출한다", async () => {
    vi.spyOn(problemService, "postBoard").mockResolvedValue({
      id: 999,
      success: true,
    });

    const wrapper = mount(ProblemBoard, {
      global: {
        stubs: {
          ProblemSearch: {
            name: "ProblemSearch",
            props: ["groupId", "selectedProblemIds"],
            template: "<div />",
          },
          SelectedProblemsPanel: { template: "<div />", props: ["problems"] },
          BoardHeader: {
            template: `<button data-test="submit" @click="$emit('submit')">게시</button>`,
          },
        },
      },
    });

    // title/selectedProblems 세팅
    wrapper.vm.title = "테스트 세션";
    wrapper.vm.selectedProblems.push({ id: 1 }, { id: 2 });

    await nextTick();

    await wrapper.get('[data-test="submit"]').trigger("click");
    await nextTick();
    await flushPromises();

    expect(addBoard).toHaveBeenCalledTimes(1);
    expect(addBoard).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 1, id: 999, title: "테스트 세션" }),
    );

    expect(fetchBoards).toHaveBeenCalledTimes(1);
    expect(fetchBoards).toHaveBeenCalledWith(1);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith({
      name: "BoardList",
      params: { groupId: 1 },
    });
  });

  it("title/selectedProblems가 부족하면 postBoard를 호출하지 않는다", async () => {
    const postSpy = vi
      .spyOn(problemService, "postBoard")
      .mockResolvedValue({ id: 1 });

    const wrapper = mount(ProblemBoard, {
      global: {
        stubs: {
          ProblemSearch: { template: "<div />" },
          SelectedProblemsPanel: { template: "<div />", props: ["problems"] },
          BoardHeader: {
            template: `<button data-test="submit" @click="$emit('submit')">게시</button>`,
          },
        },
      },
    });

    // 아무것도 세팅 안함 -> canPost=false
    await wrapper.get('[data-test="submit"]').trigger("click");
    await nextTick();

    expect(postSpy).not.toHaveBeenCalled();
  });
});
