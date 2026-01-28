import { ref, computed } from 'vue';

export type Language = 'en' | 'es' | 'fr';

const STORAGE_KEY = 'app-language';

const translations = {
  en: {
    // JoinGameView
    join: {
      loading: 'Loading session...',
      error: 'Error',
      backToHome: 'Back to home',
      joinGame: 'Join Game',
      status: 'Status',
      questions: 'Questions',
      statusWaiting: 'Waiting',
      statusRunning: 'In Progress',
      statusFinished: 'Finished',
      enterName: 'Enter your name',
      yourName: 'Your name',
      welcome: 'Welcome',
      joining: 'Joining...',
      joinButton: 'Join Game',
      joinedSuccess: 'You have successfully joined!',
      getReadyToPlay: 'Get ready to play',
      goToPlay: 'Go to Play',
      errors: {
        sessionNotFound: 'The game session does not exist or is no longer available.',
        sessionFinished: 'This session has already finished.',
        sessionClosed: 'This session is not accepting new players.',
        loadError: 'Error loading the game session.',
      },
    },
    // PlayGameView
    play: {
      loading: 'Loading game...',
      error: 'Error',
      back: 'Back',
      readyToPlay: 'Ready to play!',
      totalQuestions: 'Total questions',
      yourCurrentScore: 'Your current score',
      points: 'points',
      progress: 'Progress',
      continue: 'Continue',
      start: 'Start',
      question: 'Question',
      of: 'of',
      yourAnswer: 'Your answer',
      writeAnswer: 'Write your answer',
      enterNumber: 'Enter a number',
      sending: 'Sending...',
      sendAnswer: 'Send answer',
      correct: 'Correct! 🎉',
      incorrect: 'Incorrect answer. Try again.',
      gameCompleted: 'Game completed!',
      viewRanking: 'View ranking',
      errors: {
        sessionNotFound: 'The game session does not exist.',
        notJoined: 'You have not joined this session. Please join first.',
        loadError: 'Error loading the game.',
        submitError: 'Error submitting the answer.',
      },
    },
    // RankingGameView
    ranking: {
      title: 'Player Ranking',
      loadingRanking: 'Loading ranking...',
      sessionStatus: 'Session status',
      participants: 'participants',
      statusWaiting: 'Waiting to start',
      statusRunning: 'In progress',
      statusFinished: 'Finished',
      you: 'You',
      finished: '✓ Finished',
      playing: '⏱ Playing',
      points: 'Points',
      currentQuestion: 'Current question',
      time: 'Time',
      penalty: 'Penalty',
      noPlayers: 'No players yet',
      refresh: 'Refresh ranking',
      errors: {
        sessionNotFound: 'Game session not found',
        loadError: 'Error loading ranking',
      },
    },
    // Language selector
    language: {
      select: 'Select language',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
  },
  es: {
    // JoinGameView
    join: {
      loading: 'Cargando sesión...',
      error: 'Error',
      backToHome: 'Volver al inicio',
      joinGame: 'Unirse al juego',
      status: 'Estado',
      questions: 'Preguntas',
      statusWaiting: 'En espera',
      statusRunning: 'En curso',
      statusFinished: 'Finalizado',
      enterName: 'Ingresa tu nombre',
      yourName: 'Tu nombre',
      welcome: 'Bienvenido',
      joining: 'Uniéndose...',
      joinButton: 'Unirse al juego',
      joinedSuccess: '¡Te has unido exitosamente!',
      getReadyToPlay: 'Prepárate para comenzar a jugar',
      goToPlay: 'Ir a jugar',
      errors: {
        sessionNotFound: 'La sesión de juego no existe o ya no está disponible.',
        sessionFinished: 'Esta sesión ya ha finalizado.',
        sessionClosed: 'Esta sesión no acepta nuevos jugadores.',
        loadError: 'Error al cargar la sesión de juego.',
      },
    },
    // PlayGameView
    play: {
      loading: 'Cargando juego...',
      error: 'Error',
      back: 'Volver',
      readyToPlay: '¡Listo para jugar!',
      totalQuestions: 'Total de preguntas',
      yourCurrentScore: 'Tu puntaje actual',
      points: 'puntos',
      progress: 'Progreso',
      continue: 'Continuar',
      start: 'Comenzar',
      question: 'Pregunta',
      of: 'de',
      yourAnswer: 'Tu respuesta',
      writeAnswer: 'Escribe tu respuesta',
      enterNumber: 'Ingresa un número',
      sending: 'Enviando...',
      sendAnswer: 'Enviar respuesta',
      correct: '¡Correcto! 🎉',
      incorrect: 'Respuesta incorrecta. Intenta de nuevo.',
      gameCompleted: '¡Juego completado!',
      viewRanking: 'Ver ranking',
      errors: {
        sessionNotFound: 'La sesión de juego no existe.',
        notJoined: 'No te has unido a esta sesión. Por favor, únete primero.',
        loadError: 'Error al cargar el juego.',
        submitError: 'Error al enviar la respuesta.',
      },
    },
    // RankingGameView
    ranking: {
      title: 'Ranking de Jugadores',
      loadingRanking: 'Cargando ranking...',
      sessionStatus: 'Estado de la sesión',
      participants: 'participantes',
      statusWaiting: 'Esperando inicio',
      statusRunning: 'En progreso',
      statusFinished: 'Finalizado',
      you: 'Tú',
      finished: '✓ Finalizado',
      playing: '⏱ Jugando',
      points: 'Puntos',
      currentQuestion: 'Pregunta actual',
      time: 'Tiempo',
      penalty: 'Penalización',
      noPlayers: 'No hay jugadores todavía',
      refresh: 'Actualizar ranking',
      errors: {
        sessionNotFound: 'Sesión de juego no encontrada',
        loadError: 'Error al cargar el ranking',
      },
    },
    // Language selector
    language: {
      select: 'Seleccionar idioma',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
  },
  fr: {
    // JoinGameView
    join: {
      loading: 'Chargement de la session...',
      error: 'Erreur',
      backToHome: "Retour à l'accueil",
      joinGame: 'Rejoindre le jeu',
      status: 'Statut',
      questions: 'Questions',
      statusWaiting: 'En attente',
      statusRunning: 'En cours',
      statusFinished: 'Terminé',
      enterName: 'Entrez votre nom',
      yourName: 'Votre nom',
      welcome: 'Bienvenue',
      joining: 'Rejoindre...',
      joinButton: 'Rejoindre le jeu',
      joinedSuccess: 'Vous avez rejoint avec succès!',
      getReadyToPlay: 'Préparez-vous à jouer',
      goToPlay: 'Aller jouer',
      errors: {
        sessionNotFound: "La session de jeu n'existe pas ou n'est plus disponible.",
        sessionFinished: 'Cette session est déjà terminée.',
        sessionClosed: "Cette session n'accepte pas de nouveaux joueurs.",
        loadError: 'Erreur lors du chargement de la session de jeu.',
      },
    },
    // PlayGameView
    play: {
      loading: 'Chargement du jeu...',
      error: 'Erreur',
      back: 'Retour',
      readyToPlay: 'Prêt à jouer!',
      totalQuestions: 'Total de questions',
      yourCurrentScore: 'Votre score actuel',
      points: 'points',
      progress: 'Progrès',
      continue: 'Continuer',
      start: 'Commencer',
      question: 'Question',
      of: 'sur',
      yourAnswer: 'Votre réponse',
      writeAnswer: 'Écrivez votre réponse',
      enterNumber: 'Entrez un nombre',
      sending: 'Envoi...',
      sendAnswer: 'Envoyer la réponse',
      correct: 'Correct! 🎉',
      incorrect: 'Réponse incorrecte. Réessayez.',
      gameCompleted: 'Jeu terminé!',
      viewRanking: 'Voir le classement',
      errors: {
        sessionNotFound: "La session de jeu n'existe pas.",
        notJoined: "Vous n'avez pas rejoint cette session. Veuillez d'abord rejoindre.",
        loadError: 'Erreur lors du chargement du jeu.',
        submitError: "Erreur lors de l'envoi de la réponse.",
      },
    },
    // RankingGameView
    ranking: {
      title: 'Classement des Joueurs',
      loadingRanking: 'Chargement du classement...',
      sessionStatus: 'Statut de la session',
      participants: 'participants',
      statusWaiting: 'En attente de démarrage',
      statusRunning: 'En cours',
      statusFinished: 'Terminé',
      you: 'Vous',
      finished: '✓ Terminé',
      playing: '⏱ En train de jouer',
      points: 'Points',
      currentQuestion: 'Question actuelle',
      time: 'Temps',
      penalty: 'Pénalité',
      noPlayers: 'Pas encore de joueurs',
      refresh: 'Actualiser le classement',
      errors: {
        sessionNotFound: 'Session de jeu introuvable',
        loadError: 'Erreur lors du chargement du classement',
      },
    },
    // Language selector
    language: {
      select: 'Sélectionner la langue',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    },
  },
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
