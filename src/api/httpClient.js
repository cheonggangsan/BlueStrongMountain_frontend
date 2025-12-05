import axios from "axios";

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

// 지금은 안 써도 됨. 나중에 로그인 성공 시 여기로 토큰 넣으면 됨.
export function setAccessToken(token) {
  accessToken = token;
}

// 로그아웃/만료 시 호출
export function clearAccessToken() {
  accessToken = null;
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
    // 나중에:
    // if (error.response?.status === 401) { ...refresh 처리... }
    return Promise.reject(error);
  },
);

export default httpClient;
