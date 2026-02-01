import { ref, computed } from 'vue';
import en from './languages/en';
import es from './languages/es';
import fr from './languages/fr';

export type Language = 'en' | 'es' | 'fr';

const STORAGE_KEY = 'app-language';

const translations = {
  en,
  es,
  fr,
};

// Get initial language from localStorage or default to 'en'
const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'en' || stored === 'es' || stored === 'fr')) {
    return stored as Language;
  }
  return 'en';
};

const currentLanguage = ref<Language>(getInitialLanguage());

export function useI18n() {
  const t = computed(() => translations[currentLanguage.value]);

  const setLanguage = (lang: Language) => {
    currentLanguage.value = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const language = computed(() => currentLanguage.value);

  return {
    t,
    language,
    setLanguage,
  };
}
