import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import * as mockAuthApi from "@/mocks/auth.mock";
import SignupView from "@/views/SignupView.vue";

async function goToFormStep(wrapper) {
  const checkboxes = wrapper.findAll('input[type="checkbox"]');
  expect(checkboxes.length).toBeGreaterThanOrEqual(2);

  await checkboxes[0].setValue(true); // 필수 약관 1
  await checkboxes[1].setValue(true); // 필수 약관 2

  const proceedButton = wrapper
    .findAll("button")
    .find((btn) => btn.text().includes("약관에 동의하고 회원가입 진행"));

  expect(proceedButton).toBeTruthy();

  await proceedButton.trigger("click");
  await flushPromises();
}

describe("SignupView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.restoreAllMocks();
  });

  it("필수 필드가 비어 있으면 검증 에러를 보여준다", async () => {
    const wrapper = mount(SignupView);

    await goToFormStep(wrapper);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("이메일과 닉네임을 모두 입력해주세요.");
  });

  it("백준 아이디가 비어 있으면 에러를 보여준다", async () => {
    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#nickname").setValue("user");
    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain("백준 아이디를 입력해주세요.");
  });

  it("백준 아이디 확인을 하지 않으면 에러를 보여주고 mockSignup을 호출하지 않는다", async () => {
    const signupSpy = vi.spyOn(mockAuthApi, "mockSignup").mockResolvedValue({
      user: {
        id: 1,
        email: "user@example.com",
        nickname: "user",
        baekjoonId: "tourist",
      },
    });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#baekjoon-id").setValue("tourist");
    await wrapper.find("#nickname").setValue("user");
    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    // 🔥 여기서 '아이디 확인' 버튼은 누르지 않음

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "백준 아이디가 존재하는지 확인 버튼을 눌러주세요.",
    );
    expect(signupSpy).not.toHaveBeenCalled();
  });

  it("비밀번호와 확인이 다르면 에러를 보여준다", async () => {
    vi.spyOn(mockAuthApi, "mockCheckBaekjoonId").mockResolvedValue({
      exists: true,
    });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#baekjoon-id").setValue("tourist");
    await wrapper.find("#nickname").setValue("user");

    // 백준 아이디 확인
    const bjCheckBtn = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("아이디 확인"));
    expect(bjCheckBtn).toBeTruthy();
    await bjCheckBtn.trigger("click");
    await flushPromises();

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
        baekjoonId: "tourist",
      },
    });

    const baekjoonSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({
        exists: true,
      });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#signup-email").setValue("user@example.com");
    await wrapper.find("#baekjoon-id").setValue("tourist");
    await wrapper.find("#nickname").setValue("user");

    // 백준 아이디 확인
    const bjCheckBtn = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("아이디 확인"));
    expect(bjCheckBtn).toBeTruthy();
    await bjCheckBtn.trigger("click");
    await flushPromises();

    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(baekjoonSpy).toHaveBeenCalledWith({ handle: "tourist" });
    expect(signupSpy).toHaveBeenCalledWith({
      email: "user@example.com",
      nickname: "user",
      password: "password123",
      baekjoonId: "tourist",
    });
    expect(pushMock).toHaveBeenCalledWith({ name: "Login" });
  });

  it("백준 아이디 확인 버튼 클릭 시 mockCheckBaekjoonId를 호출하고 존재하는 아이디면 성공 메시지를 보여준다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({
        exists: true,
      });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#baekjoon-id").setValue("tourist");

    const bjCheckBtn = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("아이디 확인"));
    expect(bjCheckBtn).toBeTruthy();

    await bjCheckBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ handle: "tourist" });
    expect(wrapper.text()).toContain("존재하는 백준 아이디입니다.");
  });

  it("백준 아이디 확인 시 존재하지 않는 아이디면 경고 메시지를 보여준다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({
        exists: false,
      });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    await wrapper.find("#baekjoon-id").setValue("no_such_user_123");

    const bjCheckBtn = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("아이디 확인"));
    expect(bjCheckBtn).toBeTruthy();

    await bjCheckBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ handle: "no_such_user_123" });
    expect(wrapper.text()).toContain(
      "존재하지 않는 백준 아이디입니다. 다시 확인해주세요.",
    );
  });

  it("닉네임 중복 확인 버튼 클릭 시 mockCheckUsernameDuplicate를 호출하고 사용 가능 메시지를 보여준다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckUsernameDuplicate")
      .mockResolvedValue({
        duplicated: false,
        available: true,
      });

    const wrapper = mount(SignupView);
    await goToFormStep(wrapper);

    // 닉네임 입력
    await wrapper.find("#nickname").setValue("uniqueUser");

    const nicknameCheckButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("중복 확인"));
    expect(nicknameCheckButton).toBeTruthy();

    await nicknameCheckButton.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ username: "uniqueUser" });
    expect(wrapper.text()).toContain("사용 가능한 닉네임입니다.");
  });

  it("중복된 닉네임이면 경고 메시지를 보여주고, 제출 시 mockSignup이 호출되지 않는다", async () => {
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
    await goToFormStep(wrapper);

    await wrapper.find("#signup-email").setValue("dup@example.com");
    await wrapper.find("#baekjoon-id").setValue("tourist");
    await wrapper.find("#nickname").setValue("dupUser");

    const nicknameCheckButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("중복 확인"));
    expect(nicknameCheckButton).toBeTruthy();

    await nicknameCheckButton.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
    );

    await wrapper.find("#signup-password").setValue("password123");
    await wrapper.find("#signup-password-confirm").setValue("password123");

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(signupSpy).not.toHaveBeenCalled();
    // 닉네임 경고 메시지는 여전히 화면 상에 존재해야 함
    expect(wrapper.text()).toContain(
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
    );
  });
});
