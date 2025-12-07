<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/data/authStore";

// TODO: 실제 API 전환 시 사용할 예시 (지금은 mock만 사용)
// import { verifyPassword, changePassword } from "@/api/authApi";
// import { updateMyProfile, deleteMyAccount, getMyProfile, getMyGroupSummary } from "@/api/memberApi";

import {
  mockVerifyPassword,
  mockUpdateNickname,
  mockChangePassword,
  mockDeleteAccount,
  mockCheckUsernameDuplicate,
  mockCheckBaekjoonId,
  mockUpdateBaekjoonId,
} from "../api/mockAuthApi";

const router = useRouter();
const authStore = useAuthStore();

// ===== 공통 상태 =====
const globalMessage = ref("");
const globalError = ref("");

// ===== 1단계: 비밀번호 재입력 (재인증) =====
const step = ref("verify"); // 'verify' | 'profile'
const verifyPasswordInput = ref("");
const verifyError = ref("");
const verifyLoading = ref(false);

// ===== 2단계: 프로필 정보 =====
const email = ref("");
const nickname = ref("");
const originalNickname = ref("");
const baekjoonId = ref("");
const originalBaekjoonId = ref("");

// 백준 아이디 수정 상태
const isEditingBaekjoonId = ref(false);
const isSavingBaekjoonId = ref(false);
const isCheckingBaekjoonId = ref(false);
const baekjoonCheckMessage = ref("");
const isBaekjoonValid = ref(null); // null: 모름, true: 존재, false: 없음

// 닉네임 수정 상태
const isEditingNickname = ref(false);
const isSavingNickname = ref(false);
const isCheckingNickname = ref(false);
const nicknameCheckMessage = ref("");
const isNicknameDuplicated = ref(null); // null: 모름, true: 중복, false: 사용 가능

// 닉네임이 바뀌면 중복 결과는 무효화
watch(nickname, () => {
  if (!isEditingNickname.value) return;
  isNicknameDuplicated.value = null;
  nicknameCheckMessage.value = "";
});

// 백준 아이디가 바뀌면 검증 결과는 무효화
watch(baekjoonId, () => {
  if (!isEditingBaekjoonId.value) return;
  isBaekjoonValid.value = null;
  baekjoonCheckMessage.value = "";
});

// ===== 3영역: 비밀번호 변경 =====
const showPasswordSection = ref(false);
const newPassword = ref("");
const newPasswordConfirm = ref("");
const isChangingPassword = ref(false);
const passwordChangeMessage = ref("");
const passwordChangeError = ref("");

// ===== 4영역: 회원 탈퇴 =====
const showDeleteConfirm = ref(false);
const deleteConfirmInput = ref("");
const isDeleting = ref(false);
const deleteError = ref("");

// ===== 기본 유저 정보 로드 (로그인 안 돼 있으면 Login으로) =====
onMounted(async () => {
  // authStore에 세션 동기화
  if (!authStore.initialized.value) {
    await authStore.fetchCurrentUser();
  }

  const current = authStore.user.value;
  if (!current) {
    router.push({
      name: "Login",
      query: { redirect: "/me" },
    });
    return;
  }
});

// ===== 1) 비밀번호 재입력 처리 =====
async function handleVerifyPassword() {
  verifyError.value = "";
  globalError.value = "";
  globalMessage.value = "";

  const pwd = verifyPasswordInput.value.trim();

  if (pwd.length < 8) {
    verifyError.value = "비밀번호는 최소 8자 이상이어야 합니다.";
    return;
  }

  verifyLoading.value = true;
  try {
    // TODO: 지금은 mock 사용
    const res = await mockVerifyPassword({ password: pwd });

    const user = res.user;
    email.value = user.email;
    nickname.value = user.nickname;
    originalNickname.value = user.nickname;
    baekjoonId.value = user.baekjoonId || "";
    originalBaekjoonId.value = user.baekjoonId || "";

    step.value = "profile";
    verifyPasswordInput.value = "";
    globalMessage.value = "본인 확인이 완료되었습니다.";
  } catch (e) {
    if (e.code === "INVALID_PASSWORD") {
      verifyError.value = "비밀번호가 올바르지 않습니다.";
    } else {
      verifyError.value =
        "본인 확인 중 문제가 발생했습니다. 다시 시도해주세요.";
    }
    console.log(e);
  } finally {
    verifyLoading.value = false;
  }
}

