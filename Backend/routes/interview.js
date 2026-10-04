/**
 * routes/interview.js
 *
 *   POST /api/interview        start (candidate) or continue (message)
 *   POST /api/interview/end    candidate ends the interview early
 *
 * One AI call per candidate answer: it grades the answer AND writes the next
 * question. The backend then applies the evaluation (adaptive state), decides
 * whether the interview continues, and — only at the end — makes one extra AI
 * call to write the report narrative. All numbers in the report are computed
 * by the backend (services/reportBuilder.js).
 *
 * Interview length: at least MIN_QUESTIONS (10). If the last answers were
 * inconsistent the backend asks up to MAX_QUESTIONS (12) to settle the
 * assessment. The candidate may end at any moment.
 */

const express = require("express");
const router = express.Router();

const sessionStore = require("../services/sessionStore");
const aiClient = require("../services/aiClient");
const { parseModelJson } = require("../services/parseModelJson");
const { buildReport, evaluateAnswer } = require("../services/reportBuilder");
const { applyEvaluation } = require("../services/adaptiveState");
const { buildInterviewPlan, buildCandidateSummary, getDayInfo } = require("../services/curriculumContext");

const {
  buildSystemPrompt,
  buildReportPrompt,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  MIN_DISTINCT_DAYS,
} = require("../prompts/interviewerPrompt");

const MAX_ANSWER_CHARS = 4000;

/* ----------------------------- helpers ----------------------------- */

const badRequest = (res, message, status = 400) => res.status(status).json({ error: message });

/** Removes wrapping quotes / role prefixes and literal "\n" sequences. */
function cleanReplyText(text) {
  if (typeof text !== "string") return "";
  let out = text.trim();
  out = out.replace(/^(interviewer|novix|assistant)\s*:\s*/i, "");
  if (!out.includes("\n") && out.includes("\\n")) out = out.replace(/\\n/g, "\n");
  out = out.replace(/\\u0027/gi, "'").replace(/\\u0022/gi, '"').replace(/\\"/g, '"');
  if (/^".*"$/s.test(out)) out = out.slice(1, -1);
  return out.trim();
}

function topicContextFor(session) {
  const item = (session.plan || []).find((p) => p.title === session.currentTopic);
  if (!item) return { day: null, title: session.currentTopic, module: null, objectives: [] };
  const info = getDayInfo(item.day);
  return {
    day: item.day,
    title: item.title,
    module: item.module || null,
    objectives: info?.objectives || item.objectives || [],
  };
}

function buildSessionSystemPrompt(session, extra = "") {
  return (
    buildSystemPrompt({
      candidateSummary: session.candidateSummary,
      plan: session.plan,
      progress: {
        questionCount: session.questionCount,
        answeredCount: session.answeredCount,
        planned: session.totalPlanned,
      },
      topicPerformance: session.topicPerformance,
      avoidTopics: session.avoidTopics,
      topicContext: topicContextFor(session),
      currentDepth: session.currentDepth,
    }) + extra
  );
}

/**
 * Calls the model and validates the JSON. Retries once with a stricter
 * reminder, because open models occasionally slip out of JSON.
 */
async function callInterviewer(systemPrompt, history, { requireAnalysis }) {
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const reminder =
      attempt === 1
        ? ""
        : "\n\nREMINDER: your previous reply was not valid. Respond with ONE JSON object only, exactly in the required format, with a real question in \"reply\".";

    try {
      const raw = await aiClient.chatComplete(systemPrompt + reminder, history, {
        maxTokens: 700,
        temperature: attempt === 1 ? 0.5 : 0.2,
      });

      const parsed = parseModelJson(raw);
      parsed.reply = cleanReplyText(parsed.reply);

      if (!parsed.reply || /<[^>]{2,40}>/.test(parsed.reply)) {
        throw new Error("The AI returned an empty or placeholder reply.");
      }
      if (requireAnalysis && (!parsed.analysis || typeof parsed.analysis !== "object")) {
        throw new Error("The AI response did not include an evaluation of the answer.");
      }
      return parsed;
    } catch (err) {
      lastError = err;
      // Provider/network errors already retried in the provider layer.
      if (err && (err.status || /took longer|API key|rate limit|HTTP/i.test(err.message))) throw err;
    }
  }
  throw lastError || new Error("The AI did not return a usable response.");
}

const lastAssistantMessage = (session) =>
  [...session.history].reverse().find((m) => m.role === "assistant")?.content || "";

const numbers = (session) => ({
  questionNumber: session.questionCount,
  totalQuestions: session.totalPlanned,
  minQuestions: MIN_QUESTIONS,
  maxQuestions: MAX_QUESTIONS,
});

/**
 * Past the minimum, add one more question when the last three scores are
 * inconsistent (range >= 3 points), up to MAX_QUESTIONS.
 */
