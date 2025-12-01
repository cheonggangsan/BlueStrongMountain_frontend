import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GroupEdit from "../src/components/group/GroupEdit.vue";

// ----- vue-router mock -----
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
        groupId: "1", // GroupEdit에서 사용하는 groupId
      },
    }),
    // 테스트용으로 router 객체를 그대로 export
    router,
  };
});

// ----- groupStore mock -----
vi.mock("../src/data/groupStore", () => {
  const fetchGroupById = vi.fn();
  const updateGroup = vi.fn();

  return {
    __esModule: true,
    fetchGroupById,
    updateGroup,
  };
});

// ----- GroupForm stub -----
// 실제 구현을 쓰지 않고, props/emit만 있는 더미 컴포넌트로 대체
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

// ---- mock 들 import (위 vi.mock 들은 자동으로 호이스팅됨) ----
import { router as routerMock } from "vue-router";
import { fetchGroupById, updateGroup } from "../src/data/groupStore";

describe("GroupEdit.vue", () => {
  beforeEach(() => {
    fetchGroupById.mockReset();
    updateGroup.mockReset();
    routerMock.push.mockReset();
    routerMock.back.mockReset();
  });

  it("마운트 시 fetchGroupById 로 그룹 정보를 불러와 initialGroup 으로 전달한다", async () => {
    // fetchGroupById 가 반환할 Mock 데이터
    fetchGroupById.mockResolvedValue({
      id: 1,
      name: "수정용 스터디",
      description: "기존 설명",
      visibility: "PUBLIC",
      managerIds: [1, 5],
      memberIds: [1, 2, 5],
    });

    const wrapper = mount(GroupEdit);

    // onMounted 비동기 처리 기다리기
    await flushPromises();

    // 1) groupId 로 fetchGroupById 가 호출되었는지
    expect(fetchGroupById).toHaveBeenCalledTimes(1);
    expect(fetchGroupById).toHaveBeenCalledWith("1");

    // 2) 로딩 메시지가 더 이상 보이지 않는지
    expect(wrapper.text()).not.toContain("그룹 정보를 불러오는 중입니다...");

    // 3) GroupForm 으로 initialGroup 이 제대로 전달되었는지
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

    // 에러가 나도 loading 은 false 가 되고, GroupForm 은 렌더링됨
    const form = wrapper.findComponent({ name: "GroupForm" });
    expect(form.exists()).toBe(true);

    const props = form.props();
    expect(props.apiError).toBe("그룹 정보를 불러오는 중 오류가 발생했습니다.");

    // stub 템플릿에 찍힌 에러 DOM도 확인 가능
    const errorDom = wrapper.find(".api-error");
    expect(errorDom.exists()).toBe(true);
    expect(errorDom.text()).toBe(
      "그룹 정보를 불러오는 중 오류가 발생했습니다.",
    );
  });

  it("GroupForm 에서 submit 이 올라오면 updateGroup 을 호출하고 GroupList 로 이동한다", async () => {
    // 일단 정상적으로 그룹을 불러오도록 해둠
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

    // 자식에서 submit emit
    form.vm.$emit("submit", payload);
    await flushPromises();

    // 1) updateGroup(groupId, payload) 가 호출됐는지
    expect(updateGroup).toHaveBeenCalledTimes(1);
    expect(updateGroup).toHaveBeenCalledWith("1", payload);

    // 2) 성공 후 GroupList 로 이동했는지
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

    // updateGroup 은 호출되었지만
    expect(updateGroup).toHaveBeenCalledTimes(1);

    // 라우터 이동은 없어야 한다
    expect(routerMock.push).not.toHaveBeenCalled();

    // apiError 가 설정되어 GroupForm 으로 내려가는지 확인
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
});
