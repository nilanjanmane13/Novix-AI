/**
 * reportBuilder.js
 *
 * Turns the interview session into the final report card.
 *
 * SCORING (why the score is not "random")
 * ---------------------------------------
 * For every answer the AI grades four dimensions on a 0-10 scale:
 *   accuracy (40%)       - is what they said technically correct?
 *   understanding (25%)  - do they grasp the "why", not just the "what"?
 *   application (20%)    - can they apply it to real situations?
 *   clarity (15%)        - is the explanation structured and precise?
 * The backend blends those into one score per answer (evaluateAnswer) and
 * guards against inflation (e.g. "I don't know" can never score above 1.5).
 *
 * The overall 0-100 score is a weighted mean of every answer, where harder
 * questions (deeper adaptive level) count a little more. The AI writes the
 * narrative (summary / strengths / gaps / next steps); it never invents the
 * number.
 */

const { cleanScore, DEPTH_LABELS, depthIndexFromLabel, levelFromScore } = require("./adaptiveState");

const DIMENSION_WEIGHTS = { accuracy: 0.4, understanding: 0.25, application: 0.2, clarity: 0.15 };

const DIMENSION_LABELS = {
  accuracy: "Technical accuracy",
  understanding: "Depth of understanding",
  application: "Practical application",
  clarity: "Communication",
};

