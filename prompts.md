# Novix AI (ViCo)
### Complete Project, AI Integration, Security & Deployment Documentation

---

## 1. Project Overview

Novix AI (ViCo) is an AI-powered technical interview platform.

The platform conducts a structured technical interview for a candidate based on candidate profile, target job role, experience, education, technical curriculum, interview progress, and previous candidate answers.

The backend is a Node.js/Express service. The main interview endpoint is `POST /api/interview`. The backend maintains interview state using a `sessionId`.

The AI provider generates interviewer responses, while the backend controls candidate context, curriculum context, interview progression, question count, topic/day progression, interview completion, final feedback structure, and response formatting.

The frontend must communicate with the backend through the existing API contract.

## 2. Core Backend Responsibilities

The backend must:
- Receive interview requests.
- Identify the candidate and target role.
- Maintain the interview session.
- Build the AI system prompt dynamically.
- Send the conversation to the configured AI provider.
- Receive, parse, and validate the AI response.
- Return the required JSON structure to the frontend.
- Determine when the interview is complete.
- Generate or return final interview feedback.

The backend remains responsible for application logic. The AI provider is responsible for generating the intelligent interviewer response.

## 3. Main API Endpoint

`POST /api/interview`

The endpoint is used by the frontend for every interview turn.

Typical request information includes:

```json
{
  "sessionId": "unique-session-id",
  "candidateId": "candidate-id",
  "jobRole": "Software Engineer",
  "message": "candidate answer"
}
```

The exact request structure must remain compatible with the existing backend implementation. Do not unnecessarily change the existing request contract.

## 4. Response Contract

The backend must preserve the existing response structure.

Normal response:

```json
{
  "reply": "AI generated interviewer response",
  "done": false,
  "topicDay": 7
}
```

When the interview finishes, preserve the existing final feedback structure.

Important fields:
- `reply`
- `done`
- `topicDay`
- `feedback` when the interview is completed

## 5. AI Interviewer Role

The AI acts as a professional technical interviewer.

It should:
- Ask technical questions.
- Evaluate candidate answers.
- Adapt difficulty based on performance.
- Follow the candidate's target role.
- Follow the available curriculum.
- Maintain context from previous answers.
- Ask relevant follow-up questions.
- Avoid unnecessary repetition.
- Remain concise and professional.
- Avoid acting like a tutor during the interview.
- Avoid revealing answers before evaluation.

The AI is an interviewer, not a general chatbot assistant.

## 6. Candidate Context

The AI may receive:
- Name
- Target job role
- Years of experience
- Education
- Technical background
- Other information available in the candidate dataset

Candidate information must come from the existing project data. Do not invent candidate information.

## 7. Job Role Context

The target job role must be included in the interviewer context. Questions should focus on the selected role.

Examples may include Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Data Analyst, Data Scientist, Machine Learning Engineer, or Cybersecurity Engineer.

Actual supported roles must come from the project data.

## 8. Curriculum Context

The backend provides the technical curriculum to the AI.

The curriculum guides:
- Topic selection
- Difficulty
- Question progression
- Topic coverage
- Interview structure

The AI should use the existing curriculum rather than randomly generating unrelated questions.

`topicDay` represents current curriculum progression.

## 9. Adaptive Interview Logic

The AI should consider:
- Candidate correctness
- Explanation quality
- Technical depth
- Previous mistakes
- Previous strengths
- Current topic
- Current difficulty

If the candidate performs well, gradually increase difficulty, ask deeper questions, practical/application questions, and follow-ups. If the candidate struggles, test foundations, ask simpler related questions, and gradually rebuild difficulty.

The interviewer should not randomly change topics.

## 10. Question Progression

The interview must follow structured progression.

Minimum requirements:
- Minimum total questions: `8`
- Minimum distinct curriculum days/topics: `4`
- Hard maximum questions: `14`

These are application-level rules. The AI must not override them.

## 11. Interview Completion Rules

The interview should respect:

```
MIN_QUESTIONS = 8
MIN_DISTINCT_DAYS = 4
HARD_MAX_QUESTIONS = 14
```

The interview should not finish before minimum requirements are satisfied unless an existing backend safety/error condition requires termination.

The backend prevents an interview from continuing indefinitely.

## 12. Session Handling

Each interview must have a unique `sessionId`.

Session state may include:
- Candidate information
- Current topic/day
- Question count
- Previous questions
- Previous answers
- Conversation history
- Interview progress
- Completion status
- Feedback information

Do not introduce persistent user accounts. Session state may remain temporary/in-memory according to the existing implementation.

