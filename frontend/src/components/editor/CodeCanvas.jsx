import Editor from "@monaco-editor/react";
import { Code2, Minimize2, Maximize2 } from "lucide-react";
import { useResume } from "../../hooks/useResume";
import { useTheme } from "../../contexts/ThemeContext";
import { getEditorTheme } from "../../lib/monacoLatex";
import ErrorBoundary from "../ui/ErrorBoundary";

export default function CodeCanvas({ isCollapsed, onToggleCollapse }) {
  const { code, setCode } = useResume();
  const { theme } = useTheme();

  if (isCollapsed) {
    return (

      <div 
      className="flex flex-col items-center py-4 h-full cursor-pointer hover:bg-surface-container-low transition-colors group"
        onClick={onToggleCollapse}
        title="Open Editor"
      >
        <Maximize2 className="w-4 h-4 text-on-surface-variant mb-4 group-hover:text-on-surface" />
        <span 
          className="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface tracking-widest whitespace-nowrap" 
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          EDITOR
        </span>
        <Code2 className="w-5 h-5 mb-10 text-primary" />
        
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">LaTeX Editor</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-surface-container rounded transition-colors text-on-surface-variant hover:text-on-surface"
          title="Minimize Editor"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
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
