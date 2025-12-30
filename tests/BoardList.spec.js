import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";

// =======================
// 0) feedback mocks
// =======================
vi.mock("@/lib/feedback/confirm", () => ({
  __esModule: true,
  confirm: vi.fn(),
}));

vi.mock("@/lib/feedback/toast", () => ({
  __esModule: true,
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  toasts: { value: [] },
}));

// =======================
// 1) vue-router mock
// =======================
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ params: { groupId: 1 } }),
}));

// =======================
// 2) authStore mock
//    - 로그인 유저: id = 1 (owner)
// =======================
vi.mock("@/data/authStore", () => {
  const user = ref({
    id: 1,
    name: "테스트 유저",
  });
  const isAuthenticated = ref(true);

  return {
    useAuthStore: () => ({
      user,
      isAuthenticated,
    }),
  };
});

// =======================
// 3) groupStore mock
//    - ownerId = 1 → canManageBoards = true
// =======================
vi.mock("@/data/groupStore", () => {
  const fetchGroupById = vi.fn(async (groupId) => ({
    id: groupId,
    name: "테스트 그룹",
    ownerId: 1, // 테스트 유저가 owner
    managerIds: [1],
    memberIds: [1, 2, 3],
  }));

  return {
    fetchGroupById,
  };
});

// =======================
// 4) boardStore mock
// =======================
vi.mock("@/data/boardStore", () => {
  const boards = ref([]);

  const deleteBoard = vi.fn(({ boardId }) => {
    boards.value = boards.value.filter((b) => b.id !== boardId);
  });

  const fetchBoards = vi.fn(async () => {
    // 실제라면 서버 요청, 테스트에선 no-op
    return;
  });

  return {
    boards,
    deleteBoard,
    fetchBoards,
  };
});

// =======================
// 5) SUT & mocked exports import
//    - mock 선언 이후에 import
// =======================
import BoardList from "@/components/BoardList.vue";
import {
  boards as boardsRef,
  deleteBoard as deleteBoardMock,
  fetchBoards as fetchBoardsMock,
} from "@/data/boardStore";
import { fetchGroupById as fetchGroupByIdMock } from "@/data/groupStore";
import { useAuthStore } from "@/data/authStore";
import { confirm as confirmMock } from "@/lib/feedback/confirm";

