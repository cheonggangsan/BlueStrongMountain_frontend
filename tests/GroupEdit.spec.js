import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GroupEdit from "../src/components/group/GroupEdit.vue";

// ===== 1) authStore mock =====
vi.mock("../src/data/authStore", () => {
  const user = {
    value: { id: 1, name: "현재소유자", nickname: "owner" },
  };

  return {
    __esModule: true,
    useAuthStore: () => ({
      user,
    }),
    user,
  };
});

// ===== 2) memberStore mock =====
vi.mock("../src/data/memberStore", () => {
  const members = {
    value: [
      { id: 1, name: "현재소유자", nickname: "owner" },
      { id: 2, name: "새소유자", nickname: "newOwner" },
    ],
  };

  const ensureMembersLoaded = vi.fn(() => Promise.resolve());

  return {
    __esModule: true,
    members,
    ensureMembersLoaded,
  };
});

// ===== 3) vue-router mock =====
vi.mock("vue-router", () => {
  const router = {
    push: vi.fn(),
    back: vi.fn(),
  };

  return {
    __esModule: true,
    useRouter: () => router,
    useRoute: () => ({
      params: {
        groupId: "1",
      },
    }),
    router,
  };
});

// ===== 4) groupStore mock =====
vi.mock("../src/data/groupStore", () => {
  const fetchGroupById = vi.fn();
  const updateGroup = vi.fn();
  const changeGroupOwner = vi.fn();
  const fetchGroupUsers = vi.fn();

  return {
    __esModule: true,
    fetchGroupById,
    updateGroup,
    changeGroupOwner,
    fetchGroupUsers,
  };
});

// ===== 5) GroupForm stub =====
vi.mock("../src/components/group/GroupForm.vue", () => ({
  default: {
    name: "GroupForm",
    props: {
      mode: { type: String, default: "edit" },
      initialGroup: { type: Object, default: () => ({}) },
      submitting: { type: Boolean, default: false },
      apiError: { type: String, default: "" },
    },
    template: `
      <div>
        <div class="api-error" v-if="apiError">{{ apiError }}</div>
      </div>
    `,
  },
}));

// ===== 6) mock import =====
import { router as routerMock } from "vue-router";
import {
  fetchGroupById,
  updateGroup,
  changeGroupOwner,
  fetchGroupUsers,
} from "../src/data/groupStore";
import { user as authUser } from "../src/data/authStore";
import { members as membersRef } from "../src/data/memberStore";

