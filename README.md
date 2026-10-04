# Novix AI — Adaptive Technical Interviews

An AI interviewer that asks at least 10 questions, adapts each follow-up to how well you answered, watches for presence through your camera (on-device), and finishes with a scored report card. Liquid-glass UI in dark violet and black.

**Stack:** React 19 + Vite + Tailwind (Frontend) · Node + Express (Backend) · NVIDIA NIM API (LLM) · face-api TinyFaceDetector (in-browser presence detection)

---

## 1. Run locally

```bash
npm install                 # backend dependencies
npm run install:frontend    # frontend dependencies
cp Backend/.env.example Backend/.env
# open Backend/.env and paste your key:  NVIDIA_API_KEY=nvapi-...
npm run dev                 # backend :3000 + frontend :5173
```

Open http://localhost:5173. Camera access works on `localhost` without HTTPS.
Check the AI connection any time at http://localhost:3000/api/health

Get a free NVIDIA key at https://build.nvidia.com (any chat model → "Get API Key").

## 2. What was fixed for the NVIDIA API

The first version sent OpenAI's `response_format: json_schema (strict)`, which NVIDIA-hosted models reject or ignore. Now:

- Plain OpenAI-compatible chat call to `https://integrate.api.nvidia.com/v1` (works on every NIM model)
- A tolerant JSON parser handles `<think>` blocks, code fences, trailing commas, truncated output
- Automatic retry with backoff on 429 / 5xx / timeouts, plus one stricter re-ask if the model leaves JSON format
- Clear error messages for bad key, wrong model, rate limit
- Switch models only by editing `AI_MODEL` in `.env` (e.g. `nvidia/llama-3.3-nemotron-super-49b-v1.5`)

OpenAI, Groq, Ollama (`AI_PROVIDER=openai-compatible`) and Anthropic (`AI_PROVIDER=anthropic`) still work.

## 3. How an interview works

1. **Profile** — name, role, experience, education chosen from dropdowns.
2. **Experience** — domain, industry, system scale, AI exposure, skill self-ratings, tools, difficulty, question style, optional note. This is the *pre-interview briefing* the AI uses to phrase questions.
3. **Curriculum** — rate the 31 curriculum topics (Confident / Needs revision / Not covered).
4. **Ready** — candidate card, interview blueprint, terms & conditions (must be accepted).
5. **Device check** — camera **and** microphone are mandatory; Begin is locked until both work and you are in frame.
6. **Interview** — chat with the AI. If the camera or mic drops, the interview pauses behind a blocking screen.
7. **Report card** — score, skill dimensions, per-topic and per-question breakdown, strengths, gaps, study plan, timing, integrity notes. Printable to PDF.

### Adaptive logic (backend-controlled)
Strong answer (≥7.5) → deeper question on the same topic · moderate → probe the gap · weak → simplify, then switch topic. No topic is asked more than 3 times in a row, so 10 questions always cover several areas. Minimum 10 questions; up to 2 extra if recent scores are inconsistent (max 12). The candidate can end at any time; the report is then marked low-confidence.

### How the score is calculated (not random)
For every answer the AI grades four things from 0–10: accuracy (40%), understanding (25%), application (20%), clarity (15%). The backend blends them, caps non-answers ("I don't know" ≤ 1.5, off-topic ≤ 2.5), weights harder questions slightly more, and converts the result to 0–100. The AI writes the narrative; it never invents the number.

### Presence monitoring
Face detection runs **in the browser** with a ~190 KB model bundled in `Frontend/public/models` (no third-party download, no video upload). It shows "Candidate not found in front of the camera" after ~3 s without a face and flags extra people. Tab switches, paste attempts and device interruptions are counted and shown in the report. If the model cannot run on a device, monitoring is skipped (never blocks the interview) and the report says so.

## 4. Deploy (single service — recommended)

The backend serves the built frontend, so one service is enough and no CORS setup is needed.

**Render** (a `render.yaml` is included): New → Blueprint → select the repo → set `NVIDIA_API_KEY`.
Or manually: Build command `npm install && npm run build`, Start command `npm start`, add env vars from `Backend/.env.example`.

**Important**
- Camera and microphone only work over **HTTPS** (Render/Railway/Fly provide it automatically).
- Interview sessions live in server memory. Run **one instance** (do not scale horizontally) and note that a restart ends active interviews; the UI tells the candidate clearly.
- If you host the frontend elsewhere (e.g. Vercel), set `VITE_API_BASE_URL=https://your-backend` when building and `CORS_ORIGIN=https://your-frontend` on the backend.
- Never commit `Backend/.env`.

## 5. Tests

```bash
npm run test:backend   # 28 checks against a mock NVIDIA server (no API key needed)
```
Covers messy model output, 429/500 retries, adaptive flow, 10-question minimum, extension, early end, idempotent start, injection attempts, validation, outage recovery.

## 6. Project layout

```
Backend/
  server.js                      Express app, serves Frontend/dist in production
  routes/interview.js            start / answer / end endpoints
  services/aiClient.js           provider selection (NVIDIA default)
  services/providers/            openaiCompatible.js (NVIDIA), anthropic.js
  services/parseModelJson.js     tolerant JSON extraction
  services/adaptiveState.js      topic + depth control
  services/reportBuilder.js      scoring + report card data
  prompts/interviewerPrompt.js   interviewer + report prompts
Frontend/src/
  pages/        Landing, CandidateSetup, DeviceCheck, Interview, Results
  components/   glass UI kit (ui/), setup steps (setup/), chat, camera, mic
  hooks/        useMediaDevices, useMicLevel, useFaceMonitor
  data/         options (dropdowns), terms, sample profile, curriculum
Data/curriculum.json             31-day curriculum used for questions
```
