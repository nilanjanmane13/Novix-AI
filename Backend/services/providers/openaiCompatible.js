/**
 * providers/openaiCompatible.js
 *
 * Adapter for any provider that speaks the OpenAI Chat Completions schema:
 * NVIDIA NIM (build.nvidia.com), OpenAI, Groq, Together, local Ollama, ...
 *
 * WHY THIS FILE CHANGED (NVIDIA fix)
 * ----------------------------------
 * The first version sent OpenAI's `response_format: { type: "json_schema",
 * strict: true }`. That feature is OpenAI-specific. NVIDIA-hosted models
 * either reject it (HTTP 400/422) or silently ignore it, which is what broke
 * the interview. We now:
 *   - send a plain chat completion (works on every NIM model),
 *   - rely on the prompt + services/parseModelJson.js to get JSON back,
 *   - optionally enable JSON mode with AI_JSON_MODE=json_object for models
 *     that support it,
 *   - retry transient failures (429 / 5xx / timeouts) with backoff,
 *   - strip <think> blocks and read `reasoning_content` for reasoning models.
 *
 * Interface: chatComplete({ system, messages, maxTokens, temperature, config })
 *   config = { apiKey, baseUrl, model, label }  (resolved by aiClient.js)
 */

const DEFAULT_TIMEOUT_MS = 60000;
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function describeHttpError(status, bodyText, label) {
  const snippet = (bodyText || "").slice(0, 300);
  if (status === 401 || status === 403) {
    return `${label} rejected the API key (HTTP ${status}). Check the key in Backend/.env.`;
  }
  if (status === 404) {
    return `${label} could not find the requested model (HTTP 404). Check AI_MODEL in Backend/.env. ${snippet}`;
  }
  if (status === 429) {
    return `${label} rate limit reached (HTTP 429). Please wait a moment and try again.`;
  }
  if (status === 400 || status === 422) {
    return `${label} rejected the request (HTTP ${status}): ${snippet}`;
  }
  return `${label} error (HTTP ${status}): ${snippet || "no details"}`;
}

function extractText(message) {
  if (!message) return "";
  const { content } = message;

  if (typeof content === "string" && content.trim()) return content;

  // Some providers return an array of content parts.
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("")
      .trim();
    if (joined) return joined;
  }

  // Reasoning models occasionally leave `content` empty and put everything
  // in `reasoning_content`. parseModelJson can still dig the JSON out of it.
  if (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) {
    return message.reasoning_content;
  }

  return "";
}

async function singleRequest({ url, apiKey, body, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function chatComplete({
  system,
  messages,
  maxTokens = 1024,
  temperature = 0.4,
  config = {},
}) {
  const { apiKey, baseUrl, model, label = "AI provider" } = config;

  if (!apiKey) {
    throw new Error(`Missing API key for ${label}. Set it in Backend/.env.`);
  }
  if (!model) {
    throw new Error(`Missing model name for ${label}. Set AI_MODEL in Backend/.env.`);
  }

  const url = `${String(baseUrl).replace(/\/+$/, "")}/chat/completions`;
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const body = {
    model,
    messages: [{ role: "system", content: system }, ...messages],
    max_tokens: maxTokens,
    temperature,
    top_p: 0.9,
    stream: false,
  };

  // Opt-in only: not every NVIDIA model supports JSON mode.
  if ((process.env.AI_JSON_MODE || "").toLowerCase() === "json_object") {
    body.response_format = { type: "json_object" };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await singleRequest({ url, apiKey, body, timeoutMs });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const error = new Error(describeHttpError(response.status, text, label));
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("retry-after")) || 0;

        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === MAX_ATTEMPTS) throw error;

        lastError = error;
        await sleep(error.retryAfter ? error.retryAfter * 1000 : 800 * 2 ** (attempt - 1));
        continue;
      }

      const data = await response.json();
      const text = extractText(data?.choices?.[0]?.message);

      if (!text) {
        const error = new Error(`${label} returned an empty response.`);
        if (attempt === MAX_ATTEMPTS) throw error;
        lastError = error;
        await sleep(600 * attempt);
        continue;
      }

      return text;
    } catch (err) {
      // Non-retryable HTTP errors were already thrown with a status.
      if (err && err.status && err.status !== 429 && err.status < 500) throw err;

      const isAbort = err && err.name === "AbortError";
      const wrapped = isAbort
        ? new Error(`${label} took longer than ${Math.round(timeoutMs / 1000)}s to respond.`)
        : err;

      lastError = wrapped;
      if (attempt === MAX_ATTEMPTS) throw wrapped;
      await sleep(800 * 2 ** (attempt - 1));
    }
  }

  throw lastError || new Error(`${label} request failed.`);
}

module.exports = { chatComplete };
