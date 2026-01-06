/**
 * Export Module
 * Handles CSV export functionality
 */

import { downloadCSV } from './utils.js';
import { computeBySkill, findWeakestSkill, getRecommendedLevel } from './summary.js';

/**
 * Export quiz result to CSV
 * @param {Object} data - Quiz state or attempt object (must have user, logs, score, asked)
 */
export function exportThisResult(data) {
  if (!data || !data.logs || data.logs.length === 0) return;
  
  const header = [
    "timestamp", "name", "email", "empId", "dept", "weightedScore", "asked",
    "qid", "difficulty", "skill", "chosen", "correct?", "timeTaken",
    "weakestSkill", "weakestSkillAccuracy", "recommendedLevel"
  ];
  const rows = [header];
  
  // Use stored timestamp if available, otherwise current time
  const ts = data.ts ? new Date(data.ts).toLocaleString() : new Date().toLocaleString();
  
  // Calculate weakest skill
  const bySkill = computeBySkill(data.logs);
  const weakest = findWeakestSkill(bySkill);
  const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
  const weakestSkillName = weakest ? weakest.skill : "";
  const weakestSkillAcc = weakest ? Math.round(weakest.accuracy) + "%" : "";
  const recommendedLevel = recommendation ? recommendation.level : "";
  
  data.logs.forEach((l, idx) => {
    rows.push([
      ts,
      data.user && data.user.name || "",
      data.user && data.user.email || "",
      data.user && data.user.empId || "",
      data.user && data.user.dept || "",
      Math.round(data.score * 10) / 10,
      data.asked,
      l.id,
      l.difficulty,
      l.skill,
      l.chosen,
      l.correctBool,
      l.timeTaken,
      idx === 0 ? weakestSkillName : "",
      idx === 0 ? weakestSkillAcc : "",
      idx === 0 ? recommendedLevel : ""
    ]);
  });
  
  const userName = (data.user && data.user.name || "result").replace(/\s+/g, "_");
  downloadCSV(`nat_quiz_${userName}.csv`, rows);
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

