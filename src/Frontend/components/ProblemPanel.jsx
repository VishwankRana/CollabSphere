import { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  XCircle,
} from "lucide-react";

import IconLabel from "./IconLabel";

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

function getTestResultForIndex(testResults, index) {
  if (!Array.isArray(testResults) || !testResults[index]) {
    return null;
  }

  return testResults[index];
}

export default function ProblemPanel({
  collapsed = false,
  onToggleCollapsed,
  problem = {},
  testCases = [],
  interviewer = null,
  candidate = null,
  testResults = null,
}) {
  const examples = problem.examples || [];
  const difficulty = problem.difficulty || "Medium";
  const [expandedCase, setExpandedCase] = useState(null);

  const constraints = problem.constraints
    ? problem.constraints
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <aside className={`interview-problem-panel${collapsed ? " is-collapsed" : ""}`}>
      {!collapsed ? (
        <div className="problem-participant-strip">
          <div className="problem-participant-label">
            <IconLabel icon={Users} size={14}>
              In this room
            </IconLabel>
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
        <button
          type="button"
          className="btn-ghost btn-icon"
          aria-label={collapsed ? "Expand problem panel" : "Collapse problem panel"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {!collapsed ? (
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

          {testCases.length ? (
            <div className="interview-problem-section">
              <h3>
                <IconLabel icon={CheckSquare} size={14}>
                  Test Cases
                </IconLabel>
              </h3>
              <ul className="interview-problem-testcases">
                {testCases.map((testCase, index) => {
                  const result = getTestResultForIndex(testResults, index);
                  const expanded = expandedCase === index;
                  const statusLabel = result
                    ? result.passed
                      ? "PASSED"
                      : "FAILED"
                    : "NOT RUN";

                  return (
                    <li key={`test-${index}`}>
                      <button
                        type="button"
                        className="problem-testcase-row"
                        onClick={() =>
                          setExpandedCase((current) => (current === index ? null : index))
                        }
                      >
                        {result?.passed ? (
                          <CheckCircle size={14} strokeWidth={1.5} className="code-test-pass" />
                        ) : result && !result.passed ? (
                          <XCircle size={14} strokeWidth={1.5} className="code-test-fail" />
                        ) : (
                          <Circle size={14} strokeWidth={1.5} />
                        )}
                        <span>
                          Case {index + 1}
                          {testCase.isHidden ? " (hidden)" : ""}
                        </span>
                        <span className={`cs-badge cs-badge--status-${result?.passed ? "active" : result ? "waiting" : "ended"}`}>
                          {statusLabel}
                        </span>
                        <ChevronDown
                          className={expanded ? "is-open" : ""}
                          size={12}
                          strokeWidth={1.5}
                        />
                      </button>
                      {expanded ? (
                        <div className="problem-testcase-detail">
                          <p>
                            <span>Input</span>
                            <pre>{testCase.input || "(empty)"}</pre>
                          </p>
                          <p>
                            <span>Expected</span>
                            <pre>{testCase.expectedOutput || "(empty)"}</pre>
                          </p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="problem-resources">
            <div className="problem-participant-label">Quick Reference</div>
            <a className="problem-resource-link" href="#">
              <BookOpen size={14} strokeWidth={1.5} />
              Big-O Cheatsheet
            </a>
            <a className="problem-resource-link" href="#">
              <Code size={14} strokeWidth={1.5} />
              Common Patterns
            </a>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
