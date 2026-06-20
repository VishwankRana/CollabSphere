import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, MessageSquare } from "lucide-react";

import { getInterviewSocket } from "../lib/interviewSocket";
import IconLabel from "./IconLabel";

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

export default function ChatPanel({ roomId, readOnly = false, embedded = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <section
      className={`interview-chat-panel${embedded ? " interview-chat-panel--embedded" : ""}`}
    >
      <div className="interview-chat-header">
        <span className="chat-header-title">
          <IconLabel icon={MessageSquare} size={14}>
            Chat
          </IconLabel>
        </span>
        {!embedded ? <span className="comment-count">{messages.length}</span> : null}
      </div>

      <div className="interview-chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <MessageSquare size={28} strokeWidth={1.5} />
            <p>No messages yet</p>
            <span>Use chat to discuss the problem</span>
          </div>
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
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <p className="hero-copy interview-chat-readonly">Chat is closed because this interview has ended.</p>
      )}
    </section>
  );
}
