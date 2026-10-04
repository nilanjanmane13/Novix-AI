/**
 * providers/anthropic.js
 *
 * Adapter for Anthropic's native Messages API.
 * Interface: chatComplete({ system, messages, maxTokens, temperature, config })
 *
 * Env: ANTHROPIC_API_KEY, AI_MODEL (defaults to claude-sonnet-4-6)
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function chatComplete({ system, messages, maxTokens = 1024, temperature = 0.4, config = {} }) {
  const { apiKey, model } = config;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Set it in Backend/.env to use AI_PROVIDER=anthropic.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Anthropic API error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Anthropic API returned no text content block.");
  return textBlock.text;
}

module.exports = { chatComplete };
