import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  DEFAULT_RESUME_CODE,
  DEFAULT_ELEMENTS,
  TEMPLATES,
} from "../data/defaults";
import { saveResume } from "../lib/api";

const ResumeContext = createContext(null);

/**
 * Auto-sync interval in milliseconds.
 * The resume is persisted to the backend this often after any change.
 */
const AUTO_SYNC_INTERVAL_MS = 5000;

export function ResumeProvider({ children }) {
  const [code, setCode] = useState(DEFAULT_RESUME_CODE);
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [editorMode, setEditorMode] = useState("code");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  // Persistence state
  const [resumeId, setResumeId] = useState(null);       // UUID of the resume in DB (null = not yet saved)
  const [builderType, setBuilderType] = useState("latex");
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"

  // Auto-sync: track pending changes
  const dirtyRef = useRef(false);
  const syncTimerRef = useRef(null);

  // Mark dirty on content changes
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  // Auto-sync effect — fires every AUTO_SYNC_INTERVAL_MS, only saves if dirty
  useEffect(() => {
    if (!resumeId) return; // No saved resume yet — skip auto-sync

    const tick = async () => {
      if (!dirtyRef.current) return;

      dirtyRef.current = false;
      setSyncStatus("saving");

      const patch =
        builderType === "wysiwyg"
          ? { content_elements: elements }
          : { content_code: code };

      try {
        await saveResume(resumeId, patch);
        setSyncStatus("saved");
      } catch (err) {
        console.error("Auto-sync failed:", err);
        dirtyRef.current = true; // re-mark dirty so we retry next tick
        setSyncStatus("error");
      }
    };

    syncTimerRef.current = setInterval(tick, AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(syncTimerRef.current);
  }, [resumeId, builderType, code, elements]);

  // Setters that also mark dirty
  const setCodeAndMarkDirty = useCallback((value) => {
    setCode(value);
    markDirty();
  }, [markDirty]);

  const setElementsAndMarkDirty = useCallback((value) => {
    setElements(value);
    markDirty();
  }, [markDirty]);

  // WYSIWYG field updaters
  const updateContact = useCallback((field, value) => {
    setElements((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
    markDirty();
  }, [markDirty]);

  const updateSummary = useCallback((value) => {
    setElements((prev) => ({ ...prev, summary: value }));
    markDirty();
  }, [markDirty]);

  const updateExperience = useCallback((id, field, value) => {
    setElements((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
    markDirty();
  }, [markDirty]);

  const updateExperienceBullet = useCallback((expId, index, value) => {
    setElements((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        const bullets = [...exp.bullets];
        bullets[index] = value;
        return { ...exp, bullets };
      }),
    }));
    markDirty();
  }, [markDirty]);

  const addExperienceBullet = useCallback((expId) => {
    setElements((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === expId
          ? { ...exp, bullets: [...exp.bullets, "New achievement bullet"] }
          : exp,
      ),
    }));
    markDirty();
  }, [markDirty]);

  const updateSkill = useCallback((index, value) => {
    setElements((prev) => {
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
    markDirty();
  }, [markDirty]);

  const addSkill = useCallback(() => {
    setElements((prev) => ({
      ...prev,
      skills: [...prev.skills, "New Skill"],
    }));
    markDirty();
  }, [markDirty]);

  const removeSkill = useCallback((index) => {
    setElements((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
    markDirty();
  }, [markDirty]);

  /**
   * Load a resume from the DB into editor state.
   * Called by MyResumesView when the user opens a resume.
   */
  const loadResume = useCallback((resume) => {
    setResumeId(resume.id);
    setBuilderType(resume.builder_type);
    if (resume.builder_type === "wysiwyg") {
      setElements(resume.content_elements || DEFAULT_ELEMENTS);
    } else {
      setCode(resume.content_code || DEFAULT_RESUME_CODE);
    }
    if (resume.job_description) setJobDescription(resume.job_description);
    dirtyRef.current = false;
    setSyncStatus("idle");
  }, []);

  const value = {
    code,
    setCode: setCodeAndMarkDirty,
    elements,
    setElements: setElementsAndMarkDirty,
    template,
    setTemplate,
    editorMode,
    setEditorMode,
    previewHtml,
    setPreviewHtml,
    previewLoading,
    setPreviewLoading,
    jobDescription,
    setJobDescription,
    // Persistence
    resumeId,
    setResumeId,
    builderType,
    setBuilderType,
    syncStatus,
    loadResume,
    // WYSIWYG field helpers
    updateContact,
    updateSummary,
    updateExperience,
    updateExperienceBullet,
    addExperienceBullet,
    updateSkill,
    addSkill,
    removeSkill,
  };

  return (
    <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
}
