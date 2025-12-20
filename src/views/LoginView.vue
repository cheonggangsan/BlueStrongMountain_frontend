<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/data/authStore";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const infoMessage = ref("");

if (route.query.reason === "passwordChanged") {
  infoMessage.value =
    "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.";
}

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
  auth.resetError();

  try {
    await auth.login({
      email: email.value,
      password: password.value,
    });

    const redirect =
      (route.query.redirect && String(route.query.redirect)) || null;

    router.replace(redirect || { name: "GroupList" });
  } catch (e) {
    // authStore.error에 백엔드/목 기준 메시지가 들어있도록 설계해둠
    errorMessage.value =
      auth.error.value || "이메일 또는 비밀번호가 올바르지 않습니다.";
    console.log(e); // TODO: remove and apply logging
  } finally {
    isSubmitting.value = false;
  }
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
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
      <div
        class="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-yellow-100/60 px-6 py-8 sm:px-8"
      >
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">로그인</h2>
        <p class="mt-2 text-sm text-gray-600">
          알고리즘 보드를 관리하려면 먼저 로그인하세요.
        </p>

        <p
          v-if="infoMessage"
          class="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
        >
          {{ infoMessage }}
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
