<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authService } from "@/services/authService";

const router = useRouter();

const email = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const infoMessage = ref("");
const devResetToken = ref(""); // 데모용: 바로 reset 화면으로 이동할 때 사용

function validate() {
  errorMessage.value = "";
  infoMessage.value = "";

  if (!email.value.trim()) {
    errorMessage.value = "가입하신 이메일을 입력해주세요.";
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  errorMessage.value = "";
  infoMessage.value = "";
  devResetToken.value = "";

  try {
    const res = await authService.forgotPassword({ email: email.value });

    infoMessage.value =
      "입력하신 이메일로 비밀번호 재설정 안내를 보냈습니다. (이메일이 등록되어 있다면)";

    // TODO:
    // ⚠️ 실제 서비스에서는 token을 받지 않는다.
    // 지금은 개발 편의상, mock이 token을 리턴해주기 때문에
    // 바로 reset 화면으로 이동할 수 있도록 devResetToken에 저장.
    if (res.token) {
      devResetToken.value = res.token;
      // 실제 서비스에서는 이메일을 열고 사용자가 링크를 클릭하므로
      // 아래처럼 바로 이동시키는 코드는 사용하지 않음
      // router.push({ name: "ResetPassword", query: { token: res.token } });
    }
  } catch (e) {
    errorMessage.value =
      "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    console.log(e); // TODO: remove this code and apply log
  } finally {
    isSubmitting.value = false;
  }
}

// TODO: 지금은 mock 사용 (백엔드 붙기 전까지)
function goToResetNow() {
  if (!devResetToken.value) return;
  router.push({
    name: "ResetPassword",
    query: { token: devResetToken.value },
  });
}

function goToLogin() {
  router.push({ name: "Login" });
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
          비밀번호 찾기
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          가입하신 이메일로 비밀번호 재설정 링크를 보내드릴게요.
        </p>

        <p
          v-if="errorMessage"
          class="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ errorMessage }}
        </p>

        <p
          v-if="infoMessage"
          class="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
        >
          {{ infoMessage }}
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label
              for="forgot-email"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              이메일
            </label>
            <input
              id="forgot-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="block w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isSubmitting">재설정 링크 보내기</span>
            <span v-else>요청 중...</span>
          </button>
        </form>

        <!-- 데모용 바로가기 -->
        <div
          v-if="devResetToken"
          class="mt-6 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-3 space-y-2"
        >
          <p class="font-medium text-gray-700">
            개발용 데모:
            <span class="font-normal text-gray-500">
              실제 서비스에서는 이메일로 링크가 전송되지만,<br />
              지금은 바로 새 비밀번호 설정 화면으로 이동할 수 있어요.
            </span>
          </p>
          <button
            type="button"
            class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            @click="goToResetNow"
          >
            새 비밀번호 설정하러 가기
          </button>
        </div>

        <div class="mt-6 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            @click="goToLogin"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
