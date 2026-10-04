/**
 * adaptiveState.js
 *
 * Backend-controlled adaptive interview state.
 *
 * The AI evaluates the candidate's answer; the BACKEND decides what happens
 * next (topic, depth). This keeps the interview predictable and stops the
 * model from wandering off-curriculum.
 *
 *   strong   (>= 7.5)  -> DEEPEN   same topic, one level deeper
 *   moderate (5 - 7.4) -> PROBE    same topic, same depth, target the gap
 *   weak     (< 5)     -> SIMPLIFY first time, SWITCH_TOPIC if still weak
 *
 * Topic rotation: a topic is never asked more than MAX_PER_TOPIC times in a
 * row, so a 10+ question interview always covers several curriculum areas.
 */

const MIN_DEPTH = 1;
const MAX_DEPTH = 5;
const MAX_PER_TOPIC = 3;

const STRONG_AT = 7.5;
const WEAK_BELOW = 5;

const DEPTH_LABELS = ["basic", "conceptual", "application", "scenario", "advanced"];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round1 = (n) => Math.round(n * 10) / 10;

/** Keeps a 0-10 score, one decimal place. Missing/invalid -> null. */
function cleanScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? round1(clamp(n, 0, 10)) : null;
}

function levelFromScore(score) {
  if (score >= STRONG_AT) return "strong";
  if (score >= WEAK_BELOW) return "moderate";
  return "weak";
}

function depthIndexFromLabel(label) {
  const idx = DEPTH_LABELS.indexOf(String(label || "").toLowerCase());
  return idx === -1 ? null : idx + 1;
}

function determineAction(score, previous) {
  const level = levelFromScore(score);
  if (level === "strong") return "DEEPEN";
  if (level === "moderate") return "PROBE";
  if (previous && previous.questionsAsked >= 1) return "SWITCH_TOPIC";
  return "SIMPLIFY";
}

function updateTopicPerformance(session, topic, score, depthLabel) {
  const existing = session.topicPerformance[topic] || {
    scores: [],
    questionsAsked: 0,
  };

  const scores = [...(existing.scores || []), score];
  const average = round1(scores.reduce((a, b) => a + b, 0) / scores.length);
  const level = levelFromScore(average);

  const updated = {
    level,
    status: level,
    score: average,
    scores,
    questionsAsked: scores.length,
  };
  if (depthLabel) updated.depth = depthLabel;

  session.topicPerformance[topic] = updated;
  return updated;
}

/** Picks the next curriculum topic: fresh first, then not-avoided, then any. */
function pickNextTopic(session, excludeTopic) {
  const plan = session.plan || [];
  const avoid = new Set(session.avoidTopics || []);
  const seen = session.topicPerformance || {};

  const fresh = plan.find((p) => p.title !== excludeTopic && !avoid.has(p.title) && !seen[p.title]);
  if (fresh) return fresh.title;

  // Everything has been touched: prefer the least-asked, non-avoided topic.
  const candidates = plan
    .filter((p) => p.title !== excludeTopic)
    .sort((a, b) => {
      const qa = seen[a.title]?.questionsAsked || 0;
      const qb = seen[b.title]?.questionsAsked || 0;
      const avoidA = avoid.has(a.title) ? 1 : 0;
      const avoidB = avoid.has(b.title) ? 1 : 0;
      return avoidA - avoidB || qa - qb;
    });

  return candidates[0]?.title || excludeTopic || null;
}

/**
 * Applies the AI's evaluation to the session.
 * `score` must already be the final 0-10 score for this answer.
 */
function applyEvaluation(session, { score, depthLabel }) {
  const topic = session.currentTopic;
  if (!topic) return null;

  const previous = session.topicPerformance[topic] || null;
  const performance = updateTopicPerformance(session, topic, score, depthLabel);
  let action = determineAction(score, previous);

  const justAsked = performance.questionsAsked;
  const previousDepth = session.currentDepth;

  // Rotation: don't camp on a single topic.
  const mustRotate = justAsked >= MAX_PER_TOPIC && action !== "SWITCH_TOPIC";

  if (action === "SWITCH_TOPIC" || mustRotate) {
    if (action === "SWITCH_TOPIC" && !session.avoidTopics.includes(topic)) {
      session.avoidTopics.push(topic);
    }
    const next = pickNextTopic(session, topic);
    session.currentTopic = next;
    // Strong performers keep some momentum into the next topic.
    session.currentDepth =
      action === "SWITCH_TOPIC" ? MIN_DEPTH : clamp(previousDepth - 1, MIN_DEPTH, 3);
    action = action === "SWITCH_TOPIC" ? "SWITCH_TOPIC" : "NEXT_TOPIC";
  } else if (action === "DEEPEN") {
    session.currentDepth = clamp(previousDepth + 1, MIN_DEPTH, MAX_DEPTH);
  } else if (action === "SIMPLIFY") {
    session.currentDepth = clamp(previousDepth - 1, MIN_DEPTH, MAX_DEPTH);
  } // PROBE keeps the same depth.

  session.lastAction = action;

  return {
    topic,
    score,
    action,
    performance,
    nextTopic: session.currentTopic,
    nextDepth: session.currentDepth,
  };
}

module.exports = {
  DEPTH_LABELS,
  MAX_PER_TOPIC,
  cleanScore,
  levelFromScore,
  depthIndexFromLabel,
  determineAction,
  updateTopicPerformance,
  pickNextTopic,
  applyEvaluation,
};
