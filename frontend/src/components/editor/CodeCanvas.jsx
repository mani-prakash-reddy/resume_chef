import { lazy, Suspense } from "react";
import { Code2, LayoutTemplate } from "lucide-react";
import Tabs from "../ui/Tabs";
import { useResume } from "../../hooks/useResume";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const editorTabs = [
  { id: "code", label: "Code", icon: <Code2 className="w-4 h-4" /> },
  {
    id: "elements",
    label: "Elements",
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
];

export default function CodeCanvas({ elementsPanel }) {
  const { code, setCode, editorMode, setEditorMode } = useResume();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-outline-variant shrink-0">
        <Tabs tabs={editorTabs} active={editorMode} onChange={setEditorMode} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {editorMode === "code" ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-sm text-on-surface-variant">
                Loading editor…
              </div>
            }
          >
            <MonacoEditor
              height="100%"
              language="latex"
              theme="vs"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </Suspense>
        ) : (
          <div className="h-full overflow-y-auto p-4">{elementsPanel}</div>
        )}
      </div>
    </div>
  );
}
