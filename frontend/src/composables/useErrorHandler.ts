import { ref } from 'vue';

interface ErrorState {
  show: boolean;
  message: string;
  title: string;
  returnUrl: string;
  returnButtonText: string;
  showSupport: boolean;
}

const errorState = ref<ErrorState>({
  show: false,
  message: '',
  title: '',
  returnUrl: '',
  returnButtonText: '',
  showSupport: true,
});

export function useErrorHandler() {
  const showError = (
    message: string,
    options?: {
      title?: string;
      returnUrl?: string;
      returnButtonText?: string;
      showSupport?: boolean;
    }
  ) => {
    errorState.value = {
      show: true,
      message,
      title: options?.title || '',
      returnUrl: options?.returnUrl || '',
      returnButtonText: options?.returnButtonText || '',
      showSupport: options?.showSupport ?? true,
    };
  };

  const closeError = () => {
    errorState.value.show = false;
  };

  return {
    errorState,
    showError,
    closeError,
  };
}
