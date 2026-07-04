import { useState, useRef, useEffect } from "react";
import { Send, Wand2 } from "lucide-react";
import clsx from "clsx";
import { useResume } from "../../hooks/useResume";
import { chatWithAi } from "../../lib/api";
import Button from "../ui/Button";
import Strands from "../effects/Strands";

export default function AiChatWidget() {
  const { code, elements, updateSummary } = useResume();
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
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="relative flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <div className="w-full max-w-sm h-48 opacity-40">
            <Strands
              colors={["#2563EB", "#7C3AED", "#06B6D4"]}
              count={3}
              speed={0.5}
              amplitude={1}
              waviness={1}
              thickness={0.7}
              glow={2.6}
              taper={3}
              spread={1}
              intensity={0.6}
              saturation={1.5}
              opacity={1}
              scale={1.5}
              glass={false}
              refraction={1}
              dispersion={1}
              glassSize={1}
            />
          </div>
        </div>

        <div className="relative z-10 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              "max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-primary-bright text-on-primary"
                : "bg-surface-container text-on-surface",
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
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-outline-variant/40 shrink-0">
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
                className="text-xs px-2.5 py-1 rounded-lg bg-secondary-container text-primary hover:opacity-80 cursor-pointer"
              >
                {s.length > 40 ? s.slice(0, 40) + "…" : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex gap-2 items-end p-3 pb-8 border-t border-outline-variant/40 border-b shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Ask about your resume…"
          className="chat-input-glow flex-1 px-3 py-2 text-sm bg-surface-container-lowest/80 rounded-lg resize-none overflow-y-auto leading-relaxed"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
