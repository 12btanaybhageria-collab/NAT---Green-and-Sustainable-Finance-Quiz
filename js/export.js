/**
 * Export Module
 * Handles CSV export functionality
 */

import { downloadCSV } from './utils.js';
import { computeBySkill, findWeakestSkill, getRecommendedLevel } from './summary.js';

/**
 * Export current quiz result to CSV
 * @param {Object} state - Quiz state
 */
export function exportThisResult(state) {
  if (!state.user || state.logs.length === 0) return;
  
  const header = [
    "timestamp", "name", "email", "empId", "dept", "weightedScore", "asked",
    "qid", "difficulty", "skill", "chosen", "correct?", "timeTaken",
    "weakestSkill", "weakestSkillAccuracy", "recommendedLevel"
  ];
  const rows = [header];
  const ts = new Date().toLocaleString();
  
  // Calculate weakest skill for this attempt
  const bySkill = computeBySkill(state.logs);
  const weakest = findWeakestSkill(bySkill);
  const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
  const weakestSkillName = weakest ? weakest.skill : "";
  const weakestSkillAcc = weakest ? Math.round(weakest.accuracy) + "%" : "";
  const recommendedLevel = recommendation ? recommendation.level : "";
  
  state.logs.forEach((l, idx) => {
    rows.push([
      ts,
      state.user.name || "",
      state.user.email || "",
      state.user.empId || "",
      state.user.dept || "",
      Math.round(state.score * 10) / 10,
      state.asked,
      l.id,
      l.difficulty,
      l.skill,
      l.chosen,
      l.correctBool,
      l.timeTaken,
      idx === 0 ? weakestSkillName : "",  // Only on first row
      idx === 0 ? weakestSkillAcc : "",   // Only on first row
      idx === 0 ? recommendedLevel : ""   // Only on first row
    ]);
  });
  
  downloadCSV("nat_quiz_result.csv", rows);
}

/**
 * Export all stored attempts to CSV
 */
export function exportAll() {
  const raw = localStorage.getItem("natAttempts") || "[]";
  let attempts = [];
  try { attempts = JSON.parse(raw); } catch(e) { attempts = []; }
  
  const header = [
    "timestamp", "name", "email", "empId", "dept", "weightedScore", "asked",
    "qid", "difficulty", "skill", "chosen", "correct?", "timeTaken",
    "weakestSkill", "weakestSkillAccuracy", "recommendedLevel"
  ];
  const rows = [header];
  
  attempts.forEach(a => {
    // Calculate weakest skill for each attempt
    const bySkill = computeBySkill(a.logs || []);
    const weakest = findWeakestSkill(bySkill);
    const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
    const weakestSkillName = weakest ? weakest.skill : "";
    const weakestSkillAcc = weakest ? Math.round(weakest.accuracy) + "%" : "";
    const recommendedLevel = recommendation ? recommendation.level : "";
    
    (a.logs || []).forEach((l, idx) => {
      rows.push([
        new Date(a.ts).toLocaleString(),
        a.user && a.user.name || "",
        a.user && a.user.email || "",
        a.user && a.user.empId || "",
        a.user && a.user.dept || "",
        Math.round(a.score * 10) / 10,
        a.asked,
        l.id,
        l.difficulty,
        l.skill,
        l.chosen,
        l.correctBool,
        l.timeTaken,
        idx === 0 ? weakestSkillName : "",  // Only on first row of each attempt
        idx === 0 ? weakestSkillAcc : "",   // Only on first row of each attempt
        idx === 0 ? recommendedLevel : ""   // Only on first row of each attempt
      ]);
    });
  });
  
  downloadCSV("nat_quiz_all_results.csv", rows);
}

