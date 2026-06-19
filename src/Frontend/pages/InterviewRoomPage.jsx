import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import ChatPanel from "../components/ChatPanel";
import CodeOutputPanel from "../components/CodeOutputPanel";
import CollaborativeCodeEditor from "../components/CollaborativeCodeEditor";
import LanguageSelector from "../components/LanguageSelector";
import ProblemPanel from "../components/ProblemPanel";
import { apiRequest } from "../lib/api";
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

  const isCandidate =
    roomState?.role === "candidate" && roomState?.status !== "ended";

  useAntiCheat({
    roomId: roomState?.id,
    enabled: Boolean(roomState?.id && isCandidate),
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

    const leaveRoom = joinInterviewSocketRoom(roomState.id);
    const socket = getInterviewSocket();

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
    };

    const handleRoomEnded = () => {
      setRoomState((current) =>
        current ? { ...current, status: "ended" } : current
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

    if (roomState.role === "interviewer") {
      socket.on("cheat:flagged", handleCheatFlagged);
    }

    return () => {
      socket.off("language:changed", handleLanguageChanged);
      socket.off("code:running", handleCodeRunning);
      socket.off("code:result", handleCodeResult);
      socket.off("room:ended", handleRoomEnded);
      socket.off("cheat:flagged", handleCheatFlagged);
      leaveRoom();
    };
  }, [navigate, roomState?.id, roomState?.role, user.name]);

  useEffect(() => {
    if (!cheatAlert) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCheatAlert("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cheatAlert]);

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
      getInterviewSocket().emit("language:change", {
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

    getInterviewSocket().emit("code:run", {
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

  function handleLeaveRoom() {
    getInterviewSocket().emit("room:leave", { roomId: roomState?.id });
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

      navigate(`/rooms/${roomState.id}/analytics`);
    } catch (requestError) {
      setEndError(requestError.message);
      setEndingInterview(false);
    }
  }

  if (loading) {
    return <main className="auth-shell">Loading interview room...</main>;
  }

  if (error || !roomState) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Interview unavailable</h1>
          <p className="hero-copy">{error || "Unable to load this interview room."}</p>
          <Link className="comment-submit" to="/">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const readOnly = roomState.status === "ended";
  const canChangeLanguage = roomState.role === "interviewer" && !readOnly;
  const canRunCode = !readOnly;
  const hasTestCases = (roomState.testCases?.length || 0) > 0;

  return (
    <main className="interview-room-shell">
      {cheatAlert ? (
        <div className="interview-cheat-toast" role="status">
          {cheatAlert}
        </div>
      ) : null}

      <section className="interview-room-header">
        <div>
          <p className="panel-kicker">Interview room</p>
          <h1>{roomState.title}</h1>
          <p className="hero-copy">
            Role: <strong>{roomState.role}</strong> · Status:{" "}
            <strong>{roomState.status}</strong>
          </p>
          {languageMessage ? <p className="access-message">{languageMessage}</p> : null}
        </div>

        <div className="interview-room-actions">
          <LanguageSelector
            disabled={!canChangeLanguage}
            readOnly={!canChangeLanguage}
            value={language}
            onChange={handleLanguageChange}
          />

          {canRunCode ? (
            <>
              <button
                type="button"
                className="comment-submit"
                disabled={isRunning}
                onClick={handleRunCode}
              >
                {isRunning ? "Running..." : "Run"}
              </button>
              {hasTestCases ? (
                <button
                  type="button"
                  className="hero-link-button"
                  disabled={isRunningTests || isRunning}
                  onClick={handleRunTests}
                >
                  {isRunningTests ? "Running tests..." : "Run tests"}
                </button>
              ) : null}
            </>
          ) : null}

          {roomState.role === "interviewer" && roomState.inviteToken ? (
            <div className="interview-invite-chip">
              Invite code: <strong>{roomState.inviteToken}</strong>
            </div>
          ) : null}

          {roomState.role === "interviewer" && !readOnly ? (
            <button
              type="button"
              className="hero-link-button interview-end-button"
              onClick={() => setShowEndDialog(true)}
            >
              End interview
            </button>
          ) : null}

          {roomState.role === "interviewer" && readOnly ? (
            <Link className="hero-link-button" to={`/rooms/${roomState.id}/analytics`}>
              Analytics
            </Link>
          ) : null}

          {roomState.role === "candidate" && !readOnly ? (
            <button type="button" className="hero-link-button" onClick={handleLeaveRoom}>
              Leave room
            </button>
          ) : null}
        </div>
      </section>

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
                className="hero-link-button"
                onClick={() => setShowEndDialog(false)}
              >
                Cancel
              </button>
              <button className="comment-submit" disabled={endingInterview} type="submit">
                {endingInterview ? "Ending..." : "End interview"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {runError ? <p className="access-message">{runError}</p> : null}

      <section className="interview-room-layout">
        <ProblemPanel
          collapsed={problemCollapsed}
          problem={roomState.problem}
          testCases={roomState.testCases}
          onToggleCollapsed={() => setProblemCollapsed((current) => !current)}
        />

        <div className="interview-room-main">
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

          <CodeOutputPanel
            isRunning={isRunning}
            readOnly={readOnly}
            result={runResult}
            stdin={stdin}
            testResults={testResults}
            onStdinChange={setStdin}
          />
        </div>
      </section>

      <ChatPanel key={roomState.id} readOnly={readOnly} roomId={roomState.id} />
    </main>
  );
}