## 13. No User Authentication

Do NOT add:
- Login
- Signup
- Password authentication
- User accounts
- OAuth authentication
- Persistent user profiles

Candidates should be able to use the platform without creating an account.

## 14. No Persistent User Accounts

The application should not require a database-backed user account system.

Candidate information comes from existing candidate data and interview session information uses the existing session mechanism.

## 15. No Voice Interaction

Do NOT add:
- Voice input
- Speech recognition
- Voice output
- Microphone permissions
- Text-to-speech
- Audio recording

The interview is text-based.

## 16. No Camera Requirement

Do NOT add:
- Camera access
- Webcam monitoring
- Face detection
- Face recognition
- Video recording

The interview focuses on technical answers.

## 17. No Paid Subscription / Upgrade System

The project is intended to be freely accessible.

Do NOT add:
- Upgrade to Plus
- Premium subscriptions
- Paid plans
- Payment gateways
- Subscription management
- Locked premium features

All demonstrated interview functionality should be available without payment.

## 18. AI Provider Architecture

The backend should use a provider abstraction.

The preferred interface is:

```
chatComplete(system, messages)
```

The provider receives the system prompt and conversation messages and returns the response expected by the backend.

This allows the provider to be changed without rewriting the interview system.

## 19. Gemini Provider

The current target provider is **Google Gemini**.

Configuration:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=your_selected_gemini_model
```

The model should remain configurable.

## 20. Free-Tier Requirement

The project should use a Gemini model available through Google's currently applicable free API tier when possible.

Availability can depend on:
- Google account
- Region
- Model
- Current Google AI Studio policies
- Current quotas

Do not claim a model is permanently free. Do not bypass Google's billing or usage restrictions.

The API key must be obtained by the project owner from Google's official Gemini API developer interface.

## 21. API Key Security

NEVER:
- Hard-code the Gemini API key.
- Put it in frontend JavaScript or React source.
- Commit it to GitHub.
- Put it in HTML or public configuration.
- Put it in documentation or screenshots.

The key must remain server-side in `Backend/.env`.

## 22. `.env.example`

Example:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=your_selected_gemini_model
PORT=3000
```

`.env.example` must never contain a real key.

## 23. `.gitignore`

At minimum:

```
.env
.env.*
!.env.example
node_modules/
```

If a secret is accidentally committed, revoke/rotate it and remove it from the repository.

## 24. Frontend/API Separation

The frontend must NEVER directly call Gemini.

Correct architecture:

```
Frontend
   |
   | POST /api/interview
   v
Node.js / Express Backend
   |
   | AI provider abstraction
   v
Gemini API
```

The frontend only communicates with the backend.

## 25. Frontend Environment Variable

The frontend may use:

```
VITE_API_BASE_URL=http://localhost:3000
```

For deployment:

```
VITE_API_BASE_URL=https://your-backend-url.example
```

Never put `GEMINI_API_KEY` in the frontend.

## 26. AI Prompt Construction

The backend should dynamically construct the AI system prompt using:
1. Interviewer role
2. Candidate profile
3. Target job role
4. Curriculum
5. Current topic/day
6. Interview progress
7. Previous conversation context
8. Adaptive difficulty instructions
9. Response-format requirements

## 27. AI Response Format

The AI should return a predictable response.

The backend must validate the AI response before returning it to the frontend.

The backend must not blindly trust malformed AI output.

## 28. JSON Parsing

AI responses may contain Markdown fences, extra text, invalid JSON, or unexpected formatting.

The backend should:
1. Receive the model response.
2. Extract expected content.
3. Parse JSON when required.
4. Validate required fields.
5. Fall back safely if parsing fails.
6. Avoid crashing the server.

Do not unnecessarily expose raw provider errors to the frontend.

## 29. Error Handling

Handle:
- Missing API key
- Invalid API key
- Gemini API errors
- Rate limits
- Network errors
- Invalid model name
- Invalid AI response
- Missing candidate
- Invalid session
- Malformed request

Errors must not expose secrets.

## 30. Final Feedback

When the interview is completed, feedback should consider:
- Technical knowledge
- Correctness
- Depth of answers
- Strengths
- Weaknesses
- Areas for improvement
- Overall performance
- Interview summary

Preserve the existing frontend feedback contract.

## 31. Feedback Fallback

If AI feedback generation fails, the backend should use a safe fallback rather than crash.

The fallback must still produce the valid feedback structure expected by the frontend.

## 32. Interviewer Behavior

