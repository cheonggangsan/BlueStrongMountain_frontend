import axios from "axios";
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  LOGOUT_EVENT,
} from "../constants/auth";

// .env에 VITE_API_BASE_URL 설정해두면 거기를 기본으로 사용
// 예: VITE_API_BASE_URL=http://localhost:8080/api
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  withCredentials: true, // 쿠키/세션 방식도 고려 (안 쓰면 그냥 무시됨)
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== JWT 전환 대비용: accessToken 관리 =====
let accessToken = null;

if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (stored) accessToken = stored;
}

// 지금은 안 써도 됨. 나중에 로그인 성공 시 여기로 토큰 넣으면 됨.
export function setAccessToken(token) {
  accessToken = token ?? null;

  if (typeof window !== "undefined") {
    if (accessToken)
      window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// 로그아웃/만료 시 호출
export function clearAccessToken() {
  accessToken = null;

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

// === request 인터셉터: 토큰이 있으면 Authorization 헤더에 붙이기 ===
httpClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// === response 인터셉터: 401 처리, refresh 토큰 로직 등은 나중에 여기서 ===
// 예시용 빈 껍데기만 두고, 추후 JWT 붙일 때 구현
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      // 토큰/유저 캐시 정리
      clearAccessToken();

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_STORAGE_KEY);
        // store도 즉시 반응하도록 이벤트 발행
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export default httpClient;
