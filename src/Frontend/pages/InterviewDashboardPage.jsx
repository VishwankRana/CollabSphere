import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import { apiRequest } from "../lib/api";
import { getDefaultDocumentPath } from "../lib/documents.js";

function formatRoomStatus(status) {
  if (status === "active") {
    return "Active";
  }

  if (status === "ended") {
    return "Ended";
  }

  return "Waiting";
}

export default function InterviewDashboardPage() {
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let ignore = false;

    apiRequest("/api/rooms", { token })
      .then((data) => {
        if (ignore) {
          return;
        }

        setRooms(data.rooms || []);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setRooms([]);
        setError(requestError.message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  function handleJoinSubmit(event) {
    event.preventDefault();

    const trimmed = inviteCode.trim();

    if (!trimmed) {
      return;
    }

    navigate(`/join/${trimmed}`);
  }

  return (
    <main className="interview-dashboard-shell">
      <section className="interview-dashboard-header">
        <div>
          <p className="panel-kicker">Interview platform</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="hero-copy">
            Create and manage interview rooms, or join a session with an invite code.
          </p>
        </div>

        <div className="interview-room-actions">
          <Link className="hero-link-button" to={getDefaultDocumentPath(user)}>
            Document workspace
          </Link>
          <Link className="comment-submit" to="/rooms/new">
            Create room
          </Link>
          <button className="hero-link-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </section>

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <h2>Join an interview</h2>
          <p className="hero-copy">Enter the invite code shared by your interviewer.</p>
        </div>

        <form className="interview-join-form" onSubmit={handleJoinSubmit}>
          <input
            className="comment-input"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="Invite code"
          />
          <button className="comment-submit" disabled={!inviteCode.trim()} type="submit">
            Join room
          </button>
        </form>
      </section>

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <h2>Your interview rooms</h2>
          <p className="hero-copy">Rooms you created as an interviewer.</p>
        </div>

        {loading ? <p className="hero-copy">Loading rooms...</p> : null}
        {error ? <p className="access-message">{error}</p> : null}

        {!loading && !error && rooms.length === 0 ? (
          <p className="hero-copy">No interview rooms yet. Create one to get started.</p>
        ) : null}

        {!loading && rooms.length ? (
          <ul className="interview-room-list">
            {rooms.map((room) => (
              <li key={room.id}>
                <div>
                  <strong>{room.title}</strong>
                  <p className="hero-copy">
                    {formatRoomStatus(room.status)}
                    {room.candidate?.name ? ` · ${room.candidate.name}` : ""}
                    {room.inviteToken ? ` · Code ${room.inviteToken}` : ""}
                  </p>
                </div>

                <div className="interview-room-list-actions">
                  <Link className="hero-link-button" to={`/rooms/${room.id}`}>
                    Open
                  </Link>
                  {room.status === "ended" ? (
                    <>
                      <Link className="hero-link-button" to={`/rooms/${room.id}/analytics`}>
                        Analytics
                      </Link>
                      <Link className="hero-link-button" to={`/rooms/${room.id}/replay`}>
                        Replay
                      </Link>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
