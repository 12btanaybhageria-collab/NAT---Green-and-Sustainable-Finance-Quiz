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
    return "No attempt selected.";
  }
  
  let html = "";
  html += '<div><strong>' + (a.user && a.user.name || '-') + '</strong> · ' +
          (a.user && a.user.email || '-') + ' · Emp ' +
          (a.user && a.user.empId || '-') + ' · ' +
          (a.user && a.user.dept || '-') + '</div>';
  html += '<div>Finished: ' + new Date(a.ts).toLocaleString() +
          ' · Score (weighted): <strong>' + (Math.round(a.score * 10) / 10) + '</strong></div>';
  html += '<div style="margin:6px 0 8px;"><em>By Skill:</em> ' + renderBySkillLine(a.bySkill) + '</div>';
  html += '<div class="hr"></div>';
  html += '<div style="max-height:260px;overflow:auto;border-radius:12px;border:1px solid var(--border);">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
    '<thead>' +
      '<tr style="background:#f4f8f5;">' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">#</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">QID</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Difficulty</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Skill</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Chosen</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Correct?</th>' +
        '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">Time(s)</th>' +
      '</tr>' +
    '</thead>' +
    '<tbody>';
    
  a.logs.forEach((l, idx) => {
    html += '<tr>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (idx+1) + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.id + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.difficulty + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.skill + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.chosen + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (l.correctBool ? '✔' : '✘') + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">' + l.timeTaken + '</td>' +
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
    tr.innerHTML = '<td colspan="9" style="padding:6px;text-align:center;" class="muted">No attempts stored yet.</td>';
    tableBody.appendChild(tr);
    return;
  }

  byUser.forEach(obj => {
    const last = obj.attempts[obj.attempts.length - 1];
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.innerHTML =
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (obj.user && obj.user.name || '-') + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (obj.user && obj.user.email || '-') + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (obj.user && obj.user.empId || '-') + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (obj.user && obj.user.dept || '-') + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);"><span class="chip" style="background:#fff;">' + obj.attempts.length + '</span></td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);"><strong>' + (Math.round(last.score * 10) / 10) + '</strong></td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + last.asked + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + new Date(last.ts).toLocaleString() + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + renderBySkillLine(last.bySkill) + '</td>';
    
    tr.addEventListener("click", () => {
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

