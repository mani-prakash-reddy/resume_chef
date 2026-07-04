import { FileText, Plus } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function MyResumesView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-on-surface">My Resumes</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Saved resumes will appear here.
            </p>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New resume
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-on-surface-variant/40 mb-3" />
          <p className="text-sm text-on-surface-variant">
            No saved resumes yet. Start editing in Canvas and save when you are
            ready.
          </p>
        </Card>
      </div>
    </div>
  );
}
