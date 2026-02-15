// composables/useFeedbackAnimation.ts
import { ref } from 'vue';

export function useFeedbackAnimation() {
  const showSuccess = ref(false);
  const showError = ref(false);

  function triggerSuccess(duration = 1500) {
    showSuccess.value = true;

    setTimeout(() => {
      showSuccess.value = false;
    }, duration);
  }

  function triggerError(duration = 1500) {
    showError.value = true;

    setTimeout(() => {
      showError.value = false;
    }, duration);
  }

  return {
    showSuccess,
    showError,
    triggerSuccess,
    triggerError,
  };
}
