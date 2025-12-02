import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import * as mockAuthApi from "../src/api/mockAuthApi";
import ForgotPasswordView from "../src/views/ForgotPasswordView.vue";

describe("ForgotPasswordView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("이메일이 비어 있으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(ForgotPasswordView);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("가입하신 이메일을 입력해주세요.");
  });

  it("유효한 이메일 입력 시 mockForgotPassword를 호출하고 안내 메시지를 보여준다", async () => {
    const forgotSpy = vi
      .spyOn(mockAuthApi, "mockForgotPassword")
      .mockResolvedValue({
        ok: true,
        token: "reset-token-123",
      });

    const wrapper = mount(ForgotPasswordView);

    await wrapper.find("#forgot-email").setValue("user@example.com");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(forgotSpy).toHaveBeenCalledWith({
      email: "user@example.com",
    });

    expect(wrapper.text()).toContain(
      "입력하신 이메일로 비밀번호 재설정 안내를 보냈습니다. (이메일이 등록되어 있다면)",
    );

    // devResetToken이 설정되면 "새 비밀번호 설정하러 가기" 버튼이 렌더링됨
    expect(wrapper.text()).toContain("새 비밀번호 설정하러 가기");
  });

  it("개발용 버튼 클릭 시 ResetPassword 라우트로 이동한다", async () => {
    vi.spyOn(mockAuthApi, "mockForgotPassword").mockResolvedValue({
      ok: true,
      token: "reset-token-456",
    });

    const wrapper = mount(ForgotPasswordView);

    await wrapper.find("#forgot-email").setValue("user@example.com");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    const devButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("새 비밀번호 설정하러 가기"));

    expect(devButton).toBeTruthy();

    await devButton.trigger("click");
    expect(pushMock).toHaveBeenCalledWith({
      name: "ResetPassword",
      query: { token: "reset-token-456" },
    });
  });
});