const DONT_KNOW = /^\s*(i\s*(do\s*not|don'?t)\s*know|no\s*idea|not\s*sure|idk|skip|pass|can'?t\s*say|no\s*clue|nothing)\b/i;

const round1 = (n) => Math.round(n * 10) / 10;
const clampNum = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Converts the AI's analysis object into trusted numbers.
 * Returns { score, dims, answerType, note, depthLabel }.
 */
function evaluateAnswer(analysis, answerText = "") {
  const a = analysis && typeof analysis === "object" ? analysis : {};
  const text = String(answerText || "").trim();

  const raw = {
    accuracy: cleanScore(a.accuracy),
    understanding: cleanScore(a.understanding),
    application: cleanScore(a.application),
    clarity: cleanScore(a.clarity),
  };
  const aiScore = cleanScore(a.score);
  const haveAllDims = Object.values(raw).every((v) => v !== null);

  let score;
  if (haveAllDims) {
    const weighted = Object.entries(DIMENSION_WEIGHTS).reduce((sum, [k, w]) => sum + raw[k] * w, 0);
    score = aiScore !== null ? 0.6 * weighted + 0.4 * aiScore : weighted;
  } else if (aiScore !== null) {
    score = aiScore;
  } else {
    // The model returned no usable evaluation at all.
    score = text.length < 40 ? 3 : 5;
  }

  let answerType = ["answered", "partial", "dont_know", "off_topic"].includes(a.answerType)
    ? a.answerType
    : "answered";

  // Anti-inflation guards.
  if (DONT_KNOW.test(text) && text.length < 60) answerType = "dont_know";
  if (answerType === "dont_know") score = Math.min(score, 1.5);
  if (answerType === "off_topic") score = Math.min(score, 2.5);
  if (text.length < 12) score = Math.min(score, 2);

  score = round1(clampNum(score, 0, 10));

  const dims = {};
  for (const key of Object.keys(DIMENSION_WEIGHTS)) {
    const v = raw[key] !== null ? raw[key] : score;
    dims[key] = round1(clampNum(Math.min(v, score + 2.5), 0, 10)); // dims can't wildly exceed the score
  }
  if (answerType === "dont_know") for (const k of Object.keys(dims)) dims[k] = Math.min(dims[k], 1.5);

  return {
    score,
    dims,
    answerType,
    depthLabel: DEPTH_LABELS.includes(String(a.depth || "").toLowerCase())
      ? String(a.depth).toLowerCase()
      : null,
    note: typeof a.note === "string" ? a.note.replace(/\s+/g, " ").trim().slice(0, 240) : "",
    usedFallback: aiScore === null && !haveAllDims,
  };
}

/** Harder questions count slightly more: weight 1.0 (basic) .. 1.6 (advanced). */
const depthWeight = (label) => 1 + 0.15 * ((depthIndexFromLabel(label) || 2) - 1);

function computeOverallScore(questionLog) {
  if (!questionLog || !questionLog.length) return null;
  let total = 0;
  let weights = 0;
  for (const q of questionLog) {
    const w = depthWeight(q.depth);
    total += q.score * w;
    weights += w;
  }
  return Math.round(clampNum((total / weights) * 10, 0, 100));
}

function levelFromOverallScore(score) {
  if (score === null) return "Not enough evidence";
  if (score >= 85) return "Exceptional";
  if (score >= 72) return "Strong";
  if (score >= 58) return "Proficient";
  if (score >= 45) return "Developing";
  return "Foundational";
}

function verdictFromScore(score) {
  if (score === null) return "No answers were completed, so no score could be calculated.";
  if (score >= 85) return "Outstanding command of the material. Ready for senior-level technical rounds.";
  if (score >= 72) return "Solid, reliable knowledge with only minor gaps. Ready for technical interviews.";
  if (score >= 58) return "Good working knowledge. A little targeted practice will make answers sharper.";
  if (score >= 45) return "Core ideas are present but depth is inconsistent. Focus on the gaps listed below.";
  return "Fundamentals need more practice before interviewing. Follow the study plan below.";
}

function computeDimensions(questionLog) {
  if (!questionLog || !questionLog.length) return [];
  return Object.keys(DIMENSION_WEIGHTS).map((key) => {
    const avg = questionLog.reduce((s, q) => s + (q.dims?.[key] ?? q.score), 0) / questionLog.length;
    return { key, label: DIMENSION_LABELS[key], score: Math.round(avg * 10) };
  });
}

function confidenceFor(answered, minQuestions) {
  if (answered >= minQuestions) return { label: "High", answered, expected: minQuestions };
  if (answered >= Math.ceil(minQuestions * 0.6)) return { label: "Moderate", answered, expected: minQuestions };
  return { label: "Low", answered, expected: minQuestions };
}

function buildTimingReport(session) {
  const log = session.timingLog || [];
  const totalSeconds = session.interviewStartedAt
    ? Math.max(0, Math.round((Date.now() - session.interviewStartedAt) / 1000))
    : 0;
  const average = log.length ? Math.round(log.reduce((s, e) => s + e.seconds, 0) / log.length) : 0;
  return {
    totalSeconds,
    averageAnswerSeconds: average,
    perQuestion: log.map((e) => ({ questionNumber: e.questionNumber, seconds: e.seconds })),
  };
}

function buildIntegrityReport(session) {
  const i = session.integrity || {};
  const flags = [];

  if (i.faceMissingEvents > 0) {
    flags.push(
      `Candidate not visible on camera ${i.faceMissingEvents} time${i.faceMissingEvents === 1 ? "" : "s"} (${i.faceMissingSeconds}s total)`
    );
  }
  if (i.multipleFaceEvents > 0) flags.push(`More than one person detected ${i.multipleFaceEvents} time(s)`);
  if (i.tabSwitches > 0) flags.push(`Left the interview tab ${i.tabSwitches} time(s)`);
  if (i.pasteAttempts > 0) flags.push(`Copy/paste attempted ${i.pasteAttempts} time(s)`);
  if (i.deviceInterruptions > 0) flags.push(`Camera or microphone interrupted ${i.deviceInterruptions} time(s)`);
  if (i.monitoringAvailable === false) flags.push("Camera monitoring was unavailable on this device");

  const serious = i.multipleFaceEvents > 0 || i.faceMissingSeconds >= 60 || i.tabSwitches >= 5 || i.pasteAttempts >= 5;
  const status = flags.length === 0 ? "clear" : serious ? "review" : "minor";

  return { status, flags, ...i };
}

function buildTopicReport(topicPerformance) {
  const report = {};
  for (const [topic, perf] of Object.entries(topicPerformance || {})) {
    report[topic] = { score: perf.score, level: perf.level, questions: perf.questionsAsked };
  }
  return report;
}

function buildQuestionReport(questionLog) {
  return (questionLog || []).map((q) => ({
    questionNumber: q.questionNumber,
    topic: q.topic,
    question: q.question,
    score: q.score,
    depth: q.depth,
    note: q.note,
    answerType: q.answerType,
    seconds: q.seconds,
    dims: q.dims,
  }));
}

const isStringArray = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim());
const trimList = (list, max = 5) => list.map((s) => s.trim()).slice(0, max);

