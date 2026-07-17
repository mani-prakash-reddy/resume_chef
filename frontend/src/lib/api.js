import { getAccessToken } from "./supabase";

const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

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
    const error = new Error(err.detail?.message || err.detail || `Request failed: ${res.status}`);
    error.status = res.status;
    error.detail = err.detail;
    throw error;
  }
  
  if (res.status === 204) {
    return null;
  }
  
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth / Health
// ---------------------------------------------------------------------------

export async function checkHealth() {
  return request("/health");
}

export async function getCurrentUser() {
  return request("/auth/me");
}

// ---------------------------------------------------------------------------
// Resume CRUD
// ---------------------------------------------------------------------------

export async function listResumes(includeArchived = false) {
  const qs = includeArchived ? "?include_archived=true" : "";
  return request(`/resumes${qs}`);
}

export async function createResume(data) {
  return request("/resumes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getResume(id) {
  return request(`/resumes/${id}`);
}

/**
 * Auto-sync: partial update of resume content (debounced by the caller).
 * Only pass the fields that changed.
 */
export async function saveResume(id, patch) {
  return request(`/resumes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteResume(id) {
  return request(`/resumes/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

export async function getWalletBalance() {
  return request("/credits/balance");
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export async function createCheckout(plan, countryCode) {
  return request("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan, country_code: countryCode }),
  });
}

// ---------------------------------------------------------------------------
// AI — Chat (SSE streaming)
// ---------------------------------------------------------------------------

/**
 * Stream chat messages from the AI agent.
 *
 * @param {Object} params
 * @param {Array}  params.messages      — [{role, content}] conversation history
 * @param {string} params.resumeId      — UUID of the active resume
 * @param {string} params.builderType   — "latex" | "html" | "wysiwyg"
 * @param {string} [params.atsContext]  — optional injected ATS context for Improve Resume flow
 * @param {Function} params.onToken     — called with each streamed text token
 * @param {Function} params.onStatus    — called with tool-call status strings ("Reading resume...")
 * @param {Function} params.onPatch     — called with patch results for diff preview
 * @param {Function} params.onDone      — called when stream completes
 * @param {Function} params.onError     — called with error message string
 */
export async function chatWithAi({
  messages,
  resumeId,
  builderType = "latex",
  atsContext = null,
  onToken,
  onStatus,
  onPatch,
  onDone,
  onError,
}) {
  const token = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        resume_id: resumeId,
        builder_type: builderType,
        ats_context: atsContext,
      }),
    });
  } catch (err) {
    onError?.(`Network error: ${err.message}`);
    return;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody.detail;
    if (res.status === 429) {
      onError?.({ type: "quota_exceeded", detail });
    } else if (res.status === 402) {
      onError?.({ type: "insufficient_credits", detail });
    } else {
      onError?.(detail?.message || `Request failed: ${res.status}`);
    }
    return;
  }

  // Read the SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE format: each event is "data: {...}\n\n"
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6);
        try {
          const event = JSON.parse(jsonStr);
          switch (event.type) {
            case "token":
              onToken?.(event.content);
              break;
            case "status":
              onStatus?.(event.content);
              break;
            case "patch_result":
              onPatch?.(event.content);
              break;
            case "done":
              onDone?.();
              break;
            case "error":
              onError?.(event.content);
              break;
          }
        } catch {
          // Malformed JSON in stream — skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// AI — ATS Analysis (JSON, no streaming)
// ---------------------------------------------------------------------------

/**
 * Run ATS analysis against a job description.
 *
 * The frontend passes the raw editor content directly — the backend
 * does NOT fetch from DB, ensuring the agent analyzes what the user sees.
 *
 * Returns: { score, matched_keywords, missing_keywords, suggestions, summary }
 * Throws on 429 (quota) or 402 (credits) with structured error.detail.
 */
export async function analyzeAts({ resumeContent, jobDescription }) {
  return request("/ai/ats", {
    method: "POST",
    body: JSON.stringify({
      resume_content: resumeContent,
      job_description: jobDescription,
    }),
  });
}
