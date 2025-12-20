import { reactive, computed, readonly } from "vue";
import { authService } from "@/services/authService";
import { USER_STORAGE_KEY, LOGOUT_EVENT } from "../constants/auth";

const state = reactive({
  user: null, // { id, email, nickname, ... }
  isLoading: false, // 로그인/로그아웃 버튼 로딩
  isRefreshing: false, // /me(또는 mock)로 세션 동기화 중
  initialized: false, // 앱 시작 후 최소 1회 fetchCurrentUser 완료 여부
  error: null,
});

function saveUserToStorage(user) {
  if (typeof window === "undefined") return;
  try {
    if (user)
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("[authStore] saveUserToStorage failed:", e);
  }
}

function clearUserFromStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

function setUser(user) {
  state.user = user ?? null;

  if (state.user) saveUserToStorage(state.user);
  else clearUserFromStorage();
}

function clearUser() {
  state.user = null;
  clearUserFromStorage();
}

function updateUser(patch) {
  if (!state.user) return;
  state.user = { ...state.user, ...patch };
  saveUserToStorage(state.user);
}

if (typeof window !== "undefined") {
  window.addEventListener(LOGOUT_EVENT, () => {
    clearUser();
    state.initialized = true; // 이후 guard에서 재시도 무한루프 방지
  });
}

/**
 * 로그인
 * @param {{ email: string, password: string }} credentials
 */
async function login(credentials) {
  state.isLoading = true;
  state.error = null;

  try {
    const user = await authService.login(credentials);
    setUser(user);

    state.initialized = true;

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
 */
async function fetchCurrentUser({ force = false } = {}) {
  if (state.initialized && !force) return;

  state.isRefreshing = true;
  state.error = null;

  try {
    const user = await authService.fetchCurrentUser();
    if (user) setUser(user);
    else clearUser();
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
    await authService.logout();
  } catch (err) {
    console.error("[authStore] logout error:", err);
  } finally {
    clearUser();
    state.initialized = true;
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

    updateUser,
  };
}
