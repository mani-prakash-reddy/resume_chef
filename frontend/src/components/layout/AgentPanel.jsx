import { useState } from "react";
import clsx from "clsx";
import { Sparkles, Target } from "lucide-react";
import AiChatWidget from "../chat/AiChatWidget";
import AtsPanel from "../ats/AtsPanel";

const agents = [
  { id: "resume", label: "Resume Agent", icon: Sparkles },
  { id: "ats", label: "ATS Agent", icon: Target },
];

export default function AgentPanel({ activeAgent, onAgentChange }) {
  // ATS context injected into the chat agent when "Improve Resume" is clicked.
  // This is the hidden system message that primes the chat agent with the ATS results.
  const [atsContext, setAtsContext] = useState(null);

  function handleImproveResume(context) {
    setAtsContext(context);
    onAgentChange("resume"); // Switch to the Resume Agent tab
  }

  function handleClearAtsContext() {
    setAtsContext(null);
  }

  return (
    <aside className="agent-window-glass agent-panel-sidebar flex flex-col flex-1 min-h-0 min-w-0">
      <div
        className="flex shrink-0 p-1.5 gap-1 bg-surface-container-low border-b border-outline-variant"
        role="tablist"
        aria-label="AI agents"
      >
        {agents.map(({ id, label, icon: Icon }) => {
          const active = activeAgent === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onAgentChange(id)}
              id={`agent-tab-${id}`}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                active
                  ? "bg-primary-bright text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeAgent === "resume" && (
          <AiChatWidget
            atsContext={atsContext}
            onClearAtsContext={handleClearAtsContext}
          />
        )}
        {activeAgent === "ats" && (
          <AtsPanel onImproveResume={handleImproveResume} />
        )}
      </div>
    </aside>
  );
}
