import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref, nextTick } from "vue";

// =======================
// 0) vue-router mock
// =======================
const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// =======================
// 1) authStore mock
//    - 호이스팅(TDZ) 피하려고 globalThis에 상태 보관
// =======================
vi.mock("@/data/authStore", () => {
  const g = (globalThis.__authMocks = globalThis.__authMocks || {});

  if (!g.userRef) g.userRef = ref(null);
  if (!g.initializedRef) g.initializedRef = ref(false);
  if (!g.fetchCurrentUserMock) g.fetchCurrentUserMock = vi.fn(async () => {});
  if (!g.logoutMock) g.logoutMock = vi.fn(async () => {});
  if (!g.updateUserMock) g.updateUserMock = vi.fn(() => {});

  return {
    useAuthStore: () => ({
      user: g.userRef,
      initialized: g.initializedRef,
      fetchCurrentUser: g.fetchCurrentUserMock,
      logout: g.logoutMock,
      updateUser: g.updateUserMock,
    }),
  };
});

// =======================
// 2) authService mock
// =======================
vi.mock("@/services/authService", () => ({
  authService: {
    verifyPassword: vi.fn(), // boolean
    getUserInfo: vi.fn(), // { id, email, nickname }
    checkUsernameDuplicate: vi.fn(),
    updateNickname: vi.fn(), // { user }
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

import { authService } from "@/services/authService";
import MyPageView from "@/views/MyPageView.vue";

// 프로필 단계로 강제 진입시키는 헬퍼
async function goToProfileStep(wrapper, overrides = {}) {
  wrapper.vm.step = "profile";
  wrapper.vm.email = overrides.email ?? "user@example.com";
  wrapper.vm.nickname = overrides.nickname ?? "oldNick";
  wrapper.vm.originalNickname = overrides.originalNickname ?? "oldNick";
  wrapper.vm.baekjoonId = overrides.baekjoonId ?? "tourist";
  await nextTick();
}

describe("MyPageView.vue", () => {
  beforeEach(() => {
    // 모든 mock 호출 기록 초기화
    vi.clearAllMocks();

    // authStore 초기 상태: 로그인 된 상태라고 가정
    const g = globalThis.__authMocks;
    if (g) {
      g.userRef.value = {
        id: 1,
        email: "user@example.com",
        nickname: "oldNick",
        baekjoonId: "tourist",
      };
      g.initializedRef.value = true;
      g.fetchCurrentUserMock.mockReset();
      g.logoutMock.mockReset();
      g.updateUserMock.mockReset();
    }

    pushMock.mockReset();
  });

  it("초기화되지 않았고 로그인 사용자 없으면 Login으로 리다이렉트한다", async () => {
    const g = globalThis.__authMocks;
    g.initializedRef.value = false;
    g.userRef.value = null;
    g.fetchCurrentUserMock.mockImplementation(async () => {
      // 서버에서 유저 못 찾았다고 가정 → 그대로 null 유지
    });

    mount(MyPageView);
    await flushPromises();

    expect(g.fetchCurrentUserMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({
      name: "Login",
      query: { redirect: "/me" },
    });
  });

  it("비밀번호 재확인에서 8자 미만이면 에러를 보여주고 API를 호출하지 않는다", async () => {
    const verifySpy = authService.verifyPassword;
    verifySpy.mockResolvedValue(true);

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("short");
    await wrapper.get('[data-testid="verify-submit"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("비밀번호는 최소 8자 이상이어야 합니다.");
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("올바른 비밀번호 입력 시 verifyPassword(userId,pwd) -> getUserInfo 호출 후 프로필 단계로 전환된다", async () => {
    const verifySpy = authService.verifyPassword;
    verifySpy.mockResolvedValue(true);

    const getInfoSpy = authService.getUserInfo;
    getInfoSpy.mockResolvedValue({
      id: 1,
      email: "me@example.com",
      nickname: "myNick",
    });

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("password123");

    await wrapper.get('[data-testid="verify-submit"]').trigger("click");
    await flushPromises();

    expect(verifySpy).toHaveBeenCalledWith({
      userId: 1,
      password: "password123",
    });
    expect(getInfoSpy).toHaveBeenCalledWith({ id: 1 });

    // 전역 메시지 + 프로필 영역 표시
    expect(wrapper.text()).toContain("본인 확인이 완료되었습니다.");
    expect(wrapper.text()).toContain("계정 정보");
    expect(wrapper.text()).toContain("me@example.com");

    const nicknameInput = wrapper.get("#mypage-nickname");
    expect(nicknameInput.element.value).toBe("myNick");
  });

  it("비밀번호가 틀리면 에러 메시지를 보여준다", async () => {
    const verifySpy = authService.verifyPassword;
    verifySpy.mockRejectedValue({ response: { status: 401 } });

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("wrongpass");
    await wrapper.get('[data-testid="verify-submit"]').trigger("click");
    await flushPromises();

    expect(verifySpy).toHaveBeenCalled();
    expect(wrapper.text()).toContain("비밀번호가 올바르지 않습니다.");
  });

  it("백준 아이디 수정 UI가 노출되지 않는다(정책 반영)", async () => {
    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    expect(wrapper.text()).not.toContain("아이디 수정");
    expect(wrapper.find("#mypage-baekjoon-id").exists()).toBe(false);
  });

  it("닉네임 중복 확인에서 사용 가능한 닉네임이면 메시지를 표시한다", async () => {
    const checkSpy = authService.checkUsernameDuplicate;
    checkSpy.mockResolvedValue({
      duplicated: false,
      available: true,
    });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    // 닉네임 수정 모드 진입
    await wrapper.get('[data-testid="nickname-edit"]').trigger("click");
    await wrapper.get("#mypage-nickname").setValue("newNick");

    await wrapper.get('[data-testid="nickname-check"]').trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ username: "newNick" });
    expect(wrapper.text()).toContain("사용 가능한 닉네임입니다.");
  });

  it("닉네임 중복 확인 없이 저장 시 에러를 보여주고 updateNickname을 호출하지 않는다", async () => {
    const updateSpy = authService.updateNickname;
    updateSpy.mockResolvedValue({
      user: {
        email: "user@example.com",
        nickname: "newNick",
      },
    });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    await wrapper.get('[data-testid="nickname-edit"]').trigger("click");
    await wrapper.get("#mypage-nickname").setValue("newNick");

    await wrapper.get('[data-testid="nickname-save"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("닉네임 중복 확인 후 저장해주세요.");
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("닉네임 중복 확인 후 저장 시 checkUsernameDuplicate + updateNickname(id,nickname) 호출, store는 updateUser로 동기화한다", async () => {
    const g = globalThis.__authMocks;

    const checkSpy = authService.checkUsernameDuplicate;
    checkSpy.mockResolvedValue({
      duplicated: false,
      available: true,
    });

    const updateSpy = authService.updateNickname;
    updateSpy.mockResolvedValue({
      user: { id: 1, email: "user@example.com", nickname: "newNick" },
    });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    await wrapper.get('[data-testid="nickname-edit"]').trigger("click");
    await wrapper.get("#mypage-nickname").setValue("newNick");

    await wrapper.get('[data-testid="nickname-check"]').trigger("click");
    await flushPromises();

    await wrapper.get('[data-testid="nickname-save"]').trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ username: "newNick" });
    expect(updateSpy).toHaveBeenCalledWith({ id: 1, nickname: "newNick" });

    expect(g.updateUserMock).toHaveBeenCalledWith({ nickname: "newNick" });
    expect(g.fetchCurrentUserMock).not.toHaveBeenCalledWith({ force: true });

    expect(wrapper.text()).toContain("닉네임이 변경되었습니다.");
  });

  it("백준 아이디가 이메일처럼 표시되고, 수정 버튼은 노출되지 않는다", async () => {
    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, { baekjoonId: "tourist" });

    const box = wrapper.get('[data-testid="baekjoon-display"]');
    expect(box.text()).toContain("tourist");
    expect(box.text()).toContain("수정 불가");

    expect(wrapper.text()).not.toContain("아이디 수정");
    expect(wrapper.text()).not.toContain("아이디 확인");
  });

  // ============================
  // 비밀번호 / 탈퇴 기존 테스트
  // ============================

  it("비밀번호 변경에서 8자 미만이면 에러를 보여주고 changePassword를 호출하지 않는다", async () => {
    const changeSpy = authService.changePassword;
    changeSpy.mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    // 비밀번호 변경 영역 열기
    await wrapper.get('[data-testid="password-toggle"]').trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-new-password").setValue("short");
    await wrapper.get("#mypage-new-password-confirm").setValue("short");

    await wrapper.get('[data-testid="password-submit"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("비밀번호는 최소 8자 이상이어야 합니다.");
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("비밀번호 변경 성공 시 changePassword(id,newPassword) + logout 호출 후 Login으로 이동한다", async () => {
    const g = globalThis.__authMocks;

    const changeSpy = authService.changePassword;
    changeSpy.mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    await wrapper.get('[data-testid="password-toggle"]').trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-new-password").setValue("newPassword123");
    await wrapper
      .get("#mypage-new-password-confirm")
      .setValue("newPassword123");

    await wrapper.get('[data-testid="password-submit"]').trigger("click");
    await flushPromises();

    expect(changeSpy).toHaveBeenCalledWith({
      id: 1,
      newPassword: "newPassword123",
    });
    expect(g.logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({
      name: "Login",
      query: { reason: "passwordChanged" },
    });
  });

  it("회원 탈퇴 확인 후 deleteAccount(id)와 logout을 호출하고 Home으로 이동한다", async () => {
    const g = globalThis.__authMocks;

    const deleteSpy = authService.deleteAccount;
    deleteSpy.mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    await wrapper.get('[data-testid="delete-toggle"]').trigger("click");
    await flushPromises();

    await wrapper.get('[data-testid="delete-input"]').setValue("탈퇴합니다");
    await flushPromises();

    const confirmBtn = wrapper.get('[data-testid="delete-confirm"]');
    expect(confirmBtn.element.disabled).toBe(false);

    await confirmBtn.trigger("click");
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith({ id: 1 });
    expect(g.logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({ name: "Home" });
  });
});
