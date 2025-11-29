<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goToGroups() {
  router.push({ name: "GroupList" });
}

function goToCreateGroup() {
  router.push({ name: "GroupCreate" });
}

function goToLogin() {
  router.push({ name: "Login" });
}
</script>

<template>
  <!-- 전체 배경: 다른 페이지랑 맞추기 위해 밝은 노랑-화이트 그라데이션 -->
  <div
    class="min-h-screen bg-gradient-to-b from-yellow-50/70 via-white to-gray-50 text-gray-900 flex flex-col"
  >
    <!-- 메인 콘텐츠 -->
    <main class="flex-1">
      <!-- 히어로 섹션 -->
      <section class="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10">
        <div class="flex flex-col md:flex-row gap-10 md:items-center">
          <!-- 왼쪽: 카피 + CTA -->
          <div class="flex-1 space-y-5">
            <div class="inline-flex items-center gap-2 text-xs text-gray-500">
              <span
                class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold"
              >
                BETA
              </span>
              <span>알고리즘 스터디용 문제 보드 툴</span>
            </div>

            <h1
              class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900"
            >
              스터디원의<br />
              <span class="text-yellow-600">“오늘 풀 문제”</span>가<br />
              항상 정리돼 있는 곳.
            </h1>

            <p class="text-xs sm:text-sm text-gray-600 max-w-xl">
              BlueStrongMountain은 백준 스터디를 위한
              <span class="font-semibold text-gray-900">문제 보드 플랫폼</span>
              입니다. 문제 링크, 난이도, 태그, 마감일까지 한 번에 모아서 “오늘은
              무엇을 풀지” 고민하는 시간을 줄여 줍니다.
            </p>

            <!-- CTA 버튼들 -->
            <div class="flex flex-wrap gap-3">
              <!-- primary -->
              <button
                type="button"
                class="text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:outline-none focus:ring-yellow-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center gap-1"
                @click="goToGroups"
              >
                스터디 그룹 둘러보기
                <svg
                  class="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <!-- secondary -->
              <button
                type="button"
                class="text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-yellow-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center gap-1"
                @click="goToCreateGroup"
              >
                새 그룹부터 만들어 보기
              </button>
            </div>

            <p class="text-[11px] text-gray-400">
              로그인 없이도 그룹을 둘러볼 수 있고,
              <span class="font-medium text-gray-600">
                로그인 후에는 보드를 직접 만들 수 있어요.
              </span>
            </p>
          </div>

          <!-- 오른쪽: 예시 카드 (보드 구조 미리보기) -->
          <div
            class="flex-1 max-w-md mx-auto md:mx-0 rounded-3xl border border-yellow-100 bg-white/90 shadow-xl shadow-yellow-100/70 p-4 sm:p-5"
          >
            <p class="text-[11px] text-gray-500 mb-3">예시: 스터디 보드 구조</p>
            <div class="space-y-2 text-[11px]">
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="h-7 w-7 flex items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 text-xs font-bold"
                >
                  G
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-900">
                    1기 알고리즘 캠프
                  </p>
                  <p class="text-[10px] text-gray-500">
                    골드 5 ~ 3, 주 3회 스터디
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  class="flex items-center justify-between rounded-2xl bg-yellow-50 px-3 py-2 border border-yellow-100"
                >
                  <div>
                    <p class="text-xs font-semibold text-gray-900">
                      2주차 - BFS / DFS
                    </p>
                    <p class="text-[10px] text-gray-600">
                      백준 1260, 2178, 2606 · 마감 D-2
                    </p>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded-full bg-green-100 text-[10px] text-green-800 font-medium"
                  >
                    진행중
                  </span>
                </div>

                <div
                  class="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 border border-gray-100"
                >
                  <div>
                    <p class="text-xs font-semibold text-gray-900">
                      3주차 - 다익스트라
                    </p>
                    <p class="text-[10px] text-gray-600">
                      난이도 Gold 5 ~ 3 · 4문제
                    </p>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600 font-medium"
                  >
                    예정
                  </span>
                </div>

                <div
                  class="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 border border-gray-100"
                >
                  <div>
                    <p class="text-xs font-semibold text-gray-900">
                      지난 세션 - 구현 튜토리얼
                    </p>
                    <p class="text-[10px] text-gray-500">
                      기록만 남기고 정리해 둘 수 있어요.
                    </p>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded-full bg-white text-[10px] text-gray-400 border border-dashed border-gray-300"
                  >
                    지난 보드
                  </span>
                </div>
              </div>
            </div>

            <p class="mt-4 text-[10px] text-gray-400">
              실제 화면은 그룹 / 보드 페이지에서 보실 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <!-- 하단 기능 섹션 -->
      <section class="border-t border-yellow-100 bg-white/80">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <h2 class="text-sm font-semibold text-gray-800">
            알고리즘 스터디를 위한, 꼭 필요한 기능만 모았습니다.
          </h2>
          <div class="grid gap-4 sm:grid-cols-3 text-[11px] sm:text-xs">
            <div
              class="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
            >
              <p class="mb-1 text-lg">🎯</p>
              <p class="font-semibold mb-1 text-gray-900">
                보드 기반 세션 관리
              </p>
              <p class="text-gray-500">
                매주 정해진 문제를 “보드”로 만들어두면, 새로 들어온 사람도 링크
                찾느라 헤매지 않고 바로 시작할 수 있어요.
              </p>
            </div>
            <div
              class="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
            >
              <p class="mb-1 text-lg">📚</p>
              <p class="font-semibold mb-1 text-gray-900">백준 문제 필터링</p>
              <p class="text-gray-500">
                난이도, 태그, 해결자 수 기준으로 문제를 찾고, 랜덤/미해결 위주로
                뽑는 기능을 점진적으로 추가할 수 있습니다.
              </p>
            </div>
            <div
              class="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
            >
              <p class="mb-1 text-lg">🤝</p>
              <p class="font-semibold mb-1 text-gray-900">그룹별 역할 정리</p>
              <p class="text-gray-500">
                관리자는 보드를 생성/삭제하고, 멤버는 문제 풀이와 기록에
                집중하도록 역할을 명확히 나눌 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- template 맨 아래, </main> 바로 위 정도에 추가 -->
      <div class="fixed bottom-0 inset-x-0 z-20 px-3 pb-3 sm:px-0 sm:pb-4">
        <div
          class="max-w-md mx-auto rounded-2xl bg-gray-900 text-white shadow-lg flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm"
        >
          <div class="flex flex-col">
            <span class="font-semibold">로그인하면 더 편해져요</span>
            <span class="text-[11px] text-gray-300">
              내 스터디 그룹과 보드를 한 번에 관리할 수 있습니다.
            </span>
          </div>
          <button
            type="button"
            class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300"
            @click="goToLogin"
          >
            로그인
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
