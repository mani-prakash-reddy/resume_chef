import { useEffect, useCallback } from "react";
import { RefreshCw, Download, FileText } from "lucide-react";
import { useResume } from "../../hooks/useResume";
import { generatePdfPreview } from "../../lib/api";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function PdfPreview() {
  const {
    code,
    elements,
    template,
    previewHtml,
    setPreviewHtml,
    previewLoading,
    setPreviewLoading,
  } = useResume();

  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const result = await generatePdfPreview({ code, elements, template });
      setPreviewHtml(result.html || result.previewHtml);
    } finally {
      setPreviewLoading(false);
    }
  }, [code, elements, template, setPreviewHtml, setPreviewLoading]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-container-low">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">
            PDF Preview
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            disabled={previewLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${previewLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <Card padding={false} className="w-full max-w-[595px] shadow-lg">
          {previewLoading && !previewHtml ? (
            <div className="flex items-center justify-center h-[842px] text-sm text-on-surface-variant">
              Generating preview…
            </div>
          ) : previewHtml ? (
            <iframe
              title="Resume PDF Preview"
              srcDoc={previewHtml}
              className="w-full border-0 rounded-2xl"
              style={{ height: "842px" }}
              sandbox=""
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[842px] text-on-surface-variant gap-2">
              <FileText className="w-10 h-10 opacity-40" />
              <p className="text-sm">No preview available</p>
              <Button size="sm" onClick={refreshPreview}>
                Generate Preview
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
