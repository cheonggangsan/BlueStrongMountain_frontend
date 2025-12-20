const STORAGE_KEY_USERS = "bst:mockUsers";
const STORAGE_KEY_CURRENT_USER = "bst:currentUser";
const STORAGE_KEY_ACCESS_TOKEN = "bst:accessToken";
const STORAGE_KEY_RESET_TOKENS = "bst:resetTokens";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * 로컬스토리지에 예전 스키마가 남아 있어도 깨지지 않도록
 * 저장/조회 시 내부 표준 형태로 정규화
 *
 * 내부 표준:
 * { id, email, nickname, password, baekjoonId, status, createdAt, updatedAt }
 */
function normalizeUser(u) {
  const id = u?.id ?? u?.userId ?? Date.now();
  const createdAt = u?.createdAt ?? nowIso();
  const updatedAt = u?.updatedAt ?? createdAt;

  return {
    id,
    email: u?.email ?? "",
    nickname: u?.nickname ?? u?.username ?? "",
    password: u?.password ?? "",
    // 과거 baekjoonId / 최신 baekjoonHandle 모두 수용
    baekjoonId: u?.baekjoonId ?? u?.baekjoonHandle ?? u?.baekjoon ?? "",
    status: u?.status ?? "ACTIVE",
    createdAt,
    updatedAt,
  };
}

function loadUsers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeUser) : [];
  } catch (e) {
    console.error("Failed to parse users from localStorage", e);
    return [];
  }
}

function saveUsers(users) {
  if (typeof window === "undefined") return;
  // 저장도 normalize하여 스키마 통일
  window.localStorage.setItem(
    STORAGE_KEY_USERS,
    JSON.stringify((users ?? []).map(normalizeUser)),
  );
}

function loadResetTokens() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RESET_TOKENS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse reset tokens", e);
    return [];
  }
}

function saveResetTokens(tokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_RESET_TOKENS, JSON.stringify(tokens));
}

// 간단한 랜덤 토큰 생성 (목 용도)
function generateToken(prefix) {
  return (
    prefix +
    "-" +
    Math.random().toString(36).slice(2) +
    "-" +
    Date.now().toString(36)
  );
}

/**
 * 닉네임(=username) 중복 확인 mock
 *   - 실제 엔드포인트: GET /api/v1/auth/duplicate/username?username=...
 */
export async function mockCheckUsernameDuplicate({ username }) {
  await delay(200);

  const users = loadUsers();
  const duplicated = users.some((u) => u.nickname === username);

  // 실제 API와 비슷한 형태로 가정
  return {
    duplicated,
    available: !duplicated,
  };
}

/**
 * 백준 아이디 존재 여부 확인 mock
 *   - 실제 서비스에서는 서버에서 Baekjoon 또는 solved.ac API를 호출해서
 *     존재 여부를 판별할 예정.
 *   - 지금은 단순 규칙으로:
 *     - handle가 "unknown", "notfound" 이면 없는 계정으로 처리
 *     - 그 외는 있는 계정으로 가정
 */
export async function mockCheckBaekjoonId({ handle }) {
  await delay(300);

  const trimmed = (handle || "").trim();
  if (!trimmed) {
    return { exists: false };
  }

  const lower = trimmed.toLowerCase();
  const invalidList = ["unknown", "notfound", "invalid"];

  const exists = !invalidList.includes(lower);

  return {
    exists,
  };
}

