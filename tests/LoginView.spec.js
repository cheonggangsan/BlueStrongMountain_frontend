import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

// =======================
// 1) vue-router mock
// =======================
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useRoute: () => ({
    query: {}, // 기본값: 쿼리 없음
  }),
}));

// =======================
// 2) authStore mock
//    - 모든 mock/refs는 팩토리 내부 로컬 변수로
// =======================
vi.mock("@/data/authStore", () => {
  const error = ref("");
  const user = ref(null);
  const isAuthenticated = ref(false);

  const login = vi.fn();
  const resetError = vi.fn(() => {
    error.value = "";
  });

  const store = {
    user,
    error,
    isAuthenticated,
    login,
    resetError,
  };

  return {
    useAuthStore: () => store,
  };
});

// =======================
// 3) SUT import
// =======================
import LoginView from "@/views/LoginView.vue";
import { useAuthStore } from "@/data/authStore";

describe("LoginView", () => {
  let authStore;

  beforeEach(() => {
    authStore = useAuthStore();

    // mock & 상태 초기화
    pushMock.mockReset();
    authStore.login.mockReset();
    authStore.resetError.mockReset();

    authStore.error.value = "";
    authStore.user.value = null;
    authStore.isAuthenticated.value = false;
  });

  it("이메일/비밀번호가 비어 있으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("이메일과 비밀번호를 모두 입력해주세요.");
    expect(authStore.login).not.toHaveBeenCalled();
  });

  it("유효한 입력 시 authStore.login을 호출하고 GroupList로 이동한다", async () => {
    // ✅ 로그인 성공 시나리오
    authStore.login.mockResolvedValue();

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("test@example.com");
    await wrapper.find("#password").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    // LoginView가 authStore.login을 어떻게 부르는지 그대로 검증
    expect(authStore.login).toHaveBeenCalledWith({
      id: "test@example.com", // LoginView에서 id로 넘기고 있음
      password: "password123",
    });

    expect(pushMock).toHaveBeenCalledWith({ name: "GroupList" });
  });

  it("로그인 실패 시 에러 메시지를 보여준다", async () => {
    // 실패 시 reject
    authStore.login.mockRejectedValue(new Error("로그인 실패"));

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("test@example.com");
    await wrapper.find("#password").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    // auth.error.value 가 비어 있으므로, 기본 메시지를 사용
    expect(wrapper.text()).toContain(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  });
});
