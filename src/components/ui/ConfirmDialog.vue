<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { confirmState, resolveConfirm } from "@/lib/feedback/confirm";

const state = confirmState;

const isOpen = computed(() => state.isOpen);
const isDanger = computed(() => state.variant === "danger");
const role = computed(() => (isDanger.value ? "alertdialog" : "dialog"));

const overlayRef = ref(null);
const dialogRef = ref(null);
const cancelBtnRef = ref(null);
const confirmBtnRef = ref(null);

const uid = Math.random().toString(36).slice(2, 9);
const titleId = `confirm-title-${uid}`;
const descId = `confirm-desc-${uid}`;

let prevActiveEl = null;
let prevBodyOverflow = "";

function getFocusable(container) {
  if (!container) return [];
  const selectors = [
    "a[href]",
    "area[href]",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "iframe",
    "object",
    "embed",
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(","))).filter(
    (el) => el.offsetParent !== null,
  );
}

function lockScroll() {
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  document.body.style.overflow = prevBodyOverflow || "";
}

function hideAppFromSR(hide) {
  const app = document.getElementById("app");
  if (!app) return;
  if (hide) app.setAttribute("aria-hidden", "true");
  else app.removeAttribute("aria-hidden");
}

async function focusInitial() {
  await nextTick();
  const target =
    state.initialFocus === "cancel" ? cancelBtnRef.value : confirmBtnRef.value;

  if (target?.focus) {
    target.focus();
    return;
  }
  // fallback
  const list = getFocusable(dialogRef.value);
  list[0]?.focus?.();
}

function onCancel() {
  resolveConfirm(false);
}

function onConfirm() {
  resolveConfirm(true);
}

function onBackdropClick(e) {
  if (!state.closeOnBackdrop) return;
  if (e.target === e.currentTarget) onCancel();
}

function trapTab(e) {
  if (e.key !== "Tab") return;

  const focusables = getFocusable(dialogRef.value);
  if (focusables.length === 0) {
    e.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (e.shiftKey) {
    if (active === first || !dialogRef.value?.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function onKeydown(e) {
  if (!state.isOpen) return;

  if (e.key === "Escape") {
    e.preventDefault();
    onCancel();
    return;
  }

  trapTab(e);
}

watch(
  () => state.isOpen,
  async (open) => {
    if (open) {
      prevActiveEl = document.activeElement;
      lockScroll();
      hideAppFromSR(true);
      window.addEventListener("keydown", onKeydown);
      await focusInitial();
    } else {
      window.removeEventListener("keydown", onKeydown);
      hideAppFromSR(false);
      unlockScroll();
      // restore focus
      prevActiveEl?.focus?.();
      prevActiveEl = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  hideAppFromSR(false);
  unlockScroll();
});
</script>

<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      ref="overlayRef"
      class="fixed inset-0 z-[9998] flex items-center justify-center"
      @click="onBackdropClick"
    >
      <div class="absolute inset-0 bg-black/30" />

      <div
        ref="dialogRef"
        class="relative w-[92%] max-w-[420px] rounded-2xl bg-white shadow-xl border border-gray-200 p-5"
        :role="role"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="state.description ? descId : undefined"
      >
        <div
          :id="titleId"
          class="text-base font-bold text-gray-900"
        >
          {{ state.title }}
        </div>

        <div
          v-if="state.description"
          :id="descId"
          class="mt-2 text-sm text-gray-600 whitespace-pre-line"
        >
          {{ state.description }}
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            ref="cancelBtnRef"
            type="button"
            class="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            @click="onCancel"
          >
            {{ state.cancelText }}
          </button>

          <button
            ref="confirmBtnRef"
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
