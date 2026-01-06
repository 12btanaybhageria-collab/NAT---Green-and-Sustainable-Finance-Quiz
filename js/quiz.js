/**
 * Quiz Logic Module
 * Handles core quiz functionality
 */

import { state, resetPools, addLog, updateDifficulty, resetQuizState, initializeBank } from './state.js';
import { weightFor } from './utils.js';
import { generateSummaryHTML, computeBySkill } from './summary.js';
import { embeddedBank } from './questions.js';
import { 
  TIME_PER_QUESTION, 
  TOAST_DURATION, 
  OPTION_LETTERS,
  STORAGE_KEYS 
} from './constants.js';

// DOM Elements (will be set by init)
let elements = null;

/**
 * Initialize quiz module with DOM elements
 * @param {Object} els - DOM elements object
 */
export function initQuizElements(els) {
  elements = els;
}

/**
 * Show toast notification
 * @param {string} msg - Message to display
 */
export function showToast(msg) {
  elements.toast.textContent = msg;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), TOAST_DURATION);
}

/**
 * Navigate to a screen
 * @param {HTMLElement} section - Section to show
 */
export function goScreen(section) {
  [elements.screenUser, elements.screenQuiz, elements.screenSummary, elements.screenAdmin]
    .forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
}

/**
 * Render user info in header
 * @param {Object} user - User object
 */
export function renderChips(user) {
  elements.userChips.innerHTML = "";
  
  if (!user.name && !user.email) {
    return;
  }
  
  if (user.name) {
    const nameSpan = document.createElement("span");
    nameSpan.className = "user-name";
    nameSpan.textContent = user.name;
    elements.userChips.appendChild(nameSpan);
  }
  
  if (user.email) {
    if (user.name) {
      const sep = document.createElement("span");
      sep.className = "separator";
      sep.textContent = "·";
      elements.userChips.appendChild(sep);
    }
    const emailSpan = document.createElement("span");
    emailSpan.className = "user-detail";
    emailSpan.textContent = user.email;
    elements.userChips.appendChild(emailSpan);
  }
}

/**
 * Update progress bar and counter
 */
export function updateTop() {
  elements.askedEl.textContent = state.asked;
  elements.barEl.style.width = `${((state.asked / state.maxQuestions) * 100).toFixed(1)}%`;
}

/**
 * Set button visibility mode
 * @param {string} mode - "start" or "answering"
 */
export function setButtonsMode(mode) {
  if (mode === "start") {
    elements.startBtn.classList.remove("hidden");
    elements.submitBtn.classList.add("hidden");
    elements.submitBtn.disabled = true;
    elements.backToDetailsBtn.classList.remove("hidden");
  } else if (mode === "answering") {
    elements.startBtn.classList.add("hidden");
    elements.submitBtn.classList.remove("hidden");
    elements.backToDetailsBtn.classList.add("hidden");
  }
}

/**
 * Pick next question based on adaptive difficulty
 */
export function pickNextQuestion() {
  let pool = state.pools[state.currentDifficulty];
  if (!pool || pool.length === 0) {
    const order = ["medium", "easy", "hard"];
    for (const d of order) {
      if (state.pools[d].length > 0) {
        state.currentDifficulty = d;
        pool = state.pools[d];
        break;
      }
    }
  }
  if (!pool || pool.length === 0) {
    state.current = null;
    return;
  }
  state.current = pool.shift();
}

/**
 * Render current question
 */
export function renderQuestion() {
  const q = state.current;
  if (!q) {
    finishQuiz();
    return;
  }
  elements.qText.textContent = q.question;
  elements.diffTag.textContent = `Difficulty: ${q.difficulty.toUpperCase()}`;
  elements.skillTag.textContent = `Skill: ${q.skill || "—"}`;

  elements.optionsEl.innerHTML = "";
  OPTION_LETTERS.forEach(letter => {
    const text = q[letter];
    const label = document.createElement("label");
    label.className = "opt";
    label.dataset.key = letter;
    label.innerHTML = `<div class="k">${letter}</div><div>${text}</div>`;
    label.addEventListener("click", () => {
      if (state.locked) return;
      state.selection = letter;
      document.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
      label.classList.add("selected");
      elements.submitBtn.disabled = false;
    });
    elements.optionsEl.appendChild(label);
  });

  setButtonsMode("answering");
}

