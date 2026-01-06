/**
 * Main Entry Point
 * Wires together all modules and handles initialization
 */

import { state, initializeBank, resetPools } from './state.js';
import { isValidEmail } from './utils.js';
import {
  initQuizElements,
  showToast,
  goScreen,
  renderChips,
  updateTop,
  setButtonsMode,
  startQuestion,
  lockAndAdvance,
  restartQuiz
} from './quiz.js';
import { exportThisResult, exportAll } from './export.js';
import { loadAdminTable, validateAdminCredentials } from './admin.js';
import { embeddedBank } from './questions.js';

// DOM Elements
const elements = {
  // Screens
  screenUser: document.getElementById("screenUser"),
  screenQuiz: document.getElementById("screenQuiz"),
  screenSummary: document.getElementById("screenSummary"),
  screenAdmin: document.getElementById("screenAdmin"),
  
  // Navigation buttons
  candidateBtn: document.getElementById("candidateBtn"),
  adminBtn: document.getElementById("adminBtn"),
  userChips: document.getElementById("userChips"),
  
  // User form inputs
  uName: document.getElementById("uName"),
  uEmail: document.getElementById("uEmail"),
  uEmpId: document.getElementById("uEmpId"),
  uDept: document.getElementById("uDept"),
  
  // Error displays
  eName: document.getElementById("eName"),
  eEmail: document.getElementById("eEmail"),
  eEmp: document.getElementById("eEmp"),
  eDept: document.getElementById("eDept"),
  
  // User screen buttons
  startFromUserBtn: document.getElementById("startFromUser"),
  prefillBtn: document.getElementById("prefillBtn"),
  saveStatus: document.getElementById("saveStatus"),
  
  // Quiz elements
  qText: document.getElementById("qText"),
  optionsEl: document.getElementById("options"),
  diffTag: document.getElementById("diffTag"),
  skillTag: document.getElementById("skillTag"),
  timerEl: document.getElementById("timer"),
  startBtn: document.getElementById("startBtn"),
  submitBtn: document.getElementById("submitBtn"),
  backToDetailsBtn: document.getElementById("backToDetailsBtn"),
  askedEl: document.getElementById("asked"),
  barEl: document.getElementById("bar"),
  
  // Summary elements
  summaryContent: document.getElementById("summaryContent"),
  retakeBtn: document.getElementById("retakeBtn"),
  exportBtn: document.getElementById("exportBtn"),
  summaryToDetailsBtn: document.getElementById("summaryToDetailsBtn"),
  
  // Admin elements
  adminLoginBox: document.getElementById("adminLoginBox"),
  adminDashboard: document.getElementById("adminDashboard"),
  adminId: document.getElementById("adminId"),
  adminPw: document.getElementById("adminPw"),
  adminLoginBtn: document.getElementById("adminLoginBtn"),
  adminBackBtn: document.getElementById("adminBackBtn"),
  adminBackBtn2: document.getElementById("adminBackBtn2"),
  adminLogoutBtn: document.getElementById("adminLogoutBtn"),
  adminStatus: document.getElementById("adminStatus"),
  exportAllBtn: document.getElementById("exportAllBtn"),
  adminTableBody: document.querySelector("#adminTable tbody"),
  detailBox: document.getElementById("detailBox"),
  
  // Toast
  toast: document.getElementById("toast")
};

// Initialize quiz module with elements
initQuizElements(elements);

/**
 * Validate user form
 * @returns {boolean} - Whether form is valid
 */
function validateUser() {
  let ok = true;
  const name = elements.uName.value.trim();
  const email = elements.uEmail.value.trim();
  const emp = elements.uEmpId.value.trim();
  const dept = elements.uDept.value.trim();

  elements.eName.textContent = name ? "" : "Please enter your full name.";
  elements.eEmail.textContent = isValidEmail(email) ? "" : "Please enter a valid email.";
  elements.eEmp.textContent = emp ? "" : "Please enter your Employee ID.";
  elements.eDept.textContent = dept ? "" : "Please enter your Department/RO.";

  if (elements.eName.textContent || elements.eEmail.textContent || 
      elements.eEmp.textContent || elements.eDept.textContent) {
    ok = false;
  }
  return ok;
}

