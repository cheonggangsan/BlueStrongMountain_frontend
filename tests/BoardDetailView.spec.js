import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";

// =======================
// 1) vue-router mock
// =======================
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({
    params: {
      groupId: 1,
      boardId: 10,
    },
  }),
}));

// =======================
// 2) authStore mock
// =======================
vi.mock("@/data/authStore", () => {
  const user = ref({
    id: 1,
    name: "이알고",
    nickname: "algoLee",
  });

  return {
    useAuthStore: () => ({ user }),
  };
});

// =======================
// 3) memberStore mock
// =======================
vi.mock("@/data/memberStore", () => {
  const members = ref([
    { id: 1, name: "이알고", nickname: "algoLee" },
    { id: 2, name: "달피곰", nickname: "baekjoonPark" },
    { id: 3, name: "집에갈까요", nickname: "campChoi" },
  ]);

  return { members };
});

// =======================
// 4) groupStore mock
// =======================
vi.mock("@/data/groupStore", () => {
  const fetchGroupById = vi.fn();
  return { fetchGroupById };
});

// =======================
// 5) boardStore mock
// =======================
vi.mock("@/data/boardStore", () => {
  const fetchBoardById = vi.fn();
  return { fetchBoardById };
});

// =======================
// 6) boardApi mock
// =======================
vi.mock("@/api/boardApi", () => {
  const getBoardUserStatus = vi.fn();
  return { getBoardUserStatus };
});

// =======================
// 7) SUT & mocks import
// =======================
import BoardDetailView from "@/views/BoardDetailView.vue";
import { useAuthStore as useAuthStoreMock } from "@/data/authStore";
import { members as membersRef } from "@/data/memberStore";
import { fetchGroupById as fetchGroupByIdMock } from "@/data/groupStore";
import { fetchBoardById as fetchBoardByIdMock } from "@/data/boardStore";
import { getBoardUserStatus as getBoardUserStatusMock } from "@/api/boardApi";

// 공통 더미 데이터
const sampleGroup = {
  id: 1,
  name: "CS 면접 대비반",
  ownerId: 1,
  managerIds: [1],
  memberIds: [1, 2, 3],
};

const sampleBoard = {
  id: 10,
  title: "2023년 상반기 회고",
  deadline: "2099-12-31",
  problems: [
    { id: 1008, title: "A@B" },
    { id: 1009, title: "A#B" },
  ],
};

const sampleStatus = {
  problemStatus: [
    { problemId: 1008, solvedUsers: [1, 2] },
    { problemId: 1009, solvedUsers: [1, 3] },
  ],
  userStatus: [
    { userId: 1, solvedProblems: [1008, 1009] },
    { userId: 2, solvedProblems: [1008] },
    { userId: 3, solvedProblems: [1009] },
  ],
};

// 공통 성공 mock 세팅
function setupSuccessMocks() {
  fetchGroupByIdMock.mockResolvedValue(sampleGroup);
  fetchBoardByIdMock.mockResolvedValue(sampleBoard);
  getBoardUserStatusMock.mockResolvedValue(sampleStatus);
}

