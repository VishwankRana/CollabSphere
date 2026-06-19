import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import CodeOutputPanel from "../components/CodeOutputPanel";
import { apiRequest } from "../lib/api";
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

function formatRoleLabel(role) {
  return role === "interviewer" ? "Interviewer" : "Candidate";
}

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
    return <main className="auth-shell">Loading interview replay...</main>;
  }

  if (error || !room) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Replay unavailable</h1>
          <p className="hero-copy">{error || "Unable to load this interview replay."}</p>
          <Link className="comment-submit" to={id ? `/rooms/${id}/analytics` : "/"}>
            Back to analytics
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="interview-replay-shell">
      <section className="interview-replay-header">
        <div>
          <p className="panel-kicker">Interview replay</p>
          <h1>{room.title}</h1>
          <p className="hero-copy">
            Scrub through code snapshots, chat, and run results from the recorded session.
          </p>
        </div>

        <div className="interview-room-actions">
          <Link className="hero-link-button" to={`/rooms/${room.id}/analytics`}>
            Analytics
          </Link>
          <Link className="hero-link-button" to={`/rooms/${room.id}`}>
            Back to room
          </Link>
        </div>
      </section>

      {sampled ? (
        <p className="access-message">
          This replay uses sampled events because the full recording exceeded 500 events.
        </p>
      ) : null}

      {!events.length ? (
        <section className="analytics-panel">
          <p className="hero-copy">No recording events were captured for this interview yet.</p>
        </section>
      ) : (
        <>
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
                theme="vs-light"
              />
            </div>

            <aside className="interview-replay-chat">
              <div className="interview-replay-chat-header">
                <h2>Chat replay</h2>
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
                          <strong>{message.payload?.senderName || "Participant"}</strong>
                          <span
                            className={`interview-chat-role interview-chat-role--${message.userRole}`}
                          >
                            {formatRoleLabel(message.userRole)}
                          </span>
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
              <button
                type="button"
                className="comment-submit"
                disabled={durationMs <= 0}
                onClick={() => setIsPlaying((current) => !current)}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={`hero-link-button${
                    playbackSpeed === speed ? " is-active" : ""
                  }`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
