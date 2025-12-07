import httpClient from "./httpClient";
// JWT 도입 시 아래처럼 교체:
// import httpClient, { setAccessToken, clearAccessToken } from "./httpClient";

/**
 * 1) 지금 당장 쓸 버전 (ID/PW + 세션)
 *    - 서버가 세션 쿠키를 내려주거나, { user } 형태 응답을 내려준다고 가정
 */
export async function loginWithIdPw({ id, password }) {
  const response = await httpClient.post("/auth/login", {
    id, // 이메일을 ID로 쓰면 프론트에서 email을 그대로 넣으면 됨
    password,
  });

  // 예시: { user: { id, nickname, ... } }
  return response.data;
}

/**
 * 회원가입 (ID/PW 기반)
 */
export async function signupWithIdPw({ email, nickname, password }) {
  const response = await httpClient.post("/auth/signup", {
    email,
    nickname,
    password,
  });

  return response.data;
}

/**
 * 닉네임(username) 중복 확인
 * GET /api/v1/auth/duplicate/username?username=홍길동
 * -> baseURL이 /api 이므로 여기서는 /v1/... 로 호출
 */
export async function checkUsernameDuplicate({ username }) {
  const response = await httpClient.get("/v1/auth/duplicate/username", {
    params: { username },
  });

  // 백엔드 응답 예시(가정):
  // { duplicated: true } 또는 { available: false } 등
  return response.data;
}

/**
 * 백엔드에서 Baekjoon 프로필 존재 여부 확인
 * GET /api/v1/baekjoon/verify?handle=xxx
 */
export async function verifyBaekjoonId({ handle }) {
  const response = await httpClient.get("/v1/baekjoon/verify", {
    params: { handle },
  });

  // 예시 응답: { exists: true }
  return response.data;
}

/**
 * 내 계정에 연결된 Baekjoon 아이디 저장/수정
 * PATCH /api/v1/members/me/baekjoon-id
 *  - body: { baekjoonId: "handle" }
 *  - 실제 엔드포인트는 백엔드 설계에 맞게 변경하면 됨
 */
export async function updateBaekjoonId({ baekjoonId }) {
  const response = await httpClient.patch("/v1/members/me/baekjoon-id", {
    baekjoonId,
  });

  // 예시 응답: { user: { ..., baekjoonId: "xxx" } } 또는 { ok: true }
  return response.data;
}

/**
 * 로그아웃 (세션 기반)
 */
export async function logout() {
  const response = await httpClient.post("/auth/logout");
  return response.data;
}

/**
 * 비밀번호 재설정 메일 발송
 */
export async function forgotPassword({ email }) {
  const response = await httpClient.post("/auth/forgot-password", { email });
  return response.data;
}

/**
 * 비밀번호 재설정
 */
export async function resetPassword({ token, newPassword }) {
  const response = await httpClient.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return response.data;
}

/**
 * 2) 나중에 JWT로 전환할 때 쓸 예시 (현재는 주석으로만 보관)
 *
 * JWT 적용 시, httpClient에 accessToken을 실어 보내고,
 * refreshToken은 httpOnly 쿠키나 별도 저장 전략을 사용.
 *
 * // import httpClient, { setAccessToken, clearAccessToken } from "./httpClient";
 *
 * export async function loginWithJwt({ id, password }) {
 *   const response = await httpClient.post("/auth/login", { id, password });
 *   const { accessToken, refreshToken, user } = response.data;
 *
 *   setAccessToken(accessToken);
 *   // refreshToken은 브라우저 저장소(localStorage)보다는 httpOnly 쿠키 권장
 *
 *   return { accessToken, refreshToken, user };
 * }
 *
 * export async function refreshAccessToken() {
 *   const response = await httpClient.post("/auth/refresh");
 *   const { accessToken } = response.data;
 *   setAccessToken(accessToken);
 *   return accessToken;
 * }
 *
 * export async function logoutJwt() {
 *   await httpClient.post("/auth/logout");
 *   clearAccessToken();
 * }
 */
