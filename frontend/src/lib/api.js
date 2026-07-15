import { getAccessToken } from "./supabase";

const API_BASE = "/api";

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function checkHealth() {
  return request("/health");
}

export async function getCurrentUser() {
  return request("/auth/me");
}

export async function chatWithAi({ messages, resumeContext }) {
  try {
    return await request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, resumeContext }),
    });
  } catch {
    const last = messages[messages.length - 1]?.content || "";
    return {
      reply: mockChatReply(last),
      suggestions: mockSuggestions(),
    };
  }
}

export async function analyzeAts({ code, elements, jobDescription }) {
  try {
    return await request("/ai/ats", {
      method: "POST",
      body: JSON.stringify({ code, elements, jobDescription }),
    });
  } catch {
    return mockAtsAnalysis(jobDescription);
  }
}

function mockChatReply(userMessage) {
  const lower = userMessage.toLowerCase();
  if (lower.includes("summary"))
    return "I'd tighten your summary to 2–3 lines focused on measurable impact. Lead with your strongest achievement and target role keywords.";
  if (lower.includes("skill"))
    return "Consider grouping skills by category (Languages, Frameworks, Tools) and prioritizing those mentioned in your target job description.";
  if (lower.includes("experience") || lower.includes("bullet"))
    return "Use the STAR format: start each bullet with a strong action verb, quantify results where possible, and keep bullets to one line.";
  return "I can help refine your resume. Try asking me to improve your summary, strengthen experience bullets, or tailor content for a specific job posting.";
}

function mockSuggestions() {
  return [
    "Add quantified metrics to your top 3 experience bullets",
    "Include 2–3 keywords from the job description in your summary",
    "Move technical skills section above education for engineering roles",
  ];
}

function mockAtsAnalysis(jobDescription) {
  const hasJd = Boolean(jobDescription?.trim());
  return {
    score: hasJd ? 78 : 72,
    breakdown: {
      keywords: hasJd ? 82 : 68,
      formatting: 90,
      sections: 85,
      length: 75,
    },
    tips: [
      {
        severity: "high",
        title: "Missing quantified achievements",
        detail:
          "3 of 5 experience bullets lack numbers. ATS and recruiters scan for metrics like %, $, or scale.",
      },
      {
        severity: "medium",
        title: "Keyword gap",
        detail: hasJd
          ? "Job description mentions 'Kubernetes' and 'CI/CD' — consider adding these if accurate."
          : "Paste a job description to get keyword-matching suggestions.",
      },
      {
        severity: "low",
        title: "Section order",
        detail:
          "Skills section appears after education. For technical roles, consider placing it earlier.",
      },
    ],
    matchedKeywords: hasJd
      ? ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
      : [],
    missingKeywords: hasJd ? ["Kubernetes", "CI/CD", "GraphQL"] : [],
  };
}
