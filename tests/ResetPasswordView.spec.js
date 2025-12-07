import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

// useRoute에서 token을 제공하고, useRouter의 push를 감시
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useRoute: () => ({
    query: {
      token: "reset-token-123",
    },
  }),
}));

import * as mockAuthApi from "@/mocks/auth.mock";
import ResetPasswordView from "../src/views/ResetPasswordView.vue";

describe("ResetPasswordView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("비밀번호 길이가 짧으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(ResetPasswordView);

    await wrapper.find("#new-password").setValue("short");
    await wrapper.find("#new-password-confirm").setValue("short");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("비밀번호는 최소 8자 이상이어야 합니다.");
  });

  it("비밀번호와 확인이 다르면 에러를 보여준다", async () => {
    const wrapper = mount(ResetPasswordView);

    await wrapper.find("#new-password").setValue("password123");
    await wrapper.find("#new-password-confirm").setValue("different123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    );
  });

  it("유효한 입력 시 mockResetPassword를 호출하고 성공 메시지를 보여준다", async () => {
    const resetSpy = vi
      .spyOn(mockAuthApi, "mockResetPassword")
      .mockResolvedValue({ ok: true });

    const wrapper = mount(ResetPasswordView);

    await wrapper.find("#new-password").setValue("password123");
    await wrapper.find("#new-password-confirm").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(resetSpy).toHaveBeenCalledWith({
      token: "reset-token-123",
      newPassword: "password123",
    });

    expect(wrapper.text()).toContain(
      "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.",
    );
  });

  it("mockResetPassword에서 INVALID_OR_EXPIRED_TOKEN 에러가 나면 해당 메시지를 보여준다", async () => {
    vi.spyOn(mockAuthApi, "mockResetPassword").mockRejectedValue(
      Object.assign(new Error("유효하지 않거나 만료된 링크입니다."), {
        code: "INVALID_OR_EXPIRED_TOKEN",
      }),
    );

    const wrapper = mount(ResetPasswordView);

    await wrapper.find("#new-password").setValue("password123");
    await wrapper.find("#new-password-confirm").setValue("password123");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("유효하지 않거나 만료된 링크입니다.");
  });
});
