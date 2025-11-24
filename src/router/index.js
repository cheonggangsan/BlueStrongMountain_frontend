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
    path: "/boards/create",
    name: "BoardCreate",
    component: ProblemBoard,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