/**
 * Start countdown timer
 */
export function countdown() {
  clearInterval(state.timer);
  state.timeLeft = TIME_PER_QUESTION;
  elements.timerEl.textContent = `${state.timeLeft}s`;
  state.timer = setInterval(() => {
    state.timeLeft--;
    elements.timerEl.textContent = `${state.timeLeft}s`;
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      lockAndAdvance(true);
    }
  }, 1000);
}

/**
 * Start a new question
 */
export function startQuestion() {
  if (state.bank.length === 0) {
    initializeBank(embeddedBank);
  }
  if (state.pools.easy.length === 0 && state.pools.medium.length === 0 && state.pools.hard.length === 0) {
    resetPools();
  }
  
  state.locked = false;
  state.selection = null;
  document.querySelectorAll(".opt").forEach(o => o.classList.remove("selected"));
  elements.submitBtn.disabled = true;
  pickNextQuestion();
  if (!state.current) {
    finishQuiz();
    return;
  }
  renderQuestion();
  countdown();
}

/**
 * Lock question and advance to next
 * @param {boolean} timeUp - Whether time expired
 */
export function lockAndAdvance(timeUp = false) {
  state.locked = true;
  elements.submitBtn.disabled = true;
  clearInterval(state.timer);

  const correctLetter = String(state.current.correct || "").trim().toUpperCase();
  const chosen = timeUp ? "(time up)" : (state.selection || "(blank)");
  const isCorrect = !timeUp && (state.selection === correctLetter);

  if (isCorrect) {
    state.score += weightFor(state.current.difficulty);
  }
  state.asked += 1;
  updateTop();

  addLog({
    id: state.current.id,
    difficulty: state.current.difficulty,
    skill: state.current.skill || "",
    chosen,
    correct: "(hidden)",
    correctBool: isCorrect,
    timeTaken: TIME_PER_QUESTION - state.timeLeft
  });

  updateDifficulty(isCorrect);

  if (state.asked >= state.maxQuestions) {
    finishQuiz();
  } else {
    startQuestion();
  }
}

/**
 * Render summary view
 */
export function renderSummary() {
  elements.summaryContent.innerHTML = generateSummaryHTML(state);
}

/**
 * Finish quiz and save results
 */
export function finishQuiz() {
  clearInterval(state.timer);
  setButtonsMode("start");
  renderSummary();
  
  const attemptsRaw = localStorage.getItem(STORAGE_KEYS.attempts) || "[]";
  let attempts = [];
  try {
    attempts = JSON.parse(attemptsRaw);
  } catch (e) {
    console.warn("Failed to parse stored attempts:", e);
    attempts = [];
  }
  
  const bySkill = computeBySkill(state.logs);
  attempts.push({
    ts: Date.now(),
    user: state.user,
    score: state.score,
    asked: state.asked,
    logs: state.logs,
    bySkill
  });
  
  try {
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(attempts));
  } catch (e) {
    console.warn("Unable to save attempts:", e);
  }
  
  goScreen(elements.screenSummary);
}

/**
 * Restart quiz with fresh state
 */
export function restartQuiz() {
  initializeBank(embeddedBank);
  resetPools();
  resetQuizState();
  
  elements.qText.textContent = `Press "Start Test" to begin.`;
  elements.optionsEl.innerHTML = "";
  elements.diffTag.textContent = "Difficulty: —";
  elements.skillTag.textContent = "Skill: —";
  elements.timerEl.textContent = `${TIME_PER_QUESTION}s`;
  updateTop();
  setButtonsMode("start");
  goScreen(elements.screenQuiz);
}
