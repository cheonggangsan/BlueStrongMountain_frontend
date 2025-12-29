<script setup>
import { computed } from "vue";
import { toasts, toast as toastApi } from "@/lib/feedback/toast";

const items = computed(() => toasts.value);

const styleFor = (type) => {
  switch (type) {
    case "success":
      return "border-green-200 bg-green-50 text-green-800";
    case "info":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "warning":
      return "border-yellow-200 bg-yellow-50 text-yellow-900";
    case "error":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-gray-200 bg-white text-gray-800";
  }
};
</script>

<template>
  <div
    class="fixed top-3 right-3 z-[9999] flex flex-col gap-2"
    role="region"
    aria-live="polite"
    aria-relevant="additions"
  >
    <transition-group
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="t in items"
        :key="t.id"
        class="min-w-[260px] max-w-[360px] rounded-xl border px-3 py-2 shadow-sm"
        :class="styleFor(t.type)"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1 text-sm leading-snug break-words">
            {{ t.message }}
          </div>
          <button
            type="button"
            class="shrink-0 rounded-md px-2 py-1 text-xs font-semibold hover:bg-black/5"
            aria-label="알림 닫기"
            @click="toastApi.remove(t.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
