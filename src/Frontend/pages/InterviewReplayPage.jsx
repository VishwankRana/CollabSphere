import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { formatDistanceToNow } from "date-fns";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pause, Play } from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import AppTopBar from "../components/AppTopBar";
import IconLabel from "../components/IconLabel";
import CodeOutputPanel from "../components/CodeOutputPanel";
import { apiRequest } from "../lib/api";
import { applyCodescreenMonacoTheme } from "../lib/monacoTheme";
import { MONACO_LANGUAGE_IDS } from "../lib/interview";
import {
  formatReplayOffset,
  getChatMessagesAtTime,
  getCodeAtTime,
  getLanguageAtTime,
  getReplayBounds,
  getRunResultAtTime,
} from "../lib/interviewReplay";

const PLAYBACK_SPEEDS = [1, 2, 5];

export default function InterviewReplayPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [events, setEvents] = useState([]);
  const [sampled, setSampled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { startMs, durationMs } = useMemo(() => getReplayBounds(events), [events]);

  const replayCode = useMemo(
    () => getCodeAtTime(events, startMs, currentTimeMs),
    [events, startMs, currentTimeMs]
  );

  const replayLanguage = useMemo(
    () => getLanguageAtTime(events, startMs, currentTimeMs, room?.language || "javascript"),
    [events, startMs, currentTimeMs, room?.language]
  );

  const replayRunResult = useMemo(
    () => getRunResultAtTime(events, startMs, currentTimeMs),
    [events, startMs, currentTimeMs]
  );

  const replayMessages = useMemo(
    () => getChatMessagesAtTime(events, startMs, currentTimeMs),
    [events, startMs, currentTimeMs]
  );

  useEffect(() => {
    if (!id || !token) {
      return undefined;
    }

    let ignore = false;

    Promise.all([
      apiRequest(`/api/rooms/${id}`, { token }),
      apiRequest(`/api/rooms/${id}/recording`, { token }),
    ])
      .then(([roomData, recordingData]) => {
        if (ignore) {
          return;
        }

        if (roomData.room.role !== "interviewer") {
          setError("Only the interviewer can view interview replays.");
          setRoom(null);
          setEvents([]);
          setLoading(false);
          return;
        }

        setRoom(roomData.room);
        setEvents(recordingData.events || []);
        setSampled(Boolean(recordingData.sampled));
        setCurrentTimeMs(0);
        setIsPlaying(false);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setRoom(null);
        setEvents([]);
        setError(requestError.message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (!isPlaying || durationMs <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentTimeMs((previous) => {
        const next = previous + 100 * playbackSpeed;

        if (next >= durationMs) {
          setIsPlaying(false);
          return durationMs;
        }

        return next;
      });
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, durationMs]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      return;
    }

    if (model.getValue() !== replayCode) {
      model.setValue(replayCode);
    }

    if (monaco) {
      monaco.editor.setModelLanguage(
        model,
        MONACO_LANGUAGE_IDS[replayLanguage] || "javascript"
      );
    }
  }, [replayCode, replayLanguage]);

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyCodescreenMonacoTheme(monaco);

    editor.getModel()?.setValue(replayCode || "");
    monaco.editor.setModelLanguage(
      editor.getModel(),
      MONACO_LANGUAGE_IDS[replayLanguage] || "javascript"
    );
  }

  function handleScrubberChange(event) {
    setIsPlaying(false);
    setCurrentTimeMs(Number(event.target.value));
  }

  if (loading) {
    return (
      <div className="cs-app">
        <AppTopBar />
        <main className="auth-shell">Loading interview replay...</main>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="cs-app">
        <AppTopBar />
        <main className="auth-shell">
          <section className="auth-card">
            <h1>Replay unavailable</h1>
            <p className="hero-copy">{error || "Unable to load this interview replay."}</p>
            <Link className="btn-primary" to={id ? `/rooms/${id}/analytics` : "/"}>
              <IconLabel icon={ArrowLeft} size={14}>
                Back to analytics
              </IconLabel>
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="cs-app interview-replay-shell">
      <AppTopBar roomTitle={room.title} variant="replay" />

      {sampled ? (
        <p className="cs-room-errors">
          This replay uses sampled events because the full recording exceeded 500 events.
        </p>
      ) : null}

      {!events.length ? (
        <main className="auth-shell">
          <section className="analytics-panel">
            <p className="hero-copy">No recording events were captured for this interview yet.</p>
          </section>
        </main>
      ) : (
        <div className="cs-replay-viewport">
          <section className="interview-replay-main">
            <div className="interview-replay-editor">
              <Editor
                height="100%"
                language={MONACO_LANGUAGE_IDS[replayLanguage] || "javascript"}
                onMount={handleEditorMount}
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  tabSize: 2,
                  automaticLayout: true,
                }}
                theme="codescreen-dark"
              />
            </div>

            <aside className="interview-replay-chat">
              <div className="interview-replay-chat-header">
                <h2>Chat</h2>
                <span className="comment-count">{replayMessages.length}</span>
              </div>

              <div className="interview-replay-chat-messages">
                {replayMessages.length === 0 ? (
                  <p className="comment-empty">No chat messages yet at this point in time.</p>
                ) : (
                  replayMessages.map((message) => (
                    <article className="interview-chat-message" key={message.id}>
                      <div className="interview-chat-message-header">
                        <div className="interview-chat-message-meta">
                          <strong className={`role-${message.userRole}`}>
                            {message.payload?.senderName || "Participant"}
                          </strong>
                        </div>
                        <time dateTime={new Date(message.timestamp).toISOString()}>
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </time>
                      </div>
                      <p>{message.payload?.text}</p>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </section>

          <CodeOutputPanel readOnly result={replayRunResult} />

          <section className="interview-replay-controls">
            <button
              type="button"
              className="btn-icon btn-ghost"
              disabled={durationMs <= 0}
              aria-label={isPlaying ? "Pause replay" : "Play replay"}
              onClick={() => setIsPlaying((current) => !current)}
            >
              {isPlaying ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}
            </button>

            <div className="interview-replay-time">
              <strong>{formatReplayOffset(currentTimeMs)}</strong>
              <span>/ {formatReplayOffset(durationMs)}</span>
            </div>

            <input
              aria-label="Replay timeline"
              className="interview-replay-scrubber"
              max={durationMs || 1}
              min={0}
              step={100}
              type="range"
              value={currentTimeMs}
              onChange={handleScrubberChange}
            />

            <div className="interview-replay-buttons">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={`btn-secondary cs-speed-btn${
                    playbackSpeed === speed ? " is-active" : ""
                  }`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
