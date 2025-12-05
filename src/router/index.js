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

const routes = [
  {
    path: "/",
    name: "Home",
    component: LandingMain,
    meta: { guestOnly: true },
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
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordView,
  },
  {
    path: "/groups",
    name: "GroupList",
    component: GroupList,
    props: true,
  },
  {
    path: "/groups/create",
    name: "GroupCreate",
    component: GroupCreate,
  },
  {
    path: "/groups/:groupId/edit",
    name: "GroupEdit",
    component: GroupEdit,
    props: true,
  },
  {
    path: "/groups/:groupId/boards",
    name: "BoardList",
    component: BoardList,
  },
  {
    path: "/groups/:groupId/boards/new",
    name: "BoardCreate",
    component: ProblemBoard,
  },
  {
    path: "/groups/:groupId/boards/:boardId/edit",
    name: "BoardEdit",
    component: ProblemBoard,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
