<script setup>
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { authService } from "@/services/authService";

const router = useRouter();

const currentStep = ref(1); // 1: 약관 동의, 2: 회원가입 폼

const agreeService = ref(false); // (필수) 서비스 이용약관
const agreePrivacy = ref(false); // (필수) 개인정보 처리방침
const agreeMarketing = ref(false); // (선택) 마케팅 수신 동의

const canProceedTerms = computed(
  () => agreeService.value && agreePrivacy.value,
);

const email = ref("");
const baekjoonId = ref("");
const nickname = ref("");
const password = ref("");
const passwordConfirm = ref("");

const isSubmitting = ref(false);
const errorMessage = ref("");

const isCheckingBaekjoon = ref(false);
const baekjoonCheckMessage = ref("");
const isBaekjoonValid = ref(null); // null: 아직 모름, true: 존재, false: 없음

const isCheckingNickname = ref(false);
const nicknameCheckMessage = ref("");
const isNicknameDuplicated = ref(null); // null: 아직 모름, true: 중복, false: 사용 가능

watch(nickname, () => {
  isNicknameDuplicated.value = null;
  nicknameCheckMessage.value = "";
});

watch(baekjoonId, () => {
  isBaekjoonValid.value = null;
  baekjoonCheckMessage.value = "";
});

function goToFormStep() {
  if (!canProceedTerms.value) {
    errorMessage.value = "필수 약관에 모두 동의해 주세요.";
    return;
  }
  errorMessage.value = "";
  currentStep.value = 2;
}

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
    const res = await authService.checkUsernameDuplicate({ username: value });

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

async function handleCheckBaekjoonId() {
  baekjoonCheckMessage.value = "";
  isBaekjoonValid.value = null;

  const handle = baekjoonId.value.trim();
  if (!handle) {
    baekjoonCheckMessage.value = "백준 아이디를 먼저 입력해주세요.";
    return;
  }

  isCheckingBaekjoon.value = true;

  try {
    const res = await authService.checkBaekjoonId({ handle });
    // 가정: { exists: boolean }
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
    isCheckingBaekjoon.value = false;
  }
}

function validate() {
  errorMessage.value = "";

  if (!email.value.trim() || !nickname.value.trim()) {
    errorMessage.value = "이메일과 닉네임을 모두 입력해주세요.";
    return false;
  }

  if (!baekjoonId.value.trim()) {
    errorMessage.value = "백준 아이디를 입력해주세요.";
    return false;
  }

  if (isBaekjoonValid.value !== true) {
    errorMessage.value = "백준 아이디가 존재하는지 확인 버튼을 눌러주세요.";
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
    await authService.signup({
      email: email.value,
      nickname: nickname.value,
      password: password.value,
      baekjoonId: baekjoonId.value,
    });

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

        <!-- STEP 1: 약관 동의 -->
        <div
          v-if="currentStep === 1"
          class="mt-6 space-y-4"
        >
          <div
            class="border border-gray-200 rounded-xl bg-white/70 px-4 py-3 text-xs text-gray-700 max-h-64 overflow-y-auto"
          >
            <h3 class="text-sm font-semibold mb-2">
              BlueStrongMountain 이용약관 (요약)
            </h3>
            <p class="mb-2">
              아래 내용은 서비스 가입을 위해 꼭 확인해야 하는 필수 약관의
              요약입니다. 자세한 내용은 향후 실제 약관 페이지로 연결할 수
              있습니다.
            </p>

            <ul class="list-disc pl-4 space-y-1">
              <li>
                서비스 이용약관: 알고리즘 스터디 플랫폼 이용과 관련된 기본
                권리·의무에 대한 내용입니다.
              </li>
              <li>
                개인정보 처리방침: 회원가입 및 서비스 이용 과정에서 수집되는
                최소한의 정보를 어떻게 보관·이용하는지에 대한 내용입니다.
              </li>
              <li>
                선택 동의(마케팅 등): 새로운 기능/이벤트 안내 등을 위해 이메일
                알림을 받을지에 대한 선택 동의입니다.
              </li>
            </ul>
          </div>

          <div class="space-y-2 text-xs text-gray-800">
            <label class="flex items-start gap-2 cursor-pointer">
              <input
                v-model="agreeService"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <span>
                [필수] BlueStrongMountain 서비스 이용약관에 동의합니다.
              </span>
            </label>

            <label class="flex items-start gap-2 cursor-pointer">
              <input
                v-model="agreePrivacy"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <span> [필수] 개인정보 수집 및 이용에 동의합니다. </span>
            </label>

            <label class="flex items-start gap-2 cursor-pointer">
              <input
                v-model="agreeMarketing"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <span>
                [선택] 새로운 기능/이벤트 등 마케팅 정보 수신에 동의합니다.
              </span>
            </label>

            <p class="mt-2 text-[11px] text-gray-500">
              선택 항목에 동의하지 않으셔도 서비스 이용에는 제한이 없습니다.
            </p>
          </div>

          <button
            type="button"
            class="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            :disabled="!canProceedTerms"
            @click="goToFormStep"
          >
            약관에 동의하고 회원가입 진행
          </button>
        </div>

        <!-- STEP 2: 실제 회원가입 폼 -->
        <form
          v-else
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
              for="baekjoon-id"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              백준 아이디
            </label>
            <div class="flex gap-2">
              <input
                id="baekjoon-id"
                v-model="baekjoonId"
                type="text"
                autocomplete="off"
                required
                class="flex-1 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                placeholder="백준 온라인 저지 아이디"
              />
              <button
                type="button"
                class="shrink-0 rounded-lg border border-gray-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isCheckingBaekjoon || !baekjoonId.trim()"
                @click="handleCheckBaekjoonId"
              >
                <span v-if="!isCheckingBaekjoon">아이디 확인</span>
                <span v-else>확인 중...</span>
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
