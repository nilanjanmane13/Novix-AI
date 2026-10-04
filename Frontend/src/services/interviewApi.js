/**
 * interviewApi.js — the only file that talks to the backend.
 *
 *   POST /api/interview       { sessionId, candidate }  -> first question
 *   POST /api/interview       { sessionId, message }    -> next question / report
 *   POST /api/interview/end   { sessionId }             -> report (ends early)
 *
 * In development Vite proxies /api to the Express server. If the frontend is
 * hosted separately from the backend, set VITE_API_BASE_URL at build time.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const ENDPOINT = `${BASE_URL}/api/interview`;
const END_ENDPOINT = `${BASE_URL}/api/interview/end`;
const REQUEST_TIMEOUT_MS = 90000;

export const MIN_QUESTIONS = 10;

export class InterviewApiError extends Error {
  constructor(message, { status, technicalDetail, expired } = {}) {
    super(message);
    this.name = "InterviewApiError";
    this.status = status;
    this.technicalDetail = technicalDetail;
    this.expired = Boolean(expired);
  }
}

function friendlyMessage(status, serverMessage) {
  if (status === 429) return "The AI interviewer is busy right now. Wait a few seconds and try again.";
  if (status === 409) return serverMessage || "Your previous answer is still being processed.";
  if (status === 400) return serverMessage || "That request was not accepted.";
  if (status === 502 || status === 503 || status === 504 || status >= 500) {
    return "The AI interviewer is temporarily unavailable. Your answer was not lost; try again.";
  }
  return serverMessage || "Something went wrong talking to the interviewer.";
}

async function call(payload, endpoint = ENDPOINT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err && err.name === "AbortError";
    throw new InterviewApiError(
      timedOut
        ? "The interviewer took too long to respond. Try again."
        : "Cannot reach the interview server. Check your internet connection and try again.",
      { technicalDetail: err && err.message }
    );
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* handled below */
  }

  if (!response.ok) {
    const serverMessage = data && typeof data.error === "string" ? data.error : null;
    const expired = response.status === 400 && /expired|No interview session/i.test(serverMessage || "");
    throw new InterviewApiError(expired ? serverMessage : friendlyMessage(response.status, serverMessage), {
      status: response.status,
      technicalDetail: serverMessage || raw.slice(0, 400) || `HTTP ${response.status}`,
      expired,
    });
  }

  if (!data || typeof data.reply !== "string" || typeof data.done !== "boolean") {
    throw new InterviewApiError("The interviewer sent an unexpected response. Please try again.", {
      status: response.status,
      technicalDetail: "Malformed response: missing 'reply' or 'done'.",
    });
  }
  return data;
}

export const startInterview = (sessionId, candidate) => call({ sessionId, candidate });
export const sendAnswer = (sessionId, message, integrity) => call({ sessionId, message, integrity });
export const endInterview = (sessionId, integrity) => call({ sessionId, integrity }, END_ENDPOINT);

export function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
