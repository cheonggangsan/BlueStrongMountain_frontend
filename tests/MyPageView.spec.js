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

  return {
    useAuthStore: () => ({
      user: g.userRef,
      initialized: g.initializedRef,
      fetchCurrentUser: g.fetchCurrentUserMock,
      logout: g.logoutMock,
    }),
  };
});

// =======================
// 2) mockAuthApi 실제 모듈 import 후 spy
// =======================
import * as mockAuthApi from "@/api/mockAuthApi";
import MyPageView from "@/views/MyPageView.vue";

// 프로필 단계로 강제 진입시키는 헬퍼
async function goToProfileStep(wrapper, overrides = {}) {
  wrapper.vm.step = "profile";
  wrapper.vm.email = overrides.email ?? "user@example.com";
  wrapper.vm.nickname = overrides.nickname ?? "oldNick";
  wrapper.vm.originalNickname = overrides.originalNickname ?? "oldNick";
  wrapper.vm.baekjoonId = overrides.baekjoonId ?? "";
  wrapper.vm.originalBaekjoonId = overrides.originalBaekjoonId ?? "";
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
      };
      g.initializedRef.value = true;
      g.fetchCurrentUserMock.mockReset();
      g.logoutMock.mockReset();
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
    const verifySpy = vi
      .spyOn(mockAuthApi, "mockVerifyPassword")
      .mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("short");

    const verifyBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("본인 확인하기"));

    await verifyBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("비밀번호는 최소 8자 이상이어야 합니다.");
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("올바른 비밀번호 입력 시 mockVerifyPassword 호출 후 프로필 단계로 전환되고, 이메일/닉네임/백준 아이디가 세팅된다", async () => {
    const verifySpy = vi
      .spyOn(mockAuthApi, "mockVerifyPassword")
      .mockResolvedValue({
        user: {
          email: "me@example.com",
          nickname: "myNick",
          baekjoonId: "tourist",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("password123");

    const verifyBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("본인 확인하기"));
    await verifyBtn.trigger("click");
    await flushPromises();

    expect(verifySpy).toHaveBeenCalledWith({ password: "password123" });

    // 전역 메시지 + 프로필 영역 표시
    expect(wrapper.text()).toContain("본인 확인이 완료되었습니다.");
    expect(wrapper.text()).toContain("계정 정보");
    expect(wrapper.text()).toContain("me@example.com");

    const nicknameInput = wrapper.get("#mypage-nickname");
    expect(nicknameInput.element.value).toBe("myNick");

    const baekjoonInput = wrapper.get("#mypage-baekjoon-id");
    expect(baekjoonInput.element.value).toBe("tourist");
  });

  it("비밀번호가 틀리면 에러 메시지를 보여준다", async () => {
    const verifySpy = vi
      .spyOn(mockAuthApi, "mockVerifyPassword")
      .mockRejectedValue({ code: "INVALID_PASSWORD" });

    const wrapper = mount(MyPageView);
    await flushPromises();

    await wrapper.get("#verify-password").setValue("wrongpass");

    const verifyBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("본인 확인하기"));
    await verifyBtn.trigger("click");
    await flushPromises();

    expect(verifySpy).toHaveBeenCalled();
    expect(wrapper.text()).toContain("비밀번호가 올바르지 않습니다.");
  });

  it("닉네임 중복 확인에서 사용 가능한 닉네임이면 메시지를 표시한다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckUsernameDuplicate")
      .mockResolvedValue({
        duplicated: false,
        available: true,
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    // 닉네임 수정 모드 진입
    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("닉네임 수정"));
    await editBtn.trigger("click");

    await wrapper.get("#mypage-nickname").setValue("newNick");

    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("중복 확인"));
    expect(checkBtn).toBeTruthy();

    await checkBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ username: "newNick" });
    expect(wrapper.text()).toContain("사용 가능한 닉네임입니다.");
  });

  it("닉네임 중복 확인 없이 저장 시 에러를 보여주고 mockUpdateNickname을 호출하지 않는다", async () => {
    const updateSpy = vi
      .spyOn(mockAuthApi, "mockUpdateNickname")
      .mockResolvedValue({
        user: {
          email: "user@example.com",
          nickname: "newNick",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("닉네임 수정"));
    await editBtn.trigger("click");

    await wrapper.get("#mypage-nickname").setValue("newNick");

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("저장"));
    await saveBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("닉네임 중복 확인 후 저장해주세요.");
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("닉네임 중복 확인 후 저장 시 mockUpdateNickname과 fetchCurrentUser를 호출한다", async () => {
    const g = globalThis.__authMocks;

    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckUsernameDuplicate")
      .mockResolvedValue({
        duplicated: false,
        available: true,
      });

    const updateSpy = vi
      .spyOn(mockAuthApi, "mockUpdateNickname")
      .mockResolvedValue({
        user: {
          email: "user@example.com",
          nickname: "newNick",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("닉네임 수정"));
    await editBtn.trigger("click");

    await wrapper.get("#mypage-nickname").setValue("newNick");

    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("중복 확인"));
    await checkBtn.trigger("click");
    await flushPromises();

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("저장"));
    await saveBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({ nickname: "newNick" });
    expect(g.fetchCurrentUserMock).toHaveBeenCalledWith({ force: true });
    expect(wrapper.text()).toContain("닉네임이 변경되었습니다.");
  });

  // ============================
  // 백준 아이디 관련 테스트
  // ============================

  it("백준 아이디 입력이 없으면 '아이디 확인' 버튼이 비활성화되고 mockCheckBaekjoonId를 호출하지 않는다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({ exists: true });

    const wrapper = mount(MyPageView);
    await flushPromises();

    // 프로필 단계 & 백준 아이디 없음으로 세팅
    await goToProfileStep(wrapper, {
      baekjoonId: "",
      originalBaekjoonId: "",
    });

    // "아이디 수정" 눌러서 편집 모드 진입
    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    // "아이디 확인" 버튼 찾기
    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 확인"));

    // 입력이 없으므로 버튼이 비활성화되어 있어야 한다
    expect(checkBtn.element.disabled).toBe(true);

    // 클릭해도 실제 API는 호출되지 않아야 한다
    await checkBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).not.toHaveBeenCalled();
  });

  it("현재 등록된 백준 아이디와 동일한 값을 확인하면 API 호출 없이 유효 처리한다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({ exists: true });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, {
      baekjoonId: "tourist",
      originalBaekjoonId: "tourist",
    });

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 확인"));
    await checkBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("현재 등록된 백준 아이디입니다.");
  });

  it("존재하는 백준 아이디라면 아이디 확인 시 성공 메시지를 보여준다", async () => {
    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({ exists: true });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, {
      baekjoonId: "",
      originalBaekjoonId: "",
    });

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-baekjoon-id").setValue("tourist");

    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 확인"));
    await checkBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ handle: "tourist" });
    expect(wrapper.text()).toContain("존재하는 백준 아이디입니다.");
  });

  it("백준 아이디 확인 없이 저장 시 에러를 보여주고 mockUpdateBaekjoonId를 호출하지 않는다", async () => {
    const updateSpy = vi
      .spyOn(mockAuthApi, "mockUpdateBaekjoonId")
      .mockResolvedValue({
        user: {
          email: "user@example.com",
          nickname: "oldNick",
          baekjoonId: "tourist",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, {
      baekjoonId: "",
      originalBaekjoonId: "",
    });

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-baekjoon-id").setValue("tourist");

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("저장"));
    await saveBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "백준 아이디가 실제로 존재하는지 확인 버튼을 눌러주세요.",
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("백준 아이디 확인 후 저장 시 mockUpdateBaekjoonId와 fetchCurrentUser를 호출한다", async () => {
    const g = globalThis.__authMocks;

    const checkSpy = vi
      .spyOn(mockAuthApi, "mockCheckBaekjoonId")
      .mockResolvedValue({ exists: true });

    const updateSpy = vi
      .spyOn(mockAuthApi, "mockUpdateBaekjoonId")
      .mockResolvedValue({
        user: {
          email: "user@example.com",
          nickname: "oldNick",
          baekjoonId: "tourist",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, {
      baekjoonId: "",
      originalBaekjoonId: "",
    });

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-baekjoon-id").setValue("tourist");

    const checkBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 확인"));
    await checkBtn.trigger("click");
    await flushPromises();

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("저장"));
    await saveBtn.trigger("click");
    await flushPromises();

    expect(checkSpy).toHaveBeenCalledWith({ handle: "tourist" });
    expect(updateSpy).toHaveBeenCalledWith({ baekjoonId: "tourist" });
    expect(g.fetchCurrentUserMock).toHaveBeenCalledWith({ force: true });
    expect(wrapper.text()).toContain("백준 아이디가 변경되었습니다.");
  });

  it("백준 아이디를 빈 문자열로 저장하려 하면 에러를 보여주고 mockUpdateBaekjoonId를 호출하지 않는다", async () => {
    const updateSpy = vi
      .spyOn(mockAuthApi, "mockUpdateBaekjoonId")
      .mockResolvedValue({
        user: {
          email: "user@example.com",
          nickname: "oldNick",
          baekjoonId: "",
        },
      });

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper, {
      baekjoonId: "tourist",
      originalBaekjoonId: "tourist",
    });

    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("아이디 수정"));
    await editBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-baekjoon-id").setValue("");
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("저장"));
    await saveBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("백준 아이디를 비울 수 없습니다.");
    expect(updateSpy).not.toHaveBeenCalled();
  });

  // ============================
  // 비밀번호 / 탈퇴 기존 테스트
  // ============================

  it("비밀번호 변경에서 8자 미만이면 에러를 보여주고 mockChangePassword를 호출하지 않는다", async () => {
    const changeSpy = vi
      .spyOn(mockAuthApi, "mockChangePassword")
      .mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    // 비밀번호 변경 영역 열기
    const openBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("열기"));
    await openBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-new-password").setValue("short");
    await wrapper.get("#mypage-new-password-confirm").setValue("short");

    const changeBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("비밀번호 변경하기"));
    await changeBtn.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("비밀번호는 최소 8자 이상이어야 합니다.");
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("비밀번호 변경 성공 시 mockChangePassword와 logout을 호출하고 Login으로 이동한다", async () => {
    const g = globalThis.__authMocks;

    const changeSpy = vi
      .spyOn(mockAuthApi, "mockChangePassword")
      .mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    const openBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("열기"));
    await openBtn.trigger("click");
    await flushPromises();

    await wrapper.get("#mypage-new-password").setValue("newPassword123");
    await wrapper
      .get("#mypage-new-password-confirm")
      .setValue("newPassword123");

    const changeBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("비밀번호 변경하기"));
    await changeBtn.trigger("click");
    await flushPromises();

    expect(changeSpy).toHaveBeenCalledWith({
      newPassword: "newPassword123",
    });
    expect(g.logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({
      name: "Login",
      query: { reason: "passwordChanged" },
    });
  });

  it("회원 탈퇴 확인 후 mockDeleteAccount와 logout을 호출하고 Home으로 이동한다", async () => {
    const g = globalThis.__authMocks;

    const deleteSpy = vi
      .spyOn(mockAuthApi, "mockDeleteAccount")
      .mockResolvedValue({});

    const wrapper = mount(MyPageView);
    await flushPromises();
    await goToProfileStep(wrapper);

    const toggleDeleteBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("탈퇴하기"));
    await toggleDeleteBtn.trigger("click");
    await flushPromises();

    const input = wrapper.get("input[placeholder*='탈퇴합니다']");
    await input.setValue("탈퇴합니다");
    await flushPromises();

    const confirmBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("정말 탈퇴하기"));
    expect(confirmBtn.element.disabled).toBe(false);

    await confirmBtn.trigger("click");
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalled();
    expect(g.logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({ name: "Home" });
  });
});
