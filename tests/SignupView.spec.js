import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import * as mockAuthApi from "../src/api/mockAuthApi";
import SignupView from "../src/views/SignupView.vue";

describe("SignupView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("필수 필드가 비어 있으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(SignupView);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("이메일과 닉네임을 모두 입력해주세요.");
  });

  it("비밀번호와 확인이 다르면 에러를 보여준다", async () => {
    const wrapper = mount(SignupView);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#nickname").setValue("user");
    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("different123");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    );
  });

  it("유효한 입력 시 mockSignup 호출 후 Login으로 이동한다", async () => {
    const signupSpy = vi.spyOn(mockAuthApi, "mockSignup").mockResolvedValue({
      user: {
        id: 1,
        email: "user@example.com",
        nickname: "user",
      },
    });

    const wrapper = mount(SignupView);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#nickname").setValue("user");
    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(signupSpy).toHaveBeenCalledWith({
      email: "user@example.com",
      nickname: "user",
      password: "password123",
    });
    expect(pushMock).toHaveBeenCalledWith({ name: "Login" });
  });

  it("닉네임 중복 확인 버튼 클릭 시 mockCheckUsernameDuplicate를 호출하고 사용 가능 메시지를 보여준다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckUsernameDuplicate")
      .mockResolvedValue({
        duplicated: false,
        available: true,
      });

    const wrapper = mount(SignupView);

    // 닉네임 입력
    await wrapper.find("#nickname").setValue("uniqueUser");

    // '중복 확인' 버튼 찾기
    const nicknameCheckButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("중복 확인"));

    expect(nicknameCheckButton).toBeTruthy();

    await nicknameCheckButton.trigger("click");
    await flushPromises();

    // API가 올바른 파라미터로 호출되었는지
    expect(checkSpy).toHaveBeenCalledWith({ username: "uniqueUser" });

    // 사용 가능 메시지 노출
    expect(wrapper.text()).toContain("사용 가능한 닉네임입니다.");
  });

  it("중복된 닉네임이면 경고 메시지를 보여주고, 제출 시 mockSignup이 호출되지 않는다", async () => {
    // 닉네임 중복 API: duplicated=true 응답
    vi.spyOn(mockAuthApi, "mockCheckUsernameDuplicate").mockResolvedValue({
      duplicated: true,
      available: false,
    });

    const signupSpy = vi.spyOn(mockAuthApi, "mockSignup").mockResolvedValue({
      user: {
        id: 1,
        email: "dup@example.com",
        nickname: "dupUser",
      },
    });

    const wrapper = mount(SignupView);

    await wrapper.find("#signup-email").setValue("dup@example.com");
    await wrapper.find("#nickname").setValue("dupUser");

    // 중복 확인 버튼 클릭
    const nicknameCheckButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("중복 확인"));
    expect(nicknameCheckButton).toBeTruthy();

    await nicknameCheckButton.trigger("click");
    await flushPromises();

    // 중복 경고 메시지 노출
    expect(wrapper.text()).toContain(
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
    );

    // 비밀번호 입력은 정상적으로
    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    // 폼 제출
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    // 중복 상태라면 mockSignup은 호출되지 않아야 한다
    expect(signupSpy).not.toHaveBeenCalled();

    // 상단 에러 메시지도 닉네임 중복 에러로 보여야 함
    expect(wrapper.text()).toContain(
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
    );
  });
});
