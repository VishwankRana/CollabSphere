import { useState } from "react";

export default function CodeOutputPanel({
  isRunning = false,
  result = null,
  testResults = null,
  stdin = "",
  onStdinChange,
  readOnly = false,
}) {
  const [activeTab, setActiveTab] = useState("output");
  const hasTestResults = Array.isArray(testResults) && testResults.length > 0;
  const passedCount = hasTestResults
    ? testResults.filter((entry) => entry.passed).length
    : 0;

  const showTestsTab = hasTestResults || isRunning;

  return (
    <section className="code-output-panel">
      <div className="code-output-tabs">
        <button
          type="button"
          className={`code-output-tab${activeTab === "output" ? " is-active" : ""}`}
          onClick={() => setActiveTab("output")}
        >
          Output
        </button>
        {showTestsTab ? (
          <button
            type="button"
            className={`code-output-tab${activeTab === "tests" ? " is-active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            Test Cases
            {hasTestResults ? ` (${passedCount}/${testResults.length})` : ""}
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
        {activeTab === "tests" && hasTestResults ? (
          <ul className="code-test-results">
            {testResults.map((entry, index) => (
              <li key={`test-${index}`}>
                <div className={`code-test-row ${entry.passed ? "code-test-pass" : "code-test-fail"}`}>
                  <span
                    className={`code-test-dot ${
                      entry.passed ? "code-test-dot--pass" : "code-test-dot--fail"
                    }`}
                    aria-hidden="true"
                  />
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
              <p className="code-output-idle">Run your code to see output</p>
            ) : null}
          </>
        ) : null}

        {activeTab === "tests" && !hasTestResults ? (
          <p className="code-output-idle">Run tests to see results</p>
        ) : null}
      </div>
    </section>
  );
}
