/**
 * Utility Functions Module
 * Contains helper functions used across the application
 */

/**
 * Normalize difficulty string to standard format
 * @param {string} d - Raw difficulty string
 * @returns {string} - Normalized difficulty (easy, medium, hard)
 */
export function normalizeDifficulty(d) {
  if (!d) return "medium";
  d = String(d).trim().toLowerCase();
  if (d === "easy") return "easy";
  if (d === "medium") return "medium";
  if (d === "difficult" || d === "hard") return "hard";
  return "medium";
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} arr - Array to shuffle
 * @returns {Array} - New shuffled array
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get weight multiplier for difficulty
 * @param {string} d - Difficulty level
 * @returns {number} - Weight multiplier
 */
export function weightFor(d) {
  if (d === "hard") return 2;
  if (d === "medium") return 1.5;
  return 1;
}

/**
 * Escape CSV cell value
 * @param {*} v - Value to escape
 * @returns {string} - Escaped CSV value
 */
export function toCSVCell(v) {
  const s = (v === null || v === undefined) ? "" : String(v);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Download data as CSV file
 * @param {string} filename - Name of the file
 * @param {Array} rows - Array of row arrays
 */
export function downloadCSV(filename, rows) {
  const bom = "\uFEFF";
  const csv = rows.map(r => r.map(toCSVCell).join(",")).join("\n");
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRe.test(email);
}

