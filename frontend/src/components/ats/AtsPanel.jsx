import { useState } from "react";
import {
  Target,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { useResume } from "../../hooks/useResume";
import { analyzeAts } from "../../lib/api";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Textarea } from "../ui/Input";
import Card from "../ui/Card";

export default function AtsPanel() {
  const { code, elements, jobDescription, setJobDescription } = useResume();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  async function runAnalysis() {
    setLoading(true);
    try {
      const result = await analyzeAts({ code, elements, jobDescription });
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-surface-container-lowest border border-outline-variant border-l-0 rounded-r-xl px-2 py-4 shadow-md hover:bg-surface-container-low cursor-pointer"
        aria-label="Open ATS panel"
      >
        <ChevronRight className="w-4 h-4 text-primary" />
        {analysis && (
          <div className="mt-2 text-xs font-bold text-primary writing-mode-vertical">
            {analysis.score}
          </div>
        )}
      </button>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-outline-variant bg-surface-container-lowest flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">
            ATS Analyzer
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer text-on-surface-variant"
          aria-label="Collapse ATS panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Textarea
          label="Job Description (optional)"
          placeholder="Paste a job posting to check keyword match…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
        />

        <Button
          className="w-full"
          onClick={runAnalysis}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Analyzing…" : "Analyze ATS Score"}
        </Button>

        {analysis && (
          <>
            <ScoreRing score={analysis.score} />

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(analysis.breakdown).map(([key, val]) => (
                <Card key={key} className="text-center py-3">
                  <div className="text-lg font-bold text-primary">{val}</div>
                  <div className="text-xs text-on-surface-variant capitalize">
                    {key}
                  </div>
                </Card>
              ))}
            </div>

            {analysis.matchedKeywords?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-on-surface-variant mb-2">
                  Matched Keywords
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedKeywords.map((kw) => (
                    <Badge key={kw} variant="success">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.missingKeywords?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-on-surface-variant mb-2">
                  Missing Keywords
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.map((kw) => (
                    <Badge key={kw} variant="warning">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-on-surface-variant mb-2">
                Tips & Suggestions
              </div>
              <div className="space-y-2">
                {analysis.tips.map((tip, i) => (
                  <TipCard key={i} tip={tip} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function ScoreRing({ score }) {
  const color =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-error";
  const label =
    score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs Work";

  return (
    <Card className="flex flex-col items-center py-6">
      <div className={clsx("text-5xl font-bold", color)}>{score}</div>
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

function TipCard({ tip }) {
  const icons = {
    high: AlertTriangle,
    medium: Info,
    low: CheckCircle2,
  };
  const colors = {
    high: "border-error-container bg-error-container/30",
    medium: "border-amber-200 bg-amber-50",
    low: "border-outline-variant bg-surface-container-low",
  };
  const Icon = icons[tip.severity] || Info;

  return (
    <div
      className={clsx(
        "p-3 rounded-xl border text-sm",
        colors[tip.severity],
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-on-surface-variant" />
        <div>
          <div className="font-semibold text-on-surface">{tip.title}</div>
          <div className="text-on-surface-variant mt-0.5 text-xs leading-relaxed">
            {tip.detail}
          </div>
        </div>
      </div>
    </div>
  );
}
