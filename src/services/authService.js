import { apiMode } from "@/config/apiMode";
import { loginWithIdPw, logout as apiLogout } from "@/api/authApi";
import { mockLogin, mockLogout, mockGetCurrentUser } from "@/mocks/auth.mock";

const USE_MOCK_AUTH = apiMode.auth === "mock";

export const authService = {
  /**
   * 로그인
   * @param {{ id: string, password: string }} credentials
   */
  async login({ id, password }) {
    if (USE_MOCK_AUTH) {
      // mock: email + password 기반
      const { user: mockUser } = await mockLogin({
        email: id,
        password,
      });
      return mockUser;
    }

    // real: 백엔드 /auth/login
    const data = await loginWithIdPw({ id, password });
    return data.user ?? data;
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
    return null;
  },

  /**
   * 로그아웃
   */
  async logout() {
    if (USE_MOCK_AUTH) {
      mockLogout();
      return;
    }

    await apiLogout();
  },
};
