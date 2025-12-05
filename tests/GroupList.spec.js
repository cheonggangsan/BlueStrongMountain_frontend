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

describe("GroupList.vue", () => {
  beforeEach(() => {
    // 유저(1)가 owner / manager / member 인 그룹 + 완전 관계없는 그룹
    groupsRef.value = [
      {
        id: 1,
        name: "내가 owner인 그룹",
        description: "owner",
        ownerId: 1,
        managerIds: [],
        memberIds: [2, 3],
        memberCount: 3,
        updatedAt: "2025-01-01T12:00:00.000Z",
      },
      {
        id: 2,
        name: "내가 manager인 그룹",
        description: "manager",
        ownerId: 2,
        managerIds: [1],
        memberIds: [2, 3],
        memberCount: 3,
        updatedAt: "2025-01-02T12:00:00.000Z",
      },
      {
        id: 3,
        name: "내가 member만인 그룹",
        description: "member only",
        ownerId: 3,
        managerIds: [3],
        memberIds: [1, 4, 5],
        memberCount: 3,
        updatedAt: "2025-01-03T12:00:00.000Z",
      },
      {
        id: 4,
        name: "내가 속하지 않은 그룹",
        description: "other",
        ownerId: 999,
        managerIds: [998],
        memberIds: [997],
        memberCount: 3,
        updatedAt: "2025-01-04T12:00:00.000Z",
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
    expect(text).not.toContain("내가 속하지 않은 그룹");
  });

  it("owner/manager 그룹에만 '수정' 버튼이 보이고, member-only 그룹에는 보이지 않는다", async () => {
    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const ownerItem = findGroupItemByName(wrapper, "내가 owner인 그룹");
    const managerItem = findGroupItemByName(wrapper, "내가 manager인 그룹");
    const memberOnlyItem = findGroupItemByName(wrapper, "내가 member만인 그룹");

    // 방어적으로 먼저 존재 확인
    expect(ownerItem, "owner 그룹 li를 찾지 못했습니다").toBeTruthy();
    expect(managerItem, "manager 그룹 li를 찾지 못했습니다").toBeTruthy();
    expect(
      memberOnlyItem,
      "member-only 그룹 li를 찾지 못했습니다",
    ).toBeTruthy();

    const hasEdit = (item) =>
      item.findAll("button").some((btn) => btn.text().includes("수정"));

    expect(hasEdit(ownerItem)).toBe(true); // owner ⇒ 수정 버튼 있어야 함
    expect(hasEdit(managerItem)).toBe(true); // manager ⇒ 수정 버튼 있어야 함
    expect(hasEdit(memberOnlyItem)).toBe(false); // 단순 member ⇒ 없어야 함
  });

  it("member-only 그룹에서 '그룹 탈퇴' 클릭 시 leaveGroup이 호출된다", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const wrapper = mount(GroupList);
    await flushPromises();
    await nextTick();

    const memberOnlyItem = findGroupItemByName(wrapper, "내가 member만인 그룹");
    expect(memberOnlyItem).toBeTruthy();

    const leaveButton = memberOnlyItem
      .findAll("button")
      .find((btn) => btn.text().includes("그룹 탈퇴"));

    expect(leaveButton, "'그룹 탈퇴' 버튼을 찾지 못했습니다").toBeTruthy();

    await leaveButton.trigger("click");
    await flushPromises();
    await nextTick();

    // owner 탈퇴 방어 로직에 걸리면 안 되므로, 정확히 id:3에 대해 호출됐는지만 체크
    expect(leaveGroupMock).toHaveBeenCalledWith(3);

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