// Event Handlers

// Navigation
elements.candidateBtn.addEventListener("click", () => goScreen(elements.screenUser));
elements.adminBtn.addEventListener("click", () => goScreen(elements.screenAdmin));

// User form submission
elements.startFromUserBtn.addEventListener("click", () => {
  if (!validateUser()) return;
  const user = {
    name: elements.uName.value.trim(),
    email: elements.uEmail.value.trim(),
    empId: elements.uEmpId.value.trim(),
    dept: elements.uDept.value.trim()
  };
  state.user = user;
  try {
    localStorage.setItem("natUser", JSON.stringify(user));
  } catch(e) {}
  renderChips(user);
  showToast("Details saved. Starting quiz…");
  setTimeout(() => {
    restartQuiz();
  }, 400);
});

// Prefill from URL params
elements.prefillBtn.addEventListener("click", () => {
  const params = new URLSearchParams(location.search);
  if (params.get("name")) elements.uName.value = params.get("name");
  if (params.get("email")) elements.uEmail.value = params.get("email");
  if (params.get("empId")) elements.uEmpId.value = params.get("empId");
  if (params.get("dept")) elements.uDept.value = params.get("dept");
});

// Quiz controls
elements.startBtn.addEventListener("click", () => {
  startQuestion();
});

elements.submitBtn.addEventListener("click", () => {
  if (state.locked) return;
  lockAndAdvance(false);
});

elements.backToDetailsBtn.addEventListener("click", () => {
  if (state.asked === 0 && state.logs.length === 0) {
    goScreen(elements.screenUser);
  }
});

// Summary controls
elements.retakeBtn.addEventListener("click", () => {
  restartQuiz();
});

elements.exportBtn.addEventListener("click", () => exportThisResult(state));
elements.summaryToDetailsBtn.addEventListener("click", () => goScreen(elements.screenUser));

// Admin controls
elements.adminLoginBtn.addEventListener("click", () => {
  const id = elements.adminId.value.trim();
  const pw = elements.adminPw.value.trim();
  if (validateAdminCredentials(id, pw)) {
    elements.adminStatus.textContent = "Login successful.";
    elements.adminLoginBox.classList.add("hidden");
    elements.adminDashboard.classList.remove("hidden");
    loadAdminTable(elements.adminTableBody, elements.detailBox);
  } else {
    elements.adminStatus.textContent = "Invalid credentials.";
  }
});

elements.adminBackBtn.addEventListener("click", () => {
  goScreen(elements.screenQuiz);
});

elements.adminBackBtn2.addEventListener("click", () => {
  goScreen(elements.screenQuiz);
});

elements.adminLogoutBtn.addEventListener("click", () => {
  elements.adminLoginBox.classList.remove("hidden");
  elements.adminDashboard.classList.add("hidden");
  elements.adminId.value = "";
  elements.adminPw.value = "";
  elements.adminStatus.textContent = "Logged out.";
});

elements.exportAllBtn.addEventListener("click", exportAll);

// Initialization
(function init() {
  // Load saved user
  try {
    const u = JSON.parse(localStorage.getItem("natUser") || "null");
    if (u) {
      elements.uName.value = u.name || "";
      elements.uEmail.value = u.email || "";
      elements.uEmpId.value = u.empId || "";
      elements.uDept.value = u.dept || "";
      state.user = u;
      renderChips(u);
    }
  } catch(e) {}

  // Initialize question bank
  initializeBank(embeddedBank);
  resetPools();
  updateTop();
  setButtonsMode("start");
  goScreen(elements.screenUser);
})();
