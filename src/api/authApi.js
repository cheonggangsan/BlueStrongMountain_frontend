import httpClient, { setAccessToken, clearAccessToken } from "./httpClient";

/**
 * 로그인 (이메일 + 비밀번호)
 *
 * POST /api/v1/auth/login
 *
 * LoginRequest:
 *  {
 *    email: string,
 *    password: string
 *  }
 *
 * LoginResponse:
 *  {
 *    userId: number,
 *    email: string,
 *    username: string,
 *    token: string,        // access token (JWT)
 *    refreshToken: string, // refresh token (추후 사용)
 *  }
 */
export async function loginWithIdPw({ email, password }) {
  const response = await httpClient.post("/auth/login", {
    email,
    password,
  });

  const {
    userId,
    email: resEmail,
    username,
    token,
    refreshToken,
  } = response.data;

  // accessToken을 httpClient 인터셉터에 등록해서
  // 이후 요청에 Authorization 헤더가 자동으로 붙도록 함
  if (token) {
    setAccessToken(token);
  }

  return {
    user: {
      id: userId,
      email: resEmail,
      // FE에서 기존에 nickname을 쓰고 있으니 username을 nickname으로 매핑
      nickname: username,
    },
    accessToken: token,
    refreshToken,
  };
}

/**
 * 회원가입
 * POST /api/v1/auth/register
 * RegisterRequest: { email, username, password, baekjoon }
 */
export async function signupWithIdPw({
  email,
  nickname,
  password,
  baekjoonId,
}) {
  const response = await httpClient.post("/auth/register", {
    email,
    username: nickname,
    password,
    baekjoon: baekjoonId ?? null,
  });

  return response.data;
}

/**
 * 닉네임(username) 중복 확인
 * GET /api/v1/auth/duplicate/username?username=...
 */
export async function checkUsernameDuplicate({ username }) {
  const response = await httpClient.get("/auth/duplicate/username", {
    params: { username },
  });

  return response.data; // { duplicated: boolean }
}

/**
 * solved.ac 백준 핸들 존재 여부 확인
 * GET /api/v1/auth/existHandle?handle=...
 * 응답: boolean
 */
export async function verifyBaekjoonId({ handle }) {
  const response = await httpClient.get("/auth/existHandle", {
    params: { handle },
  });

  return response.data; // boolean
}

// TODO: after mypage api integration
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
  try {
    await httpClient.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}

/**
 * 비밀번호 재설정 메일/임시 비밀번호 발급
 * POST /api/v1/auth/password/reset
 * body: { email }
 * res: BaseResponse { success, message }
 */
export async function forgotPassword({ email }) {
  const response = await httpClient.post("/auth/password/reset", { email });
  return response.data;
}

// TODO: after email verification api changes
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
