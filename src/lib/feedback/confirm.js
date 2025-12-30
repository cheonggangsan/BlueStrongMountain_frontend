import { reactive, readonly } from "vue";

/**
 * Tiny global confirm dialog state.
 * Use from anywhere:
 *   const ok = await confirm({ title, description, variant: "danger" })
 */

const _state = reactive({
  isOpen: false,
  title: "확인",
  description: "",
  confirmText: "확인",
  cancelText: "취소",
  variant: "default", // default | danger

  // options
  closeOnBackdrop: true,
  initialFocus: "confirm", // confirm | cancel

  _resolver: null,
});

export const confirmState = readonly(_state);

export function confirm(options = {}) {
  if (_state.isOpen && typeof _state._resolver === "function") {
    _state._resolver(false);
    _state._resolver = null;
    _state.isOpen = false;
  }

  return new Promise((resolve) => {
    _state.title = options.title ?? "확인";
    _state.description = options.description ?? "";
    _state.confirmText = options.confirmText ?? "확인";
    _state.cancelText = options.cancelText ?? "취소";
    _state.variant = options.variant ?? "default";

    _state._resolver = resolve;
    _state.isOpen = true;
  });
}

export function resolveConfirm(result) {
  try {
    if (typeof _state._resolver === "function") {
      _state._resolver(Boolean(result));
    }
  } finally {
    _state.isOpen = false;
    _state._resolver = null;
  }
}
