<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
// TODO: 실제 API 연동 버전 (JWT 없는 ID/PW) 아니면 /stores/authStore
// import { loginWithIdPw } from "../api/authApi";

// TODO: mock 버전 (백엔드 붙기 전까지 사용)
import { mockLogin } from "../api/mockAuthApi";

const router = useRouter();

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

function validate() {
  errorMessage.value = "";

  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = "이메일과 비밀번호를 모두 입력해주세요.";
    return false;
  }

  if (password.value.length < 8) {
    errorMessage.value = "비밀번호는 최소 8자 이상이어야 합니다.";
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    // TODO: ===== 1) 지금: mock + ID/PW 기반 =====
    const { user /*, accessToken */ } = await mockLogin({
      email: email.value,
      password: password.value,
    });
    console.log("로그인 성공 (mock)", user);
    // 나중에 JWT 도입 시 accessToken 활용:
    // authStore.setAuth(user, accessToken);

    // ===== 2) 나중에: 실제 API + 세션(ID/PW) =====
    // const { user } = await loginWithIdPw({
    //   id: email.value, // 서버에서 ID로 쓸 값 (이메일이면 그대로)
    //   password: password.value,
    // });

    router.push({ name: "GroupList" });
  } catch (e) {
    errorMessage.value = "이메일 또는 비밀번호가 올바르지 않습니다.";
    console.log(e); // TODO: remove and apply logging
  } finally {
    isSubmitting.value = false;
  }
}

function goToHome() {
  router.push({ name: "Home" });
}

function goToForgotPassword() {
  router.push({ name: "ForgotPassword" });
}

function goToSignup() {
  router.push({ name: "Signup" });
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-yellow-50/70 via-white to-gray-50 text-gray-900 flex flex-col"
  >
    <header class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6">
      <h1
        class="text-xl font-semibold tracking-tight cursor-pointer"
        @click="goToHome"
      >
        BlueStrongMountain
      </h1>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
      <div
        class="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-yellow-100/60 px-6 py-8 sm:px-8"
      >
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">로그인</h2>
        <p class="mt-2 text-sm text-gray-600">
          알고리즘 보드를 관리하려면 먼저 로그인하세요.
        </p>

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
              for="email"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              이메일
            </label>
            <input
              id="email"
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
              for="password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="8자 이상 입력해주세요"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isSubmitting">로그인</span>
            <span v-else>로그인 중...</span>
          </button>
        </form>

        <div class="mt-6 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            @click="goToForgotPassword"
          >
            비밀번호를 잊으셨나요?
          </button>
          <button
            type="button"
            class="text-gray-800 font-medium hover:text-yellow-600 underline-offset-2 hover:underline"
            @click="goToSignup"
          >
            아직 계정이 없으신가요?
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
