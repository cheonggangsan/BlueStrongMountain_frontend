import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";

// --- vue-router mock -------------------------------------------------
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// --- authStore mock (로그인 유저: id = 1) -----------------------------
vi.mock("/src/data/authStore", () => {
  const user = ref({ id: 1 });
  const isAuthenticated = ref(true);

  return {
    useAuthStore: () => ({
      user,
      isAuthenticated,
    }),
  };
});

// --- groupStore mock --------------------------------------------------
vi.mock("/src/data/groupStore", () => {
  const groups = ref([]);
  const fetchGroups = vi.fn(async () => {});
  const leaveGroup = vi.fn(async () => {});

  return {
    groups,
    fetchGroups,
    leaveGroup,
  };
});

// --- 컴포넌트 & store import (mock 선언 이후) --------------------------
import GroupList from "../src/components/group/GroupList.vue";
import {
  groups as groupsRef,
  fetchGroups as fetchGroupsMock,
  leaveGroup as leaveGroupMock,
} from "../src/data/groupStore";

// 🔹 그룹 li를 이름으로 찾아주는 헬퍼 (정렬/필터에 의존 X)
function findGroupItemByName(wrapper, groupName) {
  const items = wrapper.findAll("li.group");
  return items.find((li) => li.text().includes(groupName));
}

function hasButton(item, label) {
  return item.findAll("button").some((btn) => btn.text().includes(label));
}

function findButton(item, label) {
  return item.findAll("button").find((btn) => btn.text().includes(label));
}

async function openActionMenu(item) {
  const menuBtn = item.find('button[aria-label="그룹 액션 메뉴"]');
  expect(menuBtn.exists(), "⋯(액션 메뉴) 버튼을 찾지 못했습니다").toBe(true);

  await menuBtn.trigger("click");
  await flushPromises();
  await nextTick();
}

describe("GroupList.vue", () => {
  beforeEach(() => {
    // 유저(1)가 owner / manager / member 인 그룹 + 완전 관계없는 그룹
    groupsRef.value = [
      {
        id: 1,
        name: "내가 owner인 그룹",
        description: "owner",
        ownerId: 1,
        groupRole: "OWNER",
        memberCount: 3,
        updatedAt: "2025-01-01T12:00:00.000Z",
      },
      {
        id: 2,
        name: "내가 manager인 그룹",
        description: "manager",
        ownerId: 2,
        groupRole: "MANAGER",
        memberCount: 3,
        updatedAt: "2025-01-02T12:00:00.000Z",
      },
      {
        id: 3,
        name: "내가 member만인 그룹",
        description: "member only",
        ownerId: 3,
        groupRole: "MEMBER",
        memberCount: 3,
        updatedAt: "2025-01-03T12:00:00.000Z",
      },
    ];

    fetchGroupsMock.mockReset();
    fetchGroupsMock.mockImplementation(async () => {});
    leaveGroupMock.mockReset();
    pushMock.mockReset();
  });

  it("마운트 시 fetchGroups가 호출된다", async () => {
    mount(GroupList);
    await flushPromises();
    await nextTick();

    expect(fetchGroupsMock).toHaveBeenCalledTimes(1);
    expect(fetchGroupsMock).toHaveBeenCalledWith({ requesterId: 1 });
  });

  it("현재 로그인한 사용자가 속한 그룹(owner/manager/member)만 렌더링된다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const items = wrapper.findAll("li.group");
    expect(items.length).toBe(3); // id:1,2,3만 보여야 함

    const text = wrapper.text();
    expect(text).toContain("내가 owner인 그룹");
    expect(text).toContain("내가 manager인 그룹");
    expect(text).toContain("내가 member만인 그룹");
  });

  it("OWNER 그룹에는 '수정' 메뉴가 보이고, MANAGER/MEMBER 그룹에는 보이지 않는다 (groupRole 기준)", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const ownerItem = findGroupItemByName(wrapper, "내가 owner인 그룹");
    const managerItem = findGroupItemByName(wrapper, "내가 manager인 그룹");
    const memberItem = findGroupItemByName(wrapper, "내가 member만인 그룹");

    expect(ownerItem).toBeTruthy();
    expect(managerItem).toBeTruthy();
    expect(memberItem).toBeTruthy();

    await openActionMenu(ownerItem);
    expect(hasButton(ownerItem, "수정")).toBe(true);

    await openActionMenu(managerItem);
    expect(hasButton(managerItem, "수정")).toBe(false);

    await openActionMenu(memberItem);
    expect(hasButton(memberItem, "수정")).toBe(false);
  });

  it("OWNER가 '수정' 클릭 시 GroupEdit로 이동한다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const ownerItem = findGroupItemByName(wrapper, "내가 owner인 그룹");
    expect(ownerItem).toBeTruthy();

    await openActionMenu(ownerItem);

    const editBtn = findButton(ownerItem, "수정");
    expect(editBtn, "'수정' 메뉴를 찾지 못했습니다").toBeTruthy();

    await editBtn.trigger("click");
    await flushPromises();
    await nextTick();

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith({
      name: "GroupEdit",
      params: { groupId: 1 },
    });
  });

  it("MANAGER 그룹에는 '수정'이 없어 GroupEdit로 이동할 수 없다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const managerItem = findGroupItemByName(wrapper, "내가 manager인 그룹");
    await openActionMenu(managerItem);

    const editBtn = findButton(managerItem, "수정");
    expect(editBtn).toBeFalsy();

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("OWNER는 '탈퇴 불가'로 표시되고 leaveGroup이 호출되지 않는다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const ownerItem = findGroupItemByName(wrapper, "내가 owner인 그룹");
    expect(ownerItem).toBeTruthy();

    await openActionMenu(ownerItem);

    const leaveBtn = findButton(ownerItem, "탈퇴 불가");
    expect(leaveBtn, "'탈퇴 불가' 버튼을 찾지 못했습니다").toBeTruthy();

    // disabled라서 클릭 자체가 안 되는 게 정상
    expect(leaveBtn.element.disabled).toBe(true);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(leaveGroupMock).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("MEMBER 그룹에서 '그룹 탈퇴' 클릭 시 leaveGroup이 호출된다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const memberItem = findGroupItemByName(wrapper, "내가 member만인 그룹");
    expect(memberItem).toBeTruthy();

    await openActionMenu(memberItem);

    const leaveBtn = findButton(memberItem, "그룹 탈퇴");
    expect(leaveBtn, "'그룹 탈퇴' 메뉴를 찾지 못했습니다").toBeTruthy();

    await leaveBtn.trigger("click");
    await flushPromises();
    await nextTick();

    expect(confirmSpy).toHaveBeenCalled();
    expect(leaveGroupMock).toHaveBeenCalledWith(3, { requesterId: 1 });

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("그룹 카드를 클릭하면 BoardList로 이동한다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const item = findGroupItemByName(wrapper, "내가 member만인 그룹");
    expect(item).toBeTruthy();

    await item.trigger("click");
    expect(pushMock).toHaveBeenCalledWith({
      name: "BoardList",
      params: { groupId: 3 },
    });
  });

  it("액션 메뉴 버튼 클릭 시 BoardList로 이동하지 않는다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const item = findGroupItemByName(wrapper, "내가 member만인 그룹");
    const menuBtn = item.find('button[aria-label="그룹 액션 메뉴"]');

    await menuBtn.trigger("click");
    await flushPromises();

    expect(pushMock).not.toHaveBeenCalled();
  });
});