// ===== 회원가입 (ID/PW 기반) =====
export async function mockSignup({ email, nickname, password, baekjoonId }) {
  await delay(500);

  const users = loadUsers();
  const exists = users.some((u) => u.email === email);

  if (exists) {
    const error = new Error("이미 사용 중인 이메일입니다.");
    error.code = "EMAIL_EXISTS";
    throw error;
  }

  const createdAt = nowIso();

  const newUser = {
    id: Date.now(),
    email,
    nickname,
    password, // ⚠️ 실제 프로덕션에서는 평문 저장 금지 (BCrypt 등 사용)
    baekjoonId: baekjoonId ?? "",
    status: "ACTIVE",
    createdAt,
    updatedAt: createdAt,
  };

  const nextUsers = [...users, newUser];
  saveUsers(nextUsers);

  // 지금은 세션/쿠키 기반이라고 가정해서 user 정보만 반환
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      baekjoonId: newUser.baekjoonId,
    },
  };

  /**
   * 나중에 JWT로 전환하면, 회원가입 후 토큰까지 함께 내려줄 수도 있음:
   *
   * return {
   *   user: { ... },
   *   accessToken: "mock-access-token-" + newUser.id,
   *   refreshToken: "mock-refresh-token-" + newUser.id,
   * };
   */
}

// ===== 로그인 (ID/PW 기반) =====
export async function mockLogin({ email, password }) {
  await delay(500);

  const users = loadUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // JWT 도입 시:
  // const accessToken = "mock-access-token-" + user.id;

  if (typeof window !== "undefined") {
    // 프론트 전역 상태 복구용으로 현재 유저 정보만 저장
    window.localStorage.setItem(
      STORAGE_KEY_CURRENT_USER,
      JSON.stringify({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        baekjoonId: user.baekjoonId ?? "",
      }),
    );

    // 나중에 JWT 쓰면 토큰도 저장 가능
    // window.localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
  }

  // 지금은 user만 반환 (세션 쿠키 기반 가정)
  return {
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      baekjoonId: user.baekjoonId ?? "",
    },
    // JWT 도입 시 함께 반환:
    // accessToken,
    // refreshToken: "mock-refresh-token-" + user.id,
  };
}

export function mockGetCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      id: parsed?.id ?? parsed?.userId ?? null,
      email: parsed?.email ?? "",
      nickname: parsed?.nickname ?? parsed?.username ?? "",
      baekjoonId: parsed?.baekjoonId ?? parsed?.baekjoonHandle ?? "",
    };
  } catch (e) {
    console.error("Failed to parse currentUser from localStorage", e);
    return null;
  }
}

export function mockLogout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_CURRENT_USER);

  // JWT 도입 시 accessToken 제거
  window.localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
}

// ===== 비밀번호 재설정 요청 (비밀번호 찾기) =====
export async function mockForgotPassword({ email }) {
  await delay(500);

  const users = loadUsers();
  const user = users.find((u) => u.email === email);

  // 실제 서비스에서는 "존재/미존재" 노출 안 하는 게 베스트 프랙티스.
  // 여기서는 데모를 위해, 존재할 때만 토큰을 만들어 줌.
  if (!user) {
    return {
      ok: true,
      token: null, // 이메일이 없어도 같은 메시지 보여주기용
    };
  }

  const tokens = loadResetTokens().filter((t) => t.userId !== user.id);

  const token = generateToken("reset");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15분 유효

  tokens.push({
    token,
    userId: user.id,
    expiresAt,
  });

  saveResetTokens(tokens);

  // ⚠️ 실제 서비스에서는 이 토큰을 이메일로 보내고,
  // 프론트에는 토큰을 리턴하지 않는다.
  // 지금은 데모를 위해 리턴해서 바로 reset 화면으로 이동할 수 있게 함.
  return {
    ok: true,
    token,
  };
}