describe("GroupEdit.vue", () => {
  beforeEach(() => {
    // auth / members 초기화 (동일한 객체에 value만 재할당)
    authUser.value = { id: 1, name: "현재소유자", nickname: "owner" };
    membersRef.value = [
      { id: 1, name: "현재소유자", nickname: "owner" },
      { id: 2, name: "새소유자", nickname: "newOwner" },
    ];

    fetchGroupById.mockReset();
    updateGroup.mockReset();
    changeGroupOwner.mockReset();
    fetchGroupUsers.mockReset();
    fetchGroupUsers.mockResolvedValue([]);
    routerMock.push.mockReset();
    routerMock.back.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("마운트 시 fetchGroupById 로 그룹 정보를 불러와 initialGroup 으로 전달한다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1, 5],
      memberIds: [1, 2, 5],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    expect(fetchGroupById).toHaveBeenCalledTimes(1);
    expect(fetchGroupById).toHaveBeenCalledWith("1", { requesterId: 1 });
    expect(fetchGroupUsers).toHaveBeenCalledWith("1", { requesterId: 1 });

    expect(wrapper.text()).not.toContain("그룹 정보를 불러오는 중입니다...");

    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    const props = form.props();
    expect(props.mode).toBe("edit");
    expect(props.initialGroup).toEqual({
      title: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1, 5],
      memberIds: [1, 2, 5],
    });
  });

  it("fetchGroupById 실패 시 apiError 가 설정되고 GroupForm 에 전달된다", async () => {
    fetchGroupById.mockRejectedValue(new Error("네트워크 오류"));

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    const props = form.props();
    expect(props.apiError).toBe("그룹 정보를 불러오는 중 오류가 발생했습니다.");

    const errorDom = wrapper.find(".api-error");
    expect(errorDom.exists()).toBe(true);
    expect(errorDom.text()).toBe(
      "그룹 정보를 불러오는 중 오류가 발생했습니다.",
    );
  });

  it("GroupForm 에서 submit 이 올라오면 updateGroup 을 호출하고 GroupList 로 이동한다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1],
      memberIds: [1, 2],
    });
    updateGroup.mockResolvedValue(true);

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    const payload = {
      title: "수정된 스터디 이름",
      description: "수정된 설명",
      visibility: "PRIVATE",
      managerIds: [2],
      memberIds: [1, 2],
    };

    form.vm.$emit("submit", payload);
    await flushPromises();

    expect(updateGroup).toHaveBeenCalledTimes(1);
    expect(updateGroup).toHaveBeenCalledWith("1", {
      ...payload,
      requesterId: 1,
    });

    expect(routerMock.push).toHaveBeenCalledTimes(1);
    expect(routerMock.push).toHaveBeenCalledWith({ name: "GroupList" });
  });

  it("updateGroup 실패 시 apiError 를 설정하고 페이지 이동은 하지 않는다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1],
      memberIds: [1, 2],
    });
    updateGroup.mockRejectedValue(new Error("서버 오류"));

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    const payload = {
      title: "수정된 스터디 이름",
      description: "수정된 설명",
      visibility: "PRIVATE",
      managerIds: [2],
      memberIds: [1, 2],
    };

    form.vm.$emit("submit", payload);
    await flushPromises();

    expect(updateGroup).toHaveBeenCalledTimes(1);
    expect(routerMock.push).not.toHaveBeenCalled();

    const formAfter = wrapper.findComponent({ name: "GroupForm" });
    const props = formAfter.props();
    expect(props.apiError).toBe("스터디 그룹 수정 중 오류가 발생했습니다.");

    const errorDom = wrapper.find(".api-error");
    expect(errorDom.exists()).toBe(true);
    expect(errorDom.text()).toBe("스터디 그룹 수정 중 오류가 발생했습니다.");
  });

  it("GroupForm 에서 cancel 이 올라오면 router.back() 을 호출한다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    form.vm.$emit("cancel");
    await flushPromises();

    expect(routerMock.back).toHaveBeenCalledTimes(1);
  });

  it("소유자 변경 탭을 누르면 GroupForm 대신 소유자 변경 섹션이 보인다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    expect(wrapper.findComponent({ name: "GroupForm" }).exists()).toBe(true);
    expect(wrapper.text()).not.toContain("그룹 소유자 변경");

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    expect(wrapper.findComponent({ name: "GroupForm" }).exists()).toBe(false);
    expect(wrapper.text()).toContain("그룹 소유자 변경");
  });

  it("현재 로그인 사용자가 owner일 때는 '⭐ 현재 로그인 계정이 소유자입니다.' 배지와 활성화된 버튼이 보인다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });
    fetchGroupUsers.mockResolvedValue([
      { id: 1, name: "현재소유자", nickname: "owner", role: "OWNER" },
      { id: 2, name: "새소유자", nickname: "newOwner", role: "MEMBER" },
    ]);

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("⭐ 현재 로그인 계정이 소유자입니다.");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    expect(confirmBtn.attributes("disabled")).toBeUndefined();
  });

  it("현재 로그인 사용자가 owner가 아니면 경고 배지와 disabled 버튼이 보인다", async () => {
    // mock auth 유저를 비소유자로 변경
    authUser.value = { id: 999, name: "다른유저", nickname: "other" };

    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("소유자만 소유자를 변경할 수 있습니다.");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    expect(confirmBtn.attributes("disabled")).toBeDefined();
  });

  it("새 소유자를 선택하고 '소유자 변경 확정'을 누르면 changeGroupOwner가 호출되고 성공 메시지가 보인다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    changeGroupOwner.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 2,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    const candidateItem = wrapper
      .findAll("li")
      .find((li) => li.text().includes("새소유자"));
    await candidateItem.trigger("click");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(changeGroupOwner).toHaveBeenCalledWith("1", {
      requesterId: 1,
      newOwnerId: 2,
    });

    expect(wrapper.text()).toContain("소유자가 변경되었습니다.");
    expect(wrapper.text()).toContain("새소유자");
  });

  it("기본 선택 상태(현재 소유자)에서 바로 확정하면 '이미 이 멤버가 소유자입니다.' 에러를 보여주고 changeGroupOwner는 호출되지 않는다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("이미 이 멤버가 소유자입니다.");
    expect(changeGroupOwner).not.toHaveBeenCalled();
  });

  it("현재 소유자를 다시 선택하면 '이미 이 멤버가 소유자입니다.' 에러가 뜨고 changeGroupOwner는 호출되지 않는다", async () => {
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    const currentOwnerItem = wrapper
      .findAll("li")
      .find((li) => li.text().includes("현재소유자"));
    await currentOwnerItem.trigger("click");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("이미 이 멤버가 소유자입니다.");
    expect(changeGroupOwner).not.toHaveBeenCalled();
  });

  it("새 소유자를 선택하고 '소유자 변경 확정'을 누르면 changeGroupOwner가 호출되고 성공 메시지가 보이며 700ms 후 GroupList로 이동한다", async () => {
    vi.useFakeTimers();

    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    changeGroupOwner.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 2,
      managerIds: [1],
      memberIds: [1, 2],
    });

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    const candidateItem = wrapper
      .findAll("li")
      .find((li) => li.text().includes("새소유자"));
    await candidateItem.trigger("click");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(changeGroupOwner).toHaveBeenCalledWith("1", {
      requesterId: 1,
      newOwnerId: 2,
    });

    expect(wrapper.text()).toContain("소유자가 변경되었습니다.");
    expect(wrapper.text()).toContain("새소유자");

    expect(routerMock.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(699);
    expect(routerMock.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(routerMock.push).toHaveBeenCalledTimes(1);
    expect(routerMock.push).toHaveBeenCalledWith({ name: "GroupList" });
  });

  it("소유자 변경 실패 시 에러 메시지를 보여주고 700ms가 지나도 GroupList로 이동하지 않는다", async () => {
    vi.useFakeTimers();

    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "",
      visibility: "PUBLIC",
      ownerId: 1,
      managerIds: [1],
      memberIds: [1, 2],
    });

    changeGroupOwner.mockRejectedValue(new Error("서버 오류"));

    const wrapper = mount(GroupEdit);
    await flushPromises();

    const ownerTab = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경"));
    await ownerTab.trigger("click");
    await flushPromises();

    const candidateItem = wrapper
      .findAll("li")
      .find((li) => li.text().includes("새소유자"));
    await candidateItem.trigger("click");

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("소유자 변경 확정"));
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("소유자 변경 중 오류가 발생했습니다.");
    expect(routerMock.push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(700);
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
