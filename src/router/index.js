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
import BoardDetailView from "../views/BoardDetailView.vue";

import { fetchGroupById } from "@/data/groupStore";
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
    meta: { requiresAuth: true, requiresGroupOwner: true },
  },
  {
    path: "/groups/:groupId/boards",
    name: "BoardList",
    component: BoardList,
    meta: { requiresAuth: true, requiresGroupMember: true },
  },
  {
    path: "/groups/:groupId/boards/new",
    name: "BoardCreate",
    component: ProblemBoard,
    meta: { requiresAuth: true, requiresGroupManager: true },
  },
  {
    path: "/groups/:groupId/boards/:boardId",
    name: "BoardDetail",
    component: BoardDetailView,
    meta: { requiresAuth: true, requiresGroupMember: true },
  },
  {
    path: "/groups/:groupId/boards/:boardId/edit",
    name: "BoardEdit",
    component: ProblemBoard,
    meta: { requiresAuth: true, requiresGroupManager: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // 1) 앱 시작 후 처음 들어오는 라우팅이면, 서버에 한 번 현재 사용자 조회
  if (!auth.initialized.value && !auth.isRefreshing.value) {
    try {
      await auth.fetchCurrentUser();
    } catch (e) {
      console.error("[router] fetchCurrentUser error:", e);
    }
  }

  const isLoggedIn = auth.isAuthenticated.value;

  // 2) 로그인 필수 페이지인데 비로그인인 경우 → Login으로 보내기
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({
      name: "Login",
      query: {
        redirect: to.fullPath,
      },
      replace: true,
    });
  }

  // 3) 비회원 전용 페이지(로그인/회원가입 등)인데 이미 로그인 상태라면
  if (to.meta.guestOnly && isLoggedIn) {
    const redirect = (to.query.redirect && String(to.query.redirect)) || "/";
    return next(redirect);
  }

  // 4) 그룹 관련 권한 체크
  const needGroupMember = to.meta.requiresGroupMember;
  const needGroupManager = to.meta.requiresGroupManager;
  const needGroupOwner = to.meta.requiresGroupOwner;
  const groupIdParam = to.params.groupId;

  // groupId가 있고, 멤버/매니저/소유자 권한 둘 중 하나라도 필요한 경우에만 검사
  if (groupIdParam && (needGroupMember || needGroupManager || needGroupOwner)) {
    const groupId = Number(groupIdParam);

    if (!Number.isFinite(groupId)) {
      return next({ name: "GroupList" });
    }

    const userId = auth.user.value?.id;
    if (!userId) {
      return next({
        name: "Login",
        query: { redirect: to.fullPath },
        replace: true,
      });
    }
    const uid = Number(userId);

    let group;
    try {
      group = await fetchGroupById(groupId, { requesterId: uid });
    } catch (e) {
      if (e?.response?.status === 401) {
        window.alert("로그인이 필요합니다.");

        return next({
          name: "Login",
          query: { redirect: to.fullPath },
          replace: true,
        });
      }

      console.error("[router] fetchGroupById error:", e);
      window.alert("그룹 정보를 불러올 수 없습니다.");
      return next({ name: "GroupList" });
    }

    if (!group) {
      window.alert("해당 그룹을 찾을 수 없습니다.");
      return next({ name: "GroupList" });
    }

    const ownerId = group.ownerId != null ? Number(group.ownerId) : null;
    const managerIds = Array.isArray(group.managerIds)
      ? group.managerIds.map(Number)
      : [];
    const memberIds = Array.isArray(group.memberIds)
      ? group.memberIds.map(Number)
      : [];

    const isOwner = ownerId != null && ownerId === uid;
    const isManager = managerIds.includes(uid);
    const isMember = memberIds.includes(uid) || isManager || isOwner;

    // 4-1) 그룹 멤버만 접근 가능한 페이지 (BoardList, BoardDetail 등)
    if (needGroupMember && !isMember) {
      window.alert("이 그룹 멤버만 접근할 수 있는 페이지입니다.");
      return next({ name: "GroupList" });
    }

    // 4-1.5) owner만 접근 가능한 페이지 (GroupEdit 등)
    if (needGroupOwner && !isOwner) {
      window.alert("이 그룹의 소유자만 접근할 수 있습니다.");
      return next({ name: "GroupList" });
    }

    // 4-2) owner/manager만 접근 가능한 페이지 (BoardCreate/Edit)
    if (needGroupManager && !(isOwner || isManager)) {
      window.alert("이 그룹의 관리자 또는 소유자만 접근할 수 있습니다.");

      const isBoardRoute = [
        "BoardList",
        "BoardCreate",
        "BoardEdit",
        "BoardDetail",
      ].includes(to.name);

      return next(
        isBoardRoute
          ? { name: "BoardList", params: { groupId } }
          : { name: "GroupList" },
      );
    }
  }

  // 5) 그 외에는 그대로 진행
  return next();
});

export default router;
