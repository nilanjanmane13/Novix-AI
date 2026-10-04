// The one built-in sample profile (mirrors CAND-002 from Data/candidates.json,
// expressed in the new pre-interview fields). Used by the "Load sample" button.

export const SAMPLE_PROFILE = {
  name: "Alex Turner",
  role: "Backend Software Engineer",
  experience: "3-5",
  educationLevel: "B.Tech / B.E.",
  fieldOfStudy: "Computer Science",

  domain: "Backend & API development",
  industry: "SaaS & enterprise software",
  workContext: "Employed full-time",
  systemScale: "Production app, up to 10,000 users",
  aiExposure: "Built a prototype or demo",
  skills: {
    rag: "working",
    llm: "working",
    finetune: "basic",
    agents: "working",
    backend: "advanced",
    cloud: "working",
    evaluation: "basic",
    security: "basic",
  },
  tools: ["Python", "Node.js", "FastAPI", "Docker", "PostgreSQL", "LangChain", "Git & CI/CD"],
  difficulty: "Standard",
  style: "Scenario-based",
  notes: "I would like a couple of system design style questions on RAG and deployment.",
};

// day -> status
export const SAMPLE_TOPIC_STATUS = {
  7: "revising",
  8: "revising",
  10: "revising",
  12: "revising",
  13: "revising",
  16: "confident",
  18: "confident",
  22: "revising",
  28: "confident",
  31: "revising",
};
