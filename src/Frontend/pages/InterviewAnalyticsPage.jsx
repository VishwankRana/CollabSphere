import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  ArrowLeft,
  Clipboard,
  Clock,
  Code,
  Eye,
  FileCode,
  Monitor,
  Play,
  PlayCircle,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  StickyNote,
  Zap,
} from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import { apiRequest } from "../lib/api";
import { MONACO_LANGUAGE_IDS } from "../lib/interview";
import { applyCodescreenMonacoTheme } from "../lib/monacoTheme";

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
      <div className="analytics-timeline-track analytics-timeline-track--dense" aria-hidden="true">
        {timeline.map((entry, index) => {
          const offset =
            ((new Date(entry.time).getTime() - startTime) / spanMs) * 100;
          const position = `${Math.min(Math.max(offset, 0), 100)}%`;

          return (
            <span
              key={`${entry.time}-${index}`}
              className={`analytics-timeline-dot analytics-timeline-tick${
                entry.exitCode === 0 ? " is-passed" : " is-failed"
              }`}
              style={{ left: position }}
              title={`${new Date(entry.time).toLocaleTimeString()} · exit ${
                entry.exitCode ?? "?"
              }`}
            />
          );
        })}
      </div>
      <div className="analytics-timeline-labels">
        <span>{new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{duration?.formatted || "0:00"}</span>
      </div>
    </div>
  );
}

function getScoreClass(score) {
  if (score === null || score === undefined) {
    return "";
  }

  if (score >= 70) {
    return "analytics-stat-card--score-high";
  }

  if (score >= 50) {
    return "analytics-stat-card--score-mid";
  }

  return "analytics-stat-card--score-low";
}

