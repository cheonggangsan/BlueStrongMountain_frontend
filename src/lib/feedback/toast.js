import { ref, readonly } from "vue";

/**
 * Tiny global toast store (framework-agnostic).
 * - Works from anywhere (router, services, components)
 * - Keeps UI in <AppToastHost />
 */

const _toasts = ref([]);
let _seq = 1;

function remove(id) {
  _toasts.value = _toasts.value.filter((t) => t.id !== id);
}

function push(type, message, options = {}) {
  const id = _seq++;
  const duration = Number.isFinite(options.duration)
    ? options.duration
    : type === "error"
      ? 5000
      : 3000;

  const toast = {
    id,
    type,
    message,
    duration,
    createdAt: Date.now(),
  };

  _toasts.value = [..._toasts.value, toast];

  if (duration > 0) {
    window.setTimeout(() => remove(id), duration);
  }

  return id;
}

export const toast = {
  success: (message, options) => push("success", message, options),
  info: (message, options) => push("info", message, options),
  warning: (message, options) => push("warning", message, options),
  error: (message, options) => push("error", message, options),
  remove,
  clear: () => {
    _toasts.value = [];
  },
};

export const toasts = readonly(_toasts);
