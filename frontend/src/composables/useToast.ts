import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export function useToast() {
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = ++toastIdCounter;

    toasts.value.push({
      id,
      message,
      type,
      duration,
    });

    // Auto-remover después del duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  };

  const error = (message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  };

  const warning = (message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  };

  const info = (message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  };

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
