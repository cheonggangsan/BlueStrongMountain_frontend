import { apiMode } from "@/config/apiMode";
import {
  loginWithIdPw,
  logout as logoutApi,
  signupWithIdPw,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  checkUsernameDuplicate as checkUsernameDuplicateApi,
  verifyBaekjoonId as verifyBaekjoonIdApi,
  verifyPassword as verifyPasswordApi,
} from "@/api/authApi";

import {
  fetchUserInfo,
  changeUsername,
  changePassword as changePasswordApi,
  deleteUser,
} from "@/api/userApi";

import {
  mockLogin,
  mockLogout,
  mockGetCurrentUser,
  mockSignup,
  mockForgotPassword,
  mockResetPassword,
  mockVerifyPassword,
  mockFetchUserInfo,
  mockUpdateNickname,
  mockChangePassword,
  mockDeleteAccount,
  mockCheckUsernameDuplicate,
  mockCheckBaekjoonId,
} from "@/mocks/auth.mock";

import { USER_STORAGE_KEY } from "../constants/auth";

const USE_MOCK_AUTH = apiMode.auth === "mock";

function toFrontendUser(u) {
  return {
    id: u.userId,
    email: u.email,
    nickname: u.username,
    baekjoonId: u.baekjoonHandle ?? "",
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

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

    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;

      const user = JSON.parse(raw);
      if (!user || typeof user.id !== "number") return null;

      return user;
    } catch (e) {
      console.warn("[authService] fetchCurrentUser: parse failed:", e);
      return null;
    }
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

  /**
   * 비밀번호 재확인 (본인 인증)
   */
  async verifyPassword({ userId, password }) {
    if (USE_MOCK_AUTH) {
      return mockVerifyPassword({ userId, password });
    }

    return verifyPasswordApi({ userId, password }); // boolean
  },

  /**
   * (MyPage) 유저 조회
   */
  async getUserInfo({ id }) {
    if (USE_MOCK_AUTH) {
      const u = await mockFetchUserInfo({ id });
      return toFrontendUser(u);
    }

    const u = await fetchUserInfo({ id }); // { userId, username, baekjoonHandle, ... }
    return toFrontendUser(u);
  },

  /**
   * 비밀번호 변경
   */
  async changePassword({ id, newPassword }) {
    if (USE_MOCK_AUTH) return mockChangePassword({ id, newPassword });

    return changePasswordApi({ id, password: newPassword });
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

  /**
   * 닉네임 변경
   */
  async updateNickname({ id, nickname }) {
    if (USE_MOCK_AUTH) return mockUpdateNickname({ id, nickname });

    await changeUsername({ id, username: nickname });
    const u = await fetchUserInfo({ id });
    return { user: toFrontendUser(u) };
  },

  /**
   * 회원 탈퇴
   */
  async deleteAccount({ id }) {
    if (USE_MOCK_AUTH) return mockDeleteAccount({ id });
    return deleteUser({ id });
  },
};
