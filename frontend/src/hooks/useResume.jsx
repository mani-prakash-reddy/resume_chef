import { createContext, useContext, useState, useCallback } from "react";
import {
  DEFAULT_RESUME_CODE,
  DEFAULT_ELEMENTS,
  TEMPLATES,
} from "../data/defaults";

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [code, setCode] = useState(DEFAULT_RESUME_CODE);
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [editorMode, setEditorMode] = useState("code");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  const updateContact = useCallback((field, value) => {
    setElements((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  const updateSummary = useCallback((value) => {
    setElements((prev) => ({ ...prev, summary: value }));
  }, []);

  const updateExperience = useCallback((id, field, value) => {
    setElements((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
  }, []);

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
  }, []);

  const addExperienceBullet = useCallback((expId) => {
    setElements((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === expId
          ? { ...exp, bullets: [...exp.bullets, "New achievement bullet"] }
          : exp,
      ),
    }));
  }, []);

  const updateSkill = useCallback((index, value) => {
    setElements((prev) => {
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
  }, []);

  const addSkill = useCallback(() => {
    setElements((prev) => ({
      ...prev,
      skills: [...prev.skills, "New Skill"],
    }));
  }, []);

  const removeSkill = useCallback((index) => {
    setElements((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  }, []);

  const value = {
    code,
    setCode,
    elements,
    setElements,
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
