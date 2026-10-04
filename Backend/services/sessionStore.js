/**
 * sessionStore.js
 *
 * Minimal in-memory store for interview sessions, keyed by sessionId.
 * (No database: state lives for the lifetime of the server process, so run a
 * SINGLE instance when deploying — see README "Deployment".)
 *
 * Session shape (see routes/interview.js for how each field is used):
 * {
 *   sessionId, candidate, history: [{role, content}],
 *   status: 'in_progress' | 'completed',
 *   busy: boolean,                       // guards against double submits
 *
 *   candidateSummary, plan,              // built once at start
 *   topicPerformance: { [topic]: { level, score, scores[], questionsAsked, status, depth } },
 *   currentTopic, currentDepth, avoidTopics[], lastAction,
 *
 *   questionCount,                       // questions ASKED so far
 *   answeredCount,                       // answers EVALUATED so far
 *   totalPlanned,                        // current planned length (>= MIN_QUESTIONS)
 *
 *   interviewStartedAt, questionStartedAt, timingLog[],
 *   questionLog[],                       // per-question evaluation (report card)
 *   integrity,                           // proctoring summary sent by the browser
 *
 *   finalFeedback, completedNormally
 * }
 */

const sessions = new Map();

const SESSION_TTL_MS = 1000 * 60 * 60 * 3; // 3 hours

function emptyIntegrity() {
  return {
    faceMissingEvents: 0,
    faceMissingSeconds: 0,
    multipleFaceEvents: 0,
    tabSwitches: 0,
    pasteAttempts: 0,
    deviceInterruptions: 0,
    monitoringAvailable: true,
  };
}

function createSession(sessionId, candidate, totalPlanned) {
  const now = Date.now();
  const session = {
    sessionId,
    candidate,
    history: [],
    status: "in_progress",
    busy: false,
    createdAt: now,
    lastActiveAt: now,

    candidateSummary: "",
    plan: [],
    topicPerformance: {},
    currentTopic: null,
    currentDepth: 1,
    avoidTopics: [],
    lastAction: null,

    questionCount: 0,
    answeredCount: 0,
    totalPlanned,
    daysCovered: new Set(),

    interviewStartedAt: null,
    questionStartedAt: null,
    timingLog: [],
    questionLog: [],
    integrity: emptyIntegrity(),

    finalFeedback: null,
    completedNormally: null,
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) session.lastActiveAt = Date.now();
  return session || null;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

function sweepStaleSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActiveAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

/** Merges an integrity summary sent by the browser (numbers only, clamped). */
function mergeIntegrity(session, incoming) {
  if (!incoming || typeof incoming !== "object") return;
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(100000, Math.round(Number(v)))) : 0);
  const current = session.integrity;

  for (const key of [
    "faceMissingEvents",
    "faceMissingSeconds",
    "multipleFaceEvents",
    "tabSwitches",
    "pasteAttempts",
    "deviceInterruptions",
  ]) {
    if (incoming[key] !== undefined) current[key] = Math.max(current[key], num(incoming[key]));
  }
  if (incoming.monitoringAvailable === false) current.monitoringAvailable = false;
}

module.exports = {
  createSession,
  getSession,
  deleteSession,
  sweepStaleSessions,
  mergeIntegrity,
};
