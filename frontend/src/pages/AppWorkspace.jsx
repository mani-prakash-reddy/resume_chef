import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ResumeProvider, useResume } from "../hooks/useResume";
import AppHeader from "../components/layout/AppHeader";
import AgentPanel from "../components/layout/AgentPanel";
import CodeCanvas from "../components/editor/CodeCanvas";
import PdfPreview from "../components/preview/PdfPreview";
import ResizableSplitPane from "../components/layout/ResizableSplitPane";
import MyResumesView from "./MyResumesView";
import SettingsView from "./SettingsView";
import LandingPage from "./LandingPage";
import { listResumes, getResume } from "../lib/api";

function WorkspaceMain() {
  const [activeView, setActiveView] = useState("loading");
  const [activeAgent, setActiveAgent] = useState("resume");
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const { loadResume } = useResume();

  useEffect(() => {
    async function init() {
      try {
        const data = await listResumes();
        if (data.resumes && data.resumes.length > 0) {
          const latestId = data.resumes[0].id;
          const fullResume = await getResume(latestId);
          loadResume(fullResume);
          setActiveView("canvas");
        } else {
          setActiveView("landing");
        }
      } catch (err) {
        console.error("Failed to load initial resume:", err);
        setActiveView("landing");
      }
    }
    init();
  }, [loadResume]);

  if (activeView === "loading") {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader activeView={activeView} onViewChange={setActiveView} />

      {activeView === "landing" && (
        <LandingPage onNavigateToResumes={() => setActiveView("resumes")} />
      )}

      {activeView === "canvas" && (
        <main className="flex-1 flex min-w-0 min-h-0">
          <ResizableSplitPane
            left={
              <ResizableSplitPane
                isLeftCollapsed={isEditorCollapsed}
                collapsedLeftWidth={40}
                left={<CodeCanvas isCollapsed={isEditorCollapsed} onToggleCollapse={() => setIsEditorCollapsed(!isEditorCollapsed)} />}
                right={<PdfPreview />}
                defaultRatio={0.5}
                minLeft={280}
                minRight={280}
                storageKey="resume-chef-canvas-split-ratio"
              />
            }
            right={
              <AgentPanel
                activeAgent={activeAgent}
                onAgentChange={setActiveAgent}
              />
            }
            defaultRatio={0.68}
            minLeft={560}
            minRight={300}
            storageKey="resume-chef-agent-split-ratio"
          />
        </main>
      )}

      {activeView === "resumes" && <MyResumesView onOpenCanvas={() => setActiveView("canvas")} />}
      {activeView === "settings" && <SettingsView />}
    </div>
  );
}

export default function AppWorkspace() {
  return (
    <ResumeProvider>
      <WorkspaceMain />
    </ResumeProvider>
  );
}
