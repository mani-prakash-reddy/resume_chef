# AI Agents Design

Status: Draft — covers the two AI agents in scope for v1. Keyword-based ATS matching and MCP external-client access are explicitly deferred to later phases.

---

## Overview

Two distinct AI agents are exposed in the UI (`AgentPanel.jsx`). Each has a different purpose, input/output model, and interaction style:

| | Chat / Resume Agent | ATS Agent |
|---|---|---|
| **Purpose** | Conversational Q&A + surgical resume editing | Score resume against a job description |
| **Input** | User chat messages | Raw resume content + JD text (passed in payload) |
| **Tool calls** | Yes (`read_resume`, `patch_resume`) | No — JSON output mode |
| **Streaming** | Yes | No (spinner + hardcoded frontend progress messages) |
| **Credit cost** | 1 credit per message | 2 credits per analysis |
| **Implementation** | LangGraph + FastMCP | LangGraph (structured output) |

---

## 1. Chat / Resume Agent

### Role

A general-purpose assistant scoped to the user's resume. The user can ask questions ("What should I add to my summary?"), request edits ("Make my bullet points more action-oriented"), or use it as the continuation of an ATS improvement flow (see [Improve Resume Flow](#improve-resume-flow)).

### Tools (via FastMCP)

All tools have `resume_id` **runtime-injected** by the backend. The agent never fills or sees this parameter — it is bound to the authenticated user's active resume before the tool is called. This prevents the agent from accidentally reading or patching a different user's resume.

---

#### `read_resume`

Reads the current resume content with line numbers.

**Parameters** (all optional):

| Param | Type | Description |
|---|---|---|
| `starting_line` | `int` | First line to read (1-indexed). Defaults to 1. |
| `no_of_lines` | `int` | Number of lines to return. Defaults to full file. |

**Behavior:**
- If no parameters are passed → returns the full resume content.
- Content is returned with each line prefixed by its line number:
  ```
  1: \documentclass[letterpaper,11pt]{article}
  2: \usepackage{latexsym}
  3: ...
  ```
- If a partial read is performed, a footer is appended:
  ```
  [Lines 40 to 80 of 142 total lines]
  ```
- This footer ensures the agent always knows the full size of the file and can issue follow-up reads if needed.

**Agent guidance (system prompt):** "Always read the resume before making edits. If the file is large, you may read it in sections, but prefer reading the full file in a single call when possible."

---

#### `patch_resume`

Applies one or more line-range replacements to the resume in a single best-effort call.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `patches` | `list[Patch]` | Ordered list of patch objects |

**Patch object:**
```json
{
  "from": 10,
  "to": 24,
  "content": "line A\nline B\nline C\n..."
}
```

- `from` / `to`: inclusive line numbers, **always referring to the original file before any patches in this call** — not to post-patch line numbers.
- `content`: replacement text. The number of lines in `content` can differ from `to - from + 1` (the agent can freely add or remove lines).

**Application rules:**
1. Patches are applied in the order provided (first to last).
2. **Line numbers always reference the original file.** The agent must not account for line shifts caused by earlier patches in the same call.
3. Overlapping patches: the agent is instructed via system prompt to avoid overlapping ranges. In code, patches are applied sequentially — a later patch in the list can silently override an earlier one if ranges overlap.
4. **Best-effort:** patches that succeed are committed; patches that fail (e.g., out-of-range line numbers) are skipped. The tool reports which patches failed so the agent may retry them in a follow-up call.

**Agent guidance (system prompt):** "Send all intended edits in a single `patch_resume` call. Do not send overlapping patch ranges — each line number should appear in at most one patch. Line numbers always refer to the file as it was when you last called `read_resume`, not to any intermediate patched state."

---

### Builder Type Constraint (v1)

Tool-based resume editing via `read_resume` / `patch_resume` is **only supported for code-based resumes** (LaTeX and HTML builder types). These formats are stored as plain text, so line-based patching is well-defined.

WYSIWYG resumes (JSON tree structure) are not supported for agent editing in v1 — the Chat Agent can still answer questions and give suggestions for WYSIWYG users, but cannot apply patches. This limitation is surfaced clearly in the UI ("AI editing is only available for code-based resumes").

A future `update_resume_node(node_id, field, value)` tool targeting the JSON tree will unlock WYSIWYG editing.

---

### Streaming UX

The Chat Agent streams tokens to the frontend in real time. Tool calls interrupt the stream and trigger live status indicators in the chat UI:

| Agent action | UI indicator shown |
|---|---|
| Calling `read_resume` | `"Reading resume..."` |
| Calling `patch_resume` | `"Patching resume..."` |
| Streaming reply text | Live token-by-token text rendering |

**Patch diff preview:** When `patch_resume` is called, the frontend renders an inline diff view (similar to AI coding IDE patch previews — green for added lines, red for removed lines). The diff is shown in the editor panel alongside the chat. The resume editor updates live once the patch is committed.

