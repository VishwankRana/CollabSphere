import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart2,
  CheckCircle,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Radio,
  Shield,
  TrendingUp,
  User,
  UserCheck,
  Video,
} from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import { apiRequest } from "../lib/api";
import { formatDurationMinutes, formatElapsedClock } from "../lib/timeFormat";

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
    return "Unknown";
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

function getScoreClass(score) {
  if (score == null) {
    return "";
  }

  if (score >= 70) {
    return "cs-score-value--high";
  }

  if (score >= 50) {
    return "cs-score-value--mid";
  }

  return "cs-score-value--low";
}

function computeAverageScore(rooms) {
  const scored = rooms.filter((room) => room.finalScore != null);

  if (!scored.length) {
    return null;
  }

  const total = scored.reduce((sum, room) => sum + room.finalScore, 0);
  return Math.round(total / scored.length);
}

function LiveDuration({ startedAt }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      return undefined;
    }

    const start = new Date(startedAt).getTime();

    function tick() {
      setElapsedMs(Date.now() - start);
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!startedAt) {
    return <span className="cs-table-meta">—</span>;
  }

  return (
    <span className="icon-label cs-table-meta">
      <Clock size={12} strokeWidth={1.5} />
      {formatElapsedClock(elapsedMs)}
    </span>
  );
}

function DashboardStatCard({ icon: Icon, label, sub, value, valueClassName = "", iconClassName = "" }) {
  return (
    <article className="stat-card">
      <span className={`stat-card-icon${iconClassName ? ` ${iconClassName}` : ""}`}>
        <Icon size={20} strokeWidth={1.5} />
      </span>
      <div className={`stat-card-value${valueClassName ? ` ${valueClassName}` : ""}`}>{value}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-sub">{sub}</div>
    </article>
  );
}

