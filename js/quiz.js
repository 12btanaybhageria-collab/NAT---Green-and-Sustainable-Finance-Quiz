/**
 * Quiz Logic Module
 * Handles core quiz functionality
 */

import { state, resetPools, addLog, updateDifficulty, resetQuizState, initializeBank } from './state.js';
import { weightFor } from './utils.js';
import { generateSummaryHTML, computeBySkill } from './summary.js';
import { embeddedBank } from './questions.js';

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
  setTimeout(() => elements.toast.classList.remove("show"), 1500);
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
 * Render user info chips
 * @param {Object} user - User object
 */
export function renderChips(user) {
  elements.userChips.innerHTML = "";
  const parts = [
    user.name || "—",
    user.email || "—",
    user.empId || "—",
    user.dept || "—"
  ];
  const labels = ["Name", "Email", "Emp ID", "Dept/RO"];
  parts.forEach((v, idx) => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = labels[idx] + ": " + v;
    elements.userChips.appendChild(span);
  });
}

/**
 * Update progress bar and counter
 */
export function updateTop() {
  elements.askedEl.textContent = state.asked;
  elements.barEl.style.width = ((state.asked / state.maxQuestions) * 100).toFixed(1) + "%";
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
  elements.diffTag.textContent = "Difficulty: " + q.difficulty.toUpperCase();
  elements.skillTag.textContent = "Skill: " + (q.skill || "—");

  const letters = ["A", "B", "C", "D"];
  elements.optionsEl.innerHTML = "";
  letters.forEach(letter => {
    const text = q[letter];
    const label = document.createElement("label");
    label.className = "opt";
    label.dataset.key = letter;
    label.innerHTML = '<div class="k">' + letter + '</div><div>' + text + '</div>';
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
  state.timeLeft = 30;
  elements.timerEl.textContent = "⏱ " + state.timeLeft + "s";
  state.timer = setInterval(() => {
    state.timeLeft--;
    elements.timerEl.textContent = "⏱ " + state.timeLeft + "s";
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
    timeTaken: 30 - state.timeLeft
  });

  // Update difficulty for adaptive learning
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
  
  // Save to localStorage
  const attemptsRaw = localStorage.getItem("natAttempts") || "[]";
  let attempts = [];
  try {
    attempts = JSON.parse(attemptsRaw);
  } catch(e) { attempts = []; }
  
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
    localStorage.setItem("natAttempts", JSON.stringify(attempts));
  } catch(e) {
    console.warn("Unable to save attempts:", e);
  }
  
  goScreen(elements.screenSummary);
}

/**
 * Restart quiz with fresh state
 */
export function restartQuiz() {
  // Reset state using proper functions
  initializeBank(embeddedBank);
  resetPools();
  resetQuizState();
  
  // Reset UI
  elements.qText.textContent = `Press "Start Test" to begin.`;
  elements.optionsEl.innerHTML = "";
  elements.diffTag.textContent = "Difficulty: —";
  elements.skillTag.textContent = "Skill: —";
  elements.timerEl.textContent = "⏱ 30s";
  updateTop();
  setButtonsMode("start");
  goScreen(elements.screenQuiz);
}
