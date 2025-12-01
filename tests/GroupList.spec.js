import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import GroupList from "../src/components/group/GroupList.vue";

// ----------------------
// 1) vue-router mock
// ----------------------
// var 를 쓰는 이유: vi.mock 팩토리가 호이스팅되면서
// const/let 는 TDZ 에 걸려서 ReferenceError가 나기 때문.
var routerPushMock;

vi.mock("vue-router", () => {
  routerPushMock = vi.fn();
  return {
    useRouter: () => ({
      push: routerPushMock,
    }),
  };
});

// ----------------------
// 2) groupStore mock
// ----------------------
// 실제 src/data/groupStore.js 대신 여기서 ref + 함수들을 제공
vi.mock("../src/data/groupStore", () => {
  const groups = ref([
    {
      id: 1,
      name: "1조 알고리즘 스터디",
      description: "골드 5 ~ 골드 3 위주, 주 3회 모임",
      memberCount: 5,
    },
    {
      id: 2,
      name: "CS 면접 대비반",
      description: "네트워크/OS/DB 이론 복습 스터디",
      memberCount: 4,
    },
    {
      id: 3,
      name: "사내 해커톤 팀",
      description: "사내 해커톤 준비용 그룹",
      memberCount: 6,
    },
  ]);

  // 스냅샷 하나 떠두고, fetchGroups 호출 때마다 리셋
  const snapshot = JSON.parse(JSON.stringify(groups.value));

  const fetchGroups = vi.fn(async () => {
    groups.value = JSON.parse(JSON.stringify(snapshot));
    return groups.value;
  });

  const leaveGroup = vi.fn(async (groupId) => {
    groups.value = groups.value.filter((g) => g.id !== groupId);
    return true;
  });

  return {
    groups,
    fetchGroups,
    leaveGroup,
  };
});

// helper: 버튼 텍스트로 button 찾기
const findButtonByText = (wrapper, text) =>
  wrapper.findAll("button").find((btn) => btn.text().trim().includes(text));

describe("GroupList.vue", () => {
  beforeEach(() => {
    routerPushMock?.mockClear();
  });

  // 1. 그룹 리스트가 잘 나오는지 확인
  it("그룹 리스트가 잘 렌더링된다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const items = wrapper.findAll("ul li");
    expect(items.length).toBe(3);

    const text = wrapper.text();
    expect(text).toContain("1조 알고리즘 스터디");
    expect(text).toContain("CS 면접 대비반");
    expect(text).toContain("사내 해커톤 팀");
  });

  // 2. 그룹 이름으로 검색하면 해당 그룹들이 나오는지 확인
  it("그룹 이름으로 검색하면 해당 그룹만 필터링된다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const searchInput = wrapper.find(
      'input[placeholder="그룹 이름 또는 설명으로 검색..."]',
    );
    await searchInput.setValue("알고리즘");
    await flushPromises();

    const items = wrapper.findAll("ul li");
    expect(items.length).toBe(1);
    expect(items[0].text()).toContain("1조 알고리즘 스터디");
  });

  // 3. 설명으로 검색하면 해당 그룹들이 나오는지 확인
  it("그룹 설명으로 검색하면 해당 그룹만 필터링된다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const searchInput = wrapper.find(
      'input[placeholder="그룹 이름 또는 설명으로 검색..."]',
    );
    await searchInput.setValue("네트워크");
    await flushPromises();

    const items = wrapper.findAll("ul li");
    expect(items.length).toBe(1);
    expect(items[0].text()).toContain("CS 면접 대비반");
  });

  // 4. 그룹 들어가기를 누르면 페이지가 넘어가는지
  it("‘그룹 들어가기’를 누르면 BoardList 라우트로 이동한다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    // "CS 면접 대비반" 이 들어있는 li 찾기
    const targetItem = wrapper
      .findAll("ul li")
      .find((li) => li.text().includes("CS 면접 대비반"));

    expect(targetItem).toBeTruthy();

    const enterButton = findButtonByText(targetItem, "그룹 들어가기");
    expect(enterButton).toBeTruthy();

    await enterButton.trigger("click");

    expect(routerPushMock).toHaveBeenCalledWith({
      name: "BoardList",
      params: { groupId: 2 },
    });
  });

  // 5. 그룹 탈퇴를 누르면 confirm 뜨고, 목록에서 삭제되는지
  it("‘그룹 탈퇴’를 누르면 confirm 후 그룹이 목록에서 제거된다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    // "CS 면접 대비반" 이 들어있는 li 찾기
    const targetItem = wrapper
      .findAll("ul li")
      .find((li) => li.text().includes("CS 면접 대비반"));
    expect(targetItem).toBeTruthy();

    const leaveButton = findButtonByText(targetItem, "그룹 탈퇴");
    expect(leaveButton).toBeTruthy();

    await leaveButton.trigger("click");
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalled();

    // 목록에서 해당 그룹이 사라졌는지 확인
    const textAfter = wrapper.text();
    expect(textAfter).not.toContain("CS 면접 대비반");

    // 깔끔하게 복원
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  // 6. 수정을 누르면 수정 페이지로 넘어가는지
  it("‘수정’을 누르면 GroupEdit 라우트로 이동한다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const targetItem = wrapper
      .findAll("ul li")
      .find((li) => li.text().includes("1조 알고리즘 스터디"));
    expect(targetItem).toBeTruthy();

    const editButton = findButtonByText(targetItem, "수정");
    expect(editButton).toBeTruthy();

    await editButton.trigger("click");

    expect(routerPushMock).toHaveBeenCalledWith({
      name: "GroupEdit",
      params: { groupId: 1 },
    });
  });

  // 7. + 스터디 그룹 생성 버튼을 누르면 그룹 생성 페이지로 넘어가는지
  it("상단 ‘+ 스터디 그룹 생성’ 버튼을 누르면 GroupCreate 라우트로 이동한다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();

    const createButton = findButtonByText(wrapper, "스터디 그룹 생성");
    expect(createButton).toBeTruthy();

    await createButton.trigger("click");

    expect(routerPushMock).toHaveBeenCalledWith({
      name: "GroupCreate",
    });
  });
});
