<template>
  <div class="success-container" v-if="show">
    <svg viewBox="0 0 120 120" class="success-svg">
      <!-- círculo -->
      <circle class="circle" cx="60" cy="60" r="50" fill="none" stroke-width="6" />

      <!-- check -->
      <polyline
        class="check"
        points="40,65 55,80 85,45"
        fill="none"
        stroke-width="6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- fireworks rays -->
      <g class="fireworks">
        <line v-for="n in 8" :key="n" x1="60" y1="10" x2="60" y2="0" />
      </g>
    </svg>
  </div>
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
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-svg {
  width: 120px;
  height: 120px;
}

.circle {
  stroke: #22c55e;
  stroke-dasharray: 314;
  stroke-dashoffset: 314;
  animation: draw 0.6s ease forwards;
}

.check {
  stroke: #22c55e;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw 0.4s ease 0.5s forwards;
}

.fireworks line {
  stroke: #facc15;
  stroke-width: 4;
  transform-origin: 60px 60px;
  opacity: 0;
  animation: explode 0.6s ease 0.9s forwards;
}

.fireworks line:nth-child(1) {
  transform: rotate(0deg);
}
.fireworks line:nth-child(2) {
  transform: rotate(45deg);
}
.fireworks line:nth-child(3) {
  transform: rotate(90deg);
}
.fireworks line:nth-child(4) {
  transform: rotate(135deg);
}
.fireworks line:nth-child(5) {
  transform: rotate(180deg);
}
.fireworks line:nth-child(6) {
  transform: rotate(225deg);
}
.fireworks line:nth-child(7) {
  transform: rotate(270deg);
}
.fireworks line:nth-child(8) {
  transform: rotate(315deg);
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes explode {
  0% {
    opacity: 1;
    y2: 0;
  }
  100% {
    opacity: 0;
    y2: -20;
  }
}
</style>
