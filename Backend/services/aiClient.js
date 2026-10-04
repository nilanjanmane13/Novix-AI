/**
 * aiClient.js
 *
 * Single entry point the interview logic uses to talk to "the AI model".
 * The provider is chosen with environment variables only (Backend/.env):
 *
 *   AI_PROVIDER=nvidia             NVIDIA NIM (build.nvidia.com)   <- default
 *   AI_PROVIDER=openai-compatible  OpenAI, Groq, Together, Ollama, ...
 *   AI_PROVIDER=anthropic          Anthropic Claude
 *
 * If AI_PROVIDER is not set, it is inferred from whichever API key exists.
 */

const anthropicProvider = require("./providers/anthropic");
const openaiCompatibleProvider = require("./providers/openaiCompatible");

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_DEFAULT_MODEL = "meta/llama-3.3-70b-instruct";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/** Resolves provider name + config from environment variables. */
function resolveProvider() {
  let name = clean(process.env.AI_PROVIDER).toLowerCase();

  if (!name) {
    if (clean(process.env.NVIDIA_API_KEY)) name = "nvidia";
    else if (clean(process.env.AI_API_KEY)) name = "openai-compatible";
    else if (clean(process.env.ANTHROPIC_API_KEY)) name = "anthropic";
  }

  if (!name) {
    throw new Error(
      "No AI provider configured. Copy Backend/.env.example to Backend/.env and set NVIDIA_API_KEY."
    );
  }

  if (name === "nvidia") {
    return {
      name,
      impl: openaiCompatibleProvider,
      config: {
        label: "NVIDIA API",
        apiKey: clean(process.env.NVIDIA_API_KEY) || clean(process.env.AI_API_KEY),
        baseUrl: clean(process.env.AI_BASE_URL) || NVIDIA_BASE_URL,
        model: clean(process.env.AI_MODEL) || NVIDIA_DEFAULT_MODEL,
      },
    };
  }

  if (name === "openai-compatible" || name === "openai") {
    return {
      name: "openai-compatible",
      impl: openaiCompatibleProvider,
      config: {
        label: "AI provider",
        apiKey: clean(process.env.AI_API_KEY) || clean(process.env.NVIDIA_API_KEY),
        baseUrl: clean(process.env.AI_BASE_URL) || "https://api.openai.com/v1",
        model: clean(process.env.AI_MODEL),
      },
    };
  }

  if (name === "anthropic") {
    return {
      name,
      impl: anthropicProvider,
      config: {
        label: "Anthropic API",
        apiKey: clean(process.env.ANTHROPIC_API_KEY),
        model: clean(process.env.AI_MODEL) || "claude-sonnet-4-6",
      },
    };
  }

  throw new Error(
    `Unknown AI_PROVIDER "${name}". Supported values: nvidia, openai-compatible, anthropic.`
  );
}

/** Non-secret summary used by the health endpoint and startup log. */
function getProviderInfo() {
  try {
    const { name, config } = resolveProvider();
    return { provider: name, model: config.model || null, configured: Boolean(config.apiKey) };
  } catch (err) {
    return { provider: null, model: null, configured: false, problem: err.message };
  }
}

/**
 * Sends a system prompt + conversation history to the active provider
 * and returns the raw text response.
 */
async function chatComplete(system, messages, options = {}) {
  const { impl, config } = resolveProvider();
  return impl.chatComplete({ system, messages, ...options, config });
}

module.exports = { chatComplete, getProviderInfo, resolveProvider };
