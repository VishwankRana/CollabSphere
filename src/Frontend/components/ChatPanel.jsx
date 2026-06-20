import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { getInterviewSocket } from "../lib/interviewSocket";

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ChatPanel({ roomId, readOnly = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = getInterviewSocket();

    const handleMessage = (message) => {
      setMessages((current) => [
        ...current,
        {
          id: `${message.timestamp}-${message.senderName}-${current.length}`,
          text: message.text,
          senderName: message.senderName,
          role: message.role,
          timestamp: message.timestamp,
        },
      ]);
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, [roomId]);

  useEffect(() => {
    if (!collapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, collapsed]);

  function sendMessage() {
    const trimmed = text.trim();

    if (!trimmed || readOnly || !roomId) {
      return;
    }

    getInterviewSocket().emit("chat:send", {
      roomId,
      text: trimmed,
    });
    setText("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <section className={`interview-chat-panel${collapsed ? " is-collapsed" : ""}`}>
      <div className="interview-chat-header">
        <div className="interview-chat-header-actions">
          {!collapsed ? (
            <span className="comment-count">{messages.length}</span>
          ) : null}
          <button
            type="button"
            className="btn-ghost btn-icon"
            aria-label={collapsed ? "Expand chat" : "Collapse chat"}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? "v" : "^"}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <>
          <div className="interview-chat-messages">
            {messages.length === 0 ? (
              <p className="comment-empty">No messages yet. Say hello to start the conversation.</p>
            ) : (
              messages.map((message) => (
                <article className="interview-chat-message" key={message.id}>
                  <div className="interview-chat-message-header">
                    <span
                      className={`interview-chat-avatar interview-chat-avatar--${message.role}`}
                    >
                      {getInitials(message.senderName)}
                    </span>
                    <div className="interview-chat-message-meta">
                      <strong className={`role-${message.role}`}>{message.senderName}</strong>
                    </div>
                    <time dateTime={new Date(message.timestamp).toISOString()}>
                      {formatTimestamp(message.timestamp)}
                    </time>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!readOnly ? (
            <div className="interview-chat-composer">
              <textarea
                className="comment-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
              />
              <button
                type="button"
                className="comment-submit"
                disabled={!text.trim()}
                aria-label="Send message"
                onClick={sendMessage}
              >
                &rarr;
              </button>
            </div>
          ) : (
            <p className="hero-copy">Chat is closed because this interview has ended.</p>
          )}
        </>
      ) : null}
    </section>
  );
}