function shouldExtend(session) {
  if (session.answeredCount < MIN_QUESTIONS || session.answeredCount >= MAX_QUESTIONS) return false;
  const last = session.questionLog.slice(-3).map((q) => q.score);
  if (last.length < 3) return false;
  return Math.max(...last) - Math.min(...last) >= 3;
}

function transcriptText(session) {
  const lines = [];
  for (const m of session.history.slice(1)) {
    const who = m.role === "assistant" ? "Interviewer" : "Candidate";
    lines.push(`${who}: ${String(m.content).slice(0, 1200)}`);
  }
  return lines.join("\n\n");
}

/** Writes the report (AI narrative + backend numbers) and closes the session. */
async function finalizeInterview(session, { endedEarly }) {
  let aiReport = null;

  if (session.answeredCount > 0) {
    const table = session.questionLog
      .map(
        (q) =>
          `Q${q.questionNumber} | ${q.topic} | level ${q.depth || "n/a"} | score ${q.score}/10 | ${q.note || "no note"}`
      )
      .join("\n");

    try {
      const raw = await aiClient.chatComplete(
        buildReportPrompt({
          candidateSummary: session.candidateSummary,
          endedEarly,
          answered: session.answeredCount,
          planned: MIN_QUESTIONS,
          evaluationTable: table,
        }),
        [{ role: "user", content: transcriptText(session) }],
        { maxTokens: 900, temperature: 0.3 }
      );
      aiReport = parseModelJson(raw);
    } catch (err) {
      console.error(`[interview] Report narrative failed for ${session.sessionId}; using computed fallback:`, err.message);
    }
  }

  const report = buildReport(aiReport, session, { endedEarly, minQuestions: MIN_QUESTIONS });

  if (session.answeredCount === 0) {
    report.summary =
      "The interview was ended before any question was answered, so there is nothing to assess yet.";
    report.closing = "You can start a new interview whenever you are ready.";
  }

  session.status = "completed";
  session.completedNormally = !endedEarly;
  session.finalFeedback = report;
  return report;
}

/* ------------------------------ routes ------------------------------ */

router.post("/", async (req, res) => {
  const { sessionId, candidate, message, integrity } = req.body || {};

  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return badRequest(res, "sessionId (string) is required.");
  }

  const hasCandidate = candidate !== undefined && candidate !== null;
  const hasMessage = message !== undefined && message !== null;

  if (hasCandidate && hasMessage) {
    return badRequest(res, "Request must include either 'candidate' (to start) or 'message' (to continue), not both.");
  }
  if (!hasCandidate && !hasMessage) {
    return badRequest(res, "Request must include either 'candidate' (to start) or 'message' (to continue).");
  }

  try {
    return hasCandidate
      ? await handleStart(res, sessionId, candidate)
      : await handleTurn(res, sessionId, message, integrity);
  } catch (err) {
    console.error(`[interview] Error for session ${sessionId}:`, err.message);
    const status = err && err.status === 429 ? 429 : 502;
    return res.status(status).json({
      error: `The AI provider failed to produce a valid response. ${err && err.message ? err.message : ""}`.trim(),
    });
  }
});

async function handleStart(res, sessionId, candidate) {
  if (typeof candidate !== "object" || Array.isArray(candidate)) {
    return badRequest(res, "'candidate' must be an object.");
  }

  // Idempotent start: a retry or page refresh gets the current question back.
  const existing = sessionStore.getSession(sessionId);
  if (existing && existing.history.length > 0) {
    if (existing.status === "completed") {
      return res.json({ reply: existing.finalFeedback?.closing || "Interview completed.", done: true, feedback: existing.finalFeedback });
    }
    return res.json({ reply: lastAssistantMessage(existing), done: false, ...numbers(existing) });
  }

  const { plan } = buildInterviewPlan(candidate, { minDays: MIN_DISTINCT_DAYS, maxDays: 12 });
  if (!plan.length) {
    return badRequest(res, "Select at least one curriculum topic so the interview has something to cover.");
  }

  const session = existing || sessionStore.createSession(sessionId, candidate, MIN_QUESTIONS);
  if (session.busy) return badRequest(res, "The interview is already starting. Please wait a moment.", 409);
  session.busy = true;

  try {
    session.candidate = candidate;
    session.candidateSummary = buildCandidateSummary(candidate);
    session.plan = plan;
    session.currentTopic = plan[0].title;
    session.currentDepth = 1;

    const kickoff = [
      {
        role: "user",
        content: "Begin the interview now. Greet the candidate by first name in one short sentence and ask the first question.",
      },
    ];

    const parsed = await callInterviewer(buildSessionSystemPrompt(session), kickoff, { requireAnalysis: false });

    session.history.push(kickoff[0], { role: "assistant", content: parsed.reply });
    session.questionCount = 1;

    const now = Date.now();
    session.interviewStartedAt = now;
    session.questionStartedAt = now;

    const ctx = topicContextFor(session);
    if (typeof ctx.day === "number") session.daysCovered.add(ctx.day);

    return res.json({ reply: parsed.reply, done: false, ...numbers(session) });
  } catch (err) {
    // Starting failed: drop the half-created session so a retry starts clean.
    sessionStore.deleteSession(sessionId);
    throw err;
  } finally {
    session.busy = false;
  }
}

