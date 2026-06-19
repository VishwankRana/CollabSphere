import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
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
  const [roomState, setRoomState] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [languageMessage, setLanguageMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    socket.on("language:changed", handleLanguageChanged);

    return () => {
      socket.off("language:changed", handleLanguageChanged);
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

          {roomState.role === "interviewer" && roomState.inviteToken ? (
            <div className="interview-invite-chip">
              Invite code: <strong>{roomState.inviteToken}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section className="interview-editor-panel">
        <CollaborativeCodeEditor
          language={language}
          readOnly={readOnly}
          roomId={roomState.id}
          starterCode={roomState.starterCode}
          userName={user.name}
          userRole={roomState.role}
        />
      </section>
    </main>
  );
}
