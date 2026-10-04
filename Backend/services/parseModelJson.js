/**
 * parseModelJson.js
 *
 * LLMs (especially open models served through NVIDIA NIM) do not always
 * return clean JSON: they may add <think> blocks, markdown fences, a
 * sentence before/after the object, trailing commas or raw newlines inside
 * strings. This parser tolerates all of that and extracts the first
 * complete JSON object.
 */

function stripNoise(text) {
  return text
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "")
    .replace(/<\/?think(?:ing)?>/gi, "")
    .replace(/^\uFEFF/, "")
    .trim();
}

/** Returns the first balanced {...} span, respecting quoted strings. */
function extractFirstObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // Unterminated object (truncated output) — return what we have so the
  // repair step can try to close it.
  return text.slice(start);
}

/** Light-touch repairs for common LLM JSON mistakes. */
function repairJson(text) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "";
      else if (ch === "\t") out += "\\t";
      else out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }

  out = out
    .replace(/[\u201C\u201D]/g, '"') // smart quotes used as JSON quotes
    .replace(/,\s*([}\]])/g, "$1"); // trailing commas

  // Close a truncated string / object / array as a last resort.
  if (inString) out += '"';
  const opens = (out.match(/{/g) || []).length - (out.match(/}/g) || []).length;
  const openArrays = (out.match(/\[/g) || []).length - (out.match(/]/g) || []).length;
  out += "]".repeat(Math.max(0, openArrays)) + "}".repeat(Math.max(0, opens));

  return out;
}

function parseModelJson(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("Model output was empty.");
  }

  let text = stripNoise(rawText);

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const candidate = extractFirstObject(text);
  if (!candidate) throw new Error("No JSON object found in model output.");

  try {
    return JSON.parse(candidate);
  } catch {
    return JSON.parse(repairJson(candidate));
  }
}

module.exports = { parseModelJson, stripNoise };