describe("BoardDetailView.vue", () => {
  beforeEach(() => {
    // auth 초기화
    const auth = useAuthStoreMock();
    auth.user.value = {
      id: 1,
      name: "이알고",
      nickname: "algoLee",
    };

    // members 초기화
    membersRef.value = [
      { id: 1, name: "이알고", nickname: "algoLee" },
      { id: 2, name: "달피곰", nickname: "baekjoonPark" },
      { id: 3, name: "집에갈까요", nickname: "campChoi" },
    ];

    fetchGroupByIdMock.mockReset();
    fetchBoardByIdMock.mockReset();
    getBoardUserStatusMock.mockReset();
    pushMock.mockReset();
  });

  it("마운트 시 그룹/보드/상태 API 를 호출하고 헤더 정보와 통계가 렌더링된다", async () => {
    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    expect(fetchGroupByIdMock).toHaveBeenCalledWith(1);
    expect(fetchBoardByIdMock).toHaveBeenCalledWith(10);
    expect(getBoardUserStatusMock).toHaveBeenCalledWith(1, 10);

    expect(wrapper.text()).toContain("2023년 상반기 회고");
    expect(wrapper.text()).toContain("CS 면접 대비반");
    expect(wrapper.text()).toContain("문제 2개");
    expect(wrapper.text()).toContain("참여 3명");

    // 평균 완료율: 4 / (2문제 * 3명) = 66.7 → 67%
    expect(wrapper.text()).toContain("전체 평균 완료율");
    expect(wrapper.text()).toContain("67%");

    // 내 완료율: 2 / 2 = 100%
    expect(wrapper.text()).toContain("내 완료율");
    expect(wrapper.text()).toContain("100%");
  });

  it("API 에러 발생 시 에러 메시지를 보여준다", async () => {
    fetchGroupByIdMock.mockRejectedValue(new Error("network error"));
    fetchBoardByIdMock.mockResolvedValue(sampleBoard);
    getBoardUserStatusMock.mockResolvedValue(sampleStatus);

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    expect(wrapper.text()).toContain(
      "보드 정보를 불러오는 중 오류가 발생했습니다.",
    );
  });

  it("문제 기준 보기에서 문제 x 사용자 매트릭스를 렌더링한다", async () => {
    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    // 헤더에 참여 사용자 이름이 모두 보이는지
    const headerText = wrapper.find("thead").text();
    expect(headerText).toContain("이알고");
    expect(headerText).toContain("달피곰");
    expect(headerText).toContain("집에갈까요");

    const firstRow = wrapper.find("tbody tr");
    const cells = firstRow.findAll("td");

    // 첫 번째 문제는 1008 (A@B)
    expect(cells[0].text()).toContain("A@B");

    // user1, user2 풀었고 user3는 못 풀었다 → ✅, ✅, ···
    expect(cells[1].text()).toContain("✅");
    expect(cells[2].text()).toContain("✅");
    expect(cells[3].text()).toContain("···");
  });

  it("사용자 기준 보기 탭 클릭 시 사용자 카드와 완료율이 렌더링된다", async () => {
    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    // 탭 전환
    const userTab = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("사용자 기준 보기"));
    await userTab.trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain(
      "각 사용자별로 이번 보드에서 어떤 문제를 풀었는지 확인할 수 있습니다.",
    );

    // 사용자 카드 이름
    const text = wrapper.text();
    expect(text).toContain("이알고");
    expect(text).toContain("달피곰");
    expect(text).toContain("집에갈까요");

    // 완료율: 100%, 50% 정도가 포함되어 있는지만 확인
    expect(text).toContain("100%");
    expect(text).toContain("50%");
  });

  it("내 현황만 보기 체크 시 현재 로그인 유저만 테이블에 표시된다", async () => {
    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    // 초기: 문제 + 3명 컬럼
    const thAll = wrapper.findAll("thead th");
    expect(thAll.length).toBe(4);

    const checkbox = wrapper.get("input[type='checkbox']");
    await checkbox.setValue(true);
    await flushPromises();
    await nextTick();

    const thAfter = wrapper.findAll("thead th");
    // 문제 + 나 1명
    expect(thAfter.length).toBe(2);

    const headerText = wrapper.find("thead").text();
    expect(headerText).toContain("이알고");
    expect(headerText).not.toContain("달피곰");
    expect(headerText).not.toContain("집에갈까요");
  });

  it("로그인하지 않은 경우 내 완료율 카드가 보이지 않고 '내 현황만 보기' 체크박스가 비활성화된다", async () => {
    // user 를 null 로 변경
    const auth = useAuthStoreMock();
    auth.user.value = null;

    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    // 내 완료율 카드가 없음
    expect(wrapper.text()).not.toContain("내 완료율");

    // 체크박스 disabled
    const checkbox = wrapper.get("input[type='checkbox']");
    expect(checkbox.attributes("disabled")).toBeDefined();
  });

  it("상단 '보드 목록으로' 버튼 클릭 시 BoardList 라우트로 이동한다", async () => {
    setupSuccessMocks();

    const wrapper = mount(BoardDetailView);
    await flushPromises();

    const backBtn = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("보드 목록으로"));

    await backBtn.trigger("click");

    expect(pushMock).toHaveBeenCalledWith({
      name: "BoardList",
      params: { groupId: 1 },
    });
  });
});
