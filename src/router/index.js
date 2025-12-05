import { createRouter, createWebHistory } from "vue-router";
import BoardList from "../components/BoardList.vue";
import ProblemBoard from "../components/ProblemBoard.vue";
import GroupList from "../components/group/GroupList.vue";
import GroupCreate from "../components/group/GroupCreate.vue";
import GroupEdit from "../components/group/GroupEdit.vue";

import LandingMain from "../views/LandingMain.vue";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";

import ForgotPasswordView from "../views/ForgotPasswordView.vue";
import ResetPasswordView from "../views/ResetPasswordView.vue";

import MyPageView from "../views/MyPageView.vue";

import { useAuthStore } from "@/data/authStore";

const routes = [
  {
    path: "/",
    name: "Home",
    component: LandingMain,
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/signup",
    name: "Signup",
    component: SignupView,
    meta: { guestOnly: true },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPasswordView,
    meta: { guestOnly: true },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordView,
    meta: { guestOnly: true },
  },
  {
    path: "/me",
    name: "MyPageView",
    component: MyPageView,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups",
    name: "GroupList",
    component: GroupList,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups/create",
    name: "GroupCreate",
    component: GroupCreate,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups/:groupId/edit",
    name: "GroupEdit",
    component: GroupEdit,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups/:groupId/boards",
    name: "BoardList",
    component: BoardList,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups/:groupId/boards/new",
    name: "BoardCreate",
    component: ProblemBoard,
    meta: { requiresAuth: true },
  },
  {
    path: "/groups/:groupId/boards/:boardId/edit",
    name: "BoardEdit",
    component: ProblemBoard,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // 1) 앱 시작 후 처음 들어오는 라우팅이면, 서버에 한 번 현재 사용자 조회
  //    - /members/me 기준으로 로그인 여부 판단
  if (!auth.initialized.value && !auth.isRefreshing.value) {
    try {
      await auth.fetchCurrentUser();
    } catch (e) {
      // fetchCurrentUser 안에서 이미 에러 처리 + user 초기화함
      console.error("[router] fetchCurrentUser error:", e);
    }
  }

  const isLoggedIn = auth.isAuthenticated.value;

  // 2) 로그인 필수 페이지인데 비로그인인 경우 → Login으로 보내기
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({
      name: "Login",
      query: {
        // 로그인 후 다시 돌아갈 수 있도록 redirect 정보 남기기
        redirect: to.fullPath,
      },
      replace: true, // 뒤로 가기 눌렀을 때 다시 보호 페이지로 튕기지 않게
    });
  }

  // 3) 비회원 전용 페이지(로그인/회원가입 등)인데 이미 로그인 상태라면
  if (to.meta.guestOnly && isLoggedIn) {
    // redirect 쿼리가 있으면 그쪽으로, 없으면 홈으로
    const redirect = (to.query.redirect && String(to.query.redirect)) || "/";
    return next(redirect);
  }

  // 4) 그 외에는 그대로 진행
  return next();
});

export default router;