// ===== 닉네임 중복 확인 =====
async function handleCheckNickname() {
  nicknameCheckMessage.value = "";
  isNicknameDuplicated.value = null;

  const value = nickname.value.trim();
  if (!value) {
    nicknameCheckMessage.value = "닉네임을 먼저 입력해주세요.";
    isNicknameDuplicated.value = null;
    return;
  }

  // 지금 닉네임과 동일한 경우
  if (value === originalNickname.value) {
    isNicknameDuplicated.value = false;
    nicknameCheckMessage.value = "현재 사용 중인 닉네임입니다.";
    return;
  }

  isCheckingNickname.value = true;

  try {
    // TODO: 실제 API 전환 시 checkUsernameDuplicate 사용
    const res = await mockCheckUsernameDuplicate({ username: value });

    const duplicated =
      res.duplicated ??
      (typeof res.available === "boolean" ? !res.available : false);

    if (duplicated) {
      isNicknameDuplicated.value = true;
      nicknameCheckMessage.value =
        "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.";
    } else {
      isNicknameDuplicated.value = false;
      nicknameCheckMessage.value = "사용 가능한 닉네임입니다.";
    }
  } catch (e) {
    isNicknameDuplicated.value = null;
    nicknameCheckMessage.value =
      "닉네임 중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isCheckingNickname.value = false;
  }
}

function startEditNickname() {
  isEditingNickname.value = true;
  nicknameCheckMessage.value = "";
  isNicknameDuplicated.value = null;
}

function cancelEditNickname() {
  isEditingNickname.value = false;
  nickname.value = originalNickname.value;
  nicknameCheckMessage.value = "";
  isNicknameDuplicated.value = null;
}

// ===== 닉네임 저장 =====
async function handleSaveNickname() {
  globalError.value = "";
  globalMessage.value = "";

  const value = nickname.value.trim();
  if (!value) {
    globalError.value = "닉네임을 비울 수 없습니다.";
    return;
  }

  // 변경이 없으면 그냥 종료
  if (value === originalNickname.value) {
    isEditingNickname.value = false;
    nicknameCheckMessage.value = "";
    isNicknameDuplicated.value = null;
    return;
  }

  // 중복 상태가 true라면 저장 불가
  if (isNicknameDuplicated.value === true) {
    globalError.value =
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.";
    return;
  }

  // 중복 검사 안 했으면 UX상 한 번 유도
  if (isNicknameDuplicated.value === null) {
    globalError.value = "닉네임 중복 확인 후 저장해주세요.";
    return;
  }

  isSavingNickname.value = true;

  try {
    // TODO: 지금은 mock 사용
    const res = await mockUpdateNickname({ nickname: value });
    const user = res.user;

    nickname.value = user.nickname;
    originalNickname.value = user.nickname;

    isEditingNickname.value = false;
    nicknameCheckMessage.value = "";
    isNicknameDuplicated.value = null;
    globalMessage.value = "닉네임이 변경되었습니다.";

    // 헤더/전역 상태 동기화
    await authStore.fetchCurrentUser({ force: true });
  } catch (e) {
    globalError.value =
      "닉네임을 변경하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isSavingNickname.value = false;
  }
}

// ===== 백준 아이디 확인 =====
async function handleCheckBaekjoonId() {
  baekjoonCheckMessage.value = "";
  isBaekjoonValid.value = null;

  const handle = baekjoonId.value.trim();
  if (!handle) {
    baekjoonCheckMessage.value = "백준 아이디를 먼저 입력해주세요.";
    return;
  }

  // 지금 등록된 아이디와 동일하면 그냥 유효로 처리
  if (handle === (originalBaekjoonId.value || "")) {
    isBaekjoonValid.value = true;
    baekjoonCheckMessage.value = "현재 등록된 백준 아이디입니다.";
    return;
  }

  isCheckingBaekjoonId.value = true;

  try {
    // TODO: 실제 백엔드로 교체 예정
    const res = await mockCheckBaekjoonId({ handle });
    if (res.exists) {
      isBaekjoonValid.value = true;
      baekjoonCheckMessage.value = "존재하는 백준 아이디입니다.";
    } else {
      isBaekjoonValid.value = false;
      baekjoonCheckMessage.value =
        "존재하지 않는 백준 아이디입니다. 다시 확인해주세요.";
    }
  } catch (e) {
    console.error(e);
    isBaekjoonValid.value = null;
    baekjoonCheckMessage.value =
      "백준 아이디 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  } finally {
    isCheckingBaekjoonId.value = false;
  }
}

function startEditBaekjoonId() {
  isEditingBaekjoonId.value = true;
  baekjoonCheckMessage.value = "";
  isBaekjoonValid.value = null;
}