// ===== 비밀번호 실제 재설정 =====
export async function mockResetPassword({ token, newPassword }) {
  await delay(500);

  const tokens = loadResetTokens();
  const entry = tokens.find((t) => t.token === token);

  if (!entry) {
    const error = new Error("유효하지 않거나 만료된 링크입니다.");
    error.code = "INVALID_OR_EXPIRED_TOKEN";
    throw error;
  }

  if (entry.expiresAt < Date.now()) {
    const error = new Error("비밀번호 재설정 링크가 만료되었습니다.");
    error.code = "INVALID_OR_EXPIRED_TOKEN";
    throw error;
  }

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === entry.userId);

  if (idx === -1) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  users[idx].password = newPassword; // ⚠️ 목이라 그냥 저장
  users[idx].updatedAt = nowIso();
  saveUsers(users);

  // 해당 토큰은 한 번만 사용 가능하도록 제거
  const nextTokens = tokens.filter((t) => t.token !== token);
  saveResetTokens(nextTokens);

  // 현재 로그인 상태도 초기화 (단일 사용자 기준)
  mockLogout();

  return { ok: true };
}

export async function mockVerifyPassword({ userId, password }) {
  await delay(300);

  const current = mockGetCurrentUser();
  const targetId = userId ?? current?.id;

  if (!targetId) {
    const error = new Error("로그인 상태가 아닙니다.");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === current.id);

  if (!user || user.password !== password) {
    const error = new Error("비밀번호가 올바르지 않습니다.");
    error.code = "INVALID_PASSWORD";
    throw error;
  }

  return true;
}

export async function mockFetchUserInfo({ id }) {
  await delay(200);

  const current = mockGetCurrentUser();
  const targetId = id ?? current?.id;

  if (!targetId) {
    const error = new Error("로그인 상태가 아닙니다.");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === targetId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  return {
    userId: user.id,
    email: user.email,
    username: user.nickname,
    baekjoonHandle: user.baekjoonId || null,
    status: user.status ?? "ACTIVE",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ?? user.createdAt,
  };
}

// ===== 닉네임 변경 =====
export async function mockUpdateNickname(payload) {
  await delay(400);

  const current = mockGetCurrentUser();
  if (!current) {
    const error = new Error("로그인 상태가 아닙니다.");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const nickname = payload?.nickname ?? payload?.username ?? "";
  const targetId = payload?.id ?? payload?.userId ?? current.id;

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === targetId);

  if (idx === -1) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  users[idx].nickname = nickname;
  users[idx].updatedAt = nowIso();
  saveUsers(users);

  // currentUser 캐시도 업데이트
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY_CURRENT_USER,
      JSON.stringify({
        id: users[idx].id,
        email: users[idx].email,
        nickname: users[idx].nickname,
        baekjoonId: users[idx].baekjoonId ?? "",
      }),
    );
  }

  return {
    user: {
      id: users[idx].id,
      email: users[idx].email,
      nickname: users[idx].nickname,
      baekjoonId: users[idx].baekjoonId ?? "",
    },
  };
}

// ===== 비밀번호 변경 =====
export async function mockChangePassword(payload) {
  await delay(400);

  const current = mockGetCurrentUser();
  if (!current) {
    const error = new Error("로그인 상태가 아닙니다.");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const newPassword = payload?.newPassword ?? payload?.password ?? "";
  const targetId = payload?.id ?? payload?.userId ?? current.id;

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === targetId);

  if (idx === -1) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  users[idx].password = newPassword;
  users[idx].updatedAt = nowIso();
  saveUsers(users);

  // 비밀번호 바꾸면 보통 세션/로그인을 끊는 편이라,
  // mock 기준으로도 currentUser는 유지하되, 실제 서비스에서는 로그아웃 권장.
  return { ok: true };
}

// ===== 회원 탈퇴 =====
export async function mockDeleteAccount(payload = {}) {
  await delay(400);

  const current = mockGetCurrentUser();
  if (!current) {
    const error = new Error("로그인 상태가 아닙니다.");
    error.code = "NOT_LOGGED_IN";
    throw error;
  }

  const targetId = payload?.id ?? payload?.userId ?? current.id;

  const users = loadUsers();
  const nextUsers = users.filter((u) => u.id !== targetId);
  saveUsers(nextUsers);

  // 로그인 정보/토큰 정리
  mockLogout();

  return { ok: true };
}
