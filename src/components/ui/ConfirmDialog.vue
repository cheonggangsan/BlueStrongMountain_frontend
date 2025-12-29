<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { confirmState, resolveConfirm } from "@/lib/feedback/confirm";

const state = confirmState;
const isOpen = computed(() => state.isOpen);
const isDanger = computed(() => state.variant === "danger");

function onCancel() {
  resolveConfirm(false);
}

function onConfirm() {
  resolveConfirm(true);
}

function onBackdropClick(e) {
  if (e.target === e.currentTarget) onCancel();
}

function onKeydown(e) {
  if (!state.isOpen) return;
  if (e.key === "Escape") onCancel();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9998] flex items-center justify-center"
      @click="onBackdropClick"
    >
      <div class="absolute inset-0 bg-black/30" />

      <div
        class="relative w-[92%] max-w-[420px] rounded-2xl bg-white shadow-xl border border-gray-200 p-5"
        role="dialog"
        aria-modal="true"
        :aria-label="state.title"
      >
        <div class="text-base font-bold text-gray-900">
          {{ state.title }}
        </div>

        <div
          v-if="state.description"
          class="mt-2 text-sm text-gray-600"
        >
          {{ state.description }}
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            @click="onCancel"
          >
            {{ state.cancelText }}
          </button>

          <button
            type="button"
            class="px-3 py-2 rounded-xl text-sm font-semibold text-white"
            :class="
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-500 hover:bg-yellow-600'
            "
            @click="onConfirm"
          >
            {{ state.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
