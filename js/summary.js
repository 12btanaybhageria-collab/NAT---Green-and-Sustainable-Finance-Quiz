/**
 * Summary Module
 * Handles score calculations and summary rendering
 */

/**
 * Compute statistics by skill from logs
 * @param {Array} logs - Quiz attempt logs
 * @returns {Object} - Stats by skill
 */
export function computeBySkill(logs) {
  const out = {};
  logs.forEach(l => {
    const k = l.skill || "General";
    if (!out[k]) out[k] = { correct: 0, total: 0 };
    out[k].total += 1;
    if (l.correctBool) out[k].correct += 1;
  });
  return out;
}

/**
 * Get recommended proficiency level based on accuracy
 * @param {number} accuracy - Accuracy percentage
 * @returns {Object} - Level info with color and icon
 */
export function getRecommendedLevel(accuracy) {
  if (accuracy < 25) return { level: "Foundational", color: "#dc3545", icon: "🔴" };
  if (accuracy < 50) return { level: "Intermediate", color: "#fd7e14", icon: "🟠" };
  if (accuracy < 75) return { level: "Advanced", color: "#0d6efd", icon: "🔵" };
  return { level: "Leadership", color: "#198754", icon: "🟢" };
}

/**
 * Find the weakest skill from skill stats
 * @param {Object} bySkill - Stats by skill
 * @returns {Object|null} - Weakest skill info
 */
export function findWeakestSkill(bySkill) {
  let weakest = null;
  let lowestAcc = 101;
  Object.keys(bySkill).forEach(skill => {
    const r = bySkill[skill];
    const acc = r.total ? (r.correct / r.total) * 100 : 0;
    if (acc < lowestAcc) {
      lowestAcc = acc;
      weakest = { skill, accuracy: acc, correct: r.correct, total: r.total };
    }
  });
  return weakest;
}

/**
 * Render by-skill line for tables
 * @param {Object} bySkill - Stats by skill
 * @returns {string} - Formatted string
 */
export function renderBySkillLine(bySkill) {
  const parts = [];
  for (const k in bySkill) {
    const r = bySkill[k];
    parts.push(k + " " + r.correct + "/" + r.total);
  }
  return parts.join("; ");
}

/**
 * Generate summary HTML content
 * @param {Object} state - Quiz state
 * @returns {string} - HTML string for summary
 */
export function generateSummaryHTML(state) {
  const weightedScore = Math.round(state.score * 10) / 10;
  const bySkill = computeBySkill(state.logs);
  const wrong = state.logs.filter(l => !l.correctBool);
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  state.logs.forEach(l => {
    diffCounts[l.difficulty] = (diffCounts[l.difficulty] || 0) + 1;
  });

  // Find weakest skill and recommendation
  const weakest = findWeakestSkill(bySkill);
  const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;

  let html = "";
  html += '<div class="grid2">' +
    '<div class="card" style="padding:12px;">' +
      '<div class="muted">Overall</div>' +
      '<div style="font-size:22px;font-weight:800;">Score (weighted): ' + weightedScore + '</div>' +
      '<div class="muted">Weights — Easy:1 · Medium:1.5 · Hard:2</div>' +
    '</div>' +
    '<div class="card" style="padding:12px;">' +
      '<div class="muted">By Difficulty (questions seen)</div>' +
      '<div>Easy: ' + (diffCounts.easy||0) + ' · Medium: ' + (diffCounts.medium||0) + ' · Hard: ' + (diffCounts.hard||0) + '</div>' +
    '</div>' +
  '</div>';

  // Recommendation card for weakest skill
  if (weakest && recommendation) {
    html += '<div class="card" style="margin-top:10px;border-left:4px solid ' + recommendation.color + ';background:linear-gradient(90deg, rgba(255,255,255,0.95), #fff);">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="font-size:32px;">' + recommendation.icon + '</div>' +
        '<div style="flex:1;">' +
          '<div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">📊 Skill Improvement Recommendation</div>' +
          '<div style="font-size:16px;font-weight:700;margin:4px 0;color:#333;">Weakest Skill: <span style="color:' + recommendation.color + ';">' + weakest.skill + '</span></div>' +
          '<div style="font-size:13px;color:#555;">' +
            'Accuracy: <strong>' + Math.round(weakest.accuracy) + '%</strong> (' + weakest.correct + '/' + weakest.total + ' correct)' +
          '</div>' +
          '<div style="margin-top:8px;padding:8px 12px;background:' + recommendation.color + '15;border-radius:6px;display:inline-block;">' +
            '<span style="font-size:12px;color:#666;">Recommended Proficiency Level: </span>' +
            '<strong style="color:' + recommendation.color + ';font-size:14px;">' + recommendation.level + '</strong>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  html += '<div class="card" style="margin-top:10px;">' +
    '<div class="muted">By Skill (unweighted accuracy)</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
      '<thead>' +
        '<tr style="background:#f4f8f5;">' +
          '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Skill</th>' +
          '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">Correct</th>' +
          '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">Total</th>' +
          '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">Accuracy</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';

  Object.keys(bySkill).forEach(k => {
    const r = bySkill[k];
    const acc = r.total ? Math.round((r.correct / r.total) * 100) : 0;
    html += '<tr>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);">' + k + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">' + r.correct + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">' + r.total + '</td>' +
      '<td style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">' + acc + '%</td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';

  html += '<div class="card" style="margin-top:10px;">' +
    '<div class="muted">Incorrect / Timed out questions</div>';

  if (wrong.length === 0) {
    html += '<div style="padding:6px 0;">🎉 Excellent! No mistakes recorded in this attempt.</div>';
  } else {
    html += '<div style="max-height:260px;overflow:auto;margin-top:6px;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<thead>' +
          '<tr style="background:#f4f8f5;">' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">#</th>' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">QID</th>' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Difficulty</th>' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Skill</th>' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:left;">Your Answer</th>' +
            '<th style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">Time(s)</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';
    wrong.forEach((l, idx) => {
      html += '<tr>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);">' + (idx+1) + '</td>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.id + '</td>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.difficulty + '</td>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.skill + '</td>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);">' + l.chosen + '</td>' +
        '<td style="padding:4px;border-bottom:1px solid var(--border);text-align:right;">' + l.timeTaken + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';
  }

  html += '</div>';

  return html;
}

