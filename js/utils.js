/**
 * Utility Functions Module
 * Contains helper functions used across the application
 */

import { DIFFICULTY_WEIGHTS } from './constants.js';

/**
 * Normalize difficulty string to standard format
 * @param {string} d - Raw difficulty string
 * @returns {string} - Normalized difficulty (easy, medium, hard)
 */
export function normalizeDifficulty(d) {
  if (!d) return "medium";
  const normalized = String(d).trim().toLowerCase();
  if (normalized === "easy") return "easy";
  if (normalized === "medium") return "medium";
  if (normalized === "difficult" || normalized === "hard") return "hard";
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
  return DIFFICULTY_WEIGHTS[d] || DIFFICULTY_WEIGHTS.easy;
}

/**
 * Escape CSV cell value
 * @param {*} v - Value to escape
 * @returns {string} - Escaped CSV value
 */
export function toCSVCell(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
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
