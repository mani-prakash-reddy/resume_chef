import { useState, useRef, useEffect } from "react";
import { Send, Wand2, AlertCircle, Zap } from "lucide-react";
import clsx from "clsx";
import { useResume } from "../../hooks/useResume";
import { chatWithAi } from "../../lib/api";
import Button from "../ui/Button";
import Strands from "../effects/Strands";

export default function AiChatWidget({ atsContext = null, onClearAtsContext }) {
  const { code, elements, resumeId, builderType } = useResume();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(null); // "Reading resume..." | "Patching resume..."
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your resume assistant. Ask me to improve bullets, tailor your summary, or suggest changes for a specific role.",
    },
  ]);
  const [quotaError, setQuotaError] = useState(null); // {type, detail}
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // If ATS context is injected, show a banner and auto-trigger
  useEffect(() => {
    if (atsContext) {
      const banner = {
        role: "assistant",
        content:
          "📊 I've loaded your ATS analysis. I'll read your resume and propose targeted edits to improve your score. Give me a moment…",
        isSystem: true,
      };
      setMessages((prev) => [...prev, banner]);
      // Auto-send the improve request
      streamMessage([], atsContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atsContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  function appendToken(token) {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last?.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + token },
        ];
      }
      // Start a new streaming message
      return [...prev, { role: "assistant", content: token, streaming: true }];
    });
  }

  function finalizeStreamingMessage() {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.streaming) {
        return [...prev.slice(0, -1), { ...last, streaming: false }];
      }
      return prev;
    });
  }

  async function streamMessage(history, injectedAtsContext = null) {
    if (loading) return;
    setLoading(true);
    setStatusText(null);
    setQuotaError(null);

    // Build conversation history for the API (exclude our isSystem banner messages)
    const apiMessages = history.filter((m) => !m.isSystem);

    await chatWithAi({
      messages: apiMessages,
      resumeId,
      builderType,
      atsContext: injectedAtsContext,
      onToken: (token) => appendToken(token),
      onStatus: (status) => setStatusText(status),
      onPatch: (patchResult) => {
        // Future: trigger diff view in editor
        console.log("Patch applied:", patchResult);
        setStatusText(null);
      },
      onDone: () => {
        finalizeStreamingMessage();
        setStatusText(null);
        setLoading(false);
        onClearAtsContext?.();
      },
      onError: (err) => {
        setStatusText(null);
        setLoading(false);
        if (err?.type === "quota_exceeded" || err?.type === "insufficient_credits") {
          setQuotaError(err);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `⚠️ ${typeof err === "string" ? err : "Something went wrong. Please try again."}` },
          ]);
        }
      },
    });
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    await streamMessage(nextMessages);
  }

  const isWysiwyg = builderType === "wysiwyg";
  const noResume = !resumeId;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* WYSIWYG warning */}
      {isWysiwyg && (
        <div className="mx-4 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          AI editing is only available for code-based resumes. I can still answer questions and give suggestions.
        </div>
      )}

      {/* Messages */}
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
                  : msg.isSystem
                  ? "bg-primary/10 border border-primary/20 text-on-surface italic"
                  : "bg-surface-container text-on-surface",
              )}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current animate-pulse rounded-sm" />
              )}
            </div>
          ))}

          {/* Tool call status indicator */}
          {statusText && (
            <div className="text-xs text-primary animate-pulse px-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              {statusText}
            </div>
          )}

          {/* General loading indicator (before first token) */}
          {loading && !statusText && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="text-xs text-on-surface-variant animate-pulse px-2">
              Thinking…
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quota / credits error overlay */}
      {quotaError && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-amber-800">
                {quotaError.type === "quota_exceeded"
                  ? "Daily limit reached"
                  : "Insufficient credits"}
              </div>
              <div className="text-amber-700 text-xs mt-0.5">
                {quotaError.detail?.message || "You've run out of free AI messages for today."}
              </div>
              <div className="flex gap-2 mt-2.5">
                <Button size="sm" id="upgrade-from-chat-btn">
                  Upgrade to Pro
                </Button>
                <button
                  type="button"
                  className="text-xs text-amber-700 underline underline-offset-2"
                  onClick={() => setQuotaError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No resume warning */}
      {noResume && (
        <div className="mx-4 mb-2 p-2 bg-surface-container rounded-lg text-xs text-on-surface-variant text-center">
          Save or create a resume first to enable AI editing.
        </div>
      )}

      {/* Input form */}
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
          placeholder={noResume ? "Create a resume first…" : "Ask about your resume…"}
          disabled={loading || noResume}
          className="chat-input-glow flex-1 px-3 py-2 text-sm bg-surface-container-lowest/80 rounded-lg resize-none overflow-y-auto leading-relaxed disabled:opacity-50"
          id="chat-input"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !input.trim() || noResume}
          className="shrink-0"
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