export default function InterviewDashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roleView, setRoleView] = useState("interviewer");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

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

  async function handleCopyInvite(inviteToken) {
    const url = `${window.location.origin}/join/${inviteToken}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Invite link copied.");
      window.setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage("Unable to copy link.");
    }
  }

  const filteredRooms = rooms.filter((room) => room.role === roleView);
  const activeCount = filteredRooms.filter((room) => room.status === "active").length;
  const endedCount = filteredRooms.filter((room) => room.status === "ended").length;
  const averageScore = computeAverageScore(filteredRooms);
  const avgScoreClass =
    averageScore == null
      ? ""
      : averageScore >= 70
        ? "stat-card-value--success"
        : averageScore >= 50
          ? "stat-card-value--warning"
          : "stat-card-value--error";

  return (
    <main className="interview-dashboard-shell">
      <div className="cs-page-header page-section">
        <div>
          <h1 className="font-display">Interviews</h1>
          <p className="cs-page-subtitle">
            {loading
              ? "Loading..."
              : `${filteredRooms.length} as ${roleView === "interviewer" ? "interviewer" : "candidate"}`}
          </p>
        </div>

        <div className="cs-role-toggle" role="tablist" aria-label="Interview role view">
          <button
            type="button"
            className={`cs-role-toggle-btn${roleView === "interviewer" ? " is-active" : ""}`}
            role="tab"
            aria-selected={roleView === "interviewer"}
            onClick={() => setRoleView("interviewer")}
          >
            <IconLabel icon={UserCheck} size={14}>
              Interviewer
            </IconLabel>
          </button>
          <button
            type="button"
            className={`cs-role-toggle-btn${roleView === "candidate" ? " is-active" : ""}`}
            role="tab"
            aria-selected={roleView === "candidate"}
            onClick={() => setRoleView("candidate")}
          >
            <IconLabel icon={User} size={14}>
              Candidate
            </IconLabel>
          </button>
        </div>
      </div>

      <section className="dashboard-stats-row page-section">
        <DashboardStatCard
          icon={Video}
          label="Total Interviews"
          sub={roleView === "interviewer" ? "Hosted" : "Joined"}
          value={loading ? "—" : filteredRooms.length}
        />
        <DashboardStatCard
          icon={Radio}
          iconClassName={activeCount > 0 ? "stat-card-pulse" : ""}
          label="Active Now"
          sub="In progress"
          value={loading ? "—" : activeCount}
          valueClassName={activeCount > 0 ? "stat-card-value--success" : ""}
        />
        <DashboardStatCard
          icon={CheckCircle}
          label="Completed"
          sub="Finished"
          value={loading ? "—" : endedCount}
        />
        <DashboardStatCard
          icon={TrendingUp}
          label="Avg Score"
          sub={roleView === "interviewer" ? "Candidate performance" : "Your performance"}
          value={averageScore == null ? "—" : averageScore}
          valueClassName={avgScoreClass}
        />
      </section>

      {roleView === "candidate" ? (
        <section className="cs-join-strip page-section">
          <h2 className="section-header">Join with invite code</h2>
          <p className="hero-copy">Enter the code shared by your interviewer.</p>
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
      ) : null}

      {error ? <p className="access-message">{error}</p> : null}
      {copyMessage ? <p className="hero-copy">{copyMessage}</p> : null}

      <div className="cs-table-wrap page-section" id="interview-list">
        {!loading && !error && filteredRooms.length === 0 ? (
          <div className="cs-empty-state-panel">
            <Video size={48} strokeWidth={1.5} />
            <h2>
              {roleView === "interviewer"
                ? "No interviews hosted yet"
                : "No interviews joined yet"}
            </h2>
            <p>
              {roleView === "interviewer"
                ? "Create a room from the sidebar, send an invite link, and run your first live coding interview."
                : "Use an invite code from your interviewer to join a session as a candidate."}
            </p>
            <div className="cs-empty-features">
              <span className="cs-empty-feature">
                <Code size={16} strokeWidth={1.5} />
                Live Monaco Editor
              </span>
              <span className="cs-empty-feature">
                <Shield size={16} strokeWidth={1.5} />
                Anti-cheat detection
              </span>
              <span className="cs-empty-feature">
                <BarChart2 size={16} strokeWidth={1.5} />
                Interview analytics
              </span>
            </div>
          </div>
        ) : (
          <table className="cs-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>{roleView === "interviewer" ? "Candidate" : "Interviewer"}</th>
                <th>Status</th>
                <th>Duration</th>
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
                : filteredRooms.map((room) => {
                    const durationMs =
                      room.status === "ended" && room.startedAt && room.endedAt
                        ? new Date(room.endedAt) - new Date(room.startedAt)
                        : null;

                    return (
                      <tr key={room.id}>
                        <td>
                          <div className="cs-table-title-cell">
                            <span className="cs-table-title-main">{room.title}</span>
                            <span className="cs-table-title-sub">
                              Created {formatRelativeDate(room.createdAt || room.updatedAt)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {roleView === "interviewer" ? (
                            room.candidate?.name ? (
                              <span className="cs-candidate-cell">
                                <span className="cs-candidate-avatar">
                                  {getInitials(room.candidate.name)}
                                </span>
                                {room.candidate.name}
                              </span>
                            ) : (
                              <span className="cs-table-meta">Awaiting candidate</span>
                            )
                          ) : room.interviewer?.name ? (
                            <span className="cs-candidate-cell">
                              <span className="cs-candidate-avatar">
                                {getInitials(room.interviewer.name)}
                              </span>
                              {room.interviewer.name}
                            </span>
                          ) : (
                            <span className="cs-table-meta">Unknown</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`cs-badge cs-badge--status-${statusClass(room.status)}`}
                          >
                            {formatRoomStatus(room.status)}
                          </span>
                        </td>
                        <td>
                          {room.status === "active" ? (
                            <LiveDuration startedAt={room.startedAt} />
                          ) : room.status === "ended" ? (
                            <span className="icon-label cs-table-meta">
                              <Clock size={12} strokeWidth={1.5} />
                              {formatDurationMinutes(durationMs)}
                            </span>
                          ) : (
                            <span className="cs-table-meta">—</span>
                          )}
                        </td>
                        <td>
                          <span className={getScoreClass(room.finalScore)}>
                            {room.finalScore != null ? `${room.finalScore} / 100` : "—"}
                          </span>
                        </td>
                        <td className="cs-table-actions">
                          <div className="cs-table-actions-group cs-row-action">
                            <Link className="btn-ghost" to={`/rooms/${room.id}`}>
                              <IconLabel icon={ExternalLink} size={14}>
                                Open
                              </IconLabel>
                            </Link>
                            {room.status === "ended" && roleView === "interviewer" ? (
                              <Link className="btn-ghost" to={`/rooms/${room.id}/analytics`}>
                                <IconLabel icon={BarChart2} size={14}>
                                  Analytics
                                </IconLabel>
                              </Link>
                            ) : null}
                            {room.inviteToken &&
                            room.status !== "ended" &&
                            roleView === "interviewer" ? (
                              <button
                                type="button"
                                className="btn-icon btn-ghost"
                                aria-label="Copy invite link"
                                onClick={() => handleCopyInvite(room.inviteToken)}
                              >
                                <Copy size={14} strokeWidth={1.5} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