function cancelEditBaekjoonId() {
  isEditingBaekjoonId.value = false;
  baekjoonId.value = originalBaekjoonId.value || "";
  baekjoonCheckMessage.value = "";
  isBaekjoonValid.value = null;
}

// ===== 백준 아이디 저장 =====
async function handleSaveBaekjoonId() {
  globalError.value = "";
  globalMessage.value = "";

  const value = baekjoonId.value.trim();

  if (!value) {
    globalError.value = "백준 아이디를 비울 수 없습니다.";
    return;
  }

  // 변경 없으면 그냥 종료
  if (value === (originalBaekjoonId.value || "")) {
    isEditingBaekjoonId.value = false;
    baekjoonCheckMessage.value = "";
    isBaekjoonValid.value = null;
    return;
  }

  // 존재하지 않는 아이디면 막기
  if (isBaekjoonValid.value !== true) {
    globalError.value =
      "백준 아이디가 실제로 존재하는지 확인 버튼을 눌러주세요.";
    return;
  }

  isSavingBaekjoonId.value = true;

  try {
    // TODO: 실제 서버 API로 전환 예정
    const res = await mockUpdateBaekjoonId({ baekjoonId: value });
    const user = res.user;

    baekjoonId.value = user.baekjoonId || "";
    originalBaekjoonId.value = user.baekjoonId || "";

    isEditingBaekjoonId.value = false;
    baekjoonCheckMessage.value = "";
    isBaekjoonValid.value = null;
    globalMessage.value = "백준 아이디가 변경되었습니다.";

    // 헤더/전역 상태 동기화
    await authStore.fetchCurrentUser({ force: true });
  } catch (e) {
    globalError.value =
      "백준 아이디를 변경하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isSavingBaekjoonId.value = false;
  }
}

// ===== 비밀번호 변경 =====
async function handleChangePassword() {
  passwordChangeError.value = "";
  passwordChangeMessage.value = "";
  globalError.value = "";
  globalMessage.value = "";

  const pwd = newPassword.value.trim();
  const confirm = newPasswordConfirm.value.trim();

  if (pwd.length < 8) {
    passwordChangeError.value = "비밀번호는 최소 8자 이상이어야 합니다.";
    return;
  }

  if (pwd !== confirm) {
    passwordChangeError.value =
      "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    return;
  }

  isChangingPassword.value = true;

  try {
    // TODO: 지금은 mock 사용
    await mockChangePassword({ newPassword: pwd });

    // 보안상 비밀번호 변경 후 세션 끊고 재로그인 요구
    await authStore.logout();

    // Login 페이지에서 reason=passwordChanged로 안내 문구 표시하도록 사용
    router.push({
      name: "Login",
      query: { reason: "passwordChanged" },
    });
  } catch (e) {
    passwordChangeError.value =
      "비밀번호 변경 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isChangingPassword.value = false;
    newPassword.value = "";
    newPasswordConfirm.value = "";
  }
}

