import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Archive, Clock, Loader2, AlertCircle, Lock } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { listResumes, createResume, archiveResume } from "../lib/api";
import { useResume } from "../hooks/useResume";

const FREE_TIER_MAX = 1;

export default function MyResumesView({ onOpenCanvas }) {
  const { loadResume } = useResume();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState(null); // id of resume being archived
  const [plan, setPlan] = useState("free");

  const activeCount = resumes.filter((r) => !r.is_archived).length;
  const isAtLimit = plan === "free" && activeCount >= FREE_TIER_MAX;

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResumes();
      setResumes(data.resumes || []);
    } catch (err) {
      setError(err.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  async function handleCreate() {
    if (isAtLimit) return;
    setCreating(true);
    try {
      const resume = await createResume({
        title: "New Resume",
        builder_type: "latex",
      });
      loadResume(resume);
      onOpenCanvas?.();
    } catch (err) {
      if (err.detail?.code === "resume_slot_limit") {
        setError("Free tier allows 1 active resume. Upgrade to Pro for unlimited.");
      } else {
        setError(err.message || "Failed to create resume");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleOpen(resume) {
    loadResume(resume);
    onOpenCanvas?.();
  }

  async function handleArchive(e, resumeId) {
    e.stopPropagation();
    setArchiving(resumeId);
    try {
      await archiveResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } catch (err) {
      setError(err.message || "Failed to archive resume");
    } finally {
      setArchiving(null);
    }
  }

  const activeResumes = resumes.filter((r) => !r.is_archived);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-on-surface">My Resumes</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {plan === "free"
                ? `${activeCount} / ${FREE_TIER_MAX} resume slots used (free tier)`
                : `${activeCount} active resumes`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAtLimit && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                <Lock className="w-3 h-3" />
                Upgrade for more
              </span>
            )}
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || isAtLimit}
              id="create-resume-btn"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              New resume
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 border border-error-container rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Upgrade CTA when at limit */}
        {isAtLimit && (
          <Card className="mb-4 border border-primary/20 bg-primary/5 flex items-start gap-3 p-4">
            <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-on-surface text-sm">Free tier limit reached</div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                Archive your current resume or upgrade to Pro for unlimited resume slots, more AI messages, and priority support.
              </div>
              <Button size="sm" className="mt-3" id="upgrade-from-resumes-btn">
                Upgrade to Pro
              </Button>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
          </div>
        )}

        {/* Empty state */}
        {!loading && activeResumes.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-on-surface-variant/40 mb-3" />
            <p className="text-sm text-on-surface-variant">
              No active resumes yet.{" "}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || isAtLimit}
                className="text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-40"
              >
                Create your first resume
              </button>
            </p>
          </Card>
        )}

        {/* Resume list */}
        {!loading && activeResumes.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeResumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onOpen={handleOpen}
                onArchive={handleArchive}
                archiving={archiving === resume.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeCard({ resume, onOpen, onArchive, archiving }) {
  const builderBadge = {
    latex: { label: "LaTeX", color: "text-blue-600 bg-blue-50 border-blue-200" },
    html: { label: "HTML", color: "text-orange-600 bg-orange-50 border-orange-200" },
    wysiwyg: { label: "Visual", color: "text-purple-600 bg-purple-50 border-purple-200" },
  }[resume.builder_type] || { label: resume.builder_type, color: "text-on-surface-variant bg-surface-container border-outline-variant" };

  const updatedAt = new Date(resume.updated_at);
  const relativeTime = getRelativeTime(updatedAt);

  return (
    <Card
      className="group cursor-pointer hover:border-primary/40 transition-all duration-150 hover:shadow-md"
      onClick={() => onOpen(resume)}
      id={`resume-card-${resume.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-on-surface-variant shrink-0" />
          <span className="text-sm font-medium text-on-surface truncate">{resume.title}</span>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${builderBadge.color}`}>
          {builderBadge.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Clock className="w-3 h-3" />
          {relativeTime}
        </span>

        <button
          type="button"
          onClick={(e) => onArchive(e, resume.id)}
          disabled={archiving}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-on-surface-variant hover:text-error px-2 py-1 rounded hover:bg-error-container/20"
          title="Archive resume"
          id={`archive-resume-${resume.id}`}
        >
          {archiving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Archive className="w-3 h-3" />
          )}
          Archive
        </button>
      </div>
    </Card>
  );
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
