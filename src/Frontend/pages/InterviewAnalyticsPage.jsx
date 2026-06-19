import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import { apiRequest } from "../lib/api";

function RunTimeline({ duration, timeline }) {
  if (!timeline?.length) {
    return <p className="hero-copy">No code runs recorded for this interview.</p>;
  }

  const startTime = new Date(timeline[0].time).getTime();
  const endTime = duration?.ms
    ? startTime + duration.ms
    : new Date(timeline.at(-1).time).getTime();
  const spanMs = Math.max(endTime - startTime, 1);

  return (
    <div className="analytics-timeline">
      <div className="analytics-timeline-track" aria-hidden="true">
        {timeline.map((entry, index) => {
          const offset =
            ((new Date(entry.time).getTime() - startTime) / spanMs) * 100;

          return (
            <span
              key={`${entry.time}-${index}`}
              className={`analytics-timeline-dot${
                entry.exitCode === 0 ? " is-passed" : " is-failed"
              }`}
              style={{ left: `${Math.min(Math.max(offset, 0), 100)}%` }}
              title={`Exit code ${entry.exitCode ?? "unknown"}`}
            />
          );
        })}
      </div>
      <div className="analytics-timeline-labels">
        <span>0:00</span>
        <span>{duration?.formatted || "0:00"}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="analytics-stat-card">
      <p className="panel-kicker">{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default function InterviewAnalyticsPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [room, setRoom] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesMessage, setNotesMessage] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      return undefined;
    }

    let ignore = false;

    Promise.all([
      apiRequest(`/api/rooms/${id}`, { token }),
      apiRequest(`/api/rooms/${id}/analytics`, { token }),
    ])
      .then(([roomData, analyticsData]) => {
        if (ignore) {
          return;
        }

        if (roomData.room.role !== "interviewer") {
          setError("Only the interviewer can view interview analytics.");
          setRoom(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        setRoom(roomData.room);
        setAnalytics(analyticsData);
        setNotes(roomData.room.notes || "");
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (ignore) {
          return;
        }

        setRoom(null);
        setAnalytics(null);
        setError(requestError.message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, token]);

  async function handleSaveNotes() {
    if (!room || savingNotes) {
      return;
    }

    setSavingNotes(true);
    setNotesMessage("");

    try {
      const data = await apiRequest(`/api/rooms/${room.id}`, {
        method: "PATCH",
        token,
        body: { notes },
      });

      setRoom(data.room);
      setNotes(data.room.notes || "");
      setNotesMessage("Notes saved.");
    } catch (requestError) {
      setNotesMessage(requestError.message);
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return <main className="auth-shell">Loading interview analytics...</main>;
  }

  if (error || !room || !analytics) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Analytics unavailable</h1>
          <p className="hero-copy">{error || "Unable to load interview analytics."}</p>
          <Link className="comment-submit" to={id ? `/rooms/${id}` : "/"}>
            Back to room
          </Link>
        </section>
      </main>
    );
  }

  const antiCheat = analytics.antiCheat || {};
  const scoreLabel =
    analytics.finalScore === null || analytics.finalScore === undefined
      ? "Not scored"
      : `${analytics.finalScore}/100`;

  return (
    <main className="interview-analytics-shell">
      <section className="interview-analytics-header">
        <div>
          <p className="panel-kicker">Interview analytics</p>
          <h1>{room.title}</h1>
          <p className="hero-copy">
            Status: <strong>{room.status}</strong>
            {room.candidate?.name ? (
              <>
                {" "}
                · Candidate: <strong>{room.candidate.name}</strong>
              </>
            ) : null}
          </p>
        </div>

        <div className="interview-room-actions">
          <Link className="hero-link-button" to={`/rooms/${room.id}`}>
            Back to room
          </Link>
        </div>
      </section>

      <section className="analytics-stat-grid">
        <StatCard label="Duration" value={analytics.duration?.formatted || "0:00"} />
        <StatCard label="Total runs" value={analytics.codeExecution?.total ?? 0} />
        <StatCard label="Errors" value={analytics.codeExecution?.errors ?? 0} />
        <StatCard label="Score" value={scoreLabel} />
      </section>

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <h2>Run timeline</h2>
          <p className="hero-copy">
            Green dots passed (exit code 0). Red dots failed or errored.
          </p>
        </div>
        <RunTimeline duration={analytics.duration} timeline={analytics.timeline} />
      </section>

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <h2>Anti-cheat log</h2>
        </div>

        {antiCheat.totalFlags ? (
          <ul className="analytics-flag-list">
            <li>{antiCheat.tabSwitches || 0} tab switches detected</li>
            <li>{antiCheat.focusLoss || 0} window focus losses detected</li>
            <li>{antiCheat.pasteEvents || 0} paste events detected</li>
            <li>{antiCheat.inactivityFlags || 0} inactivity flags</li>
          </ul>
        ) : (
          <p className="hero-copy">No anti-cheat flags were recorded.</p>
        )}

        <p className="analytics-meta">
          Language used: <strong>{analytics.languageUsed || room.language}</strong> · Final
          code length: <strong>{analytics.finalCodeLength ?? 0}</strong> characters
        </p>
      </section>

      <section className="analytics-panel">
        <div className="analytics-panel-header">
          <h2>Interviewer notes</h2>
        </div>

        <textarea
          className="comment-input"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Private notes about this candidate and interview..."
          rows={6}
        />

        <div className="analytics-notes-actions">
          <button
            type="button"
            className="comment-submit"
            disabled={savingNotes}
            onClick={handleSaveNotes}
          >
            {savingNotes ? "Saving..." : "Save notes"}
          </button>
          {notesMessage ? <p className="access-message">{notesMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}
