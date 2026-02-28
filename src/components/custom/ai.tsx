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
  Plus,
  MessageSquare,
  Trash2,
  PlusCircle,
  CircleCheck,
  PanelLeftOpen,
  PanelLeftClose,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

interface ChatSession {
  id: string;
  title: string | null;
  updated_at: string;
}

interface DbMessage {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: string;
}

// ============================================================
//  CONSTANTS
// ============================================================

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PAGE_SIZE = 20;

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
  {
    icon: PlusCircle,
    label: "Add transaction",
    prompt: "I paid ₹500 to Swiggy for food today via UPI",
  },
];

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
  create_transaction: "Creating transaction",
};

// ============================================================
//  HELPERS
// ============================================================

function fmtRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateStr));
}

function titleFromMessage(content: string): string {
  return content.length > 42 ? content.slice(0, 42) + "…" : content;
}

// ============================================================
//  MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* avatar */}
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>

      <div
        className={`flex flex-col gap-1.5 min-w-0 ${isUser ? "items-end max-w-[78%]" : "items-start max-w-[84%]"}`}
      >
        {/* tool call badges */}
        {message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.toolCalls.map((tc, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-muted-foreground px-1.5 text-xs gap-1 h-5"
              >
                {tc.done ? (
                  <CircleCheck className="size-3 fill-green-500 dark:fill-green-400 text-white dark:text-black" />
                ) : (
                  <Loader className="size-3 animate-spin" />
                )}
                <span
                  className={
                    tc.name === "create_transaction" && tc.done
                      ? "text-green-600 dark:text-green-400"
                      : ""
                  }
                >
                  {TOOL_LABELS[tc.name] ?? tc.name}
                </span>
              </Badge>
            ))}
          </div>
        )}

        {/* text */}
        {message.content && (
          <div
            className={`rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

export function AiChat() {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // ── sidebar open state (mobile) ───────────────────────
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // ── chat sessions ─────────────────────────────────────
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [sessionsPage, setSessionsPage] = React.useState(0);
  const [sessionsTotal, setSessionsTotal] = React.useState(0);
  const [sessionsLoad, setSessionsLoad] = React.useState(false);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

  // ── messages ──────────────────────────────────────────
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasMoreSessions = sessions.length < sessionsTotal;

  // ── load sessions ─────────────────────────────────────
  const loadSessions = React.useCallback(async (page = 0, append = false) => {
    setSessionsLoad(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("ai_chats")
      .select("id, title, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (data) {
      setSessions((prev) =>
        append
          ? [...prev, ...(data as ChatSession[])]
          : (data as ChatSession[]),
      );
      setSessionsTotal(count ?? 0);
      setSessionsPage(page);
    }
    setSessionsLoad(false);
  }, []);

  React.useEffect(() => {
    loadSessions(0);
  }, [loadSessions]);

  // ── load chat messages ────────────────────────────────
  const loadChat = React.useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    setMessages([]);
    setError(null);
    setSidebarOpen(false); // close sidebar on mobile after selecting

    const { data } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        (data as DbMessage[]).map((m) => ({
          id: m.id,
          role: m.role as MessageRole,
          content: m.content,
          toolCalls: [],
        })),
      );
    }
  }, []);

  // ── new chat ──────────────────────────────────────────
  const startNewChat = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("ai_chats")
      .insert({ title: null })
      .select("id, title, updated_at")
      .single();

    if (!error && data) {
      setSessions((prev) => [data as ChatSession, ...prev]);
      setSessionsTotal((n) => n + 1);
      setActiveChatId(data.id);
      setMessages([]);
      setError(null);
      setSidebarOpen(false);
    }
  }, []);

  // ── delete chat ───────────────────────────────────────
  const deleteChat = React.useCallback(
    async (id: string) => {
      await supabase.from("ai_chats").delete().eq("id", id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setSessionsTotal((n) => Math.max(0, n - 1));
      if (activeChatId === id) {
        setActiveChatId(null);
        setMessages([]);
      }
    },
    [activeChatId],
  );

  // ── auto-scroll ───────────────────────────────────────
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── send ──────────────────────────────────────────────
  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      let chatId = activeChatId;
      if (!chatId) {
        const { data, error } = await supabase
          .from("ai_chats")
          .insert({ title: titleFromMessage(text) })
          .select("id, title, updated_at")
          .single();

        if (error || !data) {
          setError("Could not create chat session");
          return;
        }
        chatId = data.id;
        setActiveChatId(chatId);
        setSessions((prev) => [data as ChatSession, ...prev]);
        setSessionsTotal((n) => n + 1);
      }

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

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({ messages: history, chat_id: chatId }),
        });

        if (!res.ok || !res.body)
          throw new Error((await res.text()) || "AI service error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;

            try {
              const ev = JSON.parse(raw);

              if (ev.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + ev.content }
                      : m,
                  ),
                );
              }
              if (ev.type === "tool_call") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolCalls: [
                            ...m.toolCalls,
                            { name: ev.name, done: false },
                          ],
                        }
                      : m,
                  ),
                );
              }
              if (ev.type === "tool_result") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolCalls: m.toolCalls.map((tc) =>
                            tc.name === ev.name && !tc.done
                              ? { ...tc, done: true }
                              : tc,
                          ),
                        }
                      : m,
                  ),
                );
              }
              if (ev.type === "done" && ev.chat_id) {
                const firstUser =
                  messages.find((m) => m.role === "user") ?? userMsg;
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === ev.chat_id
                      ? {
                          ...s,
                          title: titleFromMessage(firstUser.content),
                          updated_at: new Date().toISOString(),
                        }
                      : s,
                  ),
                );
              }
              if (ev.type === "error") throw new Error(ev.message);
            } catch {
              /* skip malformed */
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
    [messages, streaming, activeChatId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };
  const isEmpty = messages.length === 0;

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="flex overflow-hidden" style={{ height: "100%" }}>
      {/* ══ SIDEBAR ══════════════════════════════════════════ */}

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
        flex flex-col w-56 shrink-0 border-r bg-background
        md:relative md:translate-x-0 md:flex
        fixed inset-y-0 left-0 z-30 transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chats
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={startNewChat}
              title="New chat"
            >
              <Plus className="size-3.5" />
            </Button>
            {/* mobile close */}
            <Button
              variant="ghost"
              size="icon"
              className="size-6 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessionsLoad && sessions.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-3 py-2.5 border-b">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted mb-1.5" />
                <div className="h-2.5 w-2/5 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-10 px-3 text-center text-muted-foreground">
              <MessageSquare className="size-5 opacity-40" />
              <span className="text-xs">No chats yet. Start one!</span>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadChat(s.id)}
                className={`group w-full flex items-start gap-2 px-3 py-2.5 border-b text-left hover:bg-muted/50 transition-colors ${
                  activeChatId === s.id ? "bg-muted" : ""
                }`}
              >
                <MessageSquare
                  className={`size-3.5 shrink-0 mt-0.5 ${
                    activeChatId === s.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs truncate leading-snug ${
                      activeChatId === s.id
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.title ?? "New chat"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {fmtRelative(s.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(s.id);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                  title="Delete chat"
                >
                  <Trash2 className="size-3" />
                </button>
              </button>
            ))
          )}

          {hasMoreSessions && (
            <button
              className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              onClick={() => loadSessions(sessionsPage + 1, true)}
              disabled={sessionsLoad}
            >
              {sessionsLoad ? (
                <Loader className="size-3 animate-spin mx-auto" />
              ) : (
                "Load more"
              )}
            </button>
          )}
        </div>
      </aside>

      {/* ══ MAIN CHAT AREA ═══════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 md:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeftOpen className="size-4" />
          </Button>

          <Sparkles className="size-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">
            {sessions.find((s) => s.id === activeChatId)?.title ??
              "AI Financial Assistant"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 ml-auto shrink-0"
            onClick={startNewChat}
            title="New chat"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">How can I help you today?</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Ask about your finances, add transactions, compare periods, or
                  get spending insights.
                </p>
              </div>

              {/* suggestion chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full max-w-lg">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-left text-xs hover:bg-muted transition-colors"
                  >
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* typing indicator */}
          {streaming &&
            messages.at(-1)?.role === "assistant" &&
            messages.at(-1)?.content === "" &&
            messages.at(-1)?.toolCalls.length === 0 && (
              <div className="flex gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="size-3.5" />
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2.5">
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t px-4 py-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="Ask about finances or say 'I paid ₹500 to Swiggy via UPI'…"
              disabled={streaming}
              rows={1}
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[38px] max-h-[120px]"
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0"
              disabled={streaming || !input.trim()}
            >
              {streaming ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
            AI can make mistakes — verify important financial data.
          </p>
        </div>
      </div>
    </div>
  );
}
