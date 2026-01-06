/**
 * State Management Module
 * Handles the global quiz state
 */

import { normalizeDifficulty, shuffle } from './utils.js';

export const state = {
  bank: [],
  pools: { easy: [], medium: [], hard: [] },
  asked: 0,
  score: 0,
  maxQuestions: 20,
  current: null,
  currentDifficulty: "medium",
  timer: null,
  timeLeft: 30,
  locked: true,
  selection: null,
  logs: [],
  user: null,
  adminLogged: false
};

/**
 * Reset pools with shuffled questions from the bank
 */
export function resetPools() {
  const easy = shuffle(state.bank.filter(q => q.difficulty === "easy"));
  const med = shuffle(state.bank.filter(q => q.difficulty === "medium"));
  const hard = shuffle(state.bank.filter(q => q.difficulty === "hard"));
  state.pools = { easy, medium: med, hard };
}

/**
 * Initialize bank from embedded questions
 * @param {Array} questions - Question bank array
 */
export function initializeBank(questions) {
  state.bank = questions.map(q => ({
    ...q,
    difficulty: normalizeDifficulty(q.difficulty)
  }));
}

/**
 * Reset quiz state for a new attempt
 */
export function resetQuizState() {
  state.asked = 0;
  state.score = 0;
  state.logs = [];
  state.current = null;
  state.currentDifficulty = "medium";
  state.locked = true;
  state.selection = null;
}

/**
 * Add a log entry for a completed question
 * @param {Object} logEntry - The log entry to add
 */
export function addLog(logEntry) {
  state.logs.push(logEntry);
}

/**
 * Update difficulty based on answer correctness (adaptive learning)
 * @param {boolean} isCorrect - Whether the answer was correct
 */
export function updateDifficulty(isCorrect) {
  if (state.current.difficulty === "easy") {
    state.currentDifficulty = isCorrect ? "medium" : "easy";
  } else if (state.current.difficulty === "medium") {
    state.currentDifficulty = isCorrect ? "hard" : "easy";
  } else { // hard
    state.currentDifficulty = isCorrect ? "hard" : "medium";
  }
}
