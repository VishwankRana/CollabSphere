import { ChevronRight } from "lucide-react";

import ChatPanel from "./ChatPanel";

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

function getDifficultyClass(difficulty) {
  const normalized = String(difficulty || "medium").toLowerCase();

  if (normalized === "easy") {
    return "easy";
  }

  if (normalized === "hard") {
    return "hard";
  }

  return "medium";
}

export default function ProblemPanel({
  collapsed = false,
  onToggleCollapsed,
  problem = {},
  interviewer = null,
  candidate = null,
  chatReadOnly = false,
  roomId,
}) {
  const examples = problem.examples || [];
  const difficulty = problem.difficulty
    ? String(problem.difficulty).charAt(0).toUpperCase() +
      String(problem.difficulty).slice(1).toLowerCase()
    : "Medium";

  const constraints = problem.constraints
    ? problem.constraints
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const collapseButton = (
    <button
      type="button"
      className="btn-ghost btn-icon problem-collapse-btn"
      aria-label={collapsed ? "Expand problem panel" : "Collapse problem panel"}
      onClick={onToggleCollapsed}
    >
      <ChevronRight
        size={18}
        strokeWidth={1.5}
        className={collapsed ? "" : "problem-collapse-icon--open"}
      />
    </button>
  );

  return (
    <aside className={`interview-problem-panel${collapsed ? " is-collapsed" : ""}`}>
      {!collapsed ? (
        <div className="problem-participant-strip">
          <div className="problem-participant-header">
            <div className="problem-participant-label">In this room</div>
            {collapseButton}
          </div>

          <div className="problem-participant-row">
            <span className="interview-chat-avatar interview-chat-avatar--interviewer">
              {getInitials(interviewer?.name || "I")}
            </span>
            <span>{interviewer?.name || "Interviewer"}</span>
            <span className="cs-badge cs-badge--role-interviewer">Interviewer</span>
            <span className="problem-online-dot problem-online-dot--online" aria-hidden="true" />
          </div>

          <div className="problem-participant-row">
            {candidate?.name ? (
              <>
                <span className="interview-chat-avatar interview-chat-avatar--candidate">
                  {getInitials(candidate.name)}
                </span>
                <span>{candidate.name}</span>
                <span className="cs-badge cs-badge--role-candidate">Candidate</span>
                <span className="problem-online-dot problem-online-dot--online" aria-hidden="true" />
              </>
            ) : (
              <span className="hero-copy">Waiting for candidate...</span>
            )}
          </div>
        </div>
      ) : null}

      <div className="interview-problem-header">
        <div>
          <h2>{problem.title || "Coding challenge"}</h2>
        </div>
        {collapsed ? collapseButton : null}
      </div>

      {!collapsed ? (
        <>
          <div className="interview-problem-body">
            <span
              className={`cs-badge problem-difficulty-badge problem-difficulty-badge--${getDifficultyClass(
                difficulty
              )}`}
            >
              {difficulty}
            </span>

            {problem.description ? (
              <div className="interview-problem-section">
                <h3>Description</h3>
                <p>{problem.description}</p>
              </div>
            ) : (
              <p className="hero-copy">No problem description was provided for this room.</p>
            )}

            {examples.length ? (
              <div className="interview-problem-section">
                <h3>Examples</h3>
                <ul className="interview-problem-examples">
                  {examples.map((example, index) => (
                    <li key={`example-${index}`}>
                      <div className="problem-example-block">
                        <strong>Example {index + 1}</strong>
                        <p>
                          <span>Input</span>
                          <pre>{example.input || "(empty)"}</pre>
                        </p>
                        <p>
                          <span>Output</span>
                          <pre>{example.output || "(empty)"}</pre>
                        </p>
                        {example.explanation ? <p>{example.explanation}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {constraints.length ? (
              <div className="interview-problem-section">
                <h3>Constraints</h3>
                {constraints.map((line) => (
                  <div className="problem-constraint-row" key={line}>
                    <ChevronRight size={12} strokeWidth={1.5} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="problem-chat-section">
            <ChatPanel embedded readOnly={chatReadOnly} roomId={roomId} />
          </div>
        </>
      ) : null}
    </aside>
  );
}
