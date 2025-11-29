
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, Message } from "ai/react";
import MessageBubble from "./MessageBubble";

type ChatShellProps = {
  api: string; 
  title: string;
  subtitle: string;
};

export default function ChatShell({ api, title, subtitle }: ChatShellProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const key = `chat-session-${api}`;
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    setSessionId(sid);
  }, [api]);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
  } = useChat({
    api,
    body: useMemo(
      () => ({
        sessionId,
      }),
      [sessionId]
    ),
    streamProtocol: "text", 
  });


  useEffect(() => {
    if (!sessionId) return;
    const key = `chat-history-${api}-${sessionId}`;
    sessionStorage.setItem(key, JSON.stringify(messages));
  }, [messages, api, sessionId]);


  useEffect(() => {
    if (!sessionId) return;
    const key = `chat-history-${api}-${sessionId}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        const parsed: Message[] = JSON.parse(raw);
      } catch {
      }
    }
  }, [api, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const typing = isLoading;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;
    handleSubmit(e);
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div>
          <div className="chat-header-title">{title}</div>
          <div className="chat-header-sub">{subtitle}</div>
        </div>
      </header>

      <div className="chat-main">
        {messages.length === 0 && (
          <div className="chat-empty">
            Escribí tu primer mensaje para empezar la conversación ✨
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role as any}
            content={m.content}
          />
        ))}

        {typing && <div className="chat-typing">El asistente está escribiendo…</div>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        {error && (
          <div className="chat-error">
            {String(error.message || "Ocurrió un error")}
          </div>
        )}

        <div className="chat-form-row">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Escribí tu mensaje…"
            className="chat-textarea"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !sessionId}
            className="btn"
          >
            Enviar
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={!isLoading}
            onClick={() => stop()}
          >
            Detener
          </button>
        </div>
      </form>
    </div>
  );
}
