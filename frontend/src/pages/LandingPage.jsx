import { LayoutTemplate, Code2, MousePointerClick, Sparkles, FileText } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function LandingPage({ onNavigateToResumes }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface">
      <div className="max-w-4xl mx-auto space-y-12 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-bright/20 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface">
            Craft Your Perfect Resume
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Resume Chef helps you build professional resumes in minutes. Choose the builder that fits your style, leverage AI to refine your content, and export to PDF instantly.
          </p>
          <div className="flex items-center justify-center pt-4">
            <Button size="lg" onClick={onNavigateToResumes} className="px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
              <Sparkles className="w-5 h-5 mr-2" />
              Create your first resume
            </Button>
          </div>
        </div>

        {/* Builder Types */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-on-surface text-center">
            Three Ways to Build
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center text-center p-8 bg-surface-container-lowest border-outline-variant/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">LaTeX Editor</h3>
              <p className="text-sm text-on-surface-variant">
                Full control over your resume layout with real-time compilation and syntax highlighting.
              </p>
            </Card>

            <Card className="flex flex-col items-center text-center p-8 bg-surface-container-lowest border-outline-variant/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                <LayoutTemplate className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">HTML Templates</h3>
              <p className="text-sm text-on-surface-variant">
                Modern web-based templates powered by HTML and CSS for beautiful designs.
              </p>
            </Card>

            <Card className="flex flex-col items-center text-center p-8 bg-surface-container-lowest border-outline-variant/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <MousePointerClick className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Drag & Drop</h3>
              <p className="text-sm text-on-surface-variant">
                Visual builder for quick and easy resume creation without touching any code.
              </p>
            </Card>
          </div>
        </div>

        {/* Perks Section */}
        <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/50">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-on-surface">
                Why use Resume Chef?
              </h2>
              <ul className="space-y-4">
                {[
                  { title: "AI-Powered Assistance", desc: "Get smart suggestions and ATS scoring right in the editor." },
                  { title: "Real-time Preview", desc: "See your changes instantly as you type or edit." },
                  { title: "Cloud Sync", desc: "Your resumes are saved automatically and securely." },
                  { title: "One-Click Export", desc: "Download pixel-perfect PDFs ready for your job applications." }
                ].map((perk, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface">{perk.title}</h4>
                      <p className="text-sm text-on-surface-variant">{perk.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl transform rotate-3" />
              <div className="relative bg-surface rounded-2xl shadow-xl border border-outline-variant p-6 h-64 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-primary-bright opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
