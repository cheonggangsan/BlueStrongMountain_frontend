import { createApp } from "vue";
import { VueQueryPlugin } from "@tanstack/vue-query";

import App from "./App.vue";
import "./styles/main.scss";
import "flowbite";
import router from "./router";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import { queryClient } from "@/lib/query/queryClient";

const app = createApp(App);

app.use(VueQueryPlugin, { queryClient });
app.use(router);
app.mount("#app");
