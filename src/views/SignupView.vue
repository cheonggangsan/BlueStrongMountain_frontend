<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
// TODO: 실제 회원가입 API (ID/PW 기반)
// import { signupWithIdPw, checkUsernameDuplicate } from "@/api/authApi";

// TODO: TODO: mock 버전
import { mockSignup, mockCheckUsernameDuplicate } from "../api/mockAuthApi";

const router = useRouter();

const email = ref("");
const nickname = ref("");
const password = ref("");
const passwordConfirm = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

// 닉네임 중복 확인용 상태
const isCheckingNickname = ref(false);
const nicknameCheckMessage = ref("");
const isNicknameDuplicated = ref(null); // null: 아직 모름, true: 중복, false: 사용 가능

// 닉네임이 바뀌면 이전 중복 확인 결과는 무효화
watch(nickname, () => {
  isNicknameDuplicated.value = null;
  nicknameCheckMessage.value = "";
});

async function handleCheckNickname() {
  nicknameCheckMessage.value = "";
  isNicknameDuplicated.value = null;

  const value = nickname.value.trim();
  if (!value) {
    nicknameCheckMessage.value = "닉네임을 먼저 입력해주세요.";
    return;
  }

  isCheckingNickname.value = true;

  try {
    //TODO: change this code to actually api code
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

    //TODO: change upper code to this code for actual API
    // const res = await checkUsernameDuplicate({ username: value });
    // const duplicated = res.duplicated; // 응답 형식에 맞게 수정
  } catch (e) {
    isNicknameDuplicated.value = null;
    nicknameCheckMessage.value =
      "닉네임 중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e);
  } finally {
    isCheckingNickname.value = false;
  }
}

function validate() {
  errorMessage.value = "";

  if (!email.value.trim() || !nickname.value.trim()) {
    errorMessage.value = "이메일과 닉네임을 모두 입력해주세요.";
    return false;
  }

  if (password.value.length < 8) {
    errorMessage.value = "비밀번호는 최소 8자 이상이어야 합니다.";
    return false;
  }

  if (password.value !== passwordConfirm.value) {
    errorMessage.value = "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    return false;
  }

  if (isNicknameDuplicated.value === true) {
    errorMessage.value =
      "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.";
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    // TODO: 1) 지금: mock + ID/PW
    await mockSignup({
      email: email.value,
      nickname: nickname.value,
      password: password.value,
    });

    // TODO: 2) 나중: 실제 API
    // await signupWithIdPw({
    //   email: email.value,
    //   nickname: nickname.value,
    //   password: password.value,
    // });

    router.push({ name: "Login" });
  } catch (e) {
    errorMessage.value = "이미 사용 중인 이메일이거나, 다시 시도해 주세요.";
    console.log(e); // TODO: remove and apply log
  } finally {
    isSubmitting.value = false;
  }
}

function goToLogin() {
  router.push({ name: "Login" });
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-yellow-50/70 via-white to-gray-50 text-gray-900 flex flex-col"
  >
    <header class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6">
      <h1 class="text-xl font-semibold tracking-tight">BlueStrongMountain</h1>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
      <div
        class="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-yellow-100/60 px-6 py-8 sm:px-8"
      >
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
          회원가입
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          알고리즘 스터디를 함께할 계정을 만들어 주세요.
        </p>

        <!-- 에러 메시지 -->
        <p
          v-if="errorMessage"
          class="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ errorMessage }}
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label
              for="signup-email"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              이메일
            </label>
            <input
              id="signup-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              for="nickname"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              닉네임
            </label>
            <div class="flex gap-2">
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                autocomplete="nickname"
                required
                class="flex-1 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="스터디에서 사용할 이름"
              />
              <button
                type="button"
                class="shrink-0 rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isCheckingNickname || !nickname.trim()"
                @click="handleCheckNickname"
              >
                <span v-if="!isCheckingNickname">중복 확인</span>
                <span v-else>확인 중...</span>
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

          <div>
            <label
              for="signup-password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              id="signup-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="8자 이상, 안전한 비밀번호"
            />
            <p class="mt-1 text-xs text-gray-400">
              영문, 숫자, 특수문자를 조합하면 더 안전해요.
            </p>
          </div>

          <div>
            <label
              for="signup-password-confirm"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호 확인
            </label>
            <input
              id="signup-password-confirm"
              v-model="passwordConfirm"
              type="password"
              autocomplete="new-password"
              required
              class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="비밀번호를 한 번 더 입력해주세요"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isSubmitting">가입하기</span>
            <span v-else>가입 처리 중...</span>
          </button>
        </form>

        <div class="mt-6 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            @click="goToLogin"
          >
            이미 계정이 있으신가요?
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
