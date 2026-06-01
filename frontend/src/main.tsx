import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Message = {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  status?: "streaming" | "done" | "error";
};

const STORAGE_KEY = "tooagentcore-tester-config";
const SAMPLE_PROMPTS = [
  "What can you do?",
  "Tell me about PROD-001 and its warranty.",
  "What is the return policy for audio products?",
  "Can I return a USB-C Hub after 20 days?",
];

function readSavedConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<{
      endpoint: string;
      bearerToken: string;
      extraHeaders: string;
    }>;
  } catch {
    return {};
  }
}

function parseHeaders(extraHeaders: string, bearerToken: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "text/plain, application/json, */*",
  };

  if (bearerToken.trim()) {
    headers.authorization = `Bearer ${bearerToken.trim()}`;
  }

  if (extraHeaders.trim()) {
    const parsed = JSON.parse(extraHeaders) as Record<string, unknown>;
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers[key] = value;
      }
    });
  }

  return headers;
}

async function readResponse(response: Response, onChunk: (chunk: string) => void) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.body) {
    const text = await response.text();
    onChunk(formatBody(text, contentType));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }

  const tail = decoder.decode();
  if (tail) onChunk(tail);
}

function formatBody(text: string, contentType: string) {
  if (!contentType.includes("json")) return text;

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function App() {
  const savedConfig = useMemo(readSavedConfig, []);
  const [endpoint, setEndpoint] = useState(savedConfig.endpoint || "");
  const [bearerToken, setBearerToken] = useState(savedConfig.bearerToken || "");
  const [extraHeaders, setExtraHeaders] = useState(savedConfig.extraHeaders || "");
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<string>("Idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ endpoint, bearerToken, extraHeaders }),
    );
  }, [endpoint, bearerToken, extraHeaders]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmedEndpoint = endpoint.trim();
    const trimmedPrompt = prompt.trim();

    if (!trimmedEndpoint || !trimmedPrompt || isSending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedPrompt,
    };
    const agentMessage: Message = {
      id: crypto.randomUUID(),
      role: "agent",
      content: "",
      status: "streaming",
    };

    setMessages((current) => [...current, userMessage, agentMessage]);
    setIsSending(true);
    setLastStatus("Connecting");

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const started = performance.now();
      const headers = parseHeaders(extraHeaders, bearerToken);
      const response = await fetch(trimmedEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: trimmedPrompt }),
        signal: abortController.signal,
      });

      setLastStatus(`${response.status} ${response.statusText || "Response"}`);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Request failed with status ${response.status}`);
      }

      await readResponse(response, (chunk) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === agentMessage.id
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        );
      });

      const elapsed = Math.round(performance.now() - started);
      setLastStatus(`Done in ${elapsed} ms`);
      setMessages((current) =>
        current.map((message) =>
          message.id === agentMessage.id ? { ...message, status: "done" } : message,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error";
      setLastStatus(abortController.signal.aborted ? "Cancelled" : "Error");
      setMessages((current) =>
        current.map((item) =>
          item.id === agentMessage.id
            ? { ...item, content: message, status: "error" }
            : item,
        ),
      );
    } finally {
      abortRef.current = null;
      setIsSending(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  function clearMessages() {
    setMessages([]);
    setLastStatus("Idle");
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <h1>TooAgentCore Tester</h1>
          <p>Send prompts to the deployed customer-support agent and inspect streamed replies.</p>
        </div>
        <div className="status-pill">{lastStatus}</div>
      </section>

      <section className="workspace">
        <aside className="settings-panel" aria-label="Request settings">
          <label>
            Agent endpoint
            <input
              placeholder="https://your-agent-or-proxy.example.com/invoke"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
            />
          </label>

          <label>
            Bearer token
            <input
              type="password"
              placeholder="Optional"
              value={bearerToken}
              onChange={(event) => setBearerToken(event.target.value)}
            />
          </label>

          <label>
            Extra headers JSON
            <textarea
              rows={6}
              spellCheck={false}
              placeholder={'{\n  "x-api-key": "..." \n}'}
              value={extraHeaders}
              onChange={(event) => setExtraHeaders(event.target.value)}
            />
          </label>

          <div className="examples">
            {SAMPLE_PROMPTS.map((sample) => (
              <button key={sample} type="button" onClick={() => setPrompt(sample)}>
                {sample}
              </button>
            ))}
          </div>
        </aside>

        <section className="conversation" aria-label="Conversation">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <strong>Ready for a full-path test.</strong>
                <span>Configure the endpoint, send a prompt, and the agent output will stream here.</span>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`message ${message.role} ${message.status || ""}`} key={message.id}>
                  <div className="message-meta">
                    <span>{message.role === "user" ? "You" : "Agent"}</span>
                    {message.status ? <span>{message.status}</span> : null}
                  </div>
                  <pre>{message.content || "Waiting for stream..."}</pre>
                </article>
              ))
            )}
          </div>

          <form className="composer" onSubmit={submit}>
            <textarea
              rows={3}
              placeholder="Ask about products, return policies, or warranty details..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="actions">
              <button type="button" className="secondary" onClick={clearMessages}>
                Clear
              </button>
              {isSending ? (
                <button type="button" className="secondary" onClick={cancel}>
                  Cancel
                </button>
              ) : null}
              <button type="submit" disabled={!endpoint.trim() || !prompt.trim() || isSending}>
                Send
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
