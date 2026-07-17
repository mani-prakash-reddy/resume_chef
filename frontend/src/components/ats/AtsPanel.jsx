import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  Lock,
} from "lucide-react";
import clsx from "clsx";
import { useResume } from "../../hooks/useResume";
import { analyzeAts } from "../../lib/api";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Textarea } from "../ui/Input";
import Card from "../ui/Card";

// Rotating progress messages shown during the ATS spinner
const PROGRESS_MESSAGES = [
  "Parsing job description…",
  "Scanning resume keywords…",
  "Comparing skill overlap…",
  "Evaluating experience relevance…",
  "Generating suggestions…",
  "Scoring your resume…",
];

// Score threshold below which "Improve Resume" button appears
const IMPROVE_THRESHOLD = 85;

export default function AtsPanel({ onImproveResume }) {
  const { code, elements, builderType, jobDescription, setJobDescription } = useResume();
  const [loading, setLoading] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [quotaError, setQuotaError] = useState(null);
  const progressRef = useRef(null);

  // Rotate progress message while loading
  useEffect(() => {
    if (loading) {
      progressRef.current = setInterval(() => {
        setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
      }, 1400);
    } else {
      clearInterval(progressRef.current);
      setProgressIdx(0);
    }
    return () => clearInterval(progressRef.current);
  }, [loading]);

  function getResumeContent() {
    if (builderType === "wysiwyg") {
      // Best-effort: stringify elements for the ATS agent
      return JSON.stringify(elements, null, 2);
    }
    return code || "";
  }

  async function runAnalysis() {
    setLoading(true);
    setAnalysis(null);
    setQuotaError(null);
    try {
      const result = await analyzeAts({
        resumeContent: getResumeContent(),
        jobDescription,
      });
      setAnalysis(result);
    } catch (err) {
      if (err.status === 429 || err.status === 402) {
        setQuotaError(err.detail);
      } else {
        console.error("ATS error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleImproveResume() {
    if (!analysis) return;
    const context = buildAtsContext(analysis, jobDescription);
    onImproveResume?.(context);
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
      <Textarea
        label="Job Description (optional)"
        placeholder="Paste a job posting to check keyword match…"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={5}
        id="ats-jd-input"
      />

      <Button
        className="w-full"
        onClick={runAnalysis}
        disabled={loading}
        id="ats-analyze-btn"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Analyzing…" : "Analyze ATS Score"}
      </Button>

      {/* Progress message */}
      {loading && (
        <div className="text-center text-xs text-on-surface-variant animate-pulse py-2">
          {PROGRESS_MESSAGES[progressIdx]}
        </div>
      )}

      {/* Quota error */}
      {quotaError && !loading && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-amber-800 text-sm">
                {quotaError.code === "quota_exceeded" ? "Daily limit reached" : "Insufficient credits"}
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                {quotaError.message || "You've used your daily ATS check allowance."}
              </div>
              <Button size="sm" className="mt-2.5" id="upgrade-from-ats-btn">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {analysis && !loading && (
        <>
          <ScoreRing score={analysis.score} />

          {/* Summary */}
          {analysis.summary && (
            <Card className="text-sm text-on-surface-variant leading-relaxed">
              {analysis.summary}
            </Card>
          )}

          {/* Matched keywords */}
          {analysis.matched_keywords?.length > 0 && (
            <KeywordSection
              title="Matched Keywords"
              keywords={analysis.matched_keywords}
              variant="success"
              icon={CheckCircle2}
            />
          )}

          {/* Missing keywords */}
          {analysis.missing_keywords?.length > 0 && (
            <KeywordSection
              title="Missing Keywords"
              keywords={analysis.missing_keywords}
              variant="warning"
              icon={XCircle}
            />
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-on-surface-variant mb-2">
                AI Suggestions
              </div>
              <div className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-outline-variant bg-surface-container-low text-sm text-on-surface leading-relaxed"
                  >
                    <span className="font-medium text-primary mr-1.5">{i + 1}.</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improve Resume CTA */}
          {analysis.score < IMPROVE_THRESHOLD && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleImproveResume}
              id="improve-resume-btn"
            >
              <Sparkles className="w-4 h-4" />
              Improve Resume with AI
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function ScoreRing({ score }) {
  const color =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-error";
  const label = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs Work";

  return (
    <Card className="flex flex-col items-center py-6">
      <div className={clsx("text-5xl font-bold tabular-nums", color)}>{score}</div>
      <div className="text-sm text-on-surface-variant mt-1">ATS Score</div>
      <Badge
        variant={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
        className="mt-2"
      >
        {label}
      </Badge>
    </Card>
  );
}

function KeywordSection({ title, keywords, variant, icon: Icon }) {
  return (
    <div>
      <div className="text-xs font-semibold text-on-surface-variant mb-2 flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <Badge key={kw} variant={variant}>
            {kw}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/**
 * Build the ATS context string injected into the chat agent for "Improve Resume" flow.
 * This message is hidden from the user in the chat UI.
 */
function buildAtsContext(analysis, jobDescription) {
  return `You are a resume editor. The user wants to improve their resume to better match a specific job.

Job Description:
${jobDescription || "(not provided)"}

ATS Analysis Results:
- Score: ${analysis.score}/100
- Matched keywords: ${analysis.matched_keywords?.join(", ") || "none"}
- Missing keywords: ${analysis.missing_keywords?.join(", ") || "none"}
- Suggestions:
${analysis.suggestions?.map((s, i) => `    ${i + 1}. ${s}`).join("\n") || "    (none)"}
- Summary: ${analysis.summary}

The user's goal is to improve their resume to score higher for this specific job description.
Begin by reading the resume and proposing targeted edits based on the missing keywords and suggestions above.`;
}