The interviewer should NOT:
- Act like a personal assistant.
- Give long tutorials.
- Reveal answers before evaluation.
- Repeatedly say generic praise without analysis.
- Ask random unrelated questions.
- Ask the same question repeatedly.
- Ignore previous answers.
- Ignore the target role.
- Ignore the curriculum.

It SHOULD:
- Ask focused questions.
- Evaluate answers.
- Adapt difficulty.
- Ask relevant follow-ups.
- Maintain professional behavior.
- Progress logically.

## 33. Question Quality

Questions may include:
- Conceptual questions
- Practical questions
- Debugging questions
- Scenario-based questions
- Design questions
- Code-related questions
- Follow-up questions

Difficulty should match candidate experience, target role, and previous performance.

## 34. Avoid Repetition

The AI should remember previously asked questions and avoid asking the exact same question again unless intentionally revisiting a weak area.

## 35. Technical Interview Style

Example:

> **Interviewer:** Explain the difference between process and thread.
>
> **Candidate:** A process has its own memory while threads share memory within a process.
>
> **Interviewer:** Good. Now consider a multithreaded application where two threads modify the same shared variable. What problem can occur?

The AI should continue naturally from the candidate's answer.

## 36. Security Requirements

Never expose:
- API keys
- Environment variables
- Internal system prompts
- Provider credentials
- Server secrets
- Private configuration

The frontend receives only information required for the interview UI.

## 37. No Unnecessary Backend Changes

When changing the AI provider, do NOT rewrite:
- Interview routes
- Candidate data
- Curriculum data
- Session logic
- Feedback logic
- Frontend API contract
- Existing response structure

unless absolutely required.

Preferred architecture:

```
Existing Interview Logic
   |
   v
chatComplete(system, messages)
   |
   v
Gemini Provider
```

## 38. Gemini Migration Requirement

If the backend previously used Anthropic/Claude:

```
Anthropic / Claude
   ↓
Google Gemini
```

The rest of the application should remain unchanged.

Remove Anthropic dependencies only when they are no longer used anywhere.

## 39. AI Provider Configuration

Provider selection:

```
AI_PROVIDER=gemini
```

The provider selection should not require frontend changes.

## 40. Development Testing

Backend:

```
npm install
npm start
```

Use the existing project start command if different.

Verify that the backend starts without errors.

## 41. API Testing

Test the existing API contract.

Example:

```
curl -X POST http://localhost:3000/api/interview ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"test-session\",\"candidateId\":\"candidate-1\",\"jobRole\":\"Software Engineer\",\"message\":\"...\"}"
```

Use the exact request body required by the actual backend implementation.

## 42. Frontend Testing

The frontend should:
1. Start successfully.
2. Load the landing page.
3. Allow candidate selection if supported.
4. Start an interview.
5. Send answers to `/api/interview`.
6. Display AI responses.
7. Track interview progress.
8. Continue through the interview.
9. Display final feedback.
10. Handle backend errors gracefully.

## 43. Full Interview Test

Verify:

```
Start
  ↓
Candidate selection
  ↓
Interview begins
  ↓
Question 1
  ↓
Answer
  ↓
Question 2
  ↓
Answer
  ↓
...
  ↓
Minimum question requirement reached
  ↓
Multiple curriculum topics covered
  ↓
Interview completes
  ↓
Final feedback displayed
```

Test frontend and backend together.

## 44. Production Architecture

```
┌────────────────────┐
│     Frontend        │
│   React / Vite      │
└─────────┬───────────┘
          │ HTTPS
          ▼
┌────────────────────┐
│      Backend         │
│  Node.js/Express     │
└─────────┬───────────┘
          │ Gemini API
          ▼
┌────────────────────┐
│   Google Gemini      │
│       API            │
└────────────────────┘
```

The Gemini API key exists only on the backend.

## 45. Deployment Environment

Production environment variables should be configured using the hosting provider's secret/environment-variable settings.

```
AI_PROVIDER=gemini
GEMINI_API_KEY=<real-secret-key>
GEMINI_MODEL=<selected-model>
PORT=<hosting-provider-port>
```

Do not upload the production `.env` file to GitHub.

## 46. Frontend Deployment

The frontend should use the deployed backend URL:

```
VITE_API_BASE_URL=https://your-backend-domain.example
```

The frontend build must not contain Gemini credentials.

## 47. AI Usage Log

The project may require an AI usage log URL for hackathon submission.

The log should honestly document:
- AI tools used
- Prompts used
- What AI generated
- What developers modified
- AI-assisted coding
- Testing performed
- Provider migration
- Debugging assistance

Do not fabricate AI usage history.