describe("BoardList.vue", () => {
  beforeEach(() => {
    // 각 테스트 시작 전에 mock 상태 초기화
    const auth = useAuthStore();
    auth.user.value = {
      id: 1,
      name: "테스트 유저",
    };
    auth.isAuthenticated.value = true;

    boardsRef.value = [
      {
        id: 1,
        title: "알고리즘 스터디 1차",
        deadline: "2099-01-01", // 진행중
        problemsCount: 3,
      },
      {
        id: 2,
        title: "알고리즘 스터디 2차 (종료)",
        deadline: "2000-01-01", // 지난 보드
        problemsCount: 5,
      },
    ];

    deleteBoardMock.mockClear();
    fetchBoardsMock.mockClear();
    pushMock.mockClear();
    fetchGroupByIdMock.mockClear();
    confirmMock.mockReset();
  });

  it("마운트 시 fetchBoards가 groupId와 함께 호출된다", async () => {
    mount(BoardList);
    await flushPromises();

    expect(fetchGroupByIdMock).toHaveBeenCalledWith(1, { requesterId: 1 });
    expect(fetchBoardsMock).toHaveBeenCalledWith(1);
  });

  it("기본 탭에서는 진행 중 보드만 보여준다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const items = wrapper.findAll("li.group");
    // 진행중 보드 1개만 렌더링
    expect(items.length).toBe(1);
    expect(wrapper.text()).toContain("알고리즘 스터디 1차");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 2차 (종료)");
  });

  it("탭 전환 시 지난 보드가 보여진다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const pastTabButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("지난 보드"));

    await pastTabButton.trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("알고리즘 스터디 2차 (종료)");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 1차");
  });

  it("검색어 입력 시 제목에 해당 문자열이 포함된 보드만 보인다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const input = wrapper.get("input[type='text']");
    await input.setValue("1차");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("알고리즘 스터디 1차");
    expect(wrapper.text()).not.toContain("알고리즘 스터디 2차 (종료)");
  });

  it("보드 만들기 버튼 클릭 시 BoardCreate 라우트로 이동한다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const createButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("+ 보드 만들기"));

    expect(createButton).toBeTruthy();

    await createButton.trigger("click");

    expect(pushMock).toHaveBeenCalledWith({
      name: "BoardCreate",
      params: { groupId: 1 },
    });
  });

  it("수정 버튼 클릭 시 BoardEdit 라우트로 이동한다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const firstItem = wrapper.find("li.group");
    const editButton = firstItem
      .findAll("button")
      .find((btn) => btn.text().includes("수정"));

    expect(editButton).toBeTruthy();

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
    confirmMock.mockResolvedValue(true);

    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const firstItem = wrapper.find("li.group");
    const deleteButton = firstItem
      .findAll("button")
      .find((btn) => btn.text().includes("삭제"));

    expect(deleteButton).toBeTruthy();

    await deleteButton.trigger("click");
    await flushPromises();
    await nextTick();

    // 1) 동작 검증
    expect(confirmMock).toHaveBeenCalled();
    expect(deleteBoardMock).toHaveBeenCalledWith({
      groupId: 1,
      boardId: 1,
      requesterId: 1,
    });
    expect(fetchBoardsMock).toHaveBeenCalledWith(1);

    // 2) store 상태에서 사라졌는지
    expect(boardsRef.value.some((b) => b.id === 1)).toBe(false);

    // 3) DOM에서도 사라졌는지
    expect(wrapper.text()).not.toContain("알고리즘 스터디 1차");
  });

  it("권한이 없는 사용자는 보드 만들기/수정/삭제 버튼을 볼 수 없다", async () => {
    // 🔁 authStore의 user를 owner/manager가 아닌 아이디로 변경
    const auth = useAuthStore();
    auth.user.value = { id: 999, name: "일반 유저" };

    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    // 상단의 '+ 보드 만들기' 버튼이 없어야 함
    const createButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("+ 보드 만들기"));
    expect(createButton).toBeUndefined();

    // 카드 안에 '수정', '삭제' 텍스트도 없어야 함
    // (card 자체를 눌러 이동하는 버튼은 그대로 있음)
    expect(wrapper.text()).not.toContain("수정");
    expect(wrapper.text()).not.toContain("삭제");
  });

  it("지난 보드 탭에서는 수정 버튼이 표시되지 않고 삭제 버튼만 남는다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    // '지난 보드' 탭 클릭
    const pastTabButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("지난 보드"));
    await pastTabButton.trigger("click");
    await flushPromises();
    await nextTick();

    const pastItem = wrapper.find("li.group");
    expect(pastItem.exists()).toBe(true);

    // 지난 보드 카드에는 '수정' 버튼이 없어야 함
    const editBtn = pastItem
      .findAll("button")
      .find((btn) => btn.text().includes("수정"));
    expect(editBtn).toBeUndefined();

    // 대신 '삭제' 버튼은 있어야 함
    const deleteBtn = pastItem
      .findAll("button")
      .find((btn) => btn.text().includes("삭제"));
    expect(deleteBtn).toBeTruthy();
  });

  it("탭의 배지 숫자가 진행/지난 보드 개수와 일치한다", async () => {
    const wrapper = mount(BoardList);
    await flushPromises();
    await nextTick();

    const activeTabButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("진행 중인 보드"));
    const pastTabButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("지난 보드"));

    // boardsRef 초기값에서 진행중: 1개, 지난 보드: 1개
    expect(activeTabButton.text()).toContain("1");
    expect(pastTabButton.text()).toContain("1");
  });
});
