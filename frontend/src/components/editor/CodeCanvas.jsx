import Editor from "@monaco-editor/react";
import { Code2 } from "lucide-react";
import { useResume } from "../../hooks/useResume";
import { useTheme } from "../../contexts/ThemeContext";
import { getEditorTheme } from "../../lib/monacoLatex";
import ErrorBoundary from "../ui/ErrorBoundary";

export default function CodeCanvas() {
  const { code, setCode } = useResume();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
        <Code2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-on-surface">LaTeX Editor</span>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ErrorBoundary>
          <Editor
            height="100%"
            language="latex"
            theme={getEditorTheme(theme)}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            loading={
              <div className="flex items-center justify-center h-full text-sm text-on-surface-variant">
                Loading editor…
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              bracketPairColorization: { enabled: true },
              matchBrackets: "always",
              automaticLayout: true,
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
