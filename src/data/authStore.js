// - 지금은 mockAuthApi 기반으로 동작
// - 나중에 실제 백엔드(/auth/login, /members/me 등) 붙일 때는
//   아래 TODO 부분만 바꿔주면 됨

import { reactive, computed, readonly } from "vue";
// TODO: 실제 백엔드 붙일 때 사용
import { loginWithIdPw, logout as apiLogout } from "@/api/authApi";

// 지금은 mock 기반
import { mockLogin, mockLogout, mockGetCurrentUser } from "@/api/mockAuthApi";

// 나중에는 .env로 빼서 제어하는 게 베스트:
// const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";
const USE_MOCK_AUTH = true;

const state = reactive({
  user: null, // { id, email, nickname, ... }
  isLoading: false, // 로그인/로그아웃 버튼 로딩
  isRefreshing: false, // /me(또는 mock)로 세션 동기화 중
  initialized: false, // 앱 시작 후 최소 1회 fetchCurrentUser 완료 여부
  error: null,
});

function setUser(user) {
  state.user = user;
}

function clearUser() {
  state.user = null;
}

/**
 * 로그인
 * @param {{ id: string, password: string }} credentials
 *   - mock: id를 email로 사용
 *   - 실제: 백엔드 규칙대로 id/email 중 하나
 */
async function login(credentials) {
  state.isLoading = true;
  state.error = null;

  try {
    let user;

    if (USE_MOCK_AUTH) {
      // ===== 지금: mock 로그인 (email + password) =====
      const { user: mockUser } = await mockLogin({
        email: credentials.id,
        password: credentials.password,
      });
      user = mockUser;
    } else {
      // ===== 나중: 실제 백엔드 로그인 =====
      const data = await loginWithIdPw(credentials);
      user = data.user ?? data;
    }

    setUser(user);
    return user;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "로그인에 실패했습니다. 다시 시도해 주세요.";

    state.error = message;
    clearUser();
    throw err;
  } finally {
    state.isLoading = false;
  }
}

/**
 * 현재 로그인 사용자 동기화
 * - 앱 첫 로딩 / 새로고침 이후에 호출
 * - 실제 서비스에서는 /members/me 같은 API를 쓰고,
 *   지금은 mockGetCurrentUser(localStorage)로 대체
 */
async function fetchCurrentUser({ force = false } = {}) {
  if (state.initialized && !force) return;

  state.isRefreshing = true;
  state.error = null;

  try {
    let user = null;

    if (USE_MOCK_AUTH) {
      // mock: localStorage에서 복원
      user = mockGetCurrentUser();
    } else {
      // 실제: /members/me 등에서 가져오기
      // const me = await getMyProfile();
      // user = me;
    }

    setUser(user);
  } catch (err) {
    console.error("[authStore] fetchCurrentUser error:", err);
    clearUser();
  } finally {
    state.isRefreshing = false;
    state.initialized = true;
  }
}

/**
 * 로그아웃
 */
async function logout() {
  state.isLoading = true;
  state.error = null;

  try {
    if (USE_MOCK_AUTH) {
      mockLogout();
    } else {
      await apiLogout();
    }
  } catch (err) {
    console.error("[authStore] logout error:", err);
  } finally {
    clearUser();
    state.isLoading = false;
  }
}

function resetError() {
  state.error = null;
}

export function useAuthStore() {
  return {
    // state
    state: readonly(state),
    user: computed(() => state.user),
    isAuthenticated: computed(() => !!state.user),
    isLoading: computed(() => state.isLoading),
    isRefreshing: computed(() => state.isRefreshing),
    initialized: computed(() => state.initialized),
    error: computed(() => state.error),

    // actions
    login,
    fetchCurrentUser,
    logout,
    resetError,
  };
}
