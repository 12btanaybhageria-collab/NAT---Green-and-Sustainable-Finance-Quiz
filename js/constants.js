/**
 * Constants Module
 * Centralized configuration values for the quiz application
 */

// Quiz settings
export const MAX_QUESTIONS = 20;
export const TIME_PER_QUESTION = 30;
export const TOAST_DURATION = 1500;
export const QUIZ_START_DELAY = 400;

// Difficulty weights for scoring
export const DIFFICULTY_WEIGHTS = {
  easy: 1,
  medium: 1.5,
  hard: 2
};

// Proficiency level thresholds (accuracy percentages)
export const PROFICIENCY_THRESHOLDS = {
  foundational: 25,
  intermediate: 50,
  advanced: 75
};

// Proficiency level colors
export const PROFICIENCY_COLORS = {
  foundational: { color: "#dc3545", bgColor: "rgba(220, 53, 69, 0.1)" },
  intermediate: { color: "#fd7e14", bgColor: "rgba(253, 126, 20, 0.1)" },
  advanced: { color: "#0d6efd", bgColor: "rgba(13, 110, 253, 0.1)" },
  leadership: { color: "#198754", bgColor: "rgba(25, 135, 84, 0.1)" }
};

// LocalStorage keys
export const STORAGE_KEYS = {
  user: "natUser",
  attempts: "natAttempts"
};

// Default difficulty for new quizzes
export const DEFAULT_DIFFICULTY = "medium";

// Answer option letters
export const OPTION_LETTERS = ["A", "B", "C", "D"];

