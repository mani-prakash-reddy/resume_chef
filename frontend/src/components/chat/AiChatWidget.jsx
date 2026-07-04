import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Wand2,
} from "lucide-react";
import clsx from "clsx";
import { useResume } from "../../hooks/useResume";
import { chatWithAi } from "../../lib/api";
import Button from "../ui/Button";

export default function AiChatWidget() {
  const { code, elements, updateSummary } = useResume();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your resume assistant. Ask me to improve bullets, tailor your summary, or suggest changes for a specific role.",
    },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await chatWithAi({
        messages: nextMessages,
        resumeContext: { code, elements },
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(suggestion) {
    if (suggestion.toLowerCase().includes("summary")) {
      updateSummary(
        elements.summary +
          " Delivered measurable impact across cross-functional teams.",
      );
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Applied suggestion: "${suggestion}"`,
      },
    ]);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-bright text-on-primary shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center cursor-pointer"
        aria-label="Open AI chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary-container rounded-full border-2 border-surface-container-lowest" />
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "fixed z-50 flex flex-col bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl overflow-hidden transition-all",
        expanded
          ? "inset-4 md:inset-8"
          : "bottom-6 right-6 w-[380px] h-[520px] max-h-[calc(100vh-48px)]",
      )}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-bright flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-on-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-on-surface">
              AI Resume Assistant
            </div>
            <div className="text-xs text-on-surface-variant">
              Chat & apply updates
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => setExpanded((e) => !e)}
            label={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </IconButton>
          <IconButton onClick={() => setOpen(false)} label="Close">
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-primary-bright text-on-primary rounded-br-md"
                : "bg-surface-container text-on-surface rounded-bl-md",
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-on-surface-variant animate-pulse px-2">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-outline-variant bg-surface-container-low shrink-0">
          <div className="text-xs font-semibold text-on-surface-variant mb-2 flex items-center gap-1">
            <Wand2 className="w-3 h-3" />
            Quick suggestions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySuggestion(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary-container text-primary hover:opacity-80 cursor-pointer"
              >
                {s.length > 40 ? s.slice(0, 40) + "…" : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex gap-2 p-3 border-t border-outline-variant shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your resume…"
          className="flex-1 px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary-bright focus:outline-none"
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
    >
      {children}
    </button>
  );
}
