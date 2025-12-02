import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

// vue-router의 useRouter를 가짜로 만들어서 push만 감시
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// 실제 mockAuthApi를 import 해서 spy만 덮어씌움
import * as mockAuthApi from "../src/api/mockAuthApi";
import LoginView from "../src/views/LoginView.vue";

describe("LoginView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("이메일/비밀번호가 비어 있으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(LoginView);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("이메일과 비밀번호를 모두 입력해주세요.");
  });

  it("유효한 입력 시 mockLogin을 호출하고 GroupList로 이동한다", async () => {
    const loginSpy = vi.spyOn(mockAuthApi, "mockLogin").mockResolvedValue({
      user: {
        id: 1,
        email: "test@example.com",
        nickname: "tester",
      },
    });

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("test@example.com");
    await wrapper.find("#password").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(loginSpy).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(pushMock).toHaveBeenCalledWith({ name: "GroupList" });
  });

  it("로그인 실패 시 에러 메시지를 보여준다", async () => {
    vi.spyOn(mockAuthApi, "mockLogin").mockRejectedValue(
      new Error("로그인 실패"),
    );

    const wrapper = mount(LoginView);

    await wrapper.find("#email").setValue("test@example.com");
    await wrapper.find("#password").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  });
});
