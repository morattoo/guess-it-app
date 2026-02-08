import { ref } from 'vue';

interface ConfirmDialogState {
  show: boolean;
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  resolve?: (value: boolean) => void;
}

const dialogState = ref<ConfirmDialogState>({
  show: false,
  message: '',
  title: '',
  confirmText: '',
  cancelText: '',
  confirmButtonClass: 'btn-primary',
});

export function useConfirmDialog() {
  const confirm = (
    message: string,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
    }
  ): Promise<boolean> => {
    return new Promise(resolve => {
      dialogState.value = {
        show: true,
        message,
        title: options?.title || '',
        confirmText: options?.confirmText || '',
        cancelText: options?.cancelText || '',
        confirmButtonClass: options?.confirmButtonClass || 'btn-primary',
        resolve,
      };
    });
  };

  const handleConfirm = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true);
    }
    dialogState.value.show = false;
  };

  const handleCancel = () => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(false);
    }
    dialogState.value.show = false;
  };

  return {
    dialogState,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
