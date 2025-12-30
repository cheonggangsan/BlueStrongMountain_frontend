import { ref, readonly } from "vue";

/**
 * Tiny global toast store (Vue-based).
 * - Works from anywhere (router, services, components)
 * - Keeps UI in <AppToastHost />
 */

const _toasts = ref([]);
const _timeouts = new Map();
const MAX_TOASTS = 5;
let _seq = 1;

function clearTimer(id) {
  const tid = _timeouts.get(id);
  if (tid) {
    clearTimeout(tid);
    _timeouts.delete(id);
  }
}

function remove(id) {
  clearTimer(id);
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

  if (_toasts.value.length > MAX_TOASTS) {
    const overflow = _toasts.value.length - MAX_TOASTS;
    const dropIds = _toasts.value.slice(0, overflow).map((t) => t.id);
    dropIds.forEach(clearTimer);
    _toasts.value = _toasts.value.slice(-MAX_TOASTS);
  }

  if (duration > 0) {
    const timeoutId = window.setTimeout(() => {
      remove(id);
    }, duration);
    _timeouts.set(id, timeoutId);
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
    Array.from(_timeouts.keys()).forEach((id) => clearTimer(id));
    _toasts.value = [];
  },
};

export const toasts = readonly(_toasts);