Do not include API keys or secrets.

## 48. Development Disclosure

AI coding assistants may be used during development, such as:
- Claude
- Gemini
- ChatGPT
- Antigravity
- Other tools actually used by the team

The exact tools used should be documented honestly.

## 49. GitHub Safety

The repository may contain:

```
Backend/
Frontend/
Data/
README.md
prompts.md
package.json
package-lock.json
```

Do NOT commit:
- `.env`
- API keys
- Passwords
- Tokens
- Private credentials
- `node_modules/`

Before pushing:

```
git status
```

Then:

```
git add .
git commit -m "Update Novix AI interview platform"
git push
```

## 50. Git Repository

The GitHub repository should contain the source code required to understand and run the application.

Do NOT include:
- Real API keys
- Private credentials
- Local machine paths
- Unnecessary temporary test files
- Large generated artifacts unless intentionally required

## 51. Environment Documentation

The README should explain that developers create:

```
Backend/.env
```

from:

```
Backend/.env.example
```

Example:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=your_model_here
```

The real key must be supplied locally or through deployment environment variables.

## 52. Provider Independence

The application should allow another supported AI provider to be added later without rewriting the interview engine.

Preferred architecture:

```
Interview Route
   ↓
Interview Service
   ↓
AI Client Interface
   ↓
Provider
   ┌───────────────────┐
   │      Gemini         │
   │   Other Provider    │
   └───────────────────┘
```

## 53. Performance

Avoid unnecessary API calls.

One interview turn should normally result in one AI generation request.

Do not duplicate AI calls unless required for error recovery.

Do not continuously poll the AI provider.

## 54. Reliability

The backend should remain functional if:
- Gemini temporarily fails.
- A response is malformed.
- A session is missing.
- The frontend sends an invalid request.
- The AI provider returns an error.

A single failed request should not crash the server.

## 55. UI/UX Requirements

The interview experience should be:
- Clean
- Modern
- Technical
- Fast
- Responsive
- Easy to understand
- Suitable for a hackathon demonstration

The interface should immediately communicate that this is a technical interview platform.

The application should not contain unnecessary SaaS-style features.

## 56. Features That Should NOT Be Added

Do not add:
- Login
- Signup
- User authentication
- Persistent user accounts
- Voice interaction
- Camera access
- Webcam monitoring
- Payment system
- Subscription plans
- Upgrade to Plus
- Premium plans
- Unnecessary dashboards
- Unnecessary admin systems
- Unnecessary database authentication
- Unnecessary third-party services

The goal is a focused AI technical interview platform.

## 57. Core Product Goal

The core product flow is:

```
Candidate
   ↓
Select / identify candidate
   ↓
Select technical role
   ↓
Start interview
   ↓
AI interviewer asks technical questions
   ↓
Candidate answers
   ↓
AI evaluates and adapts
   ↓
Interview progresses through multiple topics
   ↓
Interview completes
   ↓
Candidate receives technical feedback
```

Everything else should support this flow.

## 58. Maintenance Rule

When modifying the project:
1. Inspect the existing implementation first.
2. Understand the current architecture.
3. Change only what is necessary.
4. Preserve existing API contracts.
5. Preserve frontend/backend communication.
6. Preserve session behavior.
7. Preserve candidate and curriculum data.
8. Preserve feedback structure.
9. Test before committing.
10. Never commit secrets.

## 59. Final Technical Principle

The most important architecture rule is:

**DO NOT REWRITE THE APPLICATION JUST TO CHANGE THE AI PROVIDER.**

Intended implementation:

```
Existing Novix AI (ViCo)
   |
   | Existing interview logic
   v
chatComplete(system, messages)
   |
   v
Gemini Provider
   |
   v
Google Gemini API
```

The Gemini API key is supplied through:

```
GEMINI_API_KEY
```

and remains server-side.

The frontend continues communicating only with:

```
POST /api/interview
```

## 60. Final Objective

Novix AI (ViCo) should provide a complete AI-powered technical interview experience with:
- No login
- No persistent user accounts
- No voice interaction
- No camera requirement
- No paid subscription
- No exposed API keys
- Adaptive technical interviewing
- Candidate-aware questions
- Curriculum-based progression
- Multiple technical topics
- Minimum 8-question interview
- Minimum 4 distinct curriculum days/topics
- Maximum 14 questions
- Final technical feedback
- Gemini-based AI generation
- Secure backend API-key handling
- Clean frontend/backend separation
- Easy deployment
- Hackathon-ready demonstration

The final system should remain simple, reliable, secure, and focused on the technical interview experience.
