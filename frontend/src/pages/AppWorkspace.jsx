import { ResumeProvider } from "../hooks/useResume";
import AppHeader from "../components/layout/AppHeader";
import TemplateSidebar from "../components/editor/TemplateSidebar";
import CodeCanvas from "../components/editor/CodeCanvas";
import ElementsCanvas from "../components/editor/ElementsCanvas";
import PdfPreview from "../components/preview/PdfPreview";
import AtsPanel from "../components/ats/AtsPanel";
import AiChatWidget from "../components/chat/AiChatWidget";

export default function AppWorkspace() {
  return (
    <ResumeProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 flex min-h-0">
          <TemplateSidebar />
          <main className="flex-1 flex min-w-0 min-h-0">
            <section className="flex-1 min-w-0 border-r border-outline-variant bg-surface-container-lowest">
              <CodeCanvas elementsPanel={<ElementsCanvas />} />
            </section>
            <section className="w-[45%] min-w-[320px] max-w-[560px] shrink-0">
              <PdfPreview />
            </section>
          </main>
          <AtsPanel />
        </div>
        <AiChatWidget />
      </div>
    </ResumeProvider>
  );
}
