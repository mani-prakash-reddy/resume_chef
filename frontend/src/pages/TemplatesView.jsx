import clsx from "clsx";
import { LayoutTemplate } from "lucide-react";
import { TEMPLATES } from "../data/defaults";
import { useResume } from "../hooks/useResume";
import Card from "../components/ui/Card";

export default function TemplatesView() {
  const { template, setTemplate } = useResume();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-on-surface">Templates</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Choose a starting layout for your resume. You can customize everything
            in the code editor.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className="text-left cursor-pointer"
            >
              <Card
                className={clsx(
                  "h-full transition-colors hover:border-primary-bright/40",
                  template === t.id && "border-primary-bright ring-2 ring-primary-bright/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface">
                      {t.name}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {t.description}
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
