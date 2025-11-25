// tests/BoardList.spec.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { mount, flushPromises } from "@vue/test-utils";

// --- 모듈 목킹 ---
// vue-router mock
const pushMock = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useRoute: () => ({
    params: {
      groupId: 1,
    },
  }),
}));

// boardStore mock
vi.mock("/src/data/boardStore", () => {
  const boards = ref([]);

  const deleteBoard = vi.fn((id) => {
    boards.value = boards.value.filter((b) => b.id !== id);
  });

  const fetchBoards = vi.fn();

  return {
    boards,
    deleteBoard,
    fetchBoards,
  };
});

// 컴포넌트는 mock 선언 이후에 import 해야 함
import BoardList from "../src/components/BoardList.vue";
import {
  boards as boardsRef,
  deleteBoard as deleteBoardMock,
  fetchBoards as fetchBoardsMock,
} from "../src/data/boardStore";

describe("BoardList.vue", () => {
  beforeEach(() => {
    boardsRef.value = [
      {
        id: 1,
        title: "알고리즘 스터디 1차",
        deadline: "2099-01-01",
        problemsCount: 3,
      },
      {
        id: 2,
        title: "알고리즘 스터디 2차 (종료)",
        deadline: "2000-01-01",
        problemsCount: 5,
      },
    ];

    fetchBoardsMock.mockReset();
    fetchBoardsMock.mockImplementation(async () => {});
    deleteBoardMock.mockClear();
    pushMock.mockClear();
  });

  it("마운트 시 fetchBoards가 groupId와 함께 호출된다", async () => {
    mount(BoardList);
    await flushPromises();

    expect(fetchBoardsMock).toHaveBeenCalledTimes(1);
    expect(fetchBoardsMock).toHaveBeenCalledWith(1);
  });

  it("기본 탭에서는 진행 중 보드만 보여준다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();

    const items = wrapper.findAll("li.group");
    // 진행중 보드 1개만 렌더링되어야 함
    expect(items.length).toBe(1);
    expect(wrapper.text()).toContain("알고리즘 스터디 1차");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 2차 (종료)");
  });

  it("탭 전환 시 지난 보드가 보여진다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();

    // "지난 보드" 탭 클릭
    const pastTabButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("지난 보드"));
    await pastTabButton.trigger("click");

    await flushPromises();

    expect(wrapper.text()).toContain("알고리즘 스터디 2차 (종료)");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 1차");
  });

  it("검색어 입력 시 제목에 해당 문자열이 포함된 보드만 보인다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();

    const input = wrapper.get("input[type='text']");
    // 진행중 탭 상태에서 "1차"로 검색
    await input.setValue("1차");
    await flushPromises();

    expect(wrapper.text()).toContain("알고리즘 스터디 1차");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 2차 (종료)");
  });

  it("보드 만들기 버튼 클릭 시 BoardCreate 라우트로 이동한다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();

    const createButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("보드 만들기"));

    await createButton.trigger("click");

    expect(pushMock).toHaveBeenCalledWith({ name: "BoardCreate" });
  });

  it("수정 버튼 클릭 시 BoardEdit 라우트로 이동한다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();

    const editButton = wrapper
      .find("li.group")
      .findAll("button")
      .find((btn) => btn.text().includes("수정"));

    await editButton.trigger("click");

    expect(pushMock).toHaveBeenCalledWith({
      name: "BoardEdit",
      params: {
        groupId: 1,
        boardId: 1,
      },
    });
  });

  it("삭제 버튼 클릭 시 confirm 통과하면 deleteBoard와 fetchBoards가 호출된다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const wrapper = mount(BoardList);
    await flushPromises();

    const deleteButton = wrapper
      .find("li.group")
      .findAll("button")
      .find((btn) => btn.text().includes("삭제"));

    await deleteButton.trigger("click");
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteBoardMock).toHaveBeenCalledWith(1);
    expect(fetchBoardsMock).toHaveBeenCalledWith(1);

    // 실제로 리스트에서 1번 보드가 제거되었는지도 확인
    expect(wrapper.text()).not.toContain("알고리즘 스터디 1차");

    confirmSpy.mockRestore();
  });
});
