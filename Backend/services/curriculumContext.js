/**
 * curriculumContext.js
 *
 * Combines a candidate profile with the curriculum data to produce:
 *  - a compact text summary the LLM uses as interview context (including the
 *    "pre-interview" answers: skills, tools, preferred style, notes)
 *  - an ordered list of curriculum days (topics) to interview on.
 */

const fs = require("fs");
const path = require("path");

const CURRICULUM_PATH = path.join(__dirname, "..", "..", "Data", "curriculum.json");

let curriculumCache = null;

function loadCurriculum() {
  if (curriculumCache) return curriculumCache;
  curriculumCache = JSON.parse(fs.readFileSync(CURRICULUM_PATH, "utf-8"));
  return curriculumCache;
}

function getDayInfo(dayNumber) {
  return loadCurriculum().days.find((d) => d.day === dayNumber) || null;
}

function getModuleForDay(dayNumber) {
  return (
    loadCurriculum().modules.find((m) => dayNumber >= m.days[0] && dayNumber <= m.days[1]) || null
  );
}

/** strong = passed first try, shaky = needed retries, gaps = skipped/failed. */
function classifyMissions(candidate) {
  const missions = (candidate && Array.isArray(candidate.missions) ? candidate.missions : []).filter(
    (m) => m && Number.isInteger(m.day) && getDayInfo(m.day)
  );

  const strong = [];
  const shaky = [];
  const gaps = [];

  for (const m of missions) {
    if (m.skipped || m.passed === false) gaps.push(m);
    else if (m.passed && m.attempts && m.attempts > 1) shaky.push(m);
    else if (m.passed) strong.push(m);
  }
  return { strong, shaky, gaps };
}

/**
 * Ordered interview plan.
 *
 * Order: one confident topic first (a calm warm-up), then topics the
 * candidate flagged as shaky (where the interview learns the most), then
 * the remaining confident topics (verify depth), and finally topics not yet
 * covered (light fundamentals check).
 */
function buildInterviewPlan(candidate, { minDays = 4, maxDays = 12 } = {}) {
  const { strong, shaky, gaps } = classifyMissions(candidate);

  const ordered = [];
  const seen = new Set();
  const push = (m) => {
    if (m && !seen.has(m.day)) {
      seen.add(m.day);
      ordered.push(m.day);
    }
  };

  push(strong[0]);
  shaky.forEach(push);
  strong.forEach(push);
  gaps.forEach(push);

  const plan = ordered.slice(0, maxDays).map((day) => {
    const info = getDayInfo(day);
    const mod = getModuleForDay(day);
    return {
      day,
      title: info ? info.title : `Day ${day}`,
      module: mod ? mod.title : null,
      objectives: info ? info.objectives : [],
      tools: info ? info.tools : [],
    };
  });

  return { plan, meetsMinimum: plan.length >= minDays };
}

const SKILL_LABELS = {
  rag: "RAG & vector search",
  llm: "LLM APIs & prompting",
  finetune: "Fine-tuning",
  agents: "Agents & MCP",
  backend: "Backend / API design",
  cloud: "Docker, Kubernetes & cloud",
  evaluation: "Evaluation & testing",
  security: "Security & guardrails",
};

const cap = (text, max) => String(text || "").replace(/\s+/g, " ").trim().slice(0, max);

/** Compact candidate context for the system prompt. */
function buildCandidateSummary(candidate) {
  const member = (candidate && candidate.member) || {};
  const profile = (candidate && candidate.profile) || {};
  const signals = (candidate && candidate.signals) || {};
  const { strong, shaky, gaps } = classifyMissions(candidate);

  const lines = [
    `Name: ${cap(member.name, 60) || "Candidate"}`,
    `Target role: ${cap(member.jobRole, 80) || "Unknown"}`,
    `Experience: ${member.yearsExperience ?? "Unknown"} years`,
    `Education: ${cap(member.education, 100) || "Unknown"}`,
  ];

  if (profile.domain) lines.push(`Primary technical domain: ${cap(profile.domain, 80)}`);
  if (profile.industry) lines.push(`Industry background: ${cap(profile.industry, 80)}`);
  if (profile.workContext) lines.push(`Current situation: ${cap(profile.workContext, 80)}`);
  if (profile.systemScale) lines.push(`Largest system worked on: ${cap(profile.systemScale, 100)}`);
  if (profile.aiExposure) lines.push(`Production AI/ML exposure: ${cap(profile.aiExposure, 100)}`);

  if (profile.skills && typeof profile.skills === "object") {
    const rated = Object.entries(profile.skills)
      .filter(([key, level]) => SKILL_LABELS[key] && level)
      .map(([key, level]) => `${SKILL_LABELS[key]}: ${cap(level, 20)}`);
    if (rated.length) lines.push(`Self-rated skills: ${rated.join("; ")}`);
  }

  if (Array.isArray(profile.tools) && profile.tools.length) {
    lines.push(`Tools used: ${profile.tools.slice(0, 20).map((t) => cap(t, 30)).join(", ")}`);
  }

  if (profile.difficulty) lines.push(`Requested difficulty: ${cap(profile.difficulty, 60)}`);
  if (profile.style) lines.push(`Preferred question style: ${cap(profile.style, 80)}`);
  if (profile.notes) lines.push(`Candidate note to interviewer: "${cap(profile.notes, 300)}"`);

  if (signals.missionsCompleted !== undefined || signals.commitDays !== undefined) {
    const parts = [];
    if (signals.commitDays !== undefined) parts.push(`${signals.commitDays} active days`);
    if (signals.missionsCompleted !== undefined) parts.push(`${signals.missionsCompleted} missions completed`);
    if (signals.missionsFirstTry !== undefined) parts.push(`${signals.missionsFirstTry} passed first try`);
    lines.push(`Program activity: ${parts.join(", ")}`);
  }

  if (strong.length) lines.push(`Confident topics: ${strong.map((m) => m.title).join(", ")}`);
  if (shaky.length) lines.push(`Topics needing revision: ${shaky.map((m) => m.title).join(", ")}`);
  if (gaps.length) lines.push(`Not yet covered: ${gaps.map((m) => m.title).join(", ")}`);

  return lines.join("\n");
}

module.exports = {
  loadCurriculum,
  getDayInfo,
  getModuleForDay,
  classifyMissions,
  buildInterviewPlan,
  buildCandidateSummary,
};