// ===== 회원 탈퇴 =====
async function handleDeleteAccount() {
  deleteError.value = "";
  globalError.value = "";
  globalMessage.value = "";

  if (deleteConfirmInput.value.trim() !== "탈퇴합니다") {
    deleteError.value =
      '확인 문구가 일치하지 않습니다. "탈퇴합니다"를 정확히 입력해주세요.';
    return;
  }

  isDeleting.value = true;

  try {
    /**
     * TODO: 실제 백엔드 전환 시에는 대략 이런 흐름으로:
     *
     * const summary = await getMyGroupSummary();
     * if (summary.joinedCount && summary.joinedCount > 0) {
     *   deleteError.value =
     *     `현재 ${summary.joinedCount}개의 그룹에 속해 있습니다. ` +
     *     "모든 그룹에서 탈퇴한 뒤 다시 시도해주세요.";
     *   return;
     * }
     *
     * await deleteMyAccount();
     */

    // 지금은 mock에서는 그룹 개념이 없으니 바로 탈퇴
    await mockDeleteAccount();

    // 세션/스토어 정리
    await authStore.logout();

    // 탈퇴 후에는 홈(또는 랜딩)으로 이동
    router.push({ name: "Home" });
  } catch (e) {
    deleteError.value =
      "회원 탈퇴 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-yellow-50/70 via-white to-gray-50 text-gray-900 flex flex-col"
  >
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
      <div
        class="w-full max-w-2xl bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-yellow-100/60 px-6 py-8 sm:px-8 space-y-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
              마이페이지
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              계정 정보를 확인하고, 닉네임·비밀번호·탈퇴를 관리할 수 있어요.
            </p>
          </div>
          <span
            class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
          >
            계정 설정
          </span>
        </div>

        <!-- 전역 메시지 -->
        <p
          v-if="globalError"
          class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ globalError }}
        </p>
        <p
          v-if="globalMessage"
          class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
        >
          {{ globalMessage }}
        </p>

        <!-- 1단계: 비밀번호 재확인 -->
        <section
          v-if="step === 'verify'"
          class="border border-gray-100 rounded-xl px-4 py-4 bg-gray-50/60"
        >
          <h3 class="text-sm font-semibold text-gray-800">1. 본인 확인</h3>
          <p class="mt-1 text-xs text-gray-600">
            개인정보 보호를 위해 마이페이지에 들어가기 전에 비밀번호를 한 번 더
            확인해요.
          </p>

          <div class="mt-4 space-y-3">
            <div>
              <label
                for="verify-password"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호
              </label>
              <input
                id="verify-password"
                v-model="verifyPasswordInput"
                type="password"
                autocomplete="current-password"
                class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="비밀번호를 입력해주세요"
              />
              <p class="mt-1 text-xs text-gray-400">
                로그인에 사용하는 비밀번호와 동일합니다.
              </p>
            </div>

            <p
              v-if="verifyError"
              class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {{ verifyError }}
            </p>

            <button
              type="button"
              :disabled="verifyLoading"
              class="mt-1 inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              @click="handleVerifyPassword"
            >
              <span v-if="!verifyLoading">본인 확인하기</span>
              <span v-else>확인 중...</span>
            </button>
          </div>
        </section>

        <!-- 2단계: 프로필/보안 설정 -->
        <section
          v-else
          class="space-y-6"
        >
          <!-- 계정 정보 -->
          <div class="border border-gray-100 rounded-xl px-4 py-4">
            <h3 class="text-sm font-semibold text-gray-800">계정 정보</h3>
            <p class="mt-1 text-xs text-gray-600">
              로그인에 사용되는 이메일과 스터디에서 보이는 닉네임입니다.
            </p>

            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">
                  이메일
                </label>
                <div
                  class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <span>{{ email }}</span>
                  <span class="text-[11px] text-gray-400"> 로그인 ID </span>
                </div>
              </div>

              <div>
                <label
                  for="mypage-baekjoon-id"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  백준 아이디
                </label>

                <div class="flex gap-2 items-center">
                  <input
                    id="mypage-baekjoon-id"
                    v-model="baekjoonId"
                    :disabled="!isEditingBaekjoonId"
                    type="text"
                    class="flex-1 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="백준 온라인 저지 아이디"
                  />
                  <button
                    v-if="!isEditingBaekjoonId"
                    type="button"
                    class="shrink-0 rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                    @click="startEditBaekjoonId"
                  >
                    아이디 수정
                  </button>
                </div>

                <!-- 백준 아이디 수정 모드 -->
                <div
                  v-if="isEditingBaekjoonId"
                  class="mt-2 flex flex-wrap items-center gap-2"
                >
                  <button
                    type="button"
                    class="rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="isCheckingBaekjoonId || !baekjoonId.trim()"
                    @click="handleCheckBaekjoonId"
                  >
                    <span v-if="!isCheckingBaekjoonId">아이디 확인</span>
                    <span v-else>확인 중...</span>
                  </button>

                  <button
                    type="button"
                    class="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="isSavingBaekjoonId"
                    @click="handleSaveBaekjoonId"
                  >
                    <span v-if="!isSavingBaekjoonId">저장</span>
                    <span v-else>저장 중...</span>
                  </button>

                  <button
                    type="button"
                    class="rounded-lg border border-transparent px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    @click="cancelEditBaekjoonId"
                  >
                    취소
                  </button>
                </div>

                <p
                  v-if="baekjoonCheckMessage"
                  class="mt-1 text-xs"
                  :class="
                    isBaekjoonValid === true ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ baekjoonCheckMessage }}
                </p>
              </div>

              <div>
                <label
                  for="mypage-nickname"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  닉네임
                </label>

                <div class="flex gap-2 items-center">
                  <input
                    id="mypage-nickname"
                    v-model="nickname"
                    :disabled="!isEditingNickname"
                    type="text"
                    class="flex-1 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="스터디에서 사용할 이름"
                  />
                  <button
                    v-if="!isEditingNickname"
                    type="button"
                    class="shrink-0 rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
                    @click="startEditNickname"
                  >
                    닉네임 수정
                  </button>
                </div>

                <!-- 닉네임 수정 모드일 때만 보이는 영역 -->
                <div
                  v-if="isEditingNickname"
                  class="mt-2 flex flex-wrap items-center gap-2"
                >
                  <button
                    type="button"
                    class="rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="isCheckingNickname || !nickname.trim()"
                    @click="handleCheckNickname"
                  >
                    <span v-if="!isCheckingNickname">중복 확인</span>
                    <span v-else>확인 중...</span>
                  </button>

                  <button
                    type="button"
                    class="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="isSavingNickname"
                    @click="handleSaveNickname"
                  >
                    <span v-if="!isSavingNickname">저장</span>
                    <span v-else>저장 중...</span>
                  </button>

                  <button
                    type="button"
                    class="rounded-lg border border-transparent px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    @click="cancelEditNickname"
                  >
                    취소
                  </button>
                </div>

                <p
                  v-if="nicknameCheckMessage"
                  class="mt-1 text-xs"
                  :class="
                    isNicknameDuplicated === false
                      ? 'text-green-600'
                      : 'text-red-600'
                  "
                >
                  {{ nicknameCheckMessage }}
                </p>
              </div>
            </div>
          </div>

          <!-- 비밀번호 변경 -->
          <div class="border border-gray-100 rounded-xl px-4 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-gray-800">
                  비밀번호 변경
                </h3>
                <p class="mt-1 text-xs text-gray-600">
                  정기적으로 비밀번호를 변경하면 계정을 더 안전하게 지킬 수
                  있어요.
                </p>
              </div>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
                @click="showPasswordSection = !showPasswordSection"
              >
                {{ showPasswordSection ? "접기" : "열기" }}
              </button>
            </div>

            <div
              v-if="showPasswordSection"
              class="mt-4 space-y-3"
            >
              <div>
                <label
                  for="mypage-new-password"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  새 비밀번호
                </label>
                <input
                  id="mypage-new-password"
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  placeholder="8자 이상, 안전한 비밀번호"
                />
              </div>

              <div>
                <label
                  for="mypage-new-password-confirm"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="mypage-new-password-confirm"
                  v-model="newPasswordConfirm"
                  type="password"
                  autocomplete="new-password"
                  class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  placeholder="비밀번호를 한 번 더 입력해주세요"
                />
              </div>

              <p
                v-if="passwordChangeError"
                class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {{ passwordChangeError }}
              </p>
              <p
                v-if="passwordChangeMessage"
                class="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
              >
                {{ passwordChangeMessage }}
              </p>

              <button
                type="button"
                :disabled="isChangingPassword"
                class="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
                @click="handleChangePassword"
              >
                <span v-if="!isChangingPassword">비밀번호 변경하기</span>
                <span v-else>변경 중...</span>
              </button>
            </div>
          </div>

          <!-- 회원 탈퇴 -->
          <div class="border border-red-100 rounded-xl px-4 py-4 bg-red-50/40">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-red-700">회원 탈퇴</h3>
                <p class="mt-1 text-xs text-red-600">
                  탈퇴 시 계정과 관련된 데이터가 삭제되며, 복구가 어려울 수
                  있어요.
                </p>
              </div>
              <button
                type="button"
                class="text-xs font-medium text-red-700 hover:text-red-800 underline-offset-2 hover:underline"
                @click="
                  showDeleteConfirm = !showDeleteConfirm;
                  deleteConfirmInput = '';
                  deleteError = '';
                "
              >
                {{ showDeleteConfirm ? "취소" : "탈퇴하기" }}
              </button>
            </div>

            <div
              v-if="showDeleteConfirm"
              class="mt-3 space-y-3"
            >
              <p class="text-xs text-red-700">
                정말 탈퇴하시겠어요? 아래에
                <span class="text-base font-semibold">탈퇴합니다</span>
                를 그대로 입력하면 탈퇴 버튼이 활성화됩니다.
              </p>

              <input
                v-model="deleteConfirmInput"
                type="text"
                class="block w-full rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-sm shadow-sm placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
                placeholder="탈퇴합니다 를 입력해주세요"
              />

              <p
                v-if="deleteError"
                class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {{ deleteError }}
              </p>

              <button
                type="button"
                :disabled="
                  isDeleting || deleteConfirmInput.trim() !== '탈퇴합니다'
                "
                class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                @click="handleDeleteAccount"
              >
                <span v-if="!isDeleting">정말 탈퇴하기</span>
                <span v-else>처리 중...</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