/** Narrative built from tracked performance (used if the AI report fails). */
function buildFallbackNarrative(session, endedEarly) {
  const topics = Object.entries(session.topicPerformance || {});
  const strong = topics.filter(([, p]) => p.level === "strong");
  const moderate = topics.filter(([, p]) => p.level === "moderate");
  const weak = topics.filter(([, p]) => p.level === "weak");
  const answered = session.answeredCount || 0;

  const strengths = strong.map(([n, p]) => `Strong command of ${n} (${p.score}/10).`);
  const gaps = [
    ...weak.map(([n, p]) => `Limited understanding of ${n} (${p.score}/10).`),
    ...moderate.map(([n, p]) => `${n} was partly correct (${p.score}/10); depth can improve.`),
  ];
  const next = [
    ...weak.map(([n]) => `Re-study ${n} and build a small hands-on example.`),
    ...moderate.map(([n]) => `Practise explaining ${n} with a concrete example.`),
  ];

  return {
    summary: `${endedEarly ? "The interview was ended early. " : ""}The candidate answered ${answered} question${
      answered === 1 ? "" : "s"
    } across ${topics.length} curriculum topic${topics.length === 1 ? "" : "s"}. This summary is derived directly from the scored answers.`,
    strengths: strengths.length ? strengths : ["Stayed engaged and attempted each question."],
    gaps: gaps.length ? gaps : ["No significant gaps were recorded."],
    next: next.length ? next : ["Keep practising with scenario-based questions to build depth."],
    closing: "Thank you for your time. Your assessment is ready.",
  };
}

/**
 * Builds the final report object returned to the frontend.
 * @param {object|null} aiReport  { summary, strengths, gaps, next, closing }
 */
function buildReport(aiReport, session, { endedEarly = false, minQuestions = 10 } = {}) {
  const fallback = buildFallbackNarrative(session, endedEarly);
  const ai = aiReport && typeof aiReport === "object" ? aiReport : {};

  const questionLog = session.questionLog || [];
  const overallScore = computeOverallScore(questionLog);
  const member = (session.candidate && session.candidate.member) || {};

  return {
    summary: typeof ai.summary === "string" && ai.summary.trim() ? ai.summary.trim() : fallback.summary,
    strengths: isStringArray(ai.strengths) ? trimList(ai.strengths) : fallback.strengths,
    gaps: isStringArray(ai.gaps) ? trimList(ai.gaps) : fallback.gaps,
    next: isStringArray(ai.next) ? trimList(ai.next) : fallback.next,
    communication:
      typeof ai.communication === "string" && ai.communication.trim() ? ai.communication.trim() : null,

    overallScore,
    overallLevel: levelFromOverallScore(overallScore),
    verdict: verdictFromScore(overallScore),
    confidence: confidenceFor(session.answeredCount || 0, minQuestions),
    dimensions: computeDimensions(questionLog),

    topicPerformance: buildTopicReport(session.topicPerformance),
    questionPerformance: buildQuestionReport(questionLog),
    completion: {
      questionsAnswered: session.answeredCount || 0,
      questionsTotal: Math.max(session.totalPlanned || minQuestions, session.answeredCount || 0),
      minQuestions,
      completedNormally: !endedEarly,
    },
    timing: buildTimingReport(session),
    integrity: buildIntegrityReport(session),
    candidate: {
      name: member.name || "Candidate",
      role: member.jobRole || "",
      yearsExperience: member.yearsExperience ?? null,
      education: member.education || "",
    },
    generatedAt: new Date().toISOString(),
    closing:
      typeof ai.closing === "string" && ai.closing.trim() ? ai.closing.trim() : fallback.closing,
  };
}

module.exports = {
  evaluateAnswer,
  buildReport,
  buildFallbackNarrative,
  computeOverallScore,
  levelFromOverallScore,
  levelFromScore,
  DIMENSION_LABELS,
};
