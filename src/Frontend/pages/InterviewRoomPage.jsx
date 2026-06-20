import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Clock,
  LogOut,
  Play,
  RefreshCw,
  StopCircle,
  X,
} from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import AppTopBar from "../components/AppTopBar";
import CodeOutputPanel from "../components/CodeOutputPanel";
import CollaborativeCodeEditor from "../components/CollaborativeCodeEditor";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import IconLabel from "../components/IconLabel";
import LanguageSelector from "../components/LanguageSelector";
import ProblemPanel from "../components/ProblemPanel";
import ResizeHandle, { useResizePanel } from "../components/ResizeHandle";
import { apiRequest } from "../lib/api";
import { formatElapsedClock } from "../lib/timeFormat";
import {
  getInterviewSocket,
  joinInterviewSocketRoom,
} from "../lib/interviewSocket";
import { CHEAT_ALERT_LABELS, useAntiCheat } from "../hooks/useAntiCheat";

export default function InterviewRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const editorRef = useRef(null);
  const [roomState, setRoomState] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [languageMessage, setLanguageMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [runError, setRunError] = useState("");
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [cheatAlert, setCheatAlert] = useState("");
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [finalScore, setFinalScore] = useState("");
  const [endNotes, setEndNotes] = useState("");
  const [endingInterview, setEndingInterview] = useState(false);
  const [endError, setEndError] = useState("");
  const [socketError, setSocketError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [runCount, setRunCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const isCandidate =
    roomState?.role === "candidate" && roomState?.status !== "ended";

  useAntiCheat({
    roomId: roomState?.id,
    enabled: Boolean(roomState?.id && isCandidate),
  });

  const problemResize = useResizePanel({
    axis: "horizontal",
    initial: 300,
    min: 220,
    max: 520,
    storageKey: "interview-problem-width",
  });

  const outputResize = useResizePanel({
    axis: "vertical",
    initial: 200,
    min: 120,
    max: 480,
    storageKey: "interview-output-height",
  });

  useEffect(() => {
    if (!id || !token) {
      return undefined;
    }

    let ignore = false;

    apiRequest(`/api/rooms/${id}`, { token })
      .then((data) => {
        if (ignore) {
          return;
        }

        if (data.room.role === "candidate" && data.room.status === "ended") {
          navigate(`/rooms/${data.room.id}/ended`, { replace: true });
          return;
        }

        setRoomState(data.room);
        setLanguage(data.room.language);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setRoomState(null);
        setError(requestError.message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, navigate, token]);

  useEffect(() => {
    if (!roomState?.id) {
      return undefined;
    }

    const leaveRoom = joinInterviewSocketRoom(roomState.id, token);
    const socket = getInterviewSocket(token);

    const handleLanguageChanged = ({ language: nextLanguage, changedBy }) => {
      setLanguage(nextLanguage);
      setRoomState((current) =>
        current ? { ...current, language: nextLanguage } : current
      );

      if (changedBy && changedBy !== user.name) {
        setLanguageMessage(`Language changed to ${nextLanguage} by ${changedBy}.`);
      } else {
        setLanguageMessage("");
      }
    };

    const handleCodeRunning = () => {
      setIsRunning(true);
      setRunError("");
      setTestResults(null);
    };

    const handleCodeResult = (result) => {
      setIsRunning(false);
      setRunResult(result);
      setRunCount((current) => current + 1);
    };

    const handleConnect = () => {
      setSocketError("");
      setConnectionStatus("synced");
    };

    const handleConnectError = (error) => {
      setConnectionStatus("disconnected");
      const message = error?.message || "";

      if (message.includes("Authentication required")) {
        setSocketError("Interview socket authentication failed. Log out and sign in again.");
        return;
      }

      setSocketError(
        "Lost connection to the interview server. Check that the backend is running and refresh the page."
      );
    };

    const handleDisconnect = (reason) => {
      if (reason === "io client disconnect") {
        return;
      }

      setConnectionStatus("disconnected");

      setSocketError(
        "Lost connection to the interview server. Check that the backend is running and refresh the page."
      );
    };

    const handleRoomEnded = () => {
      const endedAt = new Date().toISOString();
      setRoomState((current) =>
        current ? { ...current, status: "ended", endedAt } : current
      );
      setShowEndDialog(false);

      if (roomState.role === "interviewer") {
        navigate(`/rooms/${roomState.id}/analytics`);
        return;
      }

      navigate(`/rooms/${roomState.id}/ended`);
    };

    const handleCheatFlagged = ({ type }) => {
      if (roomState.role !== "interviewer") {
        return;
      }

      setCheatAlert(CHEAT_ALERT_LABELS[type] || "Candidate activity flagged.");
    };

    socket.on("language:changed", handleLanguageChanged);
    socket.on("code:running", handleCodeRunning);
    socket.on("code:result", handleCodeResult);
    socket.on("room:ended", handleRoomEnded);
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (roomState.role === "interviewer") {
      socket.on("cheat:flagged", handleCheatFlagged);
    }

    return () => {
      socket.off("language:changed", handleLanguageChanged);
      socket.off("code:running", handleCodeRunning);
      socket.off("code:result", handleCodeResult);
      socket.off("room:ended", handleRoomEnded);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("cheat:flagged", handleCheatFlagged);
      leaveRoom();
    };
  }, [navigate, roomState?.id, roomState?.role, token, user.name]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsRunning(false);
      setRunResult({
        stdout: "",
        stderr: "Execution timed out waiting for a response from the server.",
        exitCode: 1,
        executionTime: 0,
      });
    }, 20000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!cheatAlert) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCheatAlert("");
    }, 8000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cheatAlert]);

  useEffect(() => {
    if (!roomState?.startedAt) {
      setElapsedMs(0);
      return undefined;
    }

    const start = new Date(roomState.startedAt).getTime();

    if (roomState.status === "ended") {
      const end = roomState.endedAt
        ? new Date(roomState.endedAt).getTime()
        : Date.now();
      setElapsedMs(Math.max(0, end - start));
      return undefined;
    }

    function tick() {
      setElapsedMs(Date.now() - start);
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [roomState?.startedAt, roomState?.endedAt, roomState?.status]);

  function handleLanguageChange(nextLanguage) {
    if (!roomState || nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    setRoomState((current) =>
      current ? { ...current, language: nextLanguage } : current
    );
    setLanguageMessage("");

    if (roomState.role === "interviewer") {
      getInterviewSocket(token).emit("language:change", {
        roomId: roomState.id,
        language: nextLanguage,
      });
    }
  }

  function handleRunCode() {
    if (!roomState || roomState.status === "ended" || isRunning) {
      return;
    }

    const code = editorRef.current?.getCode() || "";

    setRunResult(null);
    setTestResults(null);
    setRunError("");
    setIsRunning(true);

    getInterviewSocket(token).emit("code:run", {
      roomId: roomState.id,
      code,
      language,
      stdin,
    });
  }

  async function handleRunTests() {
    if (!roomState || roomState.status === "ended" || isRunningTests || isRunning) {
      return;
    }

    const code = editorRef.current?.getCode() || "";

    if (!code.trim()) {
      setRunError("Write some code before running tests.");
      return;
    }

    setRunResult(null);
    setTestResults(null);
    setRunError("");
    setIsRunningTests(true);

    try {
      const data = await apiRequest(`/api/rooms/${roomState.id}/run-tests`, {
        method: "POST",
        token,
        body: { code, language },
      });

      setTestResults(data.results || []);
    } catch (requestError) {
      setRunError(requestError.message);
    } finally {
      setIsRunningTests(false);
    }
  }

  function handleResetCode() {
    editorRef.current?.resetToStarter?.();
  }

  function handleLeaveRoom() {
    getInterviewSocket(token).emit("room:leave", { roomId: roomState?.id });
    navigate("/");
  }

  async function handleEndInterview(event) {
    event.preventDefault();

    if (!roomState || endingInterview) {
      return;
    }

    setEndingInterview(true);
    setEndError("");

    try {
      const scoreValue = finalScore.trim();

      await apiRequest(`/api/rooms/${roomState.id}/end`, {
        method: "POST",
        token,
        body: {
          finalScore: scoreValue ? Number(scoreValue) : undefined,
          notes: endNotes,
        },
      });

      const endedAt = new Date().toISOString();
      setRoomState((current) =>
        current ? { ...current, status: "ended", endedAt } : current
      );

      navigate(`/rooms/${roomState.id}/analytics`);
    } catch (requestError) {
      setEndError(requestError.message);
      setEndingInterview(false);
    }
  }

  if (loading) {
    return (
      <div className="cs-app">
        <AppTopBar connectionStatus="connecting" variant="room" />
        <main className="auth-shell">Loading interview room...</main>
      </div>
    );
  }

  if (error || !roomState) {
    return (
      <div className="cs-app">
        <AppTopBar />
        <main className="auth-shell">
          <section className="auth-card">
            <h1>Interview unavailable</h1>
            <p className="hero-copy">{error || "Unable to load this interview room."}</p>
            <Link className="btn-primary" to="/">
              <IconLabel icon={ArrowLeft} size={14}>
                Back to dashboard
              </IconLabel>
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const readOnly = roomState.status === "ended";
  const canChangeLanguage = roomState.role === "interviewer" && !readOnly;
  const canRunCode = !readOnly;
  const hasTestCases = (roomState.testCases?.length || 0) > 0;
  const roomTitle = roomState.candidate?.name
    ? `${roomState.title} – ${roomState.candidate.name}`
    : roomState.title;

  return (
    <div className="cs-app">
      <AppTopBar
        connectionStatus={connectionStatus}
        roomStatus={roomState.status}
        roomTitle={roomTitle}
        showActiveDot={roomState.status === "active"}
        variant="room"
      />

      {cheatAlert ? (
        <div className="cs-cheat-banner" role="status">
          <span className="icon-label">
            <AlertTriangle size={14} strokeWidth={1.5} />
            {cheatAlert}
          </span>
          <button
            type="button"
            className="cs-cheat-banner-dismiss"
            aria-label="Dismiss alert"
            onClick={() => setCheatAlert("")}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ) : null}

      {runError || socketError || languageMessage ? (
        <div className="cs-room-errors">
          {[runError, socketError, languageMessage].filter(Boolean).join(" · ")}
        </div>
      ) : null}

      <main className="interview-room-shell">
        <div className="cs-room-viewport">
          <div className="cs-room-workspace cs-room-workspace--resizable">
            {!problemCollapsed ? (
              <>
                <div
                  className="cs-resize-panel cs-resize-panel--problem"
                  style={{ width: `${problemResize.size}px` }}
                >
                  <ProblemPanel
                    candidate={roomState.candidate}
                    chatReadOnly={readOnly}
                    collapsed={problemCollapsed}
                    interviewer={roomState.interviewer}
                    problem={roomState.problem}
                    roomId={roomState.id}
                    onToggleCollapsed={() => setProblemCollapsed((current) => !current)}
                  />
                </div>
                <ResizeHandle axis="horizontal" onPointerDown={problemResize.onPointerDown} />
              </>
            ) : (
              <ProblemPanel
                candidate={roomState.candidate}
                chatReadOnly={readOnly}
                collapsed={problemCollapsed}
                interviewer={roomState.interviewer}
                problem={roomState.problem}
                roomId={roomState.id}
                onToggleCollapsed={() => setProblemCollapsed((current) => !current)}
              />
            )}

            <div className="interview-room-main">
              <div className="cs-editor-topbar">
                  <div className="cs-editor-topbar-left">
                    <LanguageSelector
                      disabled={!canChangeLanguage}
                      readOnly={!canChangeLanguage}
                      value={language}
                      onChange={handleLanguageChange}
                    />
                    <span className="cs-editor-divider" aria-hidden="true" />
                    <span className="cs-editor-meta">
                      <Clock size={14} strokeWidth={1.5} />
                      {formatElapsedClock(elapsedMs)}
                    </span>
                    <span className="cs-editor-divider" aria-hidden="true" />
                    <button
                      type="button"
                      className="btn-ghost btn-icon"
                      aria-label="Reset to starter code"
                      title="Reset to starter"
                      onClick={handleResetCode}
                    >
                      <RefreshCw size={14} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="cs-editor-topbar-right">
                    <ConnectionStatusBadge status={connectionStatus} />
                    <span className="cs-editor-divider" aria-hidden="true" />
                    <span className="cs-editor-run-count">
                      <Play size={12} strokeWidth={1.5} />
                      {runCount} runs
                    </span>
                    <span className="cs-editor-divider" aria-hidden="true" />

                    {canRunCode ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={isRunning}
                          onClick={handleRunCode}
                        >
                          <IconLabel icon={Play} size={16}>
                            {isRunning ? "Running..." : "Run Code"}
                          </IconLabel>
                        </button>
                        {hasTestCases ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={isRunningTests || isRunning}
                            onClick={handleRunTests}
                          >
                            {isRunningTests ? "Running tests..." : "Run tests"}
                          </button>
                        ) : null}
                      </>
                    ) : null}

                    {roomState.role === "interviewer" && !readOnly ? (
                      <button
                        type="button"
                        className="btn-danger interview-end-button"
                        onClick={() => setShowEndDialog(true)}
                      >
                        <IconLabel icon={StopCircle} size={16}>
                          End Interview
                        </IconLabel>
                      </button>
                    ) : null}

                    {roomState.role === "interviewer" && readOnly ? (
                      <Link className="btn-secondary" to={`/rooms/${roomState.id}/analytics`}>
                        <IconLabel icon={BarChart2} size={16}>
                          Analytics
                        </IconLabel>
                      </Link>
                    ) : null}

                    {roomState.role === "candidate" && !readOnly ? (
                      <button type="button" className="btn-ghost" onClick={handleLeaveRoom}>
                        <IconLabel icon={LogOut} size={16}>
                          Leave Room
                        </IconLabel>
                      </button>
                    ) : null}
                  </div>
                </div>

              <div className="cs-editor-output-stack">
                <div className="interview-editor-panel">
                  <CollaborativeCodeEditor
                    ref={editorRef}
                    language={language}
                    readOnly={readOnly}
                    roomId={roomState.id}
                    starterCode={roomState.starterCode}
                    userName={user.name}
                    userRole={roomState.role}
                  />
                </div>

                <ResizeHandle axis="vertical" onPointerDown={outputResize.onPointerDown} />

                <div
                  className="cs-resize-panel cs-resize-panel--output"
                  style={{ height: `${outputResize.size}px` }}
                >
                  <CodeOutputPanel
                    isRunning={isRunning}
                    isRunningTests={isRunningTests}
                    readOnly={readOnly}
                    result={runResult}
                    showTestCasesTab={hasTestCases}
                    stdin={stdin}
                    testResults={testResults}
                    onStdinChange={setStdin}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showEndDialog ? (
        <section className="interview-end-dialog">
          <form onSubmit={handleEndInterview}>
            <h2>End interview</h2>
            <p className="hero-copy">Score this candidate from 0 to 100 before ending the session.</p>

            <label className="interview-form-field">
              <span>Final score</span>
              <input
                className="comment-input"
                max={100}
                min={0}
                type="number"
                value={finalScore}
                onChange={(event) => setFinalScore(event.target.value)}
                placeholder="75"
              />
            </label>

            <label className="interview-form-field">
              <span>Notes (optional)</span>
              <textarea
                className="comment-input"
                value={endNotes}
                onChange={(event) => setEndNotes(event.target.value)}
                placeholder="Private interviewer notes..."
                rows={4}
              />
            </label>

            {endError ? <p className="access-message">{endError}</p> : null}

            <div className="interview-end-dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEndDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" disabled={endingInterview} type="submit">
                {endingInterview ? "Ending..." : "End interview"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
