// tests/GroupCreate.spec.js
import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// 1) vue-router mock
vi.mock("vue-router", () => {
  const router = {
    push: vi.fn(),
    back: vi.fn(),
  };

  return {
    __esModule: true,
    useRouter: () => router,
    // 테스트에서 접근할 수 있도록 export
    router,
  };
});

// 2) groupStore mock
vi.mock("../src/data/groupStore", () => {
  const createGroup = vi.fn();

  return {
    __esModule: true,
    createGroup,
  };
});

// 2.5) authStore mock 추가
vi.mock("../src/data/authStore", () => {
  const user = ref({ id: 1, name: "테스터", nickname: "tester" });
  return {
    __esModule: true,
    useAuthStore: () => ({ user }),
    user,
  };
});

// 3) GroupForm stub (프레젠테이션은 이미 별도 테스트 있다고 가정)
vi.mock("../src/components/group/GroupForm.vue", () => ({
  default: {
    name: "GroupForm",
    props: {
      mode: String,
      submitting: Boolean,
      apiError: String,
    },
    template: `
      <div>
        <!-- 부모에서 넘겨준 apiError 가 여기 보이도록 -->
        <div class="api-error" v-if="apiError">{{ apiError }}</div>

        <!-- submit / cancel 을 테스트에서 직접 트리거하기 쉽게 버튼으로 노출 -->
        <button class="submit-btn"
                @click="$emit('submit', {
                  title: '테스트 그룹',
                  description: '설명',
                  visibility: 'PRIVATE',
                  memberIds: [1],
                  managerIds: [1],
                })">
          SUBMIT
        </button>

        <button class="cancel-btn" @click="$emit('cancel')">
          CANCEL
        </button>
      </div>
    `,
  },
}));

// 4) 이제 모듈들을 import (vi.mock 들은 자동으로 위로 호이스팅됨)
import GroupCreate from "../src/components/group/GroupCreate.vue";
import { createGroup } from "../src/data/groupStore";
import { router as routerMock } from "vue-router";
import { user as authUser } from "../src/data/authStore";

describe("GroupCreate.vue", () => {
  beforeEach(() => {
    // 매 테스트 전 mock 초기화
    createGroup.mockReset();
    routerMock.push.mockReset();
    routerMock.back.mockReset();

    authUser.value = { id: 1, name: "테스터", nickname: "tester" };
  });

  it("submit 이벤트를 받으면 createGroup 호출 후 GroupList로 이동한다", async () => {
    createGroup.mockResolvedValue({ id: 123 });

    const wrapper = mount(GroupCreate);

    // stub된 GroupForm 안의 submit 버튼 클릭 → @submit 발생
    await wrapper.find(".submit-btn").trigger("click");
    await flushPromises();

    // 1) createGroup 가 payload와 함께 호출되었는지
    expect(createGroup).toHaveBeenCalledTimes(1);
    expect(createGroup).toHaveBeenCalledWith({
      title: "테스트 그룹",
      description: "설명",
      visibility: "PRIVATE",
      memberIds: [1],
      managerIds: [1],
      requesterId: 1,
    });

    // 2) 성공 후 router.push({ name: 'GroupList' }) 호출 여부
    expect(routerMock.push).toHaveBeenCalledWith({ name: "GroupList" });
  });

  it("createGroup 실패 시 apiError 를 세팅하고 화면에 표시한다", async () => {
    createGroup.mockRejectedValue(new Error("서버 오류"));

    const wrapper = mount(GroupCreate);

    await wrapper.find(".submit-btn").trigger("click");
    await flushPromises();

    // 라우터 이동은 없어야 함
    expect(routerMock.push).not.toHaveBeenCalled();

    // apiError 가 자식 GroupForm 의 props로 내려와서 template 에 렌더링되는지 확인
    const errorEl = wrapper.find(".api-error");
    expect(errorEl.exists()).toBe(true);
    expect(errorEl.text()).toBe("스터디 그룹 생성 중 오류가 발생했습니다.");
  });

  it("cancel 이벤트를 받으면 router.back() 을 호출한다", async () => {
    const wrapper = mount(GroupCreate);

    await wrapper.find(".cancel-btn").trigger("click");
    await flushPromises();

    expect(routerMock.back).toHaveBeenCalledTimes(1);
  });
});
