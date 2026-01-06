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
 * @returns {Object} - Level info with color
 */
export function getRecommendedLevel(accuracy) {
  if (accuracy < 25) return { level: "Foundational", color: "#dc3545", bgColor: "rgba(220, 53, 69, 0.1)" };
  if (accuracy < 50) return { level: "Intermediate", color: "#fd7e14", bgColor: "rgba(253, 126, 20, 0.1)" };
  if (accuracy < 75) return { level: "Advanced", color: "#0d6efd", bgColor: "rgba(13, 110, 253, 0.1)" };
  return { level: "Leadership", color: "#198754", bgColor: "rgba(25, 135, 84, 0.1)" };
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
  const totalCorrect = state.logs.filter(l => l.correctBool).length;
  const accuracy = state.logs.length ? Math.round((totalCorrect / state.logs.length) * 100) : 0;
  const bySkill = computeBySkill(state.logs);
  const wrong = state.logs.filter(l => !l.correctBool);
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  state.logs.forEach(l => {
    diffCounts[l.difficulty] = (diffCounts[l.difficulty] || 0) + 1;
  });

  // Find weakest skill and recommendation
  const weakest = findWeakestSkill(bySkill);
  const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
  const overallLevel = getRecommendedLevel(accuracy);

  let html = "";
  
  // Score Header
  html += '<div class="summary-header">' +
    '<div class="summary-score">' +
      '<div class="score-circle" style="border-color:' + overallLevel.color + ';">' +
        '<span class="score-value">' + accuracy + '%</span>' +
        '<span class="score-label">Accuracy</span>' +
      '</div>' +
    '</div>' +
    '<div class="summary-stats">' +
      '<div class="stat-item">' +
        '<span class="stat-value">' + weightedScore + '</span>' +
        '<span class="stat-label">Weighted Score</span>' +
      '</div>' +
      '<div class="stat-item">' +
        '<span class="stat-value">' + totalCorrect + '/' + state.logs.length + '</span>' +
        '<span class="stat-label">Correct Answers</span>' +
      '</div>' +
      '<div class="stat-item">' +
        '<span class="stat-value" style="color:' + overallLevel.color + ';">' + overallLevel.level + '</span>' +
        '<span class="stat-label">Proficiency Level</span>' +
      '</div>' +
    '</div>' +
  '</div>';

  // Difficulty Breakdown
  html += '<div class="summary-section">' +
    '<h3 class="section-title">Difficulty Breakdown</h3>' +
    '<div class="difficulty-bars">' +
      '<div class="diff-bar">' +
        '<span class="diff-label">Easy</span>' +
        '<div class="diff-track"><div class="diff-fill diff-easy" style="width:' + (diffCounts.easy * 5) + '%;"></div></div>' +
        '<span class="diff-count">' + (diffCounts.easy||0) + '</span>' +
      '</div>' +
      '<div class="diff-bar">' +
        '<span class="diff-label">Medium</span>' +
        '<div class="diff-track"><div class="diff-fill diff-medium" style="width:' + (diffCounts.medium * 5) + '%;"></div></div>' +
        '<span class="diff-count">' + (diffCounts.medium||0) + '</span>' +
      '</div>' +
      '<div class="diff-bar">' +
        '<span class="diff-label">Hard</span>' +
        '<div class="diff-track"><div class="diff-fill diff-hard" style="width:' + (diffCounts.hard * 5) + '%;"></div></div>' +
        '<span class="diff-count">' + (diffCounts.hard||0) + '</span>' +
      '</div>' +
    '</div>' +
  '</div>';

  // Recommendation card for weakest skill
  if (weakest && recommendation) {
    html += '<div class="summary-section recommendation-card" style="border-left:4px solid ' + recommendation.color + ';">' +
      '<h3 class="section-title">Focus Area</h3>' +
      '<div class="recommendation-content">' +
        '<div class="recommendation-skill">' + weakest.skill + '</div>' +
        '<div class="recommendation-stats">' +
          '<span class="rec-accuracy" style="color:' + recommendation.color + ';">' + Math.round(weakest.accuracy) + '% accuracy</span>' +
          '<span class="rec-detail">' + weakest.correct + ' of ' + weakest.total + ' correct</span>' +
        '</div>' +
        '<div class="recommendation-level" style="background:' + recommendation.bgColor + ';color:' + recommendation.color + ';">' +
          'Recommended: ' + recommendation.level + ' level training' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Skills Table
  html += '<div class="summary-section">' +
    '<h3 class="section-title">Performance by Skill</h3>' +
    '<div class="skills-table-wrap">' +
    '<table class="summary-table">' +
      '<thead>' +
        '<tr>' +
          '<th>Skill</th>' +
          '<th>Correct</th>' +
          '<th>Total</th>' +
          '<th>Accuracy</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';

  Object.keys(bySkill).forEach(k => {
    const r = bySkill[k];
    const acc = r.total ? Math.round((r.correct / r.total) * 100) : 0;
    const levelColor = getRecommendedLevel(acc).color;
    html += '<tr>' +
      '<td>' + k + '</td>' +
      '<td class="text-center">' + r.correct + '</td>' +
      '<td class="text-center">' + r.total + '</td>' +
      '<td class="text-right"><span class="accuracy-badge" style="background:' + getRecommendedLevel(acc).bgColor + ';color:' + levelColor + ';">' + acc + '%</span></td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';

  // Wrong Answers Section
  html += '<div class="summary-section">' +
    '<h3 class="section-title">Review: Incorrect Answers</h3>';

  if (wrong.length === 0) {
    html += '<div class="success-message">' +
      '<div class="success-icon">✓</div>' +
      '<div class="success-text">Excellent! No mistakes recorded in this attempt.</div>' +
    '</div>';
  } else {
    html += '<div class="wrong-table-wrap">' +
      '<table class="summary-table">' +
        '<thead>' +
          '<tr>' +
            '<th>#</th>' +
            '<th>QID</th>' +
            '<th>Difficulty</th>' +
            '<th>Skill</th>' +
            '<th>Your Answer</th>' +
            '<th>Time</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';
    wrong.forEach((l, idx) => {
      html += '<tr>' +
        '<td>' + (idx+1) + '</td>' +
        '<td>' + l.id + '</td>' +
        '<td><span class="diff-tag diff-tag-' + l.difficulty + '">' + l.difficulty + '</span></td>' +
        '<td>' + l.skill + '</td>' +
        '<td class="answer-cell">' + l.chosen + '</td>' +
        '<td class="text-right">' + l.timeTaken + 's</td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';
  }

  html += '</div>';

  return html;
}

