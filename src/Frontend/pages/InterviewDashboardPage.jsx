import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "../auth/useAuth.jsx";
import AppTopBar from "../components/AppTopBar";
import { apiRequest } from "../lib/api";

function formatRoomStatus(status) {
  if (status === "active") {
    return "Active";
  }

  if (status === "ended") {
    return "Ended";
  }

  return "Waiting";
}

function statusClass(status) {
  if (status === "active") {
    return "active";
  }

  if (status === "ended") {
    return "ended";
  }

  return "waiting";
}

function formatRelativeDate(value) {
  if (!value) {
    return "—";
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export default function InterviewDashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
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
    <div className="cs-app">
      <AppTopBar />

      <main className="interview-dashboard-shell">
        <div className="cs-page-header">
          <div>
            <h1 className="font-display">Interviews</h1>
            <p className="cs-page-subtitle">
              {loading ? "Loading..." : `${rooms.length} total`}
            </p>
          </div>

          <Link className="btn-primary" to="/rooms/new">
            + New Interview
          </Link>
        </div>

        <section className="cs-join-strip">
          <h2>Join with invite code</h2>
          <p>Enter the code shared by your interviewer.</p>
          <form className="interview-join-form" onSubmit={handleJoinSubmit}>
            <input
              className="comment-input"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Invite code"
            />
            <button className="btn-primary" disabled={!inviteCode.trim()} type="submit">
              Join
            </button>
          </form>
        </section>

        {error ? <p className="access-message">{error}</p> : null}

        <div className="cs-table-wrap">
          {!loading && !error && rooms.length === 0 ? (
            <div className="cs-empty-state">
              <div className="cs-empty-icon">&lt;/&gt;</div>
              <h2>No interviews yet</h2>
              <p>Create your first interview room to get started.</p>
              <Link className="btn-primary" to="/rooms/new">
                + New Interview
              </Link>
            </div>
          ) : (
            <table className="cs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td colSpan={6}>
                          <div className="cs-skeleton cs-skeleton-row" />
                        </td>
                      </tr>
                    ))
                  : rooms.map((room) => (
                      <tr key={room.id}>
                        <td className="cs-table-title">{room.title}</td>
                        <td className="cs-table-meta">
                          {room.candidate?.name || "—"}
                        </td>
                        <td>
                          <span className={`cs-badge cs-badge--status-${statusClass(room.status)}`}>
                            {formatRoomStatus(room.status)}
                          </span>
                        </td>
                        <td className="cs-table-meta">
                          {formatRelativeDate(room.createdAt || room.updatedAt)}
                        </td>
                        <td className="cs-table-meta">
                          {room.finalScore != null ? `${room.finalScore}/100` : "—"}
                        </td>
                        <td className="cs-table-actions">
                          <Link className="btn-ghost cs-row-action" to={`/rooms/${room.id}`}>
                            Open &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
