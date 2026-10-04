// Dropdown / choice options used by Candidate Setup.
// Every answer becomes "pre-interview information" for the AI interviewer:
// it tunes how questions are phrased (role, domain, scale, style, difficulty).

export const ROLES = [
  "AI Engineer",
  "Machine Learning Engineer",
  "Generative AI Developer",
  "Prompt / LLM Application Engineer",
  "Data Scientist",
  "Data Engineer",
  "Data Analyst",
  "MLOps / AI Platform Engineer",
  "Backend Software Engineer",
  "Full-Stack Software Engineer",
  "Frontend Software Engineer",
  "Software Engineer",
  "DevOps / Cloud Engineer",
  "Solutions / Cloud Architect",
  "QA / Test Automation Engineer",
  "Technical Product Manager",
  "Business Analyst",
  "Student / Fresh Graduate",
  "Other",
];

// years = value sent to the backend (middle of the range)
export const EXPERIENCE_BANDS = [
  { value: "fresher", label: "Fresher", hint: "0 years", years: 0 },
  { value: "0-1", label: "Under 1 year", hint: "Internship / first role", years: 1 },
  { value: "1-3", label: "1 to 3 years", hint: "Junior", years: 2 },
  { value: "3-5", label: "3 to 5 years", hint: "Mid level", years: 4 },
  { value: "5-8", label: "5 to 8 years", hint: "Senior", years: 6 },
  { value: "8-12", label: "8 to 12 years", hint: "Lead / staff", years: 10 },
  { value: "12+", label: "12+ years", hint: "Principal / architect", years: 14 },
];

export const EDUCATION_LEVELS = [
  "High school / Diploma",
  "Associate degree",
  "B.Tech / B.E.",
  "B.Sc / BS",
  "BCA / BIT",
  "BA / B.Com",
  "M.Tech / M.E.",
  "M.Sc / MS",
  "MCA",
  "MBA",
  "PhD",
  "Bootcamp / Certification",
  "Self-taught",
  "Other",
];

export const FIELDS_OF_STUDY = [
  "Computer Science",
  "Information Technology",
  "Artificial Intelligence / ML",
  "Data Science",
  "Software Engineering",
  "Electronics / Electrical",
  "Mathematics / Statistics",
  "Mechanical / Civil / Other Engineering",
  "Business / Management",
  "Design / Human-Computer Interaction",
  "Other",
];

export const DOMAINS = [
  "Generative AI & LLM applications",
  "Machine learning & data science",
  "Backend & API development",
  "Full-stack web development",
  "Data engineering & analytics",
  "Cloud, DevOps & platform",
  "Mobile development",
  "Quality engineering & testing",
  "Product & business analysis",
  "Still exploring",
];

export const INDUSTRIES = [
  "Fintech & banking",
  "Healthcare & life sciences",
  "E-commerce & retail",
  "SaaS & enterprise software",
  "EdTech",
  "Telecom & media",
  "Manufacturing & logistics",
  "Government & public sector",
  "Consulting & IT services",
  "Startup (multiple domains)",
  "No industry experience yet",
];

export const WORK_CONTEXTS = [
  "Student",
  "Intern / trainee",
  "Employed full-time",
  "Freelance / contract",
  "Between jobs",
  "Switching careers",
];

export const SYSTEM_SCALES = [
  "Learning projects only",
  "Prototype or proof of concept",
  "Internal tool used by a team",
  "Production app, up to 10,000 users",
  "Production system, 10,000 to 1M users",
  "Large-scale system, over 1M users",
];

export const AI_EXPOSURES = [
  "No hands-on AI/ML yet",
  "Coursework or tutorials only",
  "Built a prototype or demo",
  "Shipped one AI feature to production",
  "Own multiple AI systems in production",
];

export const SKILL_LEVELS = [
  { value: "none", label: "None" },
  { value: "basic", label: "Basic" },
  { value: "working", label: "Working" },
  { value: "advanced", label: "Advanced" },
];

export const SKILLS = [
  { key: "rag", label: "RAG & vector search", hint: "Embeddings, vector databases, retrieval" },
  { key: "llm", label: "LLM APIs & prompting", hint: "Prompt design, function calling, structured output" },
  { key: "finetune", label: "Fine-tuning", hint: "LoRA, QLoRA, when to fine-tune" },
  { key: "agents", label: "Agents & MCP", hint: "Tool use, multi-agent systems, Model Context Protocol" },
  { key: "backend", label: "Backend & API design", hint: "REST, streaming, services" },
  { key: "cloud", label: "Docker, Kubernetes & cloud", hint: "Containers, deployment, observability" },
  { key: "evaluation", label: "Evaluation & testing", hint: "Test sets, metrics, regression checks" },
  { key: "security", label: "Security & guardrails", hint: "Privacy, prompt injection, safe outputs" },
];

export const TOOLS = [
  "Python",
  "Node.js",
  "TypeScript",
  "FastAPI",
  "React",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "FAISS / Chroma",
  "Pinecone / Weaviate",
  "LangChain",
  "LlamaIndex",
  "Hugging Face",
  "PyTorch",
  "Ollama",
  "Git & CI/CD",
];

export const DIFFICULTIES = [
  { value: "Foundational", label: "Foundational", hint: "Core concepts, gentle pace" },
  { value: "Standard", label: "Standard", hint: "Typical industry screening" },
  { value: "Advanced", label: "Advanced", hint: "Deep follow-ups, trade-offs" },
];

export const QUESTION_STYLES = [
  { value: "Conceptual", label: "Conceptual", hint: "Explain how and why" },
  { value: "Scenario-based", label: "Scenario-based", hint: "Real-world situations" },
  { value: "Hands-on", label: "Hands-on", hint: "Implementation details" },
  { value: "Mixed", label: "Mixed", hint: "A bit of everything" },
];

// Curriculum rating (what the candidate says about each topic).
// Mapped to mission data the backend already understands:
//   confident -> passed on first attempt
//   revising  -> passed after several attempts
//   skipped   -> not covered
export const TOPIC_STATUSES = [
  { value: "confident", label: "Confident", hint: "I can explain and apply it" },
  { value: "revising", label: "Needs revision", hint: "I know it partly" },
  { value: "skipped", label: "Not covered", hint: "I haven't studied it yet" },
];
