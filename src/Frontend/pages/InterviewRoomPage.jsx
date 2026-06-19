import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import CodeOutputPanel from "../components/CodeOutputPanel";
import CollaborativeCodeEditor from "../components/CollaborativeCodeEditor";
import LanguageSelector from "../components/LanguageSelector";
import { apiRequest } from "../lib/api";
import {
  getInterviewSocket,
  joinInterviewSocketRoom,
} from "../lib/interviewSocket";

export default function InterviewRoomPage() {
  const { id } = useParams();
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
  }, [id, token]);

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

    socket.on("language:changed", handleLanguageChanged);
    socket.on("code:running", handleCodeRunning);
    socket.on("code:result", handleCodeResult);

    return () => {
      socket.off("language:changed", handleLanguageChanged);
      socket.off("code:running", handleCodeRunning);
      socket.off("code:result", handleCodeResult);
      leaveRoom();
    };
  }, [roomState?.id, user.name]);

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
            Back home
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
        </div>
      </section>

      {runError ? <p className="access-message">{runError}</p> : null}

      <section className="interview-workspace">
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
      </section>
    </main>
  );
}
