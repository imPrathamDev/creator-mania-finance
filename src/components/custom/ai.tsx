"use client";

import * as React from "react";
import {
  Send,
  Bot,
  User,
  Loader,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Tag,
  BarChart3,
  Clock,
  Landmark,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "../ui/textarea";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ============================================================
//  TYPES
// ============================================================

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls: { name: string; done: boolean }[];
}

// ============================================================
//  SUGGESTION CHIPS
// ============================================================

const SUGGESTIONS = [
  {
    icon: BarChart3,
    label: "Monthly overview",
    prompt: "Give me a complete overview of this month's finances",
  },
  {
    icon: TrendingUp,
    label: "Top income",
    prompt: "What are my top income transactions this month?",
  },
  {
    icon: TrendingDown,
    label: "Top expenses",
    prompt: "What are my biggest expenses this month?",
  },
  {
    icon: Clock,
    label: "Pending payments",
    prompt: "What payments are pending or overdue right now?",
  },
  {
    icon: Users,
    label: "Top contacts",
    prompt: "Who are my most active clients and vendors this quarter?",
  },
  {
    icon: Tag,
    label: "Spending by tag",
    prompt: "Break down my expenses by tag this month",
  },
  {
    icon: Landmark,
    label: "Payment methods",
    prompt: "Show me payment method breakdown for this month",
  },
  {
    icon: RefreshCcw,
    label: "vs last month",
    prompt: "How does this month compare to last month?",
  },
];

// ============================================================
//  TOOL LABELS
// ============================================================

const TOOL_LABELS: Record<string, string> = {
  get_summary: "Fetching summary stats",
  get_comparison: "Comparing periods",
  get_pending: "Checking pending payments",
  get_tag_breakdown: "Analyzing tags",
  get_top_contacts: "Finding top contacts",
  get_top_transactions: "Loading top transactions",
  get_payment_methods: "Analyzing payment methods",
  search_transactions: "Searching transactions",
  search_contacts: "Searching contacts",
  list_tags: "Loading tags",
};

// ============================================================
//  MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Content */}
      <div
        className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Tool call indicators */}
        {message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-muted-foreground px-1.5 text-xs gap-1"
              >
                {tc.done ? (
                  <span className="text-green-500">✓</span>
                ) : (
                  <Loader className="size-3 animate-spin" />
                )}
                {TOOL_LABELS[tc.name] ?? tc.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Text bubble */}
        {message.content && (
          <div
            className={`rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`;

export function AiChat() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // auto-scroll on new content
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── send message ────────────────────────────────────────

  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setStreaming(true);

      // placeholder assistant message — we'll fill it in as we stream
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);

      try {
        // build history for the edge function
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          throw new Error(err || "Failed to reach AI service");
        }

        // read SSE stream
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;

            try {
              const event = JSON.parse(raw);

              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m,
                  ),
                );
              }

              if (event.type === "tool_call") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolCalls: [
                            ...m.toolCalls,
                            { name: event.name, done: false },
                          ],
                        }
                      : m,
                  ),
                );
              }

              if (event.type === "tool_result") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolCalls: m.toolCalls.map((tc) =>
                            tc.name === event.name && !tc.done
                              ? { ...tc, done: true }
                              : tc,
                          ),
                        }
                      : m,
                  ),
                );
              }

              if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      } catch (err: any) {
        setError(err.message ?? "Something went wrong");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, anonKey],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const isEmpty = messages.length === 0;

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Messages ───────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 flex flex-col gap-4"
      >
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Sparkles className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">How can I help you today?</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Ask about your finances, filter transactions, compare periods,
                or get spending insights.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => handleSuggestion(prompt)}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
                >
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* streaming typing dots */}
        {streaming &&
          messages.at(-1)?.role === "assistant" &&
          messages.at(-1)?.content === "" &&
          messages.at(-1)?.toolCalls.length === 0 && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

        {error && (
          <div className="mx-auto rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────── */}
      <div className="border-t px-4 lg:px-6 py-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Ask about your finances… (Enter to send, Shift+Enter for new line)"
            disabled={streaming}
            rows={3}
            className="flex-1 resize-none disabled:cursor-not-allowed disabled:opacity-50 min-h-10 max-h-30"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0"
            disabled={streaming || !input.trim()}
          >
            {streaming ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI can make mistakes. Verify important financial data.
        </p>
      </div>
    </div>
  );
}
