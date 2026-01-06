/**
 * Export Module
 * Handles CSV export functionality
 */

import { downloadCSV } from './utils.js';
import { computeBySkill, findWeakestSkill, getRecommendedLevel } from './summary.js';
import { STORAGE_KEYS } from './constants.js';

/**
 * Export quiz result to CSV
 * @param {Object} data - Quiz state or attempt object (must have user, logs, score, asked)
 */
export function exportThisResult(data) {
  if (!data?.logs?.length) return;
  
  const header = [
    "timestamp", "name", "email", "empId", "dept", "weightedScore", "asked",
    "qid", "difficulty", "skill", "chosen", "correct?", "timeTaken",
    "weakestSkill", "weakestSkillAccuracy", "recommendedLevel"
  ];
  const rows = [header];
  
  const ts = data.ts ? new Date(data.ts).toLocaleString() : new Date().toLocaleString();
  
  const bySkill = computeBySkill(data.logs);
  const weakest = findWeakestSkill(bySkill);
  const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
  const weakestSkillName = weakest?.skill || "";
  const weakestSkillAcc = weakest ? `${Math.round(weakest.accuracy)}%` : "";
  const recommendedLevel = recommendation?.level || "";
  
  data.logs.forEach((l, idx) => {
    rows.push([
      ts,
      data.user?.name || "",
      data.user?.email || "",
      data.user?.empId || "",
      data.user?.dept || "",
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
  
  const userName = (data.user?.name || "result").replace(/\s+/g, "_");
  downloadCSV(`nat_quiz_${userName}.csv`, rows);
}

/**
 * Export all stored attempts to CSV
 */
export function exportAll() {
  const raw = localStorage.getItem(STORAGE_KEYS.attempts) || "[]";
  let attempts = [];
  try {
    attempts = JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse stored attempts:", e);
    attempts = [];
  }
  
  const header = [
    "timestamp", "name", "email", "empId", "dept", "weightedScore", "asked",
    "qid", "difficulty", "skill", "chosen", "correct?", "timeTaken",
    "weakestSkill", "weakestSkillAccuracy", "recommendedLevel"
  ];
  const rows = [header];
  
  attempts.forEach(a => {
    const bySkill = computeBySkill(a.logs || []);
    const weakest = findWeakestSkill(bySkill);
    const recommendation = weakest ? getRecommendedLevel(weakest.accuracy) : null;
    const weakestSkillName = weakest?.skill || "";
    const weakestSkillAcc = weakest ? `${Math.round(weakest.accuracy)}%` : "";
    const recommendedLevel = recommendation?.level || "";
    
    (a.logs || []).forEach((l, idx) => {
      rows.push([
        new Date(a.ts).toLocaleString(),
        a.user?.name || "",
        a.user?.email || "",
        a.user?.empId || "",
        a.user?.dept || "",
        Math.round(a.score * 10) / 10,
        a.asked,
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
  });
  
  downloadCSV("nat_quiz_all_results.csv", rows);
}
