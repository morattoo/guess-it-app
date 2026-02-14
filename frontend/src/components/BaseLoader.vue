<template>
  <transition name="fade">
    <div v-if="modelValue" :class="['loader-wrapper', { overlay }]">
      <div
        class="loader"
        :style="{
          width: size + 'px',
          height: size + 'px',
          borderWidth: stroke + 'px',
          borderTopColor: color,
        }"
      ></div>

      <p v-if="text" class="loader-text">
        {{ text }}
      </p>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  overlay: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 48,
  },
  stroke: {
    type: Number,
    default: 4,
  },
  color: {
    type: String,
    default: '#3b82f6',
  },
  text: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.loader-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loader-wrapper.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.loader {
  border-style: solid;
  border-color: #e5e7eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  font-size: 14px;
  color: #555;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
