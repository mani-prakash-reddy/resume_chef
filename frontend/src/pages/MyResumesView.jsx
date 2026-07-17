import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Trash2, Clock, Loader2, AlertCircle, Lock } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { listResumes, createResume, deleteResume, getResume } from "../lib/api";
import { useResume } from "../hooks/useResume";

const FREE_TIER_MAX = 1;

export default function MyResumesView({ onOpenCanvas }) {
  const { loadResume, resumeId: activeResumeId, clearResume } = useResume();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null); // id of resume being deleted
  const [resumeToDelete, setResumeToDelete] = useState(null); // resume object for confirmation modal
  const [plan, setPlan] = useState("free");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResumeData, setNewResumeData] = useState({ title: "", file_name: "", builder_type: "latex" });

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

  function handleCreateClick() {
    if (isAtLimit) return;
    setNewResumeData({ title: "New Resume", file_name: "", builder_type: "latex" });
    setShowCreateModal(true);
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (isAtLimit) return;
    setCreating(true);
    try {
      const finalFileName = newResumeData.file_name
        ? (newResumeData.file_name.toLowerCase().endsWith(".pdf")
            ? newResumeData.file_name
            : `${newResumeData.file_name}.pdf`)
        : null;

      const resume = await createResume({
        title: newResumeData.title || "New Resume",
        file_name: finalFileName,
        builder_type: newResumeData.builder_type,
      });
      loadResume(resume);
      setShowCreateModal(false);
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
    try {
      const fullResume = await getResume(resume.id);
      loadResume(fullResume);
      onOpenCanvas?.();
    } catch (err) {
      setError("Failed to open resume details: " + err.message);
    }
  }

  function handleDeleteClick(e, resume) {
    e.stopPropagation();
    setResumeToDelete(resume);
  }

  async function confirmDelete() {
    if (!resumeToDelete) return;
    const resumeId = resumeToDelete.id;
    setDeleting(resumeId);
    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      if (activeResumeId === resumeId) {
        clearResume();
      }
      setResumeToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete resume");
    } finally {
      setDeleting(null);
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
              onClick={handleCreateClick}
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
                Delete your current resume or upgrade to Pro for unlimited resume slots, more AI messages, and priority support.
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
                onClick={handleCreateClick}
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
                onDelete={handleDeleteClick}
                deleting={deleting === resume.id}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="text-xl font-semibold text-on-surface">Create New Resume</h2>
            </div>
            <form onSubmit={submitCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="resume-title">
                  Resume Name
                </label>
                <input
                  id="resume-title"
                  type="text"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  value={newResumeData.title}
                  onChange={(e) => setNewResumeData({ ...newResumeData, title: e.target.value })}
                  placeholder="e.g. Software Engineer Resume"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="resume-filename">
                  File Name (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="resume-filename"
                    type="text"
                    className="w-full bg-surface-container border border-outline-variant rounded-lg pl-3 pr-12 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    value={newResumeData.file_name.replace(/\.pdf$/i, "")}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\.pdf$/i, "");
                      setNewResumeData({ ...newResumeData, file_name: val });
                    }}
                    placeholder="e.g. alex_sde2"
                  />
                  <span className="absolute right-3 text-sm text-on-surface-variant pointer-events-none">
                    .pdf
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-on-surface mb-2">Build Type</span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="builder_type"
                      value="latex"
                      checked={newResumeData.builder_type === "latex"}
                      onChange={(e) => setNewResumeData({ ...newResumeData, builder_type: e.target.value })}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-on-surface">LaTeX</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="builder_type"
                      value="html"
                      checked={newResumeData.builder_type === "html"}
                      onChange={(e) => setNewResumeData({ ...newResumeData, builder_type: e.target.value })}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-on-surface">HTML</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="builder_type"
                      value="wysiwyg"
                      checked={newResumeData.builder_type === "wysiwyg"}
                      onChange={(e) => setNewResumeData({ ...newResumeData, builder_type: e.target.value })}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-on-surface">Drag and Drop (Visual)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-outline-variant">
                <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-2">Delete Resume</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete <strong>{resumeToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setResumeToDelete(null)}>
                Cancel
              </Button>
              <Button
                className="bg-error hover:bg-error/90 text-on-error border-transparent"
                onClick={confirmDelete}
                disabled={deleting === resumeToDelete.id}
              >
                {deleting === resumeToDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumeCard({ resume, onOpen, onDelete, deleting }) {
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
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-on-surface truncate">{resume.title}</span>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${builderBadge.color}`}>
          {builderBadge.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Clock className="w-3 h-3" />
          {relativeTime}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(resume);
            }}
            className="h-7 px-2 text-xs"
          >
            Open
          </Button>
          <button
          type="button"
          onClick={(e) => onDelete(e, resume)}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-on-surface-variant hover:text-error px-2 py-1 rounded hover:bg-error-container/20"
          title="Delete resume"
          id={`delete-resume-${resume.id}`}
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Delete
        </button>
        </div>
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
