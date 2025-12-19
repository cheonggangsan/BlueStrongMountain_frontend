import { apiMode } from "@/config/apiMode";
import {
  loginWithIdPw,
  logout as logoutApi,
  signupWithIdPw,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  checkUsernameDuplicate as checkUsernameDuplicateApi,
  verifyBaekjoonId as verifyBaekjoonIdApi,
  updateBaekjoonId as updateBaekjoonIdApi,
} from "@/api/authApi";
import {
  mockLogin,
  mockLogout,
  mockGetCurrentUser,
  mockSignup,
  mockForgotPassword,
  mockResetPassword,
  mockVerifyPassword,
  mockUpdateNickname,
  mockChangePassword,
  mockDeleteAccount,
  mockCheckUsernameDuplicate,
  mockCheckBaekjoonId,
  mockUpdateBaekjoonId,
} from "@/mocks/auth.mock";

const USE_MOCK_AUTH = apiMode.auth === "mock";

export const authService = {
  /**
   * 로그인
   * @param {{ email: string, password: string }} credentials
   */
  async login({ email, password }) {
    if (USE_MOCK_AUTH) {
      // mock: email + password 기반
      const { user: mockUser } = await mockLogin({
        email,
        password,
      });
      return mockUser;
    }

    // real: 백엔드 /auth/login
    const { user } = await loginWithIdPw({ email, password });
    return user;
  },

  /**
   * 현재 로그인 사용자 조회
   * - mock: localStorage 기반
   * - real: 추후 /members/me 등으로 교체 예정
   */
  async fetchCurrentUser() {
    if (USE_MOCK_AUTH) {
      return mockGetCurrentUser();
    }

    // TODO: 백엔드에서 /members/me 준비되면 아래 구현
    // const me = await getMyProfile();
    // return me;
    throw new Error(
      "authService.fetchCurrentUser: not implemented for real API yet",
    );
  },

  /**
   * 로그아웃
   */
  async logout() {
    if (USE_MOCK_AUTH) {
      mockLogout();
      return;
    }

    await logoutApi();
  },

  /**
   * 회원가입
   */
  async signup({ email, nickname, password, baekjoonId }) {
    if (USE_MOCK_AUTH)
      return mockSignup({ email, nickname, password, baekjoonId });

    return signupWithIdPw({ email, nickname, password, baekjoonId });
  },

  /**
   * 비밀번호 재설정 메일 발송
   */
  async forgotPassword({ email }) {
    if (USE_MOCK_AUTH) return mockForgotPassword({ email });
    return forgotPasswordApi({ email }); // BaseResponse
  },

  // TODO: after email verification api changes
  /**
   * 비밀번호 재설정
   */
  async resetPassword({ token, newPassword }) {
    if (USE_MOCK_AUTH) {
      return mockResetPassword({ token, newPassword });
    }

    return resetPasswordApi({ token, newPassword });
  },

  // TODO: after mypage api integration
  /**
   * 비밀번호 재확인 (본인 인증)
   * - mock: 비밀번호 검증 + 최신 user 반환
   * - real: TODO(/auth/verify-password 준비 시 연동)
   */
  async verifyPassword({ password }) {
    if (USE_MOCK_AUTH) {
      return mockVerifyPassword({ password });
    }

    throw new Error(
      "authService.verifyPassword: not implemented for real API yet",
    );
  },

  // TODO: after mypage api integration
  /**
   * 비밀번호 변경
   */
  async changePassword({ newPassword }) {
    if (USE_MOCK_AUTH) {
      return mockChangePassword({ newPassword });
    }

    throw new Error(
      "authService.changePassword: not implemented for real API yet",
    );
  },

  /**
   * 닉네임(=username) 중복 확인
   */
  async checkUsernameDuplicate({ username }) {
    if (USE_MOCK_AUTH) return mockCheckUsernameDuplicate({ username });
    return checkUsernameDuplicateApi({ username }); // { duplicated }
  },

  /**
   * 백준 아이디 존재 여부 확인
   */
  async checkBaekjoonId({ handle }) {
    if (USE_MOCK_AUTH) return mockCheckBaekjoonId({ handle });

    const res = await verifyBaekjoonIdApi({ handle }); // boolean
    return { exists: !!res };
  },

  // TODO: after mypage api integration
  /**
   * 닉네임 변경
   */
  async updateNickname({ nickname }) {
    if (USE_MOCK_AUTH) {
      return mockUpdateNickname({ nickname });
    }

    // TODO: memberApi.updateMyProfile({ nickname })로 연동
    throw new Error(
      "authService.updateNickname: not implemented for real API yet",
    );
  },

  // TODO: after mypage api integration
  /**
   * 백준 아이디 변경
   */
  async updateBaekjoonId({ baekjoonId }) {
    if (USE_MOCK_AUTH) {
      return mockUpdateBaekjoonId({ baekjoonId });
    }

    return updateBaekjoonIdApi({ baekjoonId });
  },

  // TODO: after mypage api integration
  /**
   * 회원 탈퇴
   */
  async deleteAccount() {
    if (USE_MOCK_AUTH) {
      return mockDeleteAccount();
    }

    // TODO: memberApi.deleteMyAccount()로 연동
    throw new Error(
      "authService.deleteAccount: not implemented for real API yet",
    );
  },
};
