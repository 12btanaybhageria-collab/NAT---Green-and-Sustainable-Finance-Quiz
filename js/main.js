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

console.log("=== NAT Quiz: All modules imported successfully ===");

// Expose functions globally for inline onclick handlers (fallback)
window.natStartQuestion = () => {
  startQuestion();
};
window.natGoToUser = () => {
  goScreen(document.getElementById("screenUser"));
};
window.natSubmit = () => {
  if (state.locked) return;
  lockAndAdvance(false);
};
window.natRetake = () => {
  restartQuiz();
};
window.natExport = () => {
  exportThisResult(state);
};
window.natGoToAdmin = () => {
  goScreen(document.getElementById("screenAdmin"));
};
window.natGoToQuiz = () => {
  goScreen(document.getElementById("screenQuiz"));
};
window.natAdminLogin = () => {
  const id = elements.adminId.value.trim();
  const pw = elements.adminPw.value.trim();
  if (validateAdminCredentials(id, pw)) {
    state.adminLogged = true;
    elements.adminStatus.textContent = "Login successful.";
    elements.adminLoginBox.classList.add("hidden");
    elements.adminDashboard.classList.remove("hidden");
    loadAdminTable(elements.adminTableBody, elements.detailBox);
    updateHeaderButtons('admin');
  } else {
    elements.adminStatus.textContent = "Invalid credentials.";
  }
};
window.natAdminLogout = () => {
  elements.adminLoginBox.classList.remove("hidden");
  elements.adminDashboard.classList.add("hidden");
  elements.adminId.value = "";
  elements.adminPw.value = "";
  elements.adminStatus.textContent = "Logged out.";
};
window.natExportAll = () => {
  exportAll();
};
window.natExportAttempt = () => {
  if (window.currentSelectedAttempt) {
    exportThisResult(window.currentSelectedAttempt);
  }
};
window.natStartFromUser = () => {
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
  updateHeaderButtons('candidate');
  showToast("Details saved. Starting quiz…");
  setTimeout(() => {
    restartQuiz();
  }, 400);
};

window.natLogout = () => {
  // Reset user state
  state.user = null;
  state.adminLogged = false;
  
  // Clear user chips
  elements.userChips.innerHTML = "";
  
  // Reset admin dashboard if visible
  elements.adminLoginBox.classList.remove("hidden");
  elements.adminDashboard.classList.add("hidden");
  elements.adminId.value = "";
  elements.adminPw.value = "";
  elements.adminStatus.textContent = "";
  
  // Update header buttons
  updateHeaderButtons('none');
  
  // Go to user screen
  goScreen(elements.screenUser);
  showToast("Logged out successfully");
};

// Update header buttons based on login state
function updateHeaderButtons(mode) {
  const candidateBtn = document.getElementById("candidateBtn");
  const adminBtn = document.getElementById("adminBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (mode === 'candidate') {
    candidateBtn.classList.add("hidden");
    adminBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else if (mode === 'admin') {
    candidateBtn.classList.add("hidden");
    adminBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    candidateBtn.classList.remove("hidden");
    adminBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
}

// Expose for use in other functions
window.updateHeaderButtons = updateHeaderButtons;

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
console.log("Attaching quiz event listeners...", elements.startBtn, elements.backToDetailsBtn);

elements.startBtn.addEventListener("click", () => {
  console.log("Start button clicked!");
  startQuestion();
});

elements.submitBtn.addEventListener("click", () => {
  console.log("Submit button clicked!");
  if (state.locked) return;
  lockAndAdvance(false);
});

elements.backToDetailsBtn.addEventListener("click", () => {
  console.log("Back to Details clicked!", { asked: state.asked, logs: state.logs.length });
  goScreen(elements.screenUser);
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
  console.log("NAT Quiz initializing...");
  
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
  } catch(e) {
    console.error("Error loading saved user:", e);
  }

  // Initialize question bank
  console.log("Initializing question bank with", embeddedBank.length, "questions");
  initializeBank(embeddedBank);
  resetPools();
  console.log("Pools initialized:", { 
    easy: state.pools.easy.length, 
    medium: state.pools.medium.length, 
    hard: state.pools.hard.length 
  });
  updateTop();
  setButtonsMode("start");
  goScreen(elements.screenUser);
  console.log("NAT Quiz ready!");
})();
