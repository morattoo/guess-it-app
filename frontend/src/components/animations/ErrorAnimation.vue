<template>
  <transition name="fade">
    <div v-if="show" class="error-fullscreen">
      <div class="error-container">
        <svg viewBox="0 0 120 120" class="error-svg">
          <!-- círculo -->
          <circle class="circle" cx="60" cy="60" r="50" fill="none" stroke-width="6" />

          <!-- X mark -->
          <line
            class="x-line line1"
            x1="40"
            y1="40"
            x2="80"
            y2="80"
            stroke-width="6"
            stroke-linecap="round"
          />
          <line
            class="x-line line2"
            x1="80"
            y1="40"
            x2="40"
            y2="80"
            stroke-width="6"
            stroke-linecap="round"
          />

          <!-- shake effect circles -->
          <g class="shake-effect">
            <circle v-for="n in 4" :key="n" cx="60" cy="60" r="55" fill="none" stroke-width="2" />
          </g>
        </svg>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});
</script>

<style scoped>
.error-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(239, 68, 68, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-svg {
  width: 200px;
  height: 200px;
}

.circle {
  stroke: #ffffff;
  stroke-dasharray: 314;
  stroke-dashoffset: 314;
  animation: draw 0.6s ease forwards;
}

.x-line {
  stroke: #ffffff;
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
}

.line1 {
  animation: draw 0.3s ease 0.5s forwards;
}

.line2 {
  animation: draw 0.3s ease 0.7s forwards;
}

.shake-effect circle {
  stroke: rgba(255, 255, 255, 0.3);
  opacity: 0;
  animation: shake-wave 0.6s ease 0.9s forwards;
}

.shake-effect circle:nth-child(1) {
  animation-delay: 0.9s;
}
.shake-effect circle:nth-child(2) {
  animation-delay: 1s;
}
.shake-effect circle:nth-child(3) {
  animation-delay: 1.1s;
}
.shake-effect circle:nth-child(4) {
  animation-delay: 1.2s;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes shake-wave {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
