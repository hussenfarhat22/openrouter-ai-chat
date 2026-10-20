
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  model?: string;
};

type Conversation = {
  id: number;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const models = [
  { id: "openai/gpt-4o-mini", label: "OpenAI: GPT-4o mini" },
  { id: "anthropic/claude-haiku-5.5", label: "Anthropic: Claude Haiku" },
  { id: "google/gemini-3.8-flash", label: "Google: Gemini Flash" },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    label: "Meta: Llama 3.3",
  },
  {
    id: "mistralai/mistral-large-4-0",
    label: "Mistral: Large 4",
  },
];

export default function Home() {
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
const [activeConversationId, setActiveConversationId] = useState<number | null>(
  null
);

const [storageLoaded, setStorageLoaded] = useState(false);

useEffect(() => {
  try {
    const saved = localStorage.getItem("openrouter-conversations");

    if (saved) {
      const parsed = JSON.parse(saved) as Conversation[];

      setConversations(parsed);

      if (parsed.length > 0) {
        setActiveConversationId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  } catch (error) {
    console.error("Could not load saved conversations:", error);
  } finally {
    setStorageLoaded(true);
  }
}, []);


useEffect(() => {
  if (!storageLoaded) return;

  localStorage.setItem(
    "openrouter-conversations",
    JSON.stringify(conversations)
  );
}, [conversations, storageLoaded]);



useEffect(() => {
  if (!storageLoaded || activeConversationId === null) return;

  setConversations((previous) =>
    previous.map((conversation) =>
      conversation.id === activeConversationId
        ? {
            ...conversation,
            messages,
            updatedAt: Date.now(),
          }
        : conversation
    )
  );
}, [messages, activeConversationId, storageLoaded]);



  async function handleSend() {
    const text = input.trim();

    if (!text || isLoading) return;


    const conversationId = activeConversationId ?? Date.now();

if (activeConversationId === null) {
  setActiveConversationId(conversationId);

  setConversations((previous) => [
    ...previous,
    {
      id: conversationId,
      title: text.slice(0, 40),
      messages: [],
      updatedAt: Date.now(),
    },
  ]);
}






    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    const assistantId = Date.now() + 1;
    const selectedLabel =
      models.find((model) => model.id === selectedModel)?.label ??
      selectedModel;

    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      model: selectedLabel,
    };

    const conversation = [...messages, userMessage];

    setMessages([...conversation, assistantMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversation.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error("The server returned an empty response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message
          )
        );
      }

      const finalChunk = decoder.decode();

      if (finalChunk) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + finalChunk }
              : message
          )
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: item.content || "I couldn't generate a response.",
              }
            : item
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
      }`}
    >
      <aside
  className={`${
    isSidebarOpen
      ? "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-xl sm:relative sm:z-auto sm:w-64 sm:max-w-none sm:shadow-none"
      : "hidden sm:flex"
  } shrink-0 flex-col border-r p-4 ${
    darkMode
      ? "border-zinc-800 bg-zinc-900"
      : "border-zinc-200 bg-zinc-50"
  }`}
>
        <div className="mb-6 flex items-center justify-between">
  <h1 className="text-lg font-semibold">✳ OpenRouter Chat</h1>

  <button
    type="button"
    onClick={() => setIsSidebarOpen(false)}
    aria-label="Close chat history"
    className="rounded-lg px-3 py-2 text-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 sm:hidden"
  >
    ✕
  </button>
</div>

        <button
         onClick={() => {
  setMessages([]);
  setActiveConversationId(null);
  setError("");
   setIsSidebarOpen(false);
}}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm hover:bg-zinc-200/60 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          + New chat
        </button>

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Your chats
        </p>

        
<div className="flex flex-col gap-1">
  {conversations.length === 0 ? (
    <p className="px-3 py-2 text-sm text-zinc-500">
      No conversations yet
    </p>
  ) : (
    [...conversations]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((conversation) => (
        
<div
  key={conversation.id}
  className={`group flex items-center gap-1 rounded-lg ${
    activeConversationId === conversation.id
      ? "bg-zinc-200 dark:bg-zinc-800"
      : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
  }`}
>
  <button
    onClick={() => {
  setActiveConversationId(conversation.id);
  setMessages(conversation.messages);
  setError("");
  setIsSidebarOpen(false);
}}
    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
    title={conversation.title}
  >
    {conversation.title}
  </button>

  <button
    onClick={() => {
      const newTitle = window.prompt(
        "Enter a new conversation title:",
        conversation.title
      );

      if (newTitle?.trim()) {
        setConversations((previous) =>
          previous.map((item) =>
            item.id === conversation.id
              ? { ...item, title: newTitle.trim() }
              : item
          )
        );
      }
    }}
    aria-label={`Rename ${conversation.title}`}
    title="Rename conversation"
    className="px-1 py-2 text-xs text-zinc-500 hover:text-blue-500"
  >
    ✎
  </button>

  <button
    onClick={() => {
      const confirmed = window.confirm(
        `Delete "${conversation.title}"? This cannot be undone.`
      );

      if (!confirmed) return;

      const remaining = conversations.filter(
        (item) => item.id !== conversation.id
      );

      setConversations(remaining);

      if (activeConversationId === conversation.id) {
        setActiveConversationId(null);
        setMessages([]);
        setError("");
      }
    }}
    aria-label={`Delete ${conversation.title}`}
    title="Delete conversation"
    className="px-2 py-2 text-xs text-zinc-500 hover:text-red-500"
  >
    ×
  </button>
</div>

      ))
  )}
</div>


        <div className="mt-auto text-xs text-zinc-500">
          AI Chat · Learning project
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex items-center justify-between border-b px-4 py-3 sm:px-6 ${
            darkMode ? "border-zinc-800" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2 sm:hidden">
  <button
    type="button"
    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
    aria-label={isSidebarOpen ? "Close chat history" : "Open chat history"}
    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
  >
    ☰
  </button>

  <span className="font-medium">✳ OpenRouter Chat</span>
</div>

          <div className="ml-auto flex items-center gap-3">
            <label htmlFor="model" className="text-sm text-zinc-500">
              Model
            </label>

            <select
              id="model"
              value={selectedModel}
              disabled={isLoading}
              onChange={(event) => setSelectedModel(event.target.value)}
              className={`max-w-48 rounded-lg border px-3 py-2 text-sm ${
                darkMode
                  ? "border-zinc-700 bg-zinc-900"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto mt-12 max-w-2xl">
              <h2 className="text-center text-3xl font-semibold tracking-tight">
                Your AI workspace
              </h2>

              <p className="mt-3 text-center text-zinc-500">
                Choose a model and start a conversation.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["✍️", "Write something", "Help me draft a message"],
                  ["💡", "Explain a concept", "Teach me something new"],
                  ["💻", "Help with code", "Debug or explain code"],
                  ["🧠", "Brainstorm ideas", "Explore some possibilities"],
                ].map(([icon, title, description]) => (
                  <button
                    key={title}
                    onClick={() => setInput(description)}
                    className={`rounded-xl border p-4 text-left transition ${
                      darkMode
                        ? "border-zinc-800 hover:bg-zinc-900"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{icon}</span>
                    <p className="mt-3 font-medium">{title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {message.role === "user" ? "You" : message.model}
                  </p>

                  
<div className="break-words leading-7">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      pre: ({ children }) => (
        <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
          {children}
        </pre>
      ),
      code: ({ children, className }) => (
        <code
          className={`${className ?? ""} rounded bg-zinc-100 px-1 py-0.5 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100`}
        >
          {children}
        </code>
      ),
      a: ({ children, href }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {children}
        </a>
      ),
    }}
  >
    {message.content}
  </ReactMarkdown>

  {message.role === "assistant" &&
    isLoading &&
    message.id === messages[messages.length - 1]?.id && (
      <span className="ml-1 animate-pulse">▍</span>
    )}
</div>

                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mx-auto mt-4 max-w-3xl text-sm text-red-500">
              Error: {error}
            </p>
          )}
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className="w-full px-4 pb-5 sm:px-8"
        >
          <div
            className={`mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border p-3 ${
              darkMode
                ? "border-zinc-700 bg-zinc-900"
                : "border-zinc-300 bg-white"
            }`}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Message your AI..."
              rows={2}
              disabled={isLoading}
              className="max-h-40 min-w-0 flex-1 resize-y bg-transparent p-2 text-sm outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900"
            >
              {isLoading ? "Thinking..." : "Send ↑"}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-zinc-500">
            Responses are generated through OpenRouter.
          </p>
        </form>
      </main>
    </div>
  );
}
