import { useState } from "react";
import { ResumeProvider } from "../hooks/useResume";
import AppHeader from "../components/layout/AppHeader";
import AgentPanel from "../components/layout/AgentPanel";
import CodeCanvas from "../components/editor/CodeCanvas";
import PdfPreview from "../components/preview/PdfPreview";
import ResizableSplitPane from "../components/layout/ResizableSplitPane";
import MyResumesView from "./MyResumesView";
import TemplatesView from "./TemplatesView";
import SettingsView from "./SettingsView";

export default function AppWorkspace() {
  const [activeView, setActiveView] = useState("canvas");
  const [activeAgent, setActiveAgent] = useState("resume");

  return (
    <ResumeProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <AppHeader activeView={activeView} onViewChange={setActiveView} />

        {activeView === "canvas" && (
          <main className="flex-1 flex min-w-0 min-h-0">
            <ResizableSplitPane
              left={
                <ResizableSplitPane
                  left={<CodeCanvas />}
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
        {activeView === "templates" && <TemplatesView />}
        {activeView === "settings" && <SettingsView />}
      </div>
    </ResumeProvider>
  );
}
