import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import CollaborativeCodeEditor from "../components/CollaborativeCodeEditor";
import { apiRequest } from "../lib/api";

export default function InterviewRoomPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [roomState, setRoomState] = useState(null);
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

  return (
    <main className="interview-room-shell">
      <section className="interview-room-header">
        <div>
          <p className="panel-kicker">Interview room</p>
          <h1>{roomState.title}</h1>
          <p className="hero-copy">
            Role: <strong>{roomState.role}</strong> · Language:{" "}
            <strong>{roomState.language}</strong> · Status:{" "}
            <strong>{roomState.status}</strong>
          </p>
        </div>
        {roomState.role === "interviewer" && roomState.inviteToken ? (
          <div className="interview-invite-chip">
            Invite code: <strong>{roomState.inviteToken}</strong>
          </div>
        ) : null}
      </section>

      <section className="interview-editor-panel">
        <CollaborativeCodeEditor
          language={roomState.language}
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
