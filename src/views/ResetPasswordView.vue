<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authService } from "@/services/authService";

const route = useRoute();
const router = useRouter();

const token = computed(() => {
  const t = route.query.token;
  return typeof t === "string" ? t : "";
});
const hasToken = computed(() => token.value.length > 0);

const password = ref("");
const passwordConfirm = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

function validate() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!hasToken.value) {
    errorMessage.value = "유효하지 않은 접근입니다. 링크를 다시 확인해주세요.";
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

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await authService.resetPassword({
      token: token.value,
      newPassword: password.value,
    });

    successMessage.value =
      "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.";
    password.value = "";
    passwordConfirm.value = "";
  } catch (e) {
    if (e.code === "INVALID_OR_EXPIRED_TOKEN") {
      errorMessage.value = e.message;
    } else {
      errorMessage.value =
        "비밀번호를 변경하는 중 문제가 발생했습니다. 링크를 다시 요청해 주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}

function goToLogin() {
  router.push({ name: "Login" });
}

function goToForgot() {
  router.push({ name: "ForgotPassword" });
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
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
          새 비밀번호 설정
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          새로운 비밀번호를 입력해 주세요.
        </p>

        <p
          v-if="errorMessage"
          class="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ errorMessage }}
        </p>

        <p
          v-if="successMessage"
          class="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
        >
          {{ successMessage }}
        </p>

        <div
          v-if="hasToken"
          class="mt-6"
        >
          <form
            class="space-y-4"
            @submit.prevent="handleSubmit"
          >
            <div>
              <label
                for="new-password"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                새 비밀번호
              </label>
              <input
                id="new-password"
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
                for="new-password-confirm"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                새 비밀번호 확인
              </label>
              <input
                id="new-password-confirm"
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
              <span v-if="!isSubmitting">비밀번호 변경하기</span>
              <span v-else>변경 중...</span>
            </button>
          </form>
        </div>

        <div
          v-else
          class="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3"
        >
          <p>유효하지 않은 링크입니다. 비밀번호 찾기부터 다시 진행해 주세요.</p>
        </div>

        <div class="mt-6 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            @click="goToForgot"
          >
            비밀번호 찾기로 돌아가기
          </button>
          <button
            type="button"
            class="text-gray-800 font-medium hover:text-yellow-600 underline-offset-2 hover:underline"
            @click="goToLogin"
          >
            로그인 하러 가기
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
