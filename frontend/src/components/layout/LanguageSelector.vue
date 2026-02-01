<template>
  <div class="language-selector">
    <button
      class="language-button"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="t.language.select"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 1C5.02944 1 1 5.02944 1 10C1 14.9706 5.02944 19 10 19C14.9706 19 19 14.9706 19 10C19 5.02944 14.9706 1 10 1Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M1 10H19"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10 1C12.21 3.84 13.5 7.84 13.5 10C13.5 12.16 12.21 16.16 10 19C7.79 16.16 6.5 12.16 6.5 10C6.5 7.84 7.79 3.84 10 1Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="current-language">{{ currentLanguageLabel }}</span>
      <svg
        class="chevron"
        :class="{ 'is-open': isOpen }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <transition name="dropdown">
      <ul v-if="isOpen" class="language-dropdown" role="menu">
        <li v-for="lang in languages" :key="lang.code" role="menuitem">
          <button
            class="language-option"
            :class="{ 'is-active': language === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <span class="flag">{{ lang.flag }}</span>
            <span class="label">{{ lang.label }}</span>
            <svg
              v-if="language === lang.code"
              class="check-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.3334 4L6.00002 11.3333L2.66669 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n, type Language } from '@/composables/useI18n';

const { t, language, setLanguage } = useI18n();
const isOpen = ref(false);

const languages = [
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
];

const currentLanguageLabel = computed(() => {
  const current = languages.find(lang => lang.code === language.value);
  return current ? current.flag : '🌐';
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectLanguage = (lang: Language) => {
  setLanguage(lang);
  isOpen.value = false;
};

const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.language-selector')) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});
</script>

<style scoped lang="scss">
.language-selector {
  position: relative;
  display: inline-block;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .current-language {
    font-size: 1.25rem;
  }

  .chevron {
    transition: transform 0.2s;

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 180px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  z-index: 1000;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
  font-size: 0.9375rem;

  &:hover {
    background: #f5f5f5;
  }

  &.is-active {
    background: #e8f0fe;
    color: #1967d2;
  }

  .flag {
    font-size: 1.25rem;
  }

  .label {
    flex: 1;
  }

  .check-icon {
    color: #1967d2;
  }
}

// Transitions
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
