import { createRouter, createWebHistory } from "vue-router";
import BoardList from "../components/BoardList.vue";
import ProblemBoard from "../components/ProblemBoard.vue";

const routes = [
  {
    path: "/",
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
