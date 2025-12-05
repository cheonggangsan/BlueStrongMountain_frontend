<!-- src/components/layout/AppHeader.vue -->
<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/data/authStore";

const router = useRouter();
const auth = useAuthStore();

// 앱 시작 시 한 번 세션 동기화 (mock이면 localStorage에서 복원)
onMounted(() => {
  auth.fetchCurrentUser();
});

const initialized = computed(() => auth.initialized.value);
const isAuthenticated = computed(() => auth.isAuthenticated.value);
const isLoading = computed(() => auth.isLoading.value);
const isRefreshing = computed(() => auth.isRefreshing.value);

const userNickname = computed(
  () => auth.user.value?.nickname || auth.user.value?.name || "",
);
const userInitial = computed(() =>
  userNickname.value ? userNickname.value.charAt(0) : "U",
);

// /me 호출 중이거나 아직 초기화 전이면 스켈레톤
const showSkeleton = computed(() => !initialized.value || isRefreshing.value);

function goHome() {
  router.push({ name: "Home" });
}

function goLogin() {
  router.push({ name: "Login" });
}

function goSignup() {
  router.push({ name: "Signup" });
}

function goMyPage() {
  router.push({ name: "MyPageView" });
}

async function handleLogout() {
  await auth.logout();
  router.push({ name: "Home" });
}
</script>

<template>
  <header
    class="w-full border-b border-yellow-100/70 bg-white/80 backdrop-blur-sm z-20"
  >
    <div
      class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
    >
      <!-- 로고 / 홈 -->
      <button
        type="button"
        class="text-base sm:text-lg font-semibold tracking-tight text-gray-900 hover:text-yellow-600"
        @click="goHome"
      >
        BlueStrongMountain
      </button>

      <!-- 오른쪽: 로그인 상태 영역 -->
      <div class="flex items-center gap-3 text-xs sm:text-sm">
        <!-- 세션 동기화 중 (스켈레톤) -->
        <div
          v-if="showSkeleton"
          class="h-6 w-24 rounded-full bg-gray-100 animate-pulse"
        />

        <!-- 비로그인 상태 -->
        <template v-else-if="!isAuthenticated">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-gray-700 hover:text-yellow-700 hover:bg-yellow-50"
            @click="goLogin"
          >
            로그인
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-yellow-400 text-gray-900 font-semibold shadow-sm hover:bg-yellow-300"
            @click="goSignup"
          >
            회원가입
          </button>
        </template>

        <!-- 로그인 상태 -->
        <template v-else>
          <div class="flex items-center gap-2">
            <div
              class="h-8 w-8 rounded-full bg-yellow-400/80 flex items-center justify-center text-xs font-bold text-gray-900"
            >
              {{ userInitial }}
            </div>
            <div class="flex flex-col leading-tight">
              <span class="font-medium text-gray-900">
                {{ userNickname || "사용자" }}
              </span>
              <span class="text-[11px] text-gray-400">
                알고리즘 스터디 중
              </span>
            </div>
          </div>

          <button
            type="button"
            class="px-2 py-1 rounded-md text-gray-600 hover:text-yellow-700 hover:bg-yellow-50"
            @click="goMyPage"
          >
            마이페이지
          </button>

          <button
            type="button"
            class="px-2 py-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-60"
            :disabled="isLoading"
            @click="handleLogout"
          >
            로그아웃
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
