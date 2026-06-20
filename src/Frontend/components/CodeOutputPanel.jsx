import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  CheckSquare,
  Command,
  CornerDownLeft,
  Terminal,
  XCircle,
} from "lucide-react";

import IconLabel from "./IconLabel";

function getRunShortcutLabel() {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  return isMac ? "Cmd" : "Ctrl";
}

export default function CodeOutputPanel({
  isRunning = false,
  isRunningTests = false,
  result = null,
  testResults = null,
  stdin = "",
  onStdinChange,
  readOnly = false,
  showTestCasesTab = false,
}) {
  const [activeTab, setActiveTab] = useState("output");
  const hasTestResults = Array.isArray(testResults) && testResults.length > 0;
  const passedCount = hasTestResults
    ? testResults.filter((entry) => entry.passed).length
    : 0;
  const runShortcut = useMemo(() => getRunShortcutLabel(), []);

  useEffect(() => {
    if (hasTestResults) {
      setActiveTab("tests");
    }
  }, [hasTestResults, testResults]);

  return (
    <section className="code-output-panel">
      <div className="code-output-tabs">
        <button
          type="button"
          className={`code-output-tab${activeTab === "output" ? " is-active" : ""}`}
          onClick={() => setActiveTab("output")}
        >
          <IconLabel icon={Terminal} size={14}>
            Output
          </IconLabel>
        </button>
        {showTestCasesTab ? (
          <button
            type="button"
            className={`code-output-tab${activeTab === "tests" ? " is-active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            <IconLabel icon={CheckSquare} size={14}>
              Test Cases
              {hasTestResults ? ` (${passedCount}/${testResults.length})` : ""}
            </IconLabel>
          </button>
        ) : null}
      </div>

      {!readOnly && activeTab === "output" ? (
        <label className="code-output-stdin">
          <span>Standard input (optional)</span>
          <textarea
            value={stdin}
            onChange={(event) => onStdinChange?.(event.target.value)}
            placeholder="Input passed to your program on Run"
            rows={2}
          />
        </label>
      ) : null}

      <div className="code-output-content">
        {activeTab === "tests" ? (
          <>
            {isRunningTests ? (
              <p className="code-output-running">
                Running tests<span className="cs-running-dots" aria-hidden="true" />
              </p>
            ) : null}

            {hasTestResults ? (
              <ul className="code-test-results">
                {testResults.map((entry, index) => (
                  <li key={`test-${index}`}>
                    <div
                      className={`code-test-row ${entry.passed ? "code-test-pass" : "code-test-fail"}`}
                    >
                      {entry.passed ? (
                        <CheckCircle size={14} strokeWidth={1.5} />
                      ) : (
                        <XCircle size={14} strokeWidth={1.5} />
                      )}
                      <span>
                        Case {index + 1}: {entry.passed ? "Passed" : "Failed"}
                        {entry.isHidden ? " (hidden)" : ""}
                      </span>
                    </div>
                    {!entry.passed || (!entry.isHidden && entry.actualOutput !== undefined) ? (
                      <div className="code-test-details">
                        {entry.input !== undefined && !entry.isHidden ? (
                          <p>
                            <span>Input</span>
                            <pre>{entry.input || "(empty)"}</pre>
                          </p>
                        ) : null}
                        {entry.expectedOutput !== undefined && !entry.passed ? (
                          <p>
                            <span>Expected</span>
                            <pre>{entry.expectedOutput || "(empty)"}</pre>
                          </p>
                        ) : null}
                        {entry.actualOutput !== undefined && !entry.passed ? (
                          <p>
                            <span>Actual</span>
                            <pre>{entry.actualOutput || "(empty)"}</pre>
                          </p>
                        ) : null}
                        {entry.stderr ? (
                          <p>
                            <span>Stderr</span>
                            <pre className="code-output-stderr">{entry.stderr}</pre>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : !isRunningTests ? (
              <div className="code-output-idle-panel">
                <CheckSquare size={28} strokeWidth={1.5} />
                <p>Run tests to see results</p>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === "output" ? (
          <>
            {isRunning ? (
              <p className="code-output-running">
                Running<span className="cs-running-dots" aria-hidden="true" />
              </p>
            ) : null}

            {result ? (
              <div className="code-output-body">
                {result.exitCode === 0 ? (
                  <span className="code-output-exit-badge code-output-exit-badge--success">
                    Exited {result.exitCode ?? 0}
                  </span>
                ) : (
                  <span className="code-output-exit-badge code-output-exit-badge--error">
                    Error
                  </span>
                )}

                {result.stdout ? <pre>{result.stdout}</pre> : null}
                {result.stderr ? (
                  <pre className="code-output-stderr">{result.stderr}</pre>
                ) : null}
                {!result.stdout && !result.stderr && !isRunning ? (
                  <p className="code-output-idle">No output.</p>
                ) : null}
                {result.executionTime !== undefined ? (
                  <p className="code-output-meta">
                    {result.executionTime}ms
                    {result.timedOut ? " · Timed out" : ""}
                  </p>
                ) : null}
              </div>
            ) : !isRunning ? (
              <div className="code-output-idle-panel">
                <Terminal size={32} strokeWidth={1.5} />
                <p>Run your code to see output here</p>
                {!readOnly ? (
                  <span className="code-output-shortcut">
                    <Command size={11} strokeWidth={1.5} />
                    {runShortcut === "Cmd" ? (
                      <span className="font-mono">Cmd</span>
                    ) : (
                      <span className="font-mono">{runShortcut}</span>
                    )}
                    <span>+</span>
                    <CornerDownLeft size={11} strokeWidth={1.5} />
                    <span>to run</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