---

## 2. ATS Agent

### Role

Analyzes the user's resume against a provided job description and returns a structured JSON report. This is a one-shot evaluation — not conversational.

### Input

The frontend sends both pieces of content directly in the request payload:

```json
{
  "resume_content": "<full raw resume text — the active open resume>",
  "job_description": "<JD text entered by user>"
}
```

The backend does **not** fetch the resume from DB for this call — the frontend provides the current editor content. This ensures the agent always analyzes what the user currently sees, even if the auto-sync hasn't flushed yet.

### Output Schema

The agent responds with a structured JSON object (LangGraph structured output mode):

```json
{
  "score": 62,
  "matched_keywords": ["Python", "REST APIs", "Git"],
  "missing_keywords": ["Kubernetes", "CI/CD", "System Design"],
  "suggestions": [
    "Reframe bullet 3 in your Experience section to emphasize scale and ownership.",
    "Add a Projects section showcasing system design work.",
    "Quantify your impact in the current role — numbers stand out to ATS filters."
  ],
  "summary": "Your resume is a moderate match for this role. Strong overlap in core programming skills, but missing infrastructure and architecture keywords that appear prominently in the JD."
}
```

### Keyword Matching — Deferred

For v1, the score and keyword lists are produced entirely by the LLM (AI-only pass). A dedicated keyword extraction pass (spaCy/NLTK-based, near-zero cost) is explicitly deferred until the core agent implementation is stable. When added later, it will run as a pre-pass before the LLM call, feeding the extracted keyword sets into the prompt for higher accuracy and consistency.

### Streaming

The ATS Agent does **not** stream. The frontend shows a spinner with a sequence of hardcoded progress messages (e.g., "Parsing job description...", "Comparing skills...", "Generating suggestions...") while the backend processes the request. The full JSON result is delivered in a single response.

---

## Improve Resume Flow

When the user clicks the **"Improve Resume"** button in the ATS panel (visible only when score is below a threshold and the user has remaining quota), the following happens:

1. The UI switches to the **Chat Agent tab**.
2. A **system message** is constructed injecting the full ATS context. This message is **invisible to the user** in the chat UI — the conversation appears to start fresh with the agent's first streaming reply.

**Injected system message structure:**

```
You are a resume editor. The user wants to improve their resume to better match a specific job.

Job Description:
<JD text>

ATS Analysis Results:
- Score: 62/100
- Matched keywords: Python, REST APIs, Git
- Missing keywords: Kubernetes, CI/CD, System Design
- Suggestions:
    1. Reframe bullet 3 in Experience to emphasize scale and ownership.
    2. Add a Projects section showcasing system design work.
    3. Quantify impact with numbers.
- Summary: Moderate match. Strong core skills, missing infrastructure keywords.

The user's goal is to improve their resume to score higher for this specific job description.
Begin by reading the resume and proposing targeted edits.
```

3. The Chat Agent starts streaming — it will call `read_resume`, then issue `patch_resume` calls with a diff preview rendered for each change.

---

## Token Tracking

Every AI call (both agents) logs token usage in the `credit_transactions.metadata` JSON field for margin analysis and future credit-cost tuning:

```json
{
  "model": "gpt-4o-mini",
  "agent": "ats_agent",
  "prompt_tokens": 1840,
  "completion_tokens": 420,
  "total_tokens": 2260
}
```

- `agent`: `"chat_agent"` | `"ats_agent"`
- `model`: exact model string (costs differ significantly between model tiers)
- `prompt_tokens` and `completion_tokens` logged separately — completion tokens cost more; this split enables prompt optimization later

---

## Credit Enforcement Summary

| Action | Free tier | Pro tier |
|---|---|---|
| Chat message (1 turn) | Counted against `free_tier_usage.chat_messages_used` | 1 credit deducted from wallet |
| ATS analysis | Counted against `free_tier_usage.ats_checks_used` | 2 credits deducted from wallet |
| `read_resume` tool call | Free (part of chat turn) | Free (part of chat turn) |
| `patch_resume` tool call | Free (part of chat turn) | Free (part of chat turn) |

Tool calls within a single chat turn are not individually credit-metered — the turn itself is the billable unit.

---

## What's Explicitly Out of Scope for v1

| Feature | Status |
|---|---|
| MCP access for external clients (Claude Desktop, Cursor) | Future — Pro only when implemented |
| ATS keyword extraction pass (spaCy/NLTK) | Deferred — add after core agents are stable |
| WYSIWYG resume editing via agent tools | Deferred — requires `update_resume_node` tool |
| ATS agent streaming | Not needed — spinner + hardcoded messages sufficient |
| `get_line_count()` tool | Not needed — agent infers from `read_resume` footer |