function StatCard({ label, value, className = "" }) {
  return (
    <article className={`analytics-stat-card ${className}`.trim()}>
      <p className="panel-kicker">{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function IntegrityRow({ icon: Icon, label, count }) {
  const severityClass = count > 0 ? "integrity-severity--warn" : "integrity-severity--ok";

  return (
    <div className="integrity-row">
      <Icon size={14} strokeWidth={1.5} />
      <span>{label}</span>
      <span className="integrity-count">{count}</span>
      <span className={`integrity-severity ${severityClass}`} aria-hidden="true" />
    </div>
  );
}

export default function InterviewAnalyticsPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [room, setRoom] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [finalCode, setFinalCode] = useState("");
  const [runInsights, setRunInsights] = useState({ avgExecutionMs: null, lastRunTime: null });
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
      apiRequest(`/api/rooms/${id}/recording`, { token }),
    ])
      .then(([roomData, analyticsData, recordingData]) => {
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

        const events = recordingData.events || [];
        const snapshots = events.filter((event) => event.type === "code_snapshot");
        const runs = events.filter((event) => event.type === "code_run");
        const lastSnapshot = snapshots.at(-1);
        const avgExecutionMs = runs.length
          ? Math.round(
              runs.reduce((sum, event) => sum + (event.payload?.executionTime || 0), 0) /
                runs.length
            )
          : null;
        const lastRun = runs.at(-1);

        setRoom(roomData.room);
        setAnalytics(analyticsData);
        setFinalCode(lastSnapshot?.payload?.code || "");
        setRunInsights({
          avgExecutionMs,
          lastRunTime: lastRun?.timestamp || null,
        });
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
      setNotesMessage("Saved");
    } catch (requestError) {
      setNotesMessage(requestError.message);
    } finally {
      setSavingNotes(false);
    }
  }

  const language = useMemo(
    () => MONACO_LANGUAGE_IDS[room?.language || analytics?.languageUsed || "javascript"] || "javascript",
    [room?.language, analytics?.languageUsed]
  );

  if (loading) {
    return <main className="auth-shell">Loading interview analytics...</main>;
  }

  if (error || !room || !analytics) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Analytics unavailable</h1>
          <p className="hero-copy">{error || "Unable to load interview analytics."}</p>
          <Link className="btn-primary" to={id ? `/rooms/${id}` : "/"}>
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
  const subtitle = [
    room.title,
    room.candidate?.name,
    analytics.duration?.formatted ? `${analytics.duration.formatted}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="interview-analytics-shell">
      <div className="page-section">
        <Link className="cs-back-link" to={`/rooms/${room.id}`}>
          <IconLabel icon={ArrowLeft} size={14}>
            Back to room
          </IconLabel>
        </Link>
        <h1 className="font-display">Interview Analytics</h1>
        <p className="cs-page-subtitle">{subtitle}</p>
      </div>

      <section className="analytics-stat-grid page-section">
        <StatCard label="Duration" value={analytics.duration?.formatted || "0:00"} />
        <StatCard label="Total runs" value={analytics.codeExecution?.total ?? 0} />
        <StatCard label="Errors" value={analytics.codeExecution?.errors ?? 0} />
        <StatCard
          className={getScoreClass(analytics.finalScore)}
          label="Score"
          value={scoreLabel}
        />
      </section>

      <section className="analytics-panel analytics-section-card page-section">
        <div className="section-header">
          <IconLabel icon={Activity} size={16}>
            Code Activity
          </IconLabel>
        </div>
        <RunTimeline duration={analytics.duration} timeline={analytics.timeline} />
        <div className="analytics-mini-stats">
          <span className="analytics-mini-stat">
            <Zap size={13} strokeWidth={1.5} />
            Avg execution: {runInsights.avgExecutionMs ?? "—"}ms
          </span>
          <span className="analytics-mini-stat">
            <Code size={13} strokeWidth={1.5} />
            Language: {analytics.languageUsed || room.language}
          </span>
          <span className="analytics-mini-stat">
            <Clock size={13} strokeWidth={1.5} />
            Last run:{" "}
            {runInsights.lastRunTime
              ? new Date(runInsights.lastRunTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
      </section>

      <section className="analytics-panel analytics-section-card page-section">
        <div className="section-header">
          <IconLabel icon={Shield} size={16}>
            Integrity Signals
          </IconLabel>
        </div>

        <div className="analytics-integrity-grid">
          <div>
            <IntegrityRow icon={Eye} count={antiCheat.tabSwitches || 0} label="Tab Switches" />
            <IntegrityRow
              icon={Clipboard}
              count={antiCheat.pasteEvents || 0}
              label="Paste Events"
            />
            <IntegrityRow icon={Monitor} count={antiCheat.focusLoss || 0} label="Focus Loss" />
            <IntegrityRow
              icon={Clock}
              count={antiCheat.inactivityFlags || 0}
              label="Inactivity"
            />
          </div>

          <div
            className={`integrity-summary-card ${
              antiCheat.totalFlags ? "integrity-summary-card--warn" : "integrity-summary-card--clean"
            }`}
          >
            {antiCheat.totalFlags ? (
              <>
                <ShieldAlert size={32} strokeWidth={1.5} />
                <strong>{antiCheat.totalFlags} flags detected</strong>
                <p className="hero-copy">Review the session replay for context.</p>
                <Link className="btn-ghost" to={`/rooms/${room.id}/replay`}>
                  <IconLabel icon={Play} size={14}>
                    View Replay
                  </IconLabel>
                </Link>
              </>
            ) : (
              <>
                <ShieldCheck size={32} strokeWidth={1.5} />
                <strong>No integrity flags</strong>
                <p className="hero-copy">Candidate stayed focused throughout.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="analytics-panel analytics-section-card page-section">
        <div className="section-header">
          <IconLabel icon={StickyNote} size={16}>
            Interviewer Notes (private)
          </IconLabel>
        </div>

        <textarea
          className="comment-input"
          value={notes}
          onBlur={handleSaveNotes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Private notes about this candidate and interview..."
          rows={6}
        />

        <div className="analytics-notes-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={savingNotes}
            onClick={handleSaveNotes}
          >
            <IconLabel icon={Save} size={16}>
              {savingNotes ? "Saving..." : "Save notes"}
            </IconLabel>
          </button>
          {notesMessage === "Saved" ? (
            <span className="cs-save-indicator">{notesMessage}</span>
          ) : null}
          {notesMessage && notesMessage !== "Saved" ? (
            <p className="access-message">{notesMessage}</p>
          ) : null}
        </div>
      </section>

      <section className="analytics-panel analytics-section-card page-section">
        <div className="section-header">
          <IconLabel icon={FileCode} size={16}>
            Final Submission
          </IconLabel>
        </div>

        <div className="analytics-code-preview">
          <Editor
            height="200px"
            language={language}
            value={finalCode || "// No final code snapshot recorded."}
            onMount={(_editor, monaco) => applyCodescreenMonacoTheme(monaco)}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              scrollbar: { vertical: "hidden", horizontal: "hidden" },
            }}
            theme="codescreen-dark"
          />
        </div>
        <p className="analytics-code-preview-meta">
          <span className={`cs-badge cs-badge--role-candidate`}>{room.language}</span>
          {runInsights.lastRunTime
            ? ` · Last run: ${new Date(runInsights.lastRunTime).toLocaleString()}`
            : ""}
        </p>
      </section>

      <div className="cs-analytics-footer page-section">
        <Link className="btn-secondary" to={`/rooms/${room.id}`}>
          <IconLabel icon={ArrowLeft} size={14}>
            Back to room
          </IconLabel>
        </Link>
        <Link className="btn-primary" to={`/rooms/${room.id}/replay`}>
          <IconLabel icon={PlayCircle} size={16}>
            View Replay
          </IconLabel>
        </Link>
      </div>
    </main>
  );
}
