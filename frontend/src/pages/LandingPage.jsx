import { ChefHat, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";

const features = [
  {
    title: "Code & Elements Editor",
    description:
      "Switch between LaTeX code view and a visual elements canvas. Edit contact, experience, skills, and more.",
  },
  {
    title: "Live PDF Preview",
    description:
      "See your resume render in real time as you edit. Export polished PDFs ready to send.",
  },
  {
    title: "AI Resume Assistant",
    description:
      "Chat with AI to refine bullets, tailor content for job postings, and apply suggestions instantly.",
  },
  {
    title: "ATS Score Analyzer",
    description:
      "Get an ATS compatibility score, keyword gaps, and actionable tips to pass automated screening.",
  },
];

export default function LandingPage() {
  const appUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//app.${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`
      : "http://app.localhost:5173";

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-surface/80 border-b border-outline-variant">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-bright flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-on-primary" />
            </div>
            <span className="text-lg font-bold text-on-surface">Resume Chef</span>
          </div>
          <a href={appUrl}>
            <Button size="sm">
              Open App
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge />
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">
              Build resumes that pass ATS and impress recruiters
            </h1>
            <p className="mt-6 text-lg text-on-surface-variant leading-relaxed">
              Resume Chef combines a powerful code and visual editor, live PDF
              preview, AI writing assistant, and ATS scoring — all in one
              professional workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={appUrl}>
                <Button size="lg">
                  Start Building
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <Button variant="secondary" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                See Features
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="bg-surface-container-lowest border-y border-outline-variant">
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16">
            <h2 className="text-2xl font-semibold text-on-surface mb-10">
              Everything you need to craft the perfect resume
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border border-outline-variant bg-surface hover:bg-surface-container-low transition-colors"
                >
                  <h3 className="text-lg font-semibold text-on-surface mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 text-center">
          <h2 className="text-2xl font-semibold text-on-surface mb-4">
            Ready to cook up your next resume?
          </h2>
          <p className="text-on-surface-variant mb-8">
            Access the workspace at{" "}
            <code className="px-2 py-1 bg-surface-container rounded-lg text-sm">
              app.localhost:5173
            </code>
          </p>
          <a href={appUrl}>
            <Button size="lg">
              Launch Workspace
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </section>
      </main>

      <footer className="border-t border-outline-variant py-6">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 text-center text-sm text-on-surface-variant">
          © {new Date().getFullYear()} Resume Chef
        </div>
      </footer>
    </div>
  );
}

function Badge() {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container text-primary">
      AI-Powered Resume Builder
    </span>
  );
}