async function handleTurn(res, sessionId, message, integrity) {
  if (typeof message !== "string" || !message.trim()) {
    return badRequest(res, "'message' must be a non-empty string.");
  }

  const session = sessionStore.getSession(sessionId);
  if (!session) {
    return badRequest(
      res,
      "This interview session has expired (the server may have restarted). Please start a new interview."
    );
  }
  if (session.status === "completed") {
    return badRequest(res, "This interview session has already been completed.");
  }
  if (session.busy) {
    return badRequest(res, "Your previous answer is still being processed. Please wait.", 409);
  }

  session.busy = true;

  try {
    const answerText = message.trim().slice(0, MAX_ANSWER_CHARS);
    const userMessage = { role: "user", content: answerText };

    sessionStore.mergeIntegrity(session, integrity);

    const answeringQuestionNumber = session.questionCount;
    const questionText = lastAssistantMessage(session);
    const answerSeconds = session.questionStartedAt
      ? Math.max(0, Math.round((Date.now() - session.questionStartedAt) / 1000))
      : 0;

    // The history is only committed AFTER the AI call succeeds, so a failed
    // call followed by a retry never leaves duplicate messages behind.
    const parsed = await callInterviewer(
      buildSessionSystemPrompt(session),
      [...session.history, userMessage],
      { requireAnalysis: true }
    );

    /* ---- commit: evaluate the answer ---- */
    const evaluation = evaluateAnswer(parsed.analysis, answerText);
    const topicAnswered = session.currentTopic;
    applyEvaluation(session, {
      score: evaluation.score,
      depthLabel: evaluation.depthLabel,
    });

    session.history.push(userMessage);
    session.answeredCount += 1;
    session.timingLog.push({ questionNumber: answeringQuestionNumber, seconds: answerSeconds });
    session.questionLog.push({
      questionNumber: answeringQuestionNumber,
      topic: topicAnswered,
      question: questionText,
      score: evaluation.score,
      dims: evaluation.dims,
      depth: evaluation.depthLabel || "conceptual",
      note: evaluation.note,
      answerType: evaluation.answerType,
      seconds: answerSeconds,
    });

    /* ---- decide: continue or finish ---- */
    const reachedMinimum = session.answeredCount >= MIN_QUESTIONS;
    const extend = reachedMinimum && shouldExtend(session);
    const finish = reachedMinimum && !extend;

    if (finish) {
      const feedback = await finalizeInterview(session, { endedEarly: false });
      return res.json({ reply: feedback.closing, done: true, feedback });
    }

    if (extend) session.totalPlanned = session.answeredCount + 1;
    else session.totalPlanned = Math.max(session.totalPlanned, MIN_QUESTIONS);

    session.history.push({ role: "assistant", content: parsed.reply });
    session.questionCount += 1;
    session.questionStartedAt = Date.now();

    const ctx = topicContextFor(session);
    if (typeof ctx.day === "number") session.daysCovered.add(ctx.day);

    return res.json({ reply: parsed.reply, done: false, ...numbers(session) });
  } finally {
    session.busy = false;
  }
}

/** POST /api/interview/end — candidate ends the interview early. */
router.post("/end", async (req, res) => {
  const { sessionId, integrity } = req.body || {};

  if (!sessionId || typeof sessionId !== "string") return badRequest(res, "sessionId (string) is required.");

  const session = sessionStore.getSession(sessionId);
  if (!session) {
    return badRequest(res, "This interview session has expired. Please start a new interview.");
  }

  if (session.status === "completed" && session.finalFeedback) {
    return res.json({ reply: session.finalFeedback.closing, done: true, feedback: session.finalFeedback });
  }
  if (session.busy) return badRequest(res, "Please wait for the current question to finish processing.", 409);

  session.busy = true;
  try {
    sessionStore.mergeIntegrity(session, integrity);
    const feedback = await finalizeInterview(session, { endedEarly: true });
    return res.json({ reply: feedback.closing, done: true, feedback });
  } catch (err) {
    console.error(`[interview/end] ${sessionId}:`, err.message);
    return res.status(502).json({ error: `Could not generate the report. ${err.message}` });
  } finally {
    session.busy = false;
  }
});

module.exports = router;
