// composables/useFeedbackAnimation.ts
import { ref } from 'vue';

export function useFeedbackAnimation() {
  const showSuccess = ref(false);

  function triggerSuccess(duration = 2000) {
    showSuccess.value = true;

    setTimeout(() => {
      showSuccess.value = false;
    }, duration);
  }

  return {
    showSuccess,
    triggerSuccess,
  };
}
