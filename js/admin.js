/**
 * Admin Module
 * Handles admin panel functionality
 */

import { computeBySkill, renderBySkillLine } from './summary.js';

/**
 * Compute user statistics from attempts
 * @param {Array} attempts - All stored attempts
 * @returns {Map} - Map of user stats
 */
export function computeUserStats(attempts) {
  const byUser = new Map();
  attempts.forEach(a => {
    const key = (a.user && a.user.email || "") + "|" + (a.user && a.user.empId || "");
    if (!byUser.has(key)) {
      byUser.set(key, { attempts: [], user: a.user });
    }
    byUser.get(key).attempts.push(a);
  });
  return byUser;
}

/**
 * Generate HTML for attempt detail view
 * @param {Object} a - Attempt object
 * @returns {string} - HTML string
 */
export function generateAttemptDetailHTML(a) {
  if (!a) {
    return '<div class="admin-detail-placeholder">Select a row above to view attempt details</div>';
  }
  
  let html = '';
  
  // User info header
  html += '<div class="detail-header">' +
    '<div class="detail-user">' +
      '<div class="detail-name">' + (a.user && a.user.name || '-') + '</div>' +
      '<div class="detail-meta">' + (a.user && a.user.email || '-') + ' · ' + (a.user && a.user.empId || '-') + ' · ' + (a.user && a.user.dept || '-') + '</div>' +
    '</div>' +
    '<div class="detail-score">' +
      '<span class="detail-score-value">' + (Math.round(a.score * 10) / 10) + '</span>' +
      '<span class="detail-score-label">Score</span>' +
    '</div>' +
  '</div>';
  
  // Timestamp and export button
  html += '<div class="detail-row">' +
    '<div class="detail-timestamp">Completed: ' + new Date(a.ts).toLocaleString() + '</div>' +
    '<button class="detail-export-btn" onclick="if(window.natExportAttempt) window.natExportAttempt();">Export</button>' +
  '</div>';
  
  // Skills breakdown
  html += '<div class="detail-skills"><span class="detail-skills-label">By Skill:</span> ' + renderBySkillLine(a.bySkill) + '</div>';
  
  // Questions table
  html += '<div class="detail-table-wrap">' +
    '<table class="summary-table">' +
      '<thead><tr>' +
        '<th>#</th>' +
        '<th>QID</th>' +
        '<th>Difficulty</th>' +
        '<th>Skill</th>' +
        '<th>Answer</th>' +
        '<th>Result</th>' +
        '<th>Time</th>' +
      '</tr></thead>' +
      '<tbody>';
    
  a.logs.forEach((l, idx) => {
    const isCorrect = l.correctBool;
    html += '<tr>' +
      '<td>' + (idx+1) + '</td>' +
      '<td>' + l.id + '</td>' +
      '<td><span class="diff-tag diff-tag-' + l.difficulty + '">' + l.difficulty + '</span></td>' +
      '<td>' + l.skill + '</td>' +
      '<td class="answer-cell">' + l.chosen + '</td>' +
      '<td><span class="result-badge ' + (isCorrect ? 'result-correct' : 'result-wrong') + '">' + (isCorrect ? 'Correct' : 'Wrong') + '</span></td>' +
      '<td class="text-right">' + l.timeTaken + 's</td>' +
    '</tr>';
  });
  
  html += '</tbody></table></div>';
  return html;
}

/**
 * Load and render admin table
 * @param {HTMLElement} tableBody - Table body element
 * @param {HTMLElement} detailBox - Detail box element
 */
export function loadAdminTable(tableBody, detailBox) {
  const raw = localStorage.getItem("natAttempts") || "[]";
  let attempts = [];
  try { attempts = JSON.parse(raw); } catch(e) { attempts = []; }
  
  tableBody.innerHTML = "";
  const byUser = computeUserStats(attempts);
  
  if (byUser.size === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="9" class="empty-state">No attempts recorded yet</td>';
    tableBody.appendChild(tr);
    return;
  }

  let selectedRow = null;
  
  byUser.forEach(obj => {
    const last = obj.attempts[obj.attempts.length - 1];
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td>' + (obj.user && obj.user.name || '-') + '</td>' +
      '<td>' + (obj.user && obj.user.email || '-') + '</td>' +
      '<td>' + (obj.user && obj.user.empId || '-') + '</td>' +
      '<td>' + (obj.user && obj.user.dept || '-') + '</td>' +
      '<td><span class="attempt-count">' + obj.attempts.length + '</span></td>' +
      '<td><strong class="score-highlight">' + (Math.round(last.score * 10) / 10) + '</strong></td>' +
      '<td>' + last.asked + '</td>' +
      '<td class="date-cell">' + new Date(last.ts).toLocaleDateString() + '</td>' +
      '<td class="skills-cell">' + renderBySkillLine(last.bySkill) + '</td>';
    
    tr.addEventListener("click", () => {
      if (selectedRow) selectedRow.classList.remove("selected");
      tr.classList.add("selected");
      selectedRow = tr;
      // Store the selected attempt globally for export
      window.currentSelectedAttempt = last;
      detailBox.innerHTML = generateAttemptDetailHTML(last);
    });
    
    tableBody.appendChild(tr);
  });
}

/**
 * Validate admin credentials
 * @param {string} id - Admin ID
 * @param {string} pw - Admin password
 * @returns {boolean} - Whether credentials are valid
 */
export function validateAdminCredentials(id, pw) {
  return id === "1234" && pw === "NABARD";
}

