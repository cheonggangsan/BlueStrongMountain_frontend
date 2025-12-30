<script setup>
import AppHeader from "./components/AppHeader.vue";
import AppToastHost from "./components/ui/AppToastHost.vue";
import ConfirmDialog from "./components/ui/ConfirmDialog.vue";
</script>

<template>
  <AppHeader />
  <router-view />

  <AppToastHost />
  <ConfirmDialog />
</template>
