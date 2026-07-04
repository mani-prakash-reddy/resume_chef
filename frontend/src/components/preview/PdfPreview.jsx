import { useEffect, useCallback, useRef, useState } from "react";
import { RefreshCw, Download, FileText } from "lucide-react";
import { useResume } from "../../hooks/useResume";
import {
  compileLatexToPdfUrl,
  preloadLatexCompiler,
} from "../../lib/swiftlatexPreview";
import Button from "../ui/Button";

const DEBOUNCE_MS = 900;

export default function PdfPreview() {
  const {
    code,
    previewHtml,
    setPreviewHtml,
    previewLoading,
    setPreviewLoading,
  } = useResume();

  const debounceRef = useRef(null);
  const [compileError, setCompileError] = useState(null);

  useEffect(() => {
    preloadLatexCompiler();
  }, []);

  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    setCompileError(null);
    try {
      const pdfUrl = await compileLatexToPdfUrl(code);
      setPreviewHtml(pdfUrl);
    } catch (err) {
      setPreviewHtml(null);
      setCompileError(err?.message || "Compilation failed");
    } finally {
      setPreviewLoading(false);
    }
  }, [code, setPreviewHtml, setPreviewLoading]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refreshPreview();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refreshPreview]);

  function handleDownload() {
    if (!previewHtml) return;
    const link = document.createElement("a");
    link.href = previewHtml;
    link.download = "resume.pdf";
    link.click();
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-container-low">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-on-surface shrink-0">
            PDF Preview
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            disabled={previewLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${previewLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={!previewHtml}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4 bg-surface-container-low">
        <div className="w-full h-full overflow-hidden border border-outline-variant shadow-lg bg-white">
          {previewLoading && !previewHtml ? (
            <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-sm text-on-surface-variant bg-white px-6 text-center">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              Compiling PDF…
              <span className="text-xs">
                First compile may take a moment (fetching TeX packages)
              </span>
            </div>
          ) : compileError ? (
            <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-sm bg-white px-6 py-8 overflow-auto">
              <p className="font-semibold text-error">Compilation error</p>
              <pre className="text-xs text-on-surface-variant whitespace-pre-wrap text-left w-full max-h-64 overflow-auto">
                {compileError}
              </pre>
              <Button size="sm" onClick={refreshPreview}>
                Retry
              </Button>
            </div>
          ) : previewHtml ? (
            <iframe
              title="Resume PDF Preview"
              src={previewHtml}
              className="border-0 block w-full h-full bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant gap-2 w-full h-full bg-white">
              <FileText className="w-10 h-10 opacity-40" />
              <p className="text-sm">No preview available</p>
              <Button size="sm" onClick={refreshPreview}>
                Compile PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
